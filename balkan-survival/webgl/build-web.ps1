param(
  [string]$UnityExe = "",
  [string]$OutputPath = ""
)

$ErrorActionPreference = "Stop"
$ProjectPath = $PSScriptRoot
$PreferredVersion = "6000.3.16f1"
$HubRoot = Join-Path $env:ProgramFiles "Unity\Hub\Editor"

if ([string]::IsNullOrWhiteSpace($UnityExe)) {
  $PreferredExe = Join-Path $HubRoot "$PreferredVersion\Editor\Unity.exe"
  if (Test-Path $PreferredExe) {
    $UnityExe = $PreferredExe
  } elseif (Test-Path $HubRoot) {
    $Candidates = Get-ChildItem $HubRoot -Directory | Where-Object { $_.Name -match '^6000\.3\.(\d+)f\d+$' } | Sort-Object { [int]([regex]::Match($_.Name, '^6000\.3\.(\d+)f\d+$').Groups[1].Value) } -Descending
    if ($Candidates.Count -gt 0) {
      $UnityExe = Join-Path $Candidates[0].FullName "Editor\Unity.exe"
      Write-Warning "Pinned editor $PreferredVersion was not found. Using $($Candidates[0].Name). Commit ProjectVersion.txt only after intentionally accepting an editor upgrade."
    }
  }
}

if ([string]::IsNullOrWhiteSpace($UnityExe) -or -not (Test-Path $UnityExe)) {
  throw "Unity 6.3 editor not found. Install $PreferredVersion in Unity Hub or pass -UnityExe explicitly."
}

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  $OutputPath = Join-Path $ProjectPath "Builds\WebGL-Development"
}

$env:SLEGNUCE_WEBGL_OUTPUT = [System.IO.Path]::GetFullPath($OutputPath)
Write-Host "UNITY: $UnityExe"
Write-Host "PROJECT: $ProjectPath"
Write-Host "OUTPUT: $env:SLEGNUCE_WEBGL_OUTPUT"

& $UnityExe `
  -batchmode `
  -quit `
  -accept-apiupdate `
  -projectPath $ProjectPath `
  -buildTarget WebGL `
  -executeMethod Slegnuce.Editor.SlegnuceBuild.BuildDevelopmentWeb `
  -logFile -

if ($LASTEXITCODE -ne 0) {
  throw "Unity Web build failed with exit code $LASTEXITCODE. Read the Unity log above; missing Web Build Support or licensing will fail here rather than being hidden by CI."
}

Write-Host "SLEGNUCE WEBGL DEVELOPMENT BUILD COMPLETE"
