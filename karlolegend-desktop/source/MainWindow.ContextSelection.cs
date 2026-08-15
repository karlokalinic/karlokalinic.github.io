using KarloDiskShell.Models;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;

namespace KarloDiskShell;

public partial class MainWindow
{
    private void DesktopItem_PreviewMouseRightButtonDown(
        object sender,
        MouseButtonEventArgs e)
    {
        if (sender is not ListBoxItem container ||
            container.DataContext is not FileSystemItem item)
        {
            return;
        }

        ItemsList.SelectedItem = item;

        // Keep item actions out of the reusable XAML Style. WPF's generated
        // IComponentConnector can mis-bind event connections for a ContextMenu
        // nested inside Style/Setter.Value in compiled BAML, which caused the
        // published EXE to crash during InitializeComponent().
        var menu = CreateItemContextMenu(container);
        container.ContextMenu = menu;
        menu.IsOpen = true;

        // Prevent the ListBox background context menu from opening as well.
        e.Handled = true;
    }

    private ContextMenu CreateItemContextMenu(ListBoxItem placementTarget)
    {
        var menu = new ContextMenu
        {
            PlacementTarget = placementTarget
        };

        menu.Opened += ItemContextMenu_Opened;

        menu.Items.Add(CreateMenuItem("Open", OpenItemMenuItem_Click));
        menu.Items.Add(CreateMenuItem("Open Externally", OpenExternalMenuItem_Click));
        menu.Items.Add(new Separator());
        menu.Items.Add(CreateMenuItem("Rename", RenameItemMenuItem_Click));
        menu.Items.Add(CreateMenuItem("Delete to Recycle Bin", DeleteItemMenuItem_Click));

        return menu;
    }

    private static MenuItem CreateMenuItem(
        string header,
        RoutedEventHandler clickHandler)
    {
        var item = new MenuItem { Header = header };
        item.Click += clickHandler;
        return item;
    }
}
