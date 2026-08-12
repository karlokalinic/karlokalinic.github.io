using KarloDiskShell.Models;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Security.Cryptography;
using System.Text.Json;
using System.Threading;
using System.Windows;

namespace KarloDiskShell.Services;

public static class SelfUpdateService
{
    private const string ApplySwitch = "--apply-update";

    private static readonly JsonSerializerOptions ManifestJsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public static bool IsApplyUpdateMode(string[] args) =>
        args.Length >= 5 &&
        string.Equals(args[0], ApplySwitch, StringComparison.OrdinalIgnoreCase);

    public static void CheckAndPrompt(Window owner, KarloEnvironmentService environment)
    {
        var package = FindBestUpdate(environment);

        if (package is null)
            return;

        var current = Assembly.GetExecutingAssembly().GetName().Version ?? new Version(0, 0, 0);
        var offered = ParseVersion(package.Manifest.Version);

        if (offered <= current)
            return;

        var notes = string.IsNullOrWhiteSpace(package.Manifest.Notes)
            ? ""
            : $"\n\n{package.Manifest.Notes}";

        var response = MessageBox.Show(
            owner,
            $"KARLOLEGEND {package.Manifest.Version} is ready to install.{notes}\n\nInstall and restart now?",
            "KARLOLEGEND Update",
            MessageBoxButton.YesNo,
            MessageBoxImage.Information);

        if (response != MessageBoxResult.Yes)
            return;

        try
        {
            StageAndLaunchUpdater(environment, package);
            Application.Current.Shutdown();
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                owner,
                $"Update could not be staged.\n\n{ex.Message}",
                "KARLOLEGEND Update",
                MessageBoxButton.OK,
                MessageBoxImage.Error);
        }
    }

    public static int ApplyUpdateAndRestart(string[] args)
    {
        // --apply-update <parentPid> <stagedExe> <targetExe> <packagePath>
        if (args.Length < 5)
            return 20;

        if (!int.TryParse(args[1], out var parentPid))
            return 21;

        var stagedExe = args[2];
        var targetExe = args[3];
        var packagePath = args[4];

        try
        {
            try
            {
                var parent = Process.GetProcessById(parentPid);
                parent.WaitForExit(15000);
            }
            catch
            {
                // Parent already exited.
            }

            var copied = false;
            Exception? lastError = null;

            for (var attempt = 0; attempt < 20 && !copied; attempt++)
            {
                try
                {
                    File.Copy(stagedExe, targetExe, overwrite: true);
                    copied = true;
                }
                catch (Exception ex)
                {
                    lastError = ex;
                    Thread.Sleep(250);
                }
            }

            if (!copied)
                throw new IOException("Could not replace the application executable.", lastError);

            try
            {
                if (File.Exists(packagePath))
                    File.Delete(packagePath);

                var stageDirectory = Path.GetDirectoryName(stagedExe);
                if (!string.IsNullOrWhiteSpace(stageDirectory) && Directory.Exists(stageDirectory))
                    Directory.Delete(stageDirectory, recursive: true);
            }
            catch
            {
                // Cleanup failure is non-fatal after a successful update.
            }

            Process.Start(new ProcessStartInfo
            {
                FileName = targetExe,
                UseShellExecute = true,
                WorkingDirectory = Path.GetDirectoryName(targetExe) ?? Environment.CurrentDirectory
            });

            ScheduleSelfDeletion();
            return 0;
        }
        catch
        {
            return 22;
        }
    }

    private static UpdatePackage? FindBestUpdate(KarloEnvironmentService environment)
    {
        var current = Assembly.GetExecutingAssembly().GetName().Version ?? new Version(0, 0, 0);

        return Directory.EnumerateFiles(
                environment.UpdateInboxDirectory,
                "*.karloupdate",
                SearchOption.TopDirectoryOnly)
            .Select(TryReadUpdate)
            .Where(x => x is not null && ParseVersion(x.Manifest.Version) > current)
            .OrderByDescending(x => ParseVersion(x!.Manifest.Version))
            .FirstOrDefault();
    }

    private static UpdatePackage? TryReadUpdate(string path)
    {
        try
        {
            using var archive = ZipFile.OpenRead(path);
            var entry = archive.GetEntry("manifest.json");

            if (entry is null)
                return null;

            using var reader = new StreamReader(entry.Open());
            var manifest = JsonSerializer.Deserialize<AppUpdateManifest>(
                reader.ReadToEnd(),
                ManifestJsonOptions);

            if (manifest is null ||
                string.IsNullOrWhiteSpace(manifest.Version) ||
                string.IsNullOrWhiteSpace(manifest.File))
            {
                return null;
            }

            return new UpdatePackage(path, manifest);
        }
        catch
        {
            return null;
        }
    }

    private static void StageAndLaunchUpdater(
        KarloEnvironmentService environment,
        UpdatePackage package)
    {
        var currentExe = Environment.ProcessPath
            ?? throw new InvalidOperationException("The current executable path is unavailable.");

        var versionDirectory = Path.Combine(
            environment.UpdateStagingDirectory,
            SanitizeSegment(package.Manifest.Version));

        if (Directory.Exists(versionDirectory))
            Directory.Delete(versionDirectory, recursive: true);

        Directory.CreateDirectory(versionDirectory);

        ZipFile.ExtractToDirectory(
            package.PackagePath,
            versionDirectory,
            overwriteFiles: true);

        var stagedExe = Path.Combine(versionDirectory, package.Manifest.File);

        if (!File.Exists(stagedExe))
            throw new FileNotFoundException("Update package does not contain the declared executable.", stagedExe);

        if (!string.IsNullOrWhiteSpace(package.Manifest.Sha256))
        {
            var actual = ComputeSha256(stagedExe);

            if (!string.Equals(
                    actual,
                    package.Manifest.Sha256.Trim(),
                    StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidDataException("Update SHA-256 does not match the manifest.");
            }
        }

        var updaterCopy = Path.Combine(
            Path.GetTempPath(),
            $"KARLOLEGEND-Updater-{Guid.NewGuid():N}.exe");

        File.Copy(currentExe, updaterCopy, overwrite: true);

        var startInfo = new ProcessStartInfo
        {
            FileName = updaterCopy,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        startInfo.ArgumentList.Add(ApplySwitch);
        startInfo.ArgumentList.Add(Environment.ProcessId.ToString());
        startInfo.ArgumentList.Add(stagedExe);
        startInfo.ArgumentList.Add(currentExe);
        startInfo.ArgumentList.Add(package.PackagePath);

        Process.Start(startInfo);
    }

    private static string ComputeSha256(string path)
    {
        using var stream = File.OpenRead(path);
        using var sha = SHA256.Create();

        return Convert.ToHexString(sha.ComputeHash(stream));
    }

    private static void ScheduleSelfDeletion()
    {
        var updaterPath = Environment.ProcessPath;
        if (string.IsNullOrWhiteSpace(updaterPath))
            return;

        // The updater cannot reliably delete its own executable while it is
        // still running, so ask cmd.exe to delete it a moment later.
        Process.Start(new ProcessStartInfo
        {
            FileName = "cmd.exe",
            UseShellExecute = false,
            CreateNoWindow = true,
            Arguments = $"/c ping 127.0.0.1 -n 3 > nul & del /f /q {Quote(updaterPath)}"
        });
    }

    private static Version ParseVersion(string? value) =>
        Version.TryParse(value, out var parsed)
            ? parsed
            : new Version(0, 0, 0);

    private static string Quote(string value) =>
        "\"" + value.Replace("\"", "\\\"") + "\"";

    private static string SanitizeSegment(string value)
    {
        foreach (var invalid in Path.GetInvalidFileNameChars())
            value = value.Replace(invalid, '_');

        return value;
    }

    private sealed record UpdatePackage(
        string PackagePath,
        AppUpdateManifest Manifest);
}
