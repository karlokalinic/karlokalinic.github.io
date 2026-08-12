namespace KarloDiskShell.Models;

public sealed class FeaturePackageManifest
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Version { get; set; } = "";
    public string Description { get; set; } = "";
    public string MinAppVersion { get; set; } = "0.0.0";
}
