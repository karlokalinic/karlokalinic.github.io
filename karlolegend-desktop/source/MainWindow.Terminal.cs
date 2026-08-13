using System.Diagnostics;
using System.Windows;

namespace KarloDiskShell;

public partial class MainWindow
{
    private void TerminalButton_Click(object sender, RoutedEventArgs e)
    {
        try
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = "powershell.exe",
                WorkingDirectory = _currentPath,
                UseShellExecute = true
            });
        }
        catch (Exception ex)
        {
            ShowError("Could not open Windows PowerShell.", ex);
        }
    }
}
