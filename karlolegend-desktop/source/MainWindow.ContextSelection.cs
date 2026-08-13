using KarloDiskShell.Models;
using System.Windows.Controls;
using System.Windows.Input;

namespace KarloDiskShell;

public partial class MainWindow
{
    private void DesktopItem_PreviewMouseRightButtonDown(
        object sender,
        MouseButtonEventArgs e)
    {
        if (sender is ListBoxItem container &&
            container.DataContext is FileSystemItem item)
        {
            ItemsList.SelectedItem = item;
        }
    }
}
