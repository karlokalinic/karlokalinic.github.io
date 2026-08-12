using KarloDiskShell.Models;
using KarloDiskShell.Services;
using System.Windows;

namespace KarloDiskShell;

public partial class FeatureCenterWindow : Window
{
    private readonly FeatureCatalogService _catalog;

    public FeatureCenterWindow(FeatureCatalogService catalog)
    {
        InitializeComponent();
        _catalog = catalog;
        Refresh();
    }

    private void Refresh()
    {
        FeatureList.ItemsSource = _catalog.GetStatuses();
    }

    private void RefreshButton_Click(object sender, RoutedEventArgs e)
    {
        ResultText.Text = "";
        Refresh();
    }

    private void InstallButton_Click(object sender, RoutedEventArgs e)
    {
        if (FeatureList.SelectedItem is not FeatureStatus feature)
        {
            ResultText.Text = "Select a feature first.";
            return;
        }

        if (!feature.CanInstallOrUpdate)
        {
            ResultText.Text = feature.State == "Not installed"
                ? "No install package is currently available in the local package inbox."
                : "This feature is already current.";
            return;
        }

        ResultText.Text = _catalog.InstallOrUpdate(feature.Id);
        Refresh();
    }

    private void CloseButton_Click(object sender, RoutedEventArgs e) =>
        Close();
}
