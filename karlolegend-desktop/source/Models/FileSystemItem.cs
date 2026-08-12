using System.IO;
using System.Windows.Media;

namespace KarloDiskShell.Models;

public sealed class FileSystemItem
{
    public required string Name { get; init; }
    public required string FullPath { get; init; }
    public required bool IsDirectory { get; init; }
    public required ImageSource Icon { get; init; }

    public string Kind => IsDirectory
        ? "Folder"
        : Path.GetExtension(FullPath).TrimStart('.').ToUpperInvariant();
}
