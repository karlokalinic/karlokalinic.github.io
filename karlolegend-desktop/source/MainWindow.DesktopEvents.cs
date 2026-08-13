using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;

namespace KarloDiskShell;

public partial class MainWindow
{
    private void ItemsList_PreviewMouseLeftButtonDown(
        object sender,
        MouseButtonEventArgs e)
    {
        var container = FindItemContainer(e.OriginalSource as DependencyObject);
        if (container is not null)
            DesktopItem_PreviewMouseLeftButtonDown(container, e);
    }

    private void ItemsList_PreviewMouseMove(
        object sender,
        MouseEventArgs e)
    {
        var container = _dragContainer ?? FindItemContainer(e.OriginalSource as DependencyObject);
        if (container is not null)
            DesktopItem_PreviewMouseMove(container, e);
    }

    private void ItemsList_PreviewMouseLeftButtonUp(
        object sender,
        MouseButtonEventArgs e)
    {
        var container = _dragContainer ?? FindItemContainer(e.OriginalSource as DependencyObject);
        if (container is not null)
            DesktopItem_PreviewMouseLeftButtonUp(container, e);
    }

    private void ItemsList_PreviewMouseRightButtonDown(
        object sender,
        MouseButtonEventArgs e)
    {
        var container = FindItemContainer(e.OriginalSource as DependencyObject);
        if (container is not null)
            DesktopItem_PreviewMouseRightButtonDown(container, e);
    }

    private ListBoxItem? FindItemContainer(DependencyObject? source)
    {
        var current = source;

        while (current is not null && !ReferenceEquals(current, ItemsList))
        {
            if (current is ListBoxItem item)
                return item;

            current = VisualTreeHelper.GetParent(current);
        }

        return null;
    }
}
