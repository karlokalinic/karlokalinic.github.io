[CmdletBinding()]
param(
    [string]$Destination = (Get-Location).Path,
    [switch]$Launch
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$repository = 'karlokalinic/karlokalinic.github.io'
$releaseApi = "https://api.github.com/repos/$repository/releases/latest"
$assetName = 'KARLOLEGEND.exe'

function Fail([string]$Message) {
    throw "KARLOLEGEND bootstrap: $Message"
}

try {
    if ($env:OS -ne 'Windows_NT') {
        Fail 'Windows is required.'
    }

    if ([Environment]::Is64BitOperatingSystem -ne $true) {
        Fail 'A 64-bit Windows installation is required.'
    }

    if (-not (Test-Path -LiteralPath $Destination -PathType Container)) {
        New-Item -ItemType Directory -Path $Destination -Force | Out-Null
    }

    $Destination = (Resolve-Path -LiteralPath $Destination).Path
    $target = Join-Path $Destination $assetName
    $temporary = Join-Path $Destination '.KARLOLEGEND.exe.download'

    # Windows PowerShell 5.1 on older installations may otherwise negotiate an
    # obsolete TLS version when talking to GitHub.
    try {
        [Net.ServicePointManager]::SecurityProtocol =
            [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    }
    catch {
        # PowerShell 7+ / modern .NET handles TLS itself.
    }

    $headers = @{
        'User-Agent' = 'KARLOLEGEND-Bootstrap'
        'Accept' = 'application/vnd.github+json'
        'X-GitHub-Api-Version' = '2022-11-28'
    }

    Write-Host 'Resolving latest stable KARLOLEGEND release from GitHub...'
    $release = Invoke-RestMethod -Uri $releaseApi -Headers $headers -Method Get

    if ($release.draft -or $release.prerelease) {
        Fail 'GitHub latest release is not a stable release.'
    }

    $asset = @($release.assets) | Where-Object { $_.name -eq $assetName } | Select-Object -First 1
    if ($null -eq $asset) {
        Fail "Latest release '$($release.tag_name)' does not contain $assetName."
    }

    if ([string]::IsNullOrWhiteSpace([string]$asset.browser_download_url)) {
        Fail 'Release asset download URL is missing.'
    }

    if (Test-Path -LiteralPath $temporary) {
        Remove-Item -LiteralPath $temporary -Force
    }

    Write-Host "Downloading $($release.tag_name) -> $target"
    Invoke-WebRequest -Uri $asset.browser_download_url -Headers @{ 'User-Agent' = 'KARLOLEGEND-Bootstrap' } -OutFile $temporary

    $download = Get-Item -LiteralPath $temporary
    if ($asset.size -and $download.Length -ne [int64]$asset.size) {
        Fail "Downloaded size mismatch. Expected $($asset.size) bytes, received $($download.Length)."
    }

    $actualHash = (Get-FileHash -LiteralPath $temporary -Algorithm SHA256).Hash.ToLowerInvariant()
    $digest = [string]$asset.digest

    if (-not [string]::IsNullOrWhiteSpace($digest)) {
        if (-not $digest.StartsWith('sha256:', [StringComparison]::OrdinalIgnoreCase)) {
            Fail "Unsupported GitHub asset digest '$digest'."
        }

        $expectedHash = $digest.Substring(7).Trim().ToLowerInvariant()
        if ($actualHash -ne $expectedHash) {
            Fail "SHA-256 mismatch. Expected $expectedHash, received $actualHash."
        }
    }
    else {
        Write-Warning 'GitHub did not expose an asset digest; HTTPS transport succeeded but no release digest was available to compare.'
    }

    # Do not silently terminate a running app. A locked target produces a clear
    # failure instead of leaving a half-installed executable.
    if (Test-Path -LiteralPath $target) {
        try {
            Remove-Item -LiteralPath $target -Force
        }
        catch {
            Fail "$assetName is in use. Close KARLOLEGEND and run the bootstrap command again."
        }
    }

    Move-Item -LiteralPath $temporary -Destination $target -Force

    $finalFiles = @(Get-ChildItem -LiteralPath $Destination -File -Force | Where-Object {
        $_.Name -like '.KARLOLEGEND.exe.download'
    })
    foreach ($file in $finalFiles) {
        Remove-Item -LiteralPath $file.FullName -Force -ErrorAction SilentlyContinue
    }

    Write-Host ''
    Write-Host "Installed: $target"
    Write-Host "Release:   $($release.tag_name)"
    Write-Host "SHA-256:   $actualHash"

    if ($Launch) {
        Start-Process -FilePath $target -WorkingDirectory $Destination
    }
}
catch {
    if (Test-Path -LiteralPath (Join-Path $Destination '.KARLOLEGEND.exe.download')) {
        Remove-Item -LiteralPath (Join-Path $Destination '.KARLOLEGEND.exe.download') -Force -ErrorAction SilentlyContinue
    }

    Write-Error $_
    exit 1
}
