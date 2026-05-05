[CmdletBinding()]
param(
  [switch]$Json
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$PackingRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $PackingRoot

function New-Result {
  param(
    [string]$Name,
    [bool]$Ok,
    [string]$Details,
    [string]$Severity = 'Info'
  )

  [PSCustomObject]@{
    Name = $Name
    Ok = $Ok
    Severity = $Severity
    Details = $Details
  }
}

function Resolve-CommandPath {
  param(
    [Parameter(Mandatory = $true)]
    [string]$CommandName,

    [string[]]$Fallbacks = @()
  )

  $resolved = $null

  try {
    $command = Get-Command $CommandName -ErrorAction Stop
    if ($command -and $command.Source) {
      $resolved = $command.Source
    } elseif ($command -and $command.Path) {
      $resolved = $command.Path
    }
  } catch {
    $resolved = $null
  }

  if (-not $resolved) {
    foreach ($candidate in $Fallbacks) {
      if (Test-Path -LiteralPath $candidate) {
        $resolved = (Resolve-Path -LiteralPath $candidate).Path
        break
      }
    }
  }

  return $resolved
}

function Get-VersionText {
  param(
    [Parameter(Mandatory = $true)]
    [string]$ExecutablePath,

    [string[]]$Arguments = @('--version')
  )

  try {
    $output = & $ExecutablePath @Arguments 2>&1
    if ($LASTEXITCODE -eq 0 -and $output) {
      return ($output | Select-Object -First 1).ToString().Trim()
    }
  } catch {
  }

  return 'version unavailable'
}

$cargoBin = Join-Path $env:USERPROFILE '.cargo\bin'
$vsRoot = 'C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools'
$msbuildFallback = Join-Path $vsRoot 'MSBuild\Current\Bin\MSBuild.exe'
$cmakeFallback = Join-Path $vsRoot 'Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe'

$results = New-Object System.Collections.Generic.List[object]

$nodePath = Resolve-CommandPath -CommandName 'node'
if ($nodePath) {
  $results.Add((New-Result -Name 'node' -Ok $true -Details "$(Get-VersionText -ExecutablePath $nodePath) [$nodePath]"))
} else {
  $results.Add((New-Result -Name 'node' -Ok $false -Severity 'Error' -Details 'Node.js not found in PATH.'))
}

$npmPath = Resolve-CommandPath -CommandName 'npm'
if ($npmPath) {
  $results.Add((New-Result -Name 'npm' -Ok $true -Details "$(Get-VersionText -ExecutablePath $npmPath -Arguments @('-v')) [$npmPath]"))
} else {
  $results.Add((New-Result -Name 'npm' -Ok $false -Severity 'Error' -Details 'npm not found in PATH.'))
}

$npxPath = Resolve-CommandPath -CommandName 'npx'
if ($npxPath) {
  try {
    $tauriVersion = & $npxPath 'tauri' '--version' 2>&1
    if ($LASTEXITCODE -eq 0) {
      $results.Add((New-Result -Name 'tauri-cli' -Ok $true -Details "$( ($tauriVersion | Select-Object -First 1).ToString().Trim()) [$npxPath tauri]"))
    } else {
      $results.Add((New-Result -Name 'tauri-cli' -Ok $false -Severity 'Error' -Details "npx found at [$npxPath], but 'npx tauri --version' failed."))
    }
  } catch {
    $results.Add((New-Result -Name 'tauri-cli' -Ok $false -Severity 'Error' -Details "npx found at [$npxPath], but 'npx tauri --version' threw an error."))
  }
} else {
  $results.Add((New-Result -Name 'tauri-cli' -Ok $false -Severity 'Error' -Details 'npx not found in PATH.'))
}

$rustcFallback = Join-Path $cargoBin 'rustc.exe'
$rustcPath = Resolve-CommandPath -CommandName 'rustc' -Fallbacks @($rustcFallback)
if ($rustcPath) {
  $severity = 'Info'
  $details = "$(Get-VersionText -ExecutablePath $rustcPath) [$rustcPath]"
  if ($rustcPath -eq $rustcFallback -and -not (Get-Command 'rustc' -ErrorAction SilentlyContinue)) {
    $severity = 'Warning'
    $details = "$details (not currently visible in PATH; reopen the terminal if direct 'rustc' calls fail)"
  }
  $results.Add((New-Result -Name 'rustc' -Ok $true -Severity $severity -Details $details))
} else {
  $results.Add((New-Result -Name 'rustc' -Ok $false -Severity 'Error' -Details 'Rust compiler not found. Install rustup and the stable MSVC toolchain.'))
}

$cargoFallback = Join-Path $cargoBin 'cargo.exe'
$cargoPath = Resolve-CommandPath -CommandName 'cargo' -Fallbacks @($cargoFallback)
if ($cargoPath) {
  $severity = 'Info'
  $details = "$(Get-VersionText -ExecutablePath $cargoPath) [$cargoPath]"
  if ($cargoPath -eq $cargoFallback -and -not (Get-Command 'cargo' -ErrorAction SilentlyContinue)) {
    $severity = 'Warning'
    $details = "$details (not currently visible in PATH; reopen the terminal if direct 'cargo' calls fail)"
  }
  $results.Add((New-Result -Name 'cargo' -Ok $true -Severity $severity -Details $details))
} else {
  $results.Add((New-Result -Name 'cargo' -Ok $false -Severity 'Error' -Details 'Cargo not found. Install rustup and the stable MSVC toolchain.'))
}

$msbuildPath = Resolve-CommandPath -CommandName 'msbuild' -Fallbacks @($msbuildFallback)
if ($msbuildPath) {
  $results.Add((New-Result -Name 'MSBuild' -Ok $true -Details "$(Get-VersionText -ExecutablePath $msbuildPath -Arguments @('-version')) [$msbuildPath]"))
} else {
  $results.Add((New-Result -Name 'MSBuild' -Ok $false -Severity 'Error' -Details 'MSBuild.exe not found. Install Visual Studio Build Tools with Desktop development with C++.'))
}

$msvcDir = Join-Path $vsRoot 'VC\Tools\MSVC'
$msvcToolsets = @()
if (Test-Path -LiteralPath $msvcDir) {
  $msvcToolsets = @(Get-ChildItem -LiteralPath $msvcDir -Directory | Sort-Object Name -Descending)
}

if ($msvcToolsets.Count -gt 0) {
  $results.Add((New-Result -Name 'MSVC toolset' -Ok $true -Details "$($msvcToolsets[0].Name) [$($msvcToolsets[0].FullName)]"))
} else {
  $results.Add((New-Result -Name 'MSVC toolset' -Ok $false -Severity 'Error' -Details 'No MSVC toolset found under Visual Studio Build Tools.'))
}

$cmakePath = Resolve-CommandPath -CommandName 'cmake' -Fallbacks @($cmakeFallback)
if ($cmakePath) {
  $results.Add((New-Result -Name 'CMake' -Ok $true -Details "$(Get-VersionText -ExecutablePath $cmakePath) [$cmakePath]"))
} else {
  $results.Add((New-Result -Name 'CMake' -Ok $false -Severity 'Error' -Details 'CMake not found. Install the C++ CMake tools for Windows component.'))
}

$webViewRegistryPaths = @(
  'HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}',
  'HKLM:\SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}'
)

$webViewVersion = $null
foreach ($registryPath in $webViewRegistryPaths) {
  try {
    $property = Get-ItemProperty -LiteralPath $registryPath -Name 'pv' -ErrorAction Stop
    if ($property.pv) {
      $webViewVersion = $property.pv
      break
    }
  } catch {
  }
}

if ($webViewVersion) {
  $results.Add((New-Result -Name 'WebView2 Runtime' -Ok $true -Details $webViewVersion))
} else {
  $results.Add((New-Result -Name 'WebView2 Runtime' -Ok $false -Severity 'Error' -Details 'WebView2 Runtime registry entry not found.'))
}

$requiredPaths = @(
  @{ Name = 'package.json'; Path = (Join-Path $ProjectRoot 'package.json'); Kind = 'Leaf' },
  @{ Name = 'src-tauri\tauri.conf.json'; Path = (Join-Path $ProjectRoot 'src-tauri\tauri.conf.json'); Kind = 'Leaf' },
  @{ Name = 'src-tauri\icons'; Path = (Join-Path $ProjectRoot 'src-tauri\icons'); Kind = 'Container' },
  @{ Name = 'node_modules'; Path = (Join-Path $ProjectRoot 'node_modules'); Kind = 'Container' }
)

foreach ($requiredPath in $requiredPaths) {
  $exists = Test-Path -LiteralPath $requiredPath.Path -PathType $requiredPath.Kind
  if ($exists) {
    $results.Add((New-Result -Name $requiredPath.Name -Ok $true -Details $requiredPath.Path))
  } else {
    $results.Add((New-Result -Name $requiredPath.Name -Ok $false -Severity 'Error' -Details "Missing required path: $($requiredPath.Path)"))
  }
}

$errorResults = @($results.Where({ -not $_.Ok }))
$warningResults = @($results.Where({ $_.Severity -eq 'Warning' }))
$hasErrors = $errorResults.Count -gt 0
$status = if ($hasErrors) { 'FAIL' } else { 'PASS' }

if ($Json) {
  [PSCustomObject]@{
    Status = $status
    Results = $results
  } | ConvertTo-Json -Depth 4
} else {
  Write-Host "Packing environment check for $ProjectRoot"
  Write-Host ''

  foreach ($result in $results) {
    $icon = if ($result.Ok) { '[OK]' } else { '[FAIL]' }
    if ($result.Severity -eq 'Warning') {
      $icon = '[WARN]'
    }
    Write-Host "$icon $($result.Name): $($result.Details)"
  }

  Write-Host ''
  if ($warningResults.Count -gt 0) {
    Write-Host 'Warnings:'
    foreach ($warning in $warningResults) {
      Write-Host "- $($warning.Name): $($warning.Details)"
    }
    Write-Host ''
  }

  Write-Host "Overall result: $status"
}

if ($hasErrors) {
  exit 1
}

exit 0
