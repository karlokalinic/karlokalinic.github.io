using System.Windows;
using System.Windows.Input;

namespace KarloDiskShell;

public partial class RenameItemWindow : Window
{
    public string NewName => NameTextBox.Text.Trim();

    public RenameItemWindow(string currentName)
    {
        InitializeComponent();
        NameTextBox.Text = currentName;

        Loaded += (_, _) =>
        {
            NameTextBox.Focus();

            var dot = currentName.LastIndexOf('.');
            if (dot > 0)
                NameTextBox.Select(0, dot);
            else
                NameTextBox.SelectAll();
        };
    }

    private void RenameButton_Click(object sender, RoutedEventArgs e)
    {
        if (string.IsNullOrWhiteSpace(NewName))
            return;

        DialogResult = true;
    }

    private void CancelButton_Click(object sender, RoutedEventArgs e) =>
        DialogResult = false;

    private void NameTextBox_KeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key == Key.Escape)
        {
            DialogResult = false;
            e.Handled = true;
        }
    }
}
