namespace KarloDiskShell.Models;

public sealed class DesktopSettings
{
    public int Schema { get; set; } = 2;
    public string WallpaperPath { get; set; } = "";
    public bool OpenHtmlInsideKarlolegend { get; set; } = true;
    public bool SnapToGrid { get; set; } = false;
    public double IconSize { get; set; } = 52;
    public Dictionary<string, DesktopIconPosition> IconPositions { get; set; } = new();
}

public sealed class DesktopIconPosition
{
    public double X { get; set; }
    public double Y { get; set; }
}
