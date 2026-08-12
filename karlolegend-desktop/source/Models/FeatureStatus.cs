namespace KarloDiskShell.Models;

public sealed class FeatureStatus
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required string Description { get; init; }
    public required string InstalledVersion { get; init; }
    public required string AvailableVersion { get; init; }
    public required string State { get; init; }
    public required bool CanInstallOrUpdate { get; init; }

    public string VersionText =>
        string.IsNullOrWhiteSpace(AvailableVersion)
            ? InstalledVersion
            : $"{InstalledVersion}  →  {AvailableVersion}";
}
