$ErrorActionPreference = 'Continue'

$appRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

function Test-NodeExe([string]$exe) {
    if (-not $exe -or -not (Test-Path $exe)) { return $false }
    $output = & $exe --version 2>&1 | Out-String
    return ($LASTEXITCODE -eq 0 -and $output.Trim() -match '^v\d+\.')
}

function Find-InstalledNode {
    $roots = @(
        (Join-Path $env:LOCALAPPDATA 'Author Software\nvm\installs'),
        (Join-Path $env:LOCALAPPDATA 'nvm'),
        (Join-Path $env:APPDATA 'nvm'),
        'C:\Program Files\nodejs'
    )
    $candidates = New-Object System.Collections.ArrayList
    foreach ($root in $roots) {
        if (-not (Test-Path $root)) { continue }
        $direct = Join-Path $root 'node.exe'
        if (Test-Path $direct) { [void]$candidates.Add($direct) }
        Get-ChildItem $root -Filter node.exe -Recurse -Depth 2 -File -ErrorAction SilentlyContinue |
            ForEach-Object { [void]$candidates.Add($_.FullName) }
    }
    foreach ($candidate in $candidates) {
        if (Test-NodeExe $candidate) { return $candidate }
    }
    return $null
}

$nodeExecutable = $null

# 1) nvm shim with the pinned version, if that version is actually installed
$nvmCommand = Get-Command nvm.exe -ErrorAction SilentlyContinue
if (-not $nvmCommand) { $nvmCommand = Get-Command nvm -ErrorAction SilentlyContinue }
if ($nvmCommand) {
    $versionFile = Join-Path $appRoot '.nvmrc'
    if (Test-Path $versionFile) {
        $nodeVersion = (Get-Content $versionFile -Raw).Trim()
        if ($nodeVersion) {
            & $nvmCommand.Source use $nodeVersion 2>&1 | Out-Null
        }
    }
}

# 2) node on PATH (only when the shim resolves to an installed version)
$onPath = Get-Command node -ErrorAction SilentlyContinue
if ($onPath -and (Test-NodeExe $onPath.Source)) { $nodeExecutable = $onPath.Source }

# 3) any installed Node in the usual locations
if (-not $nodeExecutable) { $nodeExecutable = Find-InstalledNode }

# 4) bundled Codex runtime
if (-not $nodeExecutable) {
    $fallback = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
    if (Test-NodeExe $fallback) { $nodeExecutable = $fallback }
}

if (-not $nodeExecutable) {
    throw 'Node.js 18+ was not found. Install Node.js, or point .nvmrc at an installed version.'
}

$viteEntry = Join-Path $appRoot 'node_modules\vite\bin\vite.js'
$expressEntry = Join-Path $appRoot 'server\node_modules\express'
if (-not (Test-Path $viteEntry) -or -not (Test-Path $expressEntry)) {
    Write-Host 'Dependencies missing. Run: npm install (in subweb) and npm install (in subweb/server).' -ForegroundColor Yellow
    exit 1
}

$serverPath = Join-Path $appRoot 'scripts\start-local.mjs'

$env:STATIC_DIR = Join-Path $appRoot 'dist'
$env:CONFIG_FILE = Join-Path $appRoot 'data\config\config.json'

New-Item -ItemType Directory -Force (Join-Path $appRoot 'data\config') | Out-Null

Write-Host "Using Node: $nodeExecutable ($(& $nodeExecutable --version))" -ForegroundColor DarkGray
Write-Host "Starting Nexus local service on http://127.0.0.1:25503"
Write-Host "Press Ctrl+C to stop."

& $nodeExecutable $serverPath
if ($LASTEXITCODE -ne 0) { throw 'Nexus local service failed to start.' }
