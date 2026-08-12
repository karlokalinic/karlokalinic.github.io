using KarloDiskShell.Services;
using System.IO;
using System.Windows;

namespace KarloDiskShell;

public partial class App : Application
{
    private SingleInstanceService? _singleInstance;

    private void Application_Startup(object sender, StartupEventArgs e)
    {
        // The temporary updater must be allowed to run while the main instance
        // is still shutting down, so update-apply mode bypasses the singleton.
        if (SelfUpdateService.IsApplyUpdateMode(e.Args))
        {
            var exitCode = SelfUpdateService.ApplyUpdateAndRestart(e.Args);
            Shutdown(exitCode);
            return;
        }

        _singleInstance = new SingleInstanceService();

        if (!_singleInstance.IsPrimaryInstance)
        {
            SingleInstanceService.TryActivateExistingWindow();
            Shutdown(0);
            return;
        }

        Exit += (_, _) => _singleInstance?.Dispose();

        var (root, rootOverride) = ResolveRoot(e.Args);
        var window = new MainWindow(root, allowSelfUpdate: !rootOverride);
        MainWindow = window;
        window.Show();
    }

    private static (string Root, bool WasOverridden) ResolveRoot(string[] args)
    {
        for (var i = 0; i < args.Length - 1; i++)
        {
            if (!string.Equals(args[i], "--root", StringComparison.OrdinalIgnoreCase))
                continue;

            var requested = Path.GetFullPath(args[i + 1]);

            if (!Directory.Exists(requested))
            {
                MessageBox.Show(
                    $"Root does not exist:\n{requested}",
                    "KARLOLEGEND",
                    MessageBoxButton.OK,
                    MessageBoxImage.Error);

                Environment.Exit(2);
            }

            return (EnsureTrailingSeparator(requested), true);
        }

        // Published layout:
        // K:\KARLOLEGEND.exe -> root becomes K:\
        var baseDirectory = AppContext.BaseDirectory;
        var driveRoot = Path.GetPathRoot(baseDirectory);

        return (EnsureTrailingSeparator(driveRoot ?? baseDirectory), false);
    }

    private static string EnsureTrailingSeparator(string path) =>
        Path.EndsInDirectorySeparator(path)
            ? path
            : path + Path.DirectorySeparatorChar;
}
