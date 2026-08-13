using KarloDiskShell.Models;
using KarloDiskShell.Services;
using Microsoft.Win32;
using Microsoft.VisualBasic.FileIO;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.IO;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media.Imaging;
using System.Windows.Threading;

namespace KarloDiskShell;

public partial class MainWindow : Window
{
    private const double DesktopItemWidth = 128;
    private const double DesktopItemHeight = 116;
    private const double DefaultColumnStep = 138;
    private const double DefaultRowStep = 120;
    private const double DesktopMargin = 16;
    private const double SnapStep = 16;

    private static readonly HashSet<string> HiddenInfrastructureNames =
        new(StringComparer.OrdinalIgnoreCase)
        {
            "System Volume Information",
            "$RECYCLE.BIN"
        };

    private readonly string _root;
    private readonly bool _allowSelfUpdate;
    private readonly KarloEnvironmentService _environment;
    private readonly FeatureCatalogService _featureCatalog;
    private readonly RemoteUpdateService _remoteUpdateService;
    private readonly DesktopSettingsService _desktopSettingsService;
    private readonly DesktopSettings _desktopSettings;

    private string _currentPath;

    private readonly ObservableCollection<FileSystemItem> _items = new();
    private readonly Stack<string> _backHistory = new();

    private FileSystemWatcher? _watcher;
    private readonly DispatcherTimer _refreshDebounce;
    private bool _isCheckingUpdates;

    private ListBoxItem? _dragContainer;
    private FileSystemItem? _dragItem;
    private Point _dragStartPointer;
    private Point _dragStartItem;
    private bool _dragMoved;

    private WindowStyle _previousWindowStyle;
    private WindowState _previousWindowState;
    private ResizeMode _previousResizeMode;
    private bool _isFullscreen;

    public MainWindow(string root, bool allowSelfUpdate)
    {
        InitializeComponent();

        _root = Normalize(root);
        _currentPath = _root;
        _allowSelfUpdate = allowSelfUpdate;

        _environment = new KarloEnvironmentService(_root);
        _environment.EnsureLayout();

        _featureCatalog = new FeatureCatalogService(_environment);
        _remoteUpdateService = new RemoteUpdateService(_environment);
        _desktopSettingsService = new DesktopSettingsService(_environment);
        _desktopSettings = _desktopSettingsService.Load();
        ApplyWallpaper();

        ItemsList.ItemsSource = _items;

        _refreshDebounce = new DispatcherTimer
        {
            Interval = TimeSpan.FromMilliseconds(180)
        };

        _refreshDebounce.Tick += (_, _) =>
        {
            _refreshDebounce.Stop();
            RefreshCurrentDirectory();
        };

        Loaded += async (_, _) =>
        {
            NavigateTo(_root, addToHistory: false);

            if (_allowSelfUpdate)
                await CheckForUpdatesAsync(interactive: false);
            else
                UpdateButton.Content = "Updates (dev)";
        };

        Closed += (_, _) => DisposeWatcher();
    }

    private void NavigateTo(string path, bool addToHistory = true)
    {
        try
        {
            var normalized = Normalize(path);

            if (!Directory.Exists(normalized))
                return;

            if (!IsInsideRoot(normalized))
                return;

            if (addToHistory &&
                !string.Equals(_currentPath, normalized, StringComparison.OrdinalIgnoreCase))
            {
                _backHistory.Push(_currentPath);
            }

            _currentPath = normalized;
            AddressText.Text = _currentPath;
            BackButton.IsEnabled = _backHistory.Count > 0;

            LoadDirectory();
            ResetWatcher();
        }
        catch (Exception ex)
        {
            ShowError("Could not open folder.", ex);
        }
    }

    private void LoadDirectory()
    {
        _items.Clear();

        IEnumerable<string> entries;

        try
        {
            entries = Directory
                .EnumerateFileSystemEntries(_currentPath)
                .Where(ShouldRenderPath)
                .ToArray();
        }
        catch (UnauthorizedAccessException ex)
        {
            ShowError("Access denied.", ex);
            return;
        }
        catch (IOException ex)
        {
            ShowError("Could not read this folder.", ex);
            return;
        }

        var ordered = entries
            .Select(path => new
            {
                Path = path,
                IsDirectory = Directory.Exists(path),
                Name = Path.GetFileName(
                    path.TrimEnd(Path.DirectorySeparatorChar))
            })
            .OrderByDescending(x => x.IsDirectory)
            .ThenBy(x => x.Name, StringComparer.CurrentCultureIgnoreCase)
            .ToArray();

        var settingsChanged = false;

        for (var index = 0; index < ordered.Length; index++)
        {
            var entry = ordered[index];

            try
            {
                var position = GetOrCreateIconPosition(entry.Path, index, ref settingsChanged);

                _items.Add(new FileSystemItem
                {
                    Name = string.IsNullOrWhiteSpace(entry.Name)
                        ? entry.Path
                        : entry.Name,
                    FullPath = entry.Path,
                    IsDirectory = entry.IsDirectory,
                    Icon = ShellIconService.GetIcon(entry.Path),
                    X = position.X,
                    Y = position.Y
                });
            }
            catch
            {
                // One inaccessible/malformed entry must not kill the desktop.
            }
        }

        if (settingsChanged)
            TrySaveDesktopSettings();

        var folderCount = _items.Count(x => x.IsDirectory);
        var fileCount = _items.Count - folderCount;

        StatusText.Text = $"{folderCount} folders  •  {fileCount} files";
    }

    private DesktopIconPosition GetOrCreateIconPosition(
        string path,
        int index,
        ref bool settingsChanged)
    {
        var key = LayoutKey(path);

        if (_desktopSettings.IconPositions.TryGetValue(key, out var existing))
            return existing;

        var availableHeight = ItemsList.ActualHeight;
        if (availableHeight < DesktopItemHeight + DesktopMargin * 2)
            availableHeight = 620;

        var rows = Math.Max(
            1,
            (int)Math.Floor(
                (availableHeight - DesktopMargin * 2) / DefaultRowStep));

        var row = index % rows;
        var column = index / rows;

        var created = new DesktopIconPosition
        {
            X = DesktopMargin + column * DefaultColumnStep,
            Y = DesktopMargin + row * DefaultRowStep
        };

        _desktopSettings.IconPositions[key] = created;
        settingsChanged = true;
        return created;
    }

    private bool ShouldRenderPath(string path)
    {
        if (_environment.IsInternalPath(path))
            return false;

        var name = Path.GetFileName(
            path.TrimEnd(Path.DirectorySeparatorChar));

        if (HiddenInfrastructureNames.Contains(name))
            return false;

        try
        {
            var fullPath = Path.GetFullPath(path);

            // Hide the deployed shell even when this is a development run from C:\
            // rendering K:\ through --root. The running-process check below also
            // covers a production executable that has been renamed.
            var canonicalShellPath = Path.Combine(_root, "KARLOLEGEND.exe");
            if (string.Equals(
                    fullPath,
                    Path.GetFullPath(canonicalShellPath),
                    StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            var currentExe = Environment.ProcessPath;
            if (!string.IsNullOrWhiteSpace(currentExe) &&
                string.Equals(
                    fullPath,
                    Path.GetFullPath(currentExe),
                    StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }
        }
        catch
        {
        }

        return true;
    }

    private void OpenItem(FileSystemItem item)
    {
        if (item.IsDirectory)
        {
            NavigateTo(item.FullPath);
            return;
        }

        try
        {
            var extension = Path.GetExtension(item.FullPath);

            if (_desktopSettings.OpenHtmlInsideKarlolegend &&
                (string.Equals(extension, ".html", StringComparison.OrdinalIgnoreCase) ||
                 string.Equals(extension, ".htm", StringComparison.OrdinalIgnoreCase)))
            {
                var viewer = new HtmlViewerWindow(
                    _root,
                    _environment.WebViewDataDirectory,
                    item.FullPath)
                {
                    Owner = this
                };

                viewer.Show();
                return;
            }

            OpenExternally(item);
        }
        catch (Exception ex)
        {
            ShowError($"Could not open:\n{item.Name}", ex);
        }
    }

    private void OpenExternally(FileSystemItem item)
    {
        Process.Start(new ProcessStartInfo
        {
            FileName = item.FullPath,
            UseShellExecute = true,
            WorkingDirectory = item.IsDirectory
                ? item.FullPath
                : Path.GetDirectoryName(item.FullPath) ?? _currentPath
        });
    }

    private void ItemsList_MouseDoubleClick(object sender, MouseButtonEventArgs e)
    {
        if (_dragMoved)
            return;

        if (ItemsList.SelectedItem is FileSystemItem item)
            OpenItem(item);
    }

    private void DesktopItem_PreviewMouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        if (sender is not ListBoxItem container ||
            container.DataContext is not FileSystemItem item)
        {
            return;
        }

        ItemsList.SelectedItem = item;
        _dragContainer = container;
        _dragItem = item;
        _dragStartPointer = e.GetPosition(ItemsList);
        _dragStartItem = new Point(item.X, item.Y);
        _dragMoved = false;

        container.CaptureMouse();
    }

    private void DesktopItem_PreviewMouseMove(object sender, MouseEventArgs e)
    {
        if (_dragItem is null ||
            _dragContainer is null ||
            e.LeftButton != MouseButtonState.Pressed)
        {
            return;
        }

        var pointer = e.GetPosition(ItemsList);
        var deltaX = pointer.X - _dragStartPointer.X;
        var deltaY = pointer.Y - _dragStartPointer.Y;

        if (!_dragMoved &&
            Math.Abs(deltaX) < SystemParameters.MinimumHorizontalDragDistance &&
            Math.Abs(deltaY) < SystemParameters.MinimumVerticalDragDistance)
        {
            return;
        }

        _dragMoved = true;

        var maxX = Math.Max(0, ItemsList.ActualWidth - DesktopItemWidth);
        var maxY = Math.Max(0, ItemsList.ActualHeight - DesktopItemHeight);

        _dragItem.X = Math.Clamp(_dragStartItem.X + deltaX, 0, maxX);
        _dragItem.Y = Math.Clamp(_dragStartItem.Y + deltaY, 0, maxY);

        e.Handled = true;
    }

    private void DesktopItem_PreviewMouseLeftButtonUp(object sender, MouseButtonEventArgs e)
    {
        if (_dragContainer is null || _dragItem is null)
            return;

        if (_dragMoved)
        {
            if (_desktopSettings.SnapToGrid)
            {
                _dragItem.X = Math.Round(_dragItem.X / SnapStep) * SnapStep;
                _dragItem.Y = Math.Round(_dragItem.Y / SnapStep) * SnapStep;
            }

            SaveIconPosition(_dragItem);
            e.Handled = true;
        }

        if (_dragContainer.IsMouseCaptured)
            _dragContainer.ReleaseMouseCapture();

        _dragContainer = null;
        _dragItem = null;
    }

    private void ItemContextMenu_Opened(object sender, RoutedEventArgs e)
    {
        if (sender is ContextMenu menu &&
            menu.PlacementTarget is ListBoxItem container &&
            container.DataContext is FileSystemItem item)
        {
            ItemsList.SelectedItem = item;
        }
    }

    private void OpenItemMenuItem_Click(object sender, RoutedEventArgs e)
    {
        if (ItemsList.SelectedItem is FileSystemItem item)
            OpenItem(item);
    }

    private void OpenExternalMenuItem_Click(object sender, RoutedEventArgs e)
    {
        if (ItemsList.SelectedItem is not FileSystemItem item)
            return;

        try
        {
            OpenExternally(item);
        }
        catch (Exception ex)
        {
            ShowError($"Could not open externally:\n{item.Name}", ex);
        }
    }

    private void RenameItemMenuItem_Click(object sender, RoutedEventArgs e) =>
        RenameSelectedItem();

    private void DeleteItemMenuItem_Click(object sender, RoutedEventArgs e) =>
        DeleteSelectedItemToRecycleBin();

    private void RenameSelectedItem()
    {
        if (ItemsList.SelectedItem is not FileSystemItem item)
            return;

        var dialog = new RenameItemWindow(item.Name)
        {
            Owner = this
        };

        if (dialog.ShowDialog() != true)
            return;

        var newName = dialog.NewName;

        if (string.IsNullOrWhiteSpace(newName) ||
            newName.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0)
        {
            MessageBox.Show(
                this,
                "The new name is empty or contains characters Windows does not allow in file names.",
                "KARLOLEGEND Rename",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
            return;
        }

        var parent = Path.GetDirectoryName(item.FullPath);
        if (string.IsNullOrWhiteSpace(parent))
            return;

        var targetPath = Path.Combine(parent, newName);

        if (string.Equals(item.FullPath, targetPath, StringComparison.OrdinalIgnoreCase))
            return;

        if (File.Exists(targetPath) || Directory.Exists(targetPath))
        {
            MessageBox.Show(
                this,
                "An item with that name already exists.",
                "KARLOLEGEND Rename",
                MessageBoxButton.OK,
                MessageBoxImage.Warning);
            return;
        }

        try
        {
            if (item.IsDirectory)
                Directory.Move(item.FullPath, targetPath);
            else
                File.Move(item.FullPath, targetPath);

            MoveIconPosition(item.FullPath, targetPath);
            RefreshCurrentDirectory();
        }
        catch (Exception ex)
        {
            ShowError("Could not rename the item.", ex);
        }
    }

    private void DeleteSelectedItemToRecycleBin()
    {
        if (ItemsList.SelectedItem is not FileSystemItem item)
            return;

        var response = MessageBox.Show(
            this,
            $"Move '{item.Name}' to the Windows Recycle Bin?",
            "KARLOLEGEND Delete",
            MessageBoxButton.YesNo,
            MessageBoxImage.Warning);

        if (response != MessageBoxResult.Yes)
            return;

        try
        {
            if (item.IsDirectory)
            {
                Microsoft.VisualBasic.FileIO.FileSystem.DeleteDirectory(
                    item.FullPath,
                    UIOption.OnlyErrorDialogs,
                    RecycleOption.SendToRecycleBin);
            }
            else
            {
                Microsoft.VisualBasic.FileIO.FileSystem.DeleteFile(
                    item.FullPath,
                    UIOption.OnlyErrorDialogs,
                    RecycleOption.SendToRecycleBin);
            }

            _desktopSettings.IconPositions.Remove(LayoutKey(item.FullPath));
            TrySaveDesktopSettings();
            RefreshCurrentDirectory();
        }
        catch (Exception ex)
        {
            ShowError("Could not move the item to the Recycle Bin.", ex);
        }
    }

    private void SaveIconPosition(FileSystemItem item)
    {
        _desktopSettings.IconPositions[LayoutKey(item.FullPath)] = new DesktopIconPosition
        {
            X = item.X,
            Y = item.Y
        };

        TrySaveDesktopSettings();
    }

    private void MoveIconPosition(string oldPath, string newPath)
    {
        var oldKey = LayoutKey(oldPath);
        var newKey = LayoutKey(newPath);

        if (_desktopSettings.IconPositions.Remove(oldKey, out var position))
            _desktopSettings.IconPositions[newKey] = position;

        TrySaveDesktopSettings();
    }

    private static string LayoutKey(string path) =>
        Path.GetFullPath(path).ToUpperInvariant();

    private void TrySaveDesktopSettings()
    {
        try
        {
            _desktopSettingsService.Save(_desktopSettings);
        }
        catch
        {
            // Presentation-state persistence must never break file navigation.
        }
    }

    private void BackButton_Click(object sender, RoutedEventArgs e)
    {
        if (_backHistory.Count == 0)
            return;

        var previous = _backHistory.Pop();
        NavigateTo(previous, addToHistory: false);
        BackButton.IsEnabled = _backHistory.Count > 0;
    }

    private void UpButton_Click(object sender, RoutedEventArgs e)
    {
        if (string.Equals(_currentPath, _root, StringComparison.OrdinalIgnoreCase))
            return;

        var parent = Directory.GetParent(
            _currentPath.TrimEnd(Path.DirectorySeparatorChar));

        if (parent is not null)
            NavigateTo(parent.FullName);
    }

    private void HomeButton_Click(object sender, RoutedEventArgs e) =>
        NavigateTo(_root);

    private void RefreshButton_Click(object sender, RoutedEventArgs e) =>
        RefreshCurrentDirectory();

    private void DesktopModeButton_Click(object sender, RoutedEventArgs e) =>
        ToggleFullscreen();

    private void NewFolderMenuItem_Click(object sender, RoutedEventArgs e)
    {
        try
        {
            var baseName = "New Folder";
            var candidate = Path.Combine(_currentPath, baseName);
            var suffix = 2;

            while (Directory.Exists(candidate) || File.Exists(candidate))
            {
                candidate = Path.Combine(_currentPath, $"{baseName} ({suffix})");
                suffix++;
            }

            Directory.CreateDirectory(candidate);
            RefreshCurrentDirectory();
        }
        catch (Exception ex)
        {
            ShowError("Could not create folder.", ex);
        }
    }

    private void SetWallpaperMenuItem_Click(object sender, RoutedEventArgs e)
    {
        var dialog = new OpenFileDialog
        {
            Title = "Choose KARLOLEGEND desktop wallpaper",
            Filter = "Images|*.png;*.jpg;*.jpeg;*.bmp|All files|*.*",
            CheckFileExists = true,
            Multiselect = false
        };

        if (dialog.ShowDialog(this) != true)
            return;

        try
        {
            var wallpaperDirectory = Path.Combine(
                _environment.StateDirectory,
                "wallpaper");

            Directory.CreateDirectory(wallpaperDirectory);

            var extension = Path.GetExtension(dialog.FileName);
            var importedPath = Path.Combine(
                wallpaperDirectory,
                "desktop" + extension);

            File.Copy(dialog.FileName, importedPath, overwrite: true);

            _desktopSettings.WallpaperPath = importedPath;
            _desktopSettingsService.Save(_desktopSettings);
            ApplyWallpaper();
        }
        catch (Exception ex)
        {
            ShowError("Could not import wallpaper.", ex);
        }
    }

    private void ClearWallpaperMenuItem_Click(object sender, RoutedEventArgs e)
    {
        _desktopSettings.WallpaperPath = "";
        TrySaveDesktopSettings();
        WallpaperImage.Source = null;
    }

    private void OpenExplorerMenuItem_Click(object sender, RoutedEventArgs e)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = "explorer.exe",
            UseShellExecute = true
        };

        startInfo.ArgumentList.Add(_currentPath);
        Process.Start(startInfo);
    }

    private void RefreshMenuItem_Click(object sender, RoutedEventArgs e) =>
        RefreshCurrentDirectory();

    private void ApplyWallpaper()
    {
        WallpaperImage.Source = null;

        if (string.IsNullOrWhiteSpace(_desktopSettings.WallpaperPath) ||
            !File.Exists(_desktopSettings.WallpaperPath))
        {
            return;
        }

        try
        {
            var bitmap = new BitmapImage();
            bitmap.BeginInit();
            bitmap.CacheOption = BitmapCacheOption.OnLoad;
            bitmap.UriSource = new Uri(_desktopSettings.WallpaperPath, UriKind.Absolute);
            bitmap.EndInit();
            bitmap.Freeze();

            WallpaperImage.Source = bitmap;
        }
        catch
        {
            WallpaperImage.Source = null;
        }
    }

    private void FeaturesButton_Click(object sender, RoutedEventArgs e)
    {
        var window = new FeatureCenterWindow(_featureCatalog)
        {
            Owner = this
        };

        window.ShowDialog();
    }

    private async void UpdateButton_Click(object sender, RoutedEventArgs e) =>
        await CheckForUpdatesAsync(interactive: true);

    private async Task CheckForUpdatesAsync(bool interactive)
    {
        if (!_allowSelfUpdate)
        {
            if (interactive)
            {
                MessageBox.Show(
                    this,
                    "Self-update is disabled while running with --root from the source tree.\n\nPublish and run K:\\KARLOLEGEND.exe to test production updates.",
                    "KARLOLEGEND Updates",
                    MessageBoxButton.OK,
                    MessageBoxImage.Information);
            }

            return;
        }

        if (_isCheckingUpdates)
            return;

        _isCheckingUpdates = true;
        UpdateButton.IsEnabled = false;
        UpdateButton.Content = "Checking…";

        try
        {
            var result = await _remoteUpdateService.CheckAndDownloadLatestAsync();

            if (!result.Success)
            {
                UpdateButton.Content = "Updates offline";

                if (interactive)
                {
                    MessageBox.Show(
                        this,
                        result.Message,
                        "KARLOLEGEND Updates",
                        MessageBoxButton.OK,
                        MessageBoxImage.Warning);
                }

                return;
            }

            if (!result.UpdateAvailable)
            {
                UpdateButton.Content = "Up to date";

                if (interactive)
                {
                    MessageBox.Show(
                        this,
                        result.Message,
                        "KARLOLEGEND Updates",
                        MessageBoxButton.OK,
                        MessageBoxImage.Information);
                }

                return;
            }

            UpdateButton.Content = $"Update {result.Version}";

            // The network layer only places a verified-package candidate in the
            // local inbox. The existing updater then owns staging, SHA-256
            // verification, replacement and restart.
            SelfUpdateService.CheckAndPrompt(this, _environment);
        }
        finally
        {
            _isCheckingUpdates = false;
            UpdateButton.IsEnabled = true;
        }
    }

    private void RefreshCurrentDirectory()
    {
        if (Directory.Exists(_currentPath))
            LoadDirectory();
        else
            NavigateTo(_root, addToHistory: false);
    }

    private void ResetWatcher()
    {
        DisposeWatcher();

        try
        {
            _watcher = new FileSystemWatcher(_currentPath)
            {
                NotifyFilter =
                    NotifyFilters.FileName |
                    NotifyFilters.DirectoryName |
                    NotifyFilters.LastWrite |
                    NotifyFilters.Size,
                IncludeSubdirectories = false,
                EnableRaisingEvents = true
            };

            _watcher.Created += OnFilesystemChanged;
            _watcher.Deleted += OnFilesystemChanged;
            _watcher.Renamed += OnFilesystemChanged;
            _watcher.Changed += OnFilesystemChanged;
        }
        catch
        {
            // Live refresh is optional; navigation must still work.
        }
    }

    private void OnFilesystemChanged(object sender, FileSystemEventArgs e)
    {
        Dispatcher.Invoke(() =>
        {
            _refreshDebounce.Stop();
            _refreshDebounce.Start();
        });
    }

    private void DisposeWatcher()
    {
        if (_watcher is null)
            return;

        _watcher.EnableRaisingEvents = false;
        _watcher.Dispose();
        _watcher = null;
    }

    private void Window_KeyDown(object sender, KeyEventArgs e)
    {
        switch (e.Key)
        {
            case Key.F2:
                RenameSelectedItem();
                e.Handled = true;
                break;

            case Key.Delete:
                DeleteSelectedItemToRecycleBin();
                e.Handled = true;
                break;

            case Key.F5:
                RefreshCurrentDirectory();
                e.Handled = true;
                break;

            case Key.F11:
                ToggleFullscreen();
                e.Handled = true;
                break;

            case Key.Enter:
                if (ItemsList.SelectedItem is FileSystemItem item)
                    OpenItem(item);
                break;

            case Key.Escape:
                ItemsList.SelectedItem = null;
                break;

            case Key.Back:
                BackButton_Click(sender, e);
                e.Handled = true;
                break;
        }
    }

    private void ToggleFullscreen()
    {
        if (!_isFullscreen)
        {
            _previousWindowStyle = WindowStyle;
            _previousWindowState = WindowState;
            _previousResizeMode = ResizeMode;

            TopBar.Visibility = Visibility.Collapsed;
            StatusBar.Visibility = Visibility.Collapsed;
            WindowStyle = WindowStyle.None;
            ResizeMode = ResizeMode.NoResize;
            WindowState = WindowState.Maximized;
            _isFullscreen = true;
        }
        else
        {
            WindowStyle = _previousWindowStyle;
            ResizeMode = _previousResizeMode;
            WindowState = _previousWindowState;
            TopBar.Visibility = Visibility.Visible;
            StatusBar.Visibility = Visibility.Visible;
            _isFullscreen = false;
        }
    }

    private bool IsInsideRoot(string path)
    {
        var normalizedPath = Normalize(path);

        if (string.Equals(normalizedPath, _root, StringComparison.OrdinalIgnoreCase))
            return true;

        var rootPrefix = _root.TrimEnd(Path.DirectorySeparatorChar)
                         + Path.DirectorySeparatorChar;

        return normalizedPath.StartsWith(
            rootPrefix,
            StringComparison.OrdinalIgnoreCase);
    }

    private static string Normalize(string path)
    {
        var full = Path.GetFullPath(path);

        if (Path.GetPathRoot(full) == full)
            return full;

        return full.TrimEnd(
            Path.DirectorySeparatorChar,
            Path.AltDirectorySeparatorChar);
    }

    private static void ShowError(string message, Exception ex)
    {
        MessageBox.Show(
            $"{message}\n\n{ex.Message}",
            "KARLOLEGEND",
            MessageBoxButton.OK,
            MessageBoxImage.Error);
    }
}
