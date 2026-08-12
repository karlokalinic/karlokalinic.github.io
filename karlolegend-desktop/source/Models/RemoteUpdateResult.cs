namespace KarloDiskShell.Models;

public sealed record RemoteUpdateResult(
    bool Success,
    bool UpdateAvailable,
    bool Downloaded,
    string Version,
    string Message);
