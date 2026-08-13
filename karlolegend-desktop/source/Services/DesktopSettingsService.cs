using KarloDiskShell.Models;
using System.IO;
using System.Text.Json;

namespace KarloDiskShell.Services;

public sealed class DesktopSettingsService
{
    private readonly string _settingsPath;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNameCaseInsensitive = true
    };

    public DesktopSettingsService(KarloEnvironmentService environment)
    {
        _settingsPath = Path.Combine(environment.StateDirectory, "desktop.json");
    }

    public DesktopSettings Load()
    {
        try
        {
            if (!File.Exists(_settingsPath))
                return new DesktopSettings();

            return JsonSerializer.Deserialize<DesktopSettings>(
                       File.ReadAllText(_settingsPath),
                       JsonOptions)
                   ?? new DesktopSettings();
        }
        catch
        {
            return new DesktopSettings();
        }
    }

    public void Save(DesktopSettings settings)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(_settingsPath)!);

        var temp = _settingsPath + ".tmp";
        File.WriteAllText(temp, JsonSerializer.Serialize(settings, JsonOptions));
        File.Move(temp, _settingsPath, overwrite: true);
    }
}
