namespace KarloDiskShell.Models;

public sealed class FeatureDefinition
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required string Description { get; init; }
    public required string BuiltInVersion { get; init; }
    public required bool IsBuiltIn { get; init; }
}
