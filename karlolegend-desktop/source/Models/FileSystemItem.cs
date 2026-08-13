using System.ComponentModel;
using System.IO;
using System.Runtime.CompilerServices;
using System.Windows.Media;

namespace KarloDiskShell.Models;

public sealed class FileSystemItem : INotifyPropertyChanged
{
    private double _x;
    private double _y;

    public required string Name { get; init; }
    public required string FullPath { get; init; }
    public required bool IsDirectory { get; init; }
    public required ImageSource Icon { get; init; }

    public double X
    {
        get => _x;
        set
        {
            if (Math.Abs(_x - value) < 0.1)
                return;

            _x = value;
            OnPropertyChanged();
        }
    }

    public double Y
    {
        get => _y;
        set
        {
            if (Math.Abs(_y - value) < 0.1)
                return;

            _y = value;
            OnPropertyChanged();
        }
    }

    public string Kind => IsDirectory
        ? "Folder"
        : Path.GetExtension(FullPath).TrimStart('.').ToUpperInvariant();

    public event PropertyChangedEventHandler? PropertyChanged;

    private void OnPropertyChanged([CallerMemberName] string? propertyName = null) =>
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
}
