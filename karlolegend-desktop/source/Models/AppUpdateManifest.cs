namespace KarloDiskShell.Models;

public sealed class AppUpdateManifest
{
    public string Version { get; set; } = "";
    public string File { get; set; } = "KARLOLEGEND.exe";
    public string Sha256 { get; set; } = "";
    public string Notes { get; set; } = "";
}
