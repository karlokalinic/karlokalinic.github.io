using System.Runtime.InteropServices;
using System.Threading;

namespace KarloDiskShell.Services;

public sealed class SingleInstanceService : IDisposable
{
    private const string MutexName = @"Local\KARLOLEGEND.Desktop.SingleInstance";
    private Mutex? _mutex;
    public bool IsPrimaryInstance { get; }

    public SingleInstanceService()
    {
        _mutex = new Mutex(initiallyOwned: true, MutexName, out var createdNew);
        IsPrimaryInstance = createdNew;

        if (!createdNew)
        {
            _mutex.Dispose();
            _mutex = null;
        }
    }

    public static void TryActivateExistingWindow()
    {
        var handle = FindWindow(null, "KARLOLEGEND");
        if (handle == IntPtr.Zero)
            return;

        ShowWindow(handle, SW_RESTORE);
        SetForegroundWindow(handle);
    }

    public void Dispose()
    {
        if (_mutex is null)
            return;

        try
        {
            _mutex.ReleaseMutex();
        }
        catch (ApplicationException)
        {
        }

        _mutex.Dispose();
        _mutex = null;
    }

    private const int SW_RESTORE = 9;

    [DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern IntPtr FindWindow(string? lpClassName, string? lpWindowName);

    [DllImport("user32.dll")]
    private static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
