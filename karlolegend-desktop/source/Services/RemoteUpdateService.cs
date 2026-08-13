using KarloDiskShell.Models;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Reflection;
using System.Text.Json;

namespace KarloDiskShell.Services;

public sealed class RemoteUpdateService
{
    private const string ReleasesApi =
        "https://api.github.com/repos/karlokalinic/karlokalinic.github.io/releases?per_page=30";

    private readonly KarloEnvironmentService _environment;

    public RemoteUpdateService(KarloEnvironmentService environment)
    {
        _environment = environment;
    }

    public async Task<RemoteUpdateResult> CheckAndDownloadLatestAsync(
        CancellationToken cancellationToken = default)
    {
        try
        {
            using var client = new HttpClient
            {
                Timeout = TimeSpan.FromSeconds(30)
            };

            client.DefaultRequestHeaders.UserAgent.Add(
                new ProductInfoHeaderValue("KARLOLEGEND", CurrentVersionString()));

            client.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/vnd.github+json"));

            using var response = await client.GetAsync(ReleasesApi, cancellationToken);
            response.EnsureSuccessStatusCode();

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

            if (document.RootElement.ValueKind != JsonValueKind.Array)
            {
                return new RemoteUpdateResult(
                    false,
                    false,
                    false,
                    "",
                    "The update service returned an unexpected response.");
            }

            var currentVersion = CurrentVersion();
            ReleaseCandidate? bestCandidate = null;

            foreach (var release in document.RootElement.EnumerateArray())
            {
                if (release.TryGetProperty("draft", out var draftElement) &&
                    draftElement.ValueKind == JsonValueKind.True)
                {
                    continue;
                }

                if (release.TryGetProperty("prerelease", out var prereleaseElement) &&
                    prereleaseElement.ValueKind == JsonValueKind.True)
                {
                    continue;
                }

                var tag = release.TryGetProperty("tag_name", out var tagElement)
                    ? tagElement.GetString() ?? ""
                    : "";

                var version = ParseVersion(tag.TrimStart('v', 'V'));
                if (version <= currentVersion)
                    continue;

                if (!release.TryGetProperty("assets", out var assetsElement) ||
                    assetsElement.ValueKind != JsonValueKind.Array)
                {
                    continue;
                }

                string? assetName = null;
                string? assetUrl = null;

                foreach (var asset in assetsElement.EnumerateArray())
                {
                    var name = asset.TryGetProperty("name", out var nameElement)
                        ? nameElement.GetString()
                        : null;

                    var url = asset.TryGetProperty("browser_download_url", out var urlElement)
                        ? urlElement.GetString()
                        : null;

                    if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(url))
                        continue;

                    if (!name.EndsWith(".karloupdate", StringComparison.OrdinalIgnoreCase))
                        continue;

                    assetName = name;
                    assetUrl = url;
                    break;
                }

                if (assetName is null || assetUrl is null)
                    continue;

                if (bestCandidate is null || version > bestCandidate.Version)
                {
                    bestCandidate = new ReleaseCandidate(
                        version,
                        assetName,
                        assetUrl);
                }
            }

            if (bestCandidate is null)
            {
                return new RemoteUpdateResult(
                    true,
                    false,
                    false,
                    currentVersion.ToString(3),
                    "KARLOLEGEND is up to date.");
            }

            Directory.CreateDirectory(_environment.UpdateInboxDirectory);

            var destination = Path.Combine(
                _environment.UpdateInboxDirectory,
                bestCandidate.AssetName);

            if (File.Exists(destination))
            {
                return new RemoteUpdateResult(
                    true,
                    true,
                    false,
                    bestCandidate.Version.ToString(3),
                    "Update package is already downloaded.");
            }

            var temporary = destination + ".download";

            try
            {
                if (File.Exists(temporary))
                    File.Delete(temporary);

                using var downloadResponse = await client.GetAsync(
                    bestCandidate.AssetUrl,
                    HttpCompletionOption.ResponseHeadersRead,
                    cancellationToken);

                downloadResponse.EnsureSuccessStatusCode();

                // The temporary download must be fully closed before File.Move.
                // Keeping an `await using var output` alive until the end of this
                // try block leaves Windows holding the file handle while the move
                // is attempted and produces ERROR_SHARING_VIOLATION / "file is
                // being used by another process". Deliberate nested scopes make
                // disposal happen before the atomic rename into the update inbox.
                await using (var input = await downloadResponse.Content.ReadAsStreamAsync(cancellationToken))
                {
                    await using (var output = new FileStream(
                                     temporary,
                                     FileMode.Create,
                                     FileAccess.Write,
                                     FileShare.None,
                                     bufferSize: 1024 * 128,
                                     useAsync: true))
                    {
                        await input.CopyToAsync(output, cancellationToken);
                        await output.FlushAsync(cancellationToken);
                    }
                }

                File.Move(temporary, destination, overwrite: true);
            }
            catch
            {
                try
                {
                    if (File.Exists(temporary))
                        File.Delete(temporary);
                }
                catch
                {
                }

                throw;
            }

            return new RemoteUpdateResult(
                true,
                true,
                true,
                bestCandidate.Version.ToString(3),
                $"KARLOLEGEND {bestCandidate.Version.ToString(3)} downloaded.");
        }
        catch (OperationCanceledException)
        {
            return new RemoteUpdateResult(
                false,
                false,
                false,
                "",
                "Update check was cancelled.");
        }
        catch (Exception ex)
        {
            return new RemoteUpdateResult(
                false,
                false,
                false,
                "",
                $"Update check failed: {ex.Message}");
        }
    }

    private static Version CurrentVersion() =>
        Assembly.GetExecutingAssembly().GetName().Version ?? new Version(0, 0, 0);

    private static string CurrentVersionString() =>
        CurrentVersion().ToString(3);

    private static Version ParseVersion(string? value) =>
        Version.TryParse(value, out var parsed)
            ? parsed
            : new Version(0, 0, 0);

    private sealed record ReleaseCandidate(
        Version Version,
        string AssetName,
        string AssetUrl);
}
