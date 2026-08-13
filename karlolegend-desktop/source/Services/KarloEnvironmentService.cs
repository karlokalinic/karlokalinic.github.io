using System.IO;

namespace KarloDiskShell.Services;

public sealed class KarloEnvironmentService
{
    public string Root { get; }
    public string InternalRoot { get; }

    public string StateDirectory => Path.Combine(InternalRoot, "state");
    public string FeatureDirectory => Path.Combine(InternalRoot, "features");
    public string PackageInboxDirectory => Path.Combine(InternalRoot, "packages", "inbox");
    public string UpdateInboxDirectory => Path.Combine(InternalRoot, "updates", "inbox");
    public string UpdateStagingDirectory => Path.Combine(InternalRoot, "updates", "staged");
    public string UpdateBackupDirectory => Path.Combine(InternalRoot, "updates", "backup");
    public string WebViewDataDirectory => Path.Combine(StateDirectory, "webview2");
    public string VersionControlDirectory => Path.Combine(InternalRoot, "vcs");
    public string TempDirectory => Path.Combine(InternalRoot, "temp");

    public KarloEnvironmentService(string root)
    {
        Root = root;
        InternalRoot = Path.Combine(root, ".karlo");
    }

    public void EnsureLayout()
    {
        Directory.CreateDirectory(InternalRoot);
        Directory.CreateDirectory(StateDirectory);
        Directory.CreateDirectory(FeatureDirectory);
        Directory.CreateDirectory(PackageInboxDirectory);
        Directory.CreateDirectory(UpdateInboxDirectory);
        Directory.CreateDirectory(UpdateStagingDirectory);
        Directory.CreateDirectory(UpdateBackupDirectory);
        Directory.CreateDirectory(WebViewDataDirectory);
        Directory.CreateDirectory(VersionControlDirectory);
        Directory.CreateDirectory(TempDirectory);

        TryMarkHidden(InternalRoot);
    }

    public bool IsInternalPath(string path)
    {
        var internalFull = Path.GetFullPath(InternalRoot)
            .TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;

        var candidate = Path.GetFullPath(path)
            .TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;

        return candidate.StartsWith(internalFull, StringComparison.OrdinalIgnoreCase);
    }

    private static void TryMarkHidden(string path)
    {
        try
        {
            var attributes = File.GetAttributes(path);

            if (!attributes.HasFlag(FileAttributes.Hidden))
                File.SetAttributes(path, attributes | FileAttributes.Hidden);
        }
        catch
        {
            // Hidden state is cosmetic. Failure must never prevent startup.
        }
    }
}
