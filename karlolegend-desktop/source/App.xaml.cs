using KarloDiskShell.Services;
using System.IO;
using System.Text;
using System.Windows;
using System.Windows.Threading;

namespace KarloDiskShell;

public partial class App : Application
{
    private SingleInstanceService? _singleInstance;
    private bool _isSmokeTest;

    public App()
    {
        DispatcherUnhandledException += OnDispatcherUnhandledException;
        AppDomain.CurrentDomain.UnhandledException += OnAppDomainUnhandledException;
        TaskScheduler.UnobservedTaskException += OnUnobservedTaskException;
    }

    private void Application_Startup(object sender, StartupEventArgs e)
    {
        _isSmokeTest = HasArgument(e.Args, "--smoke-test");

        try
        {
            StartApplication(e.Args);
        }
        catch (Exception ex)
        {
            FailStartup(ex);
        }
    }

    private void StartApplication(string[] args)
    {
        // The temporary updater must be allowed to run while the main instance
        // is still shutting down, so update-apply mode bypasses the singleton.
        if (SelfUpdateService.IsApplyUpdateMode(args))
        {
            var exitCode = SelfUpdateService.ApplyUpdateAndRestart(args);
            Shutdown(exitCode);
            return;
        }

        var (root, rootOverride) = ResolveRoot(args);

        // CI/release runtime probe. This intentionally constructs the real WPF
        // main window from the published EXE, but disables networking/updating
        // and closes immediately after XAML/layout initialization succeeds.
        if (_isSmokeTest)
        {
            var smokeWindow = new MainWindow(root, allowSelfUpdate: false);
            MainWindow = smokeWindow;
            smokeWindow.Show();
            smokeWindow.UpdateLayout();
            smokeWindow.Close();
            Shutdown(0);
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

        var window = new MainWindow(root, allowSelfUpdate: !rootOverride);
        MainWindow = window;
        window.Show();
    }

    private static bool HasArgument(string[] args, string expected) =>
        args.Any(arg => string.Equals(arg, expected, StringComparison.OrdinalIgnoreCase));

    private static (string Root, bool WasOverridden) ResolveRoot(string[] args)
    {
        for (var i = 0; i < args.Length - 1; i++)
        {
            if (!string.Equals(args[i], "--root", StringComparison.OrdinalIgnoreCase))
                continue;

            var requested = Path.GetFullPath(args[i + 1]);

            if (!Directory.Exists(requested))
                throw new DirectoryNotFoundException($"KARLOLEGEND root does not exist: {requested}");

            return (EnsureTrailingSeparator(requested), true);
        }

        // Production layout is defined by the actual process path, not the
        // single-file extraction directory. K:\KARLOLEGEND.exe therefore owns K:\.
        var processPath = Environment.ProcessPath;
        var executableDirectory = !string.IsNullOrWhiteSpace(processPath)
            ? Path.GetDirectoryName(processPath)
            : null;
        var baseDirectory = executableDirectory ?? AppContext.BaseDirectory;
        var driveRoot = Path.GetPathRoot(baseDirectory);

        return (EnsureTrailingSeparator(driveRoot ?? baseDirectory), false);
    }

    private void FailStartup(Exception exception)
    {
        var logPath = TryWriteCrashLog("STARTUP", exception);

        if (!_isSmokeTest)
        {
            var suffix = string.IsNullOrWhiteSpace(logPath)
                ? string.Empty
                : $"\n\nDiagnostic log:\n{logPath}";

            try
            {
                MessageBox.Show(
                    $"KARLOLEGEND could not start.\n\n{exception.GetType().Name}: {exception.Message}{suffix}",
                    "KARLOLEGEND Startup Error",
                    MessageBoxButton.OK,
                    MessageBoxImage.Error);
            }
            catch
            {
            }
        }

        Shutdown(1);
    }

    private void OnDispatcherUnhandledException(object sender, DispatcherUnhandledExceptionEventArgs e)
    {
        var logPath = TryWriteCrashLog("DISPATCHER", e.Exception);

        if (!_isSmokeTest)
        {
            try
            {
                MessageBox.Show(
                    $"KARLOLEGEND encountered a fatal UI error.\n\n{e.Exception.GetType().Name}: {e.Exception.Message}" +
                    (string.IsNullOrWhiteSpace(logPath) ? string.Empty : $"\n\nDiagnostic log:\n{logPath}"),
                    "KARLOLEGEND Error",
                    MessageBoxButton.OK,
                    MessageBoxImage.Error);
            }
            catch
            {
            }
        }

        e.Handled = true;
        Shutdown(1);
    }

    private static void OnAppDomainUnhandledException(object? sender, UnhandledExceptionEventArgs e)
    {
        if (e.ExceptionObject is Exception exception)
            TryWriteCrashLog("APPDOMAIN", exception);
    }

    private static void OnUnobservedTaskException(object? sender, UnobservedTaskExceptionEventArgs e)
    {
        TryWriteCrashLog("TASK", e.Exception);
        e.SetObserved();
    }

    private static string? TryWriteCrashLog(string source, Exception exception)
    {
        foreach (var directory in CandidateLogDirectories())
        {
            try
            {
                Directory.CreateDirectory(directory);
                var logPath = Path.Combine(directory, "startup.log");
                var text = new StringBuilder()
                    .AppendLine("============================================================")
                    .AppendLine($"UTC: {DateTimeOffset.UtcNow:O}")
                    .AppendLine($"Source: {source}")
                    .AppendLine($"Process: {Environment.ProcessPath ?? "<unknown>"}")
                    .AppendLine($"BaseDirectory: {AppContext.BaseDirectory}")
                    .AppendLine($"OS: {Environment.OSVersion}")
                    .AppendLine($"64-bit process: {Environment.Is64BitProcess}")
                    .AppendLine(exception.ToString())
                    .ToString();

                File.AppendAllText(logPath, text);
                return logPath;
            }
            catch
            {
            }
        }

        return null;
    }

    private static IEnumerable<string> CandidateLogDirectories()
    {
        var processPath = Environment.ProcessPath;
        var executableDirectory = !string.IsNullOrWhiteSpace(processPath)
            ? Path.GetDirectoryName(processPath)
            : null;

        if (!string.IsNullOrWhiteSpace(executableDirectory))
            yield return Path.Combine(executableDirectory, ".karlo", "logs");

        var localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        if (!string.IsNullOrWhiteSpace(localAppData))
            yield return Path.Combine(localAppData, "KARLOLEGEND", "logs");
    }

    private static string EnsureTrailingSeparator(string path) =>
        Path.EndsInDirectorySeparator(path)
            ? path
            : path + Path.DirectorySeparatorChar;
}
