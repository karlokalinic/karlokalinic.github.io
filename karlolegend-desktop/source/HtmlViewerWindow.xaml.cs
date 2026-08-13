using Microsoft.Web.WebView2.Core;
using System.Diagnostics;
using System.IO;
using System.Windows;

namespace KarloDiskShell;

public partial class HtmlViewerWindow : Window
{
    private const string VirtualHost = "karlo.local";

    private readonly string _root;
    private readonly string _htmlPath;
    private readonly string _webViewDataDirectory;

    public HtmlViewerWindow(
        string root,
        string webViewDataDirectory,
        string htmlPath)
    {
        InitializeComponent();

        _root = Path.GetFullPath(root);
        _htmlPath = Path.GetFullPath(htmlPath);
        _webViewDataDirectory = webViewDataDirectory;

        Title = $"KARLOLEGEND — {Path.GetFileName(_htmlPath)}";
        PathText.Text = _htmlPath;

        Loaded += async (_, _) => await InitializeAsync();
    }

    private async Task InitializeAsync()
    {
        try
        {
            Directory.CreateDirectory(_webViewDataDirectory);

            var environment = await CoreWebView2Environment.CreateAsync(
                userDataFolder: _webViewDataDirectory);

            await WebView.EnsureCoreWebView2Async(environment);

            WebView.CoreWebView2.Settings.IsStatusBarEnabled = false;
            WebView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = true;
            WebView.CoreWebView2.Settings.AreDevToolsEnabled = true;
            WebView.CoreWebView2.Settings.IsZoomControlEnabled = true;

            WebView.CoreWebView2.SetVirtualHostNameToFolderMapping(
                VirtualHost,
                _root,
                CoreWebView2HostResourceAccessKind.DenyCors);

            WebView.CoreWebView2.HistoryChanged += (_, _) => UpdateNavigationState();
            WebView.CoreWebView2.NavigationStarting += (_, e) =>
            {
                StatusText.Text = e.Uri;
            };
            WebView.CoreWebView2.NavigationCompleted += (_, e) =>
            {
                StatusText.Text = e.IsSuccess ? "Ready" : $"Navigation failed: {e.WebErrorStatus}";
                UpdateNavigationState();
            };

            NavigateToLocalFile();
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                this,
                "KARLOLEGEND could not initialize the internal HTML renderer.\n\n" +
                ex.Message +
                "\n\nThe WebView2 Evergreen Runtime is required.",
                "KARLOLEGEND HTML",
                MessageBoxButton.OK,
                MessageBoxImage.Error);

            Close();
        }
    }

    private void NavigateToLocalFile()
    {
        var relative = Path.GetRelativePath(_root, _htmlPath)
            .Replace(Path.DirectorySeparatorChar, '/');

        var encoded = string.Join(
            "/",
            relative.Split('/')
                .Select(Uri.EscapeDataString));

        WebView.CoreWebView2.Navigate($"https://{VirtualHost}/{encoded}");
    }

    private void UpdateNavigationState()
    {
        if (WebView.CoreWebView2 is null)
            return;

        BackButton.IsEnabled = WebView.CoreWebView2.CanGoBack;
        ForwardButton.IsEnabled = WebView.CoreWebView2.CanGoForward;
    }

    private void BackButton_Click(object sender, RoutedEventArgs e)
    {
        if (WebView.CoreWebView2?.CanGoBack == true)
            WebView.CoreWebView2.GoBack();
    }

    private void ForwardButton_Click(object sender, RoutedEventArgs e)
    {
        if (WebView.CoreWebView2?.CanGoForward == true)
            WebView.CoreWebView2.GoForward();
    }

    private void ReloadButton_Click(object sender, RoutedEventArgs e) =>
        WebView.CoreWebView2?.Reload();

    private void OpenExternalButton_Click(object sender, RoutedEventArgs e)
    {
        Process.Start(new ProcessStartInfo
        {
            FileName = _htmlPath,
            UseShellExecute = true,
            WorkingDirectory = Path.GetDirectoryName(_htmlPath) ?? _root
        });
    }
}
