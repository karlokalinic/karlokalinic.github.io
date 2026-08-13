using KarloDiskShell.Models;
using System.IO;
using System.IO.Compression;
using System.Text.Json;

namespace KarloDiskShell.Services;

public sealed class FeatureCatalogService
{
    private readonly KarloEnvironmentService _environment;

    private static readonly FeatureDefinition[] Catalog =
    [
        new FeatureDefinition
        {
            Id = "core.desktop",
            Name = "Desktop Shell",
            Description = "Filesystem desktop, movable persistent icons, navigation, rename, recycle-bin delete, Windows Shell icons and live refresh.",
            BuiltInVersion = "0.4.0",
            IsBuiltIn = true
        },
        new FeatureDefinition
        {
            Id = "core.html",
            Name = "Internal HTML Viewer",
            Description = "Opens local HTML/HTM inside KARLOLEGEND through an embedded WebView2 renderer and the karlo.local virtual origin.",
            BuiltInVersion = "0.4.0",
            IsBuiltIn = true
        },
        new FeatureDefinition
        {
            Id = "core.appearance",
            Name = "Desktop Appearance",
            Description = "Wallpaper, chrome-free desktop mode and persistent desktop presentation state.",
            BuiltInVersion = "0.4.0",
            IsBuiltIn = true
        },
        new FeatureDefinition
        {
            Id = "terminal",
            Name = "Integrated Terminal Launcher",
            Description = "Opens Windows PowerShell directly in the current KARLOLEGEND directory.",
            BuiltInVersion = "0.4.0",
            IsBuiltIn = true
        },
        new FeatureDefinition
        {
            Id = "core.updates",
            Name = "Update Engine",
            Description = "Discovers online .karloupdate releases, verifies the staged executable, preserves the previous build, replaces the live EXE and restarts.",
            BuiltInVersion = "0.4.0",
            IsBuiltIn = true
        },
        new FeatureDefinition
        {
            Id = "version-control",
            Name = "Local Version Control",
            Description = "Planned Git-backed local history UI: repositories, changes, commits, branches, tags, diffs and restore.",
            BuiltInVersion = "",
            IsBuiltIn = false
        }
    ];

    public FeatureCatalogService(KarloEnvironmentService environment)
    {
        _environment = environment;
    }

    public IReadOnlyList<FeatureStatus> GetStatuses()
    {
        var packages = ReadAvailablePackages();

        return Catalog.Select(definition =>
        {
            if (definition.IsBuiltIn)
            {
                return new FeatureStatus
                {
                    Id = definition.Id,
                    Name = definition.Name,
                    Description = definition.Description,
                    InstalledVersion = definition.BuiltInVersion,
                    AvailableVersion = "",
                    State = "Installed / built-in",
                    CanInstallOrUpdate = false
                };
            }

            var installed = ReadInstalledVersion(definition.Id);
            var available = packages
                .Where(p => string.Equals(p.Manifest.Id, definition.Id, StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(p => ParseVersion(p.Manifest.Version))
                .FirstOrDefault();

            var availableVersion = available?.Manifest.Version ?? "";

            if (string.IsNullOrWhiteSpace(installed))
            {
                return new FeatureStatus
                {
                    Id = definition.Id,
                    Name = definition.Name,
                    Description = definition.Description,
                    InstalledVersion = "Not installed",
                    AvailableVersion = availableVersion,
                    State = string.IsNullOrWhiteSpace(availableVersion)
                        ? "Planned / not installed"
                        : "Ready to install",
                    CanInstallOrUpdate = !string.IsNullOrWhiteSpace(availableVersion)
                };
            }

            var updateAvailable =
                !string.IsNullOrWhiteSpace(availableVersion) &&
                ParseVersion(availableVersion) > ParseVersion(installed);

            return new FeatureStatus
            {
                Id = definition.Id,
                Name = definition.Name,
                Description = definition.Description,
                InstalledVersion = installed,
                AvailableVersion = updateAvailable ? availableVersion : "",
                State = updateAvailable ? "Update available" : "Installed",
                CanInstallOrUpdate = updateAvailable
            };
        }).ToArray();
    }

    public string InstallOrUpdate(string featureId)
    {
        var package = ReadAvailablePackages()
            .Where(p => string.Equals(p.Manifest.Id, featureId, StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(p => ParseVersion(p.Manifest.Version))
            .FirstOrDefault();

        if (package is null)
            return "No package for this feature exists in .karlo\\packages\\inbox.";

        var currentAppVersion = typeof(FeatureCatalogService).Assembly.GetName().Version ?? new Version(0, 0, 0);
        var minimum = ParseVersion(package.Manifest.MinAppVersion);

        if (minimum > currentAppVersion)
            return $"Feature requires KARLOLEGEND {minimum} or newer.";

        var destination = Path.Combine(
            _environment.FeatureDirectory,
            SanitizeSegment(package.Manifest.Id),
            SanitizeSegment(package.Manifest.Version));

        var temp = Path.Combine(_environment.TempDirectory, "feature-" + Guid.NewGuid().ToString("N"));

        try
        {
            Directory.CreateDirectory(temp);
            ZipFile.ExtractToDirectory(package.PackagePath, temp, overwriteFiles: true);

            if (Directory.Exists(destination))
                Directory.Delete(destination, recursive: true);

            Directory.CreateDirectory(Path.GetDirectoryName(destination)!);
            Directory.Move(temp, destination);

            var currentFile = Path.Combine(
                _environment.FeatureDirectory,
                SanitizeSegment(package.Manifest.Id),
                "current.json");

            Directory.CreateDirectory(Path.GetDirectoryName(currentFile)!);

            File.WriteAllText(
                currentFile,
                JsonSerializer.Serialize(
                    package.Manifest,
                    new JsonSerializerOptions { WriteIndented = true }));

            File.Delete(package.PackagePath);

            return $"{package.Manifest.Name} {package.Manifest.Version} installed.";
        }
        catch (Exception ex)
        {
            try
            {
                if (Directory.Exists(temp))
                    Directory.Delete(temp, recursive: true);
            }
            catch
            {
            }

            return $"Install failed: {ex.Message}";
        }
    }

    private string ReadInstalledVersion(string featureId)
    {
        var currentFile = Path.Combine(
            _environment.FeatureDirectory,
            SanitizeSegment(featureId),
            "current.json");

        if (!File.Exists(currentFile))
            return "";

        try
        {
            var manifest = JsonSerializer.Deserialize<FeaturePackageManifest>(
                File.ReadAllText(currentFile));

            return manifest?.Version ?? "";
        }
        catch
        {
            return "";
        }
    }

    private IReadOnlyList<PackageInfo> ReadAvailablePackages()
    {
        var result = new List<PackageInfo>();

        foreach (var path in Directory.EnumerateFiles(
                     _environment.PackageInboxDirectory,
                     "*.karlofeature",
                     SearchOption.TopDirectoryOnly))
        {
            try
            {
                using var archive = ZipFile.OpenRead(path);
                var entry = archive.GetEntry("manifest.json");

                if (entry is null)
                    continue;

                using var reader = new StreamReader(entry.Open());
                var manifest = JsonSerializer.Deserialize<FeaturePackageManifest>(
                    reader.ReadToEnd(),
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (manifest is null ||
                    string.IsNullOrWhiteSpace(manifest.Id) ||
                    string.IsNullOrWhiteSpace(manifest.Version))
                {
                    continue;
                }

                result.Add(new PackageInfo(path, manifest));
            }
            catch
            {
                // Invalid package is ignored; it does not get executed.
            }
        }

        return result;
    }

    private static Version ParseVersion(string? value) =>
        Version.TryParse(value, out var parsed)
            ? parsed
            : new Version(0, 0, 0);

    private static string SanitizeSegment(string value)
    {
        foreach (var invalid in Path.GetInvalidFileNameChars())
            value = value.Replace(invalid, '_');

        return value;
    }

    private sealed record PackageInfo(
        string PackagePath,
        FeaturePackageManifest Manifest);
}
