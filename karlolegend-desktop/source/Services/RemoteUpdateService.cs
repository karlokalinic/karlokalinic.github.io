using KarloDiskShell.Models;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Reflection;
using System.Text.Json;

namespace KarloDiskShell.Services;

public sealed class RemoteUpdateService
{
    private const string LatestReleaseApi =
        "https://api.github.com/repos/karlokalinic/karlokalinic.github.io/releases/latest";

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

            using var response = await client.GetAsync(LatestReleaseApi, cancellationToken);
            response.EnsureSuccessStatusCode();

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

            var root = document.RootElement;
            var tag = root.TryGetProperty("tag_name", out var tagElement)
                ? tagElement.GetString() ?? ""
                : "";

            var remoteVersion = ParseVersion(tag.TrimStart('v', 'V'));
            var currentVersion = CurrentVersion();

            if (remoteVersion <= currentVersion)
            {
                return new RemoteUpdateResult(
                    true,
                    false,
                    false,
                    remoteVersion.ToString(3),
                    "KARLOLEGEND is up to date.");
            }

            if (!root.TryGetProperty("assets", out var assetsElement) ||
                assetsElement.ValueKind != JsonValueKind.Array)
            {
                return new RemoteUpdateResult(
                    false,
                    true,
                    false,
                    remoteVersion.ToString(3),
                    "The release has no downloadable assets.");
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

                if (name.EndsWith(".karloupdate", StringComparison.OrdinalIgnoreCase))
                {
                    assetName = name;
                    assetUrl = url;
                    break;
                }
            }

            if (assetName is null || assetUrl is null)
            {
                return new RemoteUpdateResult(
                    false,
                    true,
                    false,
                    remoteVersion.ToString(3),
                    "A newer release exists, but it has no .karloupdate package.");
            }

            Directory.CreateDirectory(_environment.UpdateInboxDirectory);

            var destination = Path.Combine(_environment.UpdateInboxDirectory, assetName);
            if (File.Exists(destination))
            {
                return new RemoteUpdateResult(
                    true,
                    true,
                    false,
                    remoteVersion.ToString(3),
                    "Update package is already downloaded.");
            }

            var temporary = destination + ".download";

            try
            {
                if (File.Exists(temporary))
                    File.Delete(temporary);

                using var downloadResponse = await client.GetAsync(
                    assetUrl,
                    HttpCompletionOption.ResponseHeadersRead,
                    cancellationToken);

                downloadResponse.EnsureSuccessStatusCode();

                await using var input = await downloadResponse.Content.ReadAsStreamAsync(cancellationToken);
                await using var output = new FileStream(
                    temporary,
                    FileMode.Create,
                    FileAccess.Write,
                    FileShare.None,
                    bufferSize: 1024 * 128,
                    useAsync: true);

                await input.CopyToAsync(output, cancellationToken);
                await output.FlushAsync(cancellationToken);

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
                remoteVersion.ToString(3),
                $"KARLOLEGEND {remoteVersion.ToString(3)} downloaded.");
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
}
