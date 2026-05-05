[CmdletBinding()]
param(
  [switch]$Clean,
  [string]$Version
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$PackingRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $PackingRoot
$ArtifactsRoot = Join-Path $PackingRoot '.artifacts'
$WebDist = Join-Path $ArtifactsRoot 'web'
$CargoTarget = Join-Path $ArtifactsRoot 'cargo-target'
$ReleaseRoot = Join-Path $PackingRoot 'release'
$LogsRoot = Join-Path $PackingRoot 'logs'
$GeneratedIconsRoot = Join-Path $ArtifactsRoot 'generated-icons'
$DoctorScript = Join-Path $PackingRoot 'doctor.ps1'
$TauriOverrideConfig = Join-Path $PackingRoot 'tauri.override.json'
$ViteConfig = Join-Path $PackingRoot 'vite.pack.config.mjs'
$RootTauriConfig = Join-Path $ProjectRoot 'src-tauri\tauri.conf.json'
$PreferredIconCandidates = @(
  (Join-Path $PackingRoot 'icon.png'),
  (Join-Path $PackingRoot 'icon.jpg'),
  (Join-Path $PackingRoot 'icon.jpeg')
)
$GeneratedIconIco = Join-Path $GeneratedIconsRoot 'icon.ico'

function New-IconFromPng {
  param(
    [Parameter(Mandatory = $true)]
    [string]$SourcePngPath,

    [Parameter(Mandatory = $true)]
    [string]$DestinationIcoPath
  )

  Add-Type -AssemblyName System.Drawing

  $iconSizes = @(16, 32, 48, 64, 128, 256)
  $image = [System.Drawing.Image]::FromFile($SourcePngPath)

  try {
    $memoryStream = New-Object System.IO.MemoryStream
    $writer = New-Object System.IO.BinaryWriter($memoryStream)

    $writer.Write([UInt16]0)
    $writer.Write([UInt16]1)
    $writer.Write([UInt16]$iconSizes.Count)

    $imageDataList = New-Object System.Collections.Generic.List[byte[]]

    foreach ($size in $iconSizes) {
      $bitmap = New-Object System.Drawing.Bitmap($size, $size)
      try {
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        try {
          $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
          $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
          $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
          $graphics.Clear([System.Drawing.Color]::Transparent)

          # Preserve the source aspect ratio and center it on a square canvas,
          # otherwise non-square source art gets visibly squashed in Windows icons.
          $scale = [Math]::Min($size / $image.Width, $size / $image.Height)
          $drawWidth = [int][Math]::Round($image.Width * $scale)
          $drawHeight = [int][Math]::Round($image.Height * $scale)
          $offsetX = [int][Math]::Floor(($size - $drawWidth) / 2)
          $offsetY = [int][Math]::Floor(($size - $drawHeight) / 2)

          $destinationRect = New-Object System.Drawing.Rectangle($offsetX, $offsetY, $drawWidth, $drawHeight)
          $sourceRect = New-Object System.Drawing.Rectangle(0, 0, $image.Width, $image.Height)
          $graphics.DrawImage($image, $destinationRect, $sourceRect, [System.Drawing.GraphicsUnit]::Pixel)
        } finally {
          $graphics.Dispose()
        }

        $pngStream = New-Object System.IO.MemoryStream
        try {
          $bitmap.Save($pngStream, [System.Drawing.Imaging.ImageFormat]::Png)
          $imageDataList.Add($pngStream.ToArray())
        } finally {
          $pngStream.Dispose()
        }
      } finally {
        $bitmap.Dispose()
      }
    }

    $offset = 6 + (16 * $iconSizes.Count)
    for ($index = 0; $index -lt $iconSizes.Count; $index++) {
      $size = $iconSizes[$index]
      $imageBytes = $imageDataList[$index]
      $dimensionByte = if ($size -ge 256) { [byte]0 } else { [byte]$size }

      $writer.Write($dimensionByte)
      $writer.Write($dimensionByte)
      $writer.Write([byte]0)
      $writer.Write([byte]0)
      $writer.Write([UInt16]1)
      $writer.Write([UInt16]32)
      $writer.Write([UInt32]$imageBytes.Length)
      $writer.Write([UInt32]$offset)

      $offset += $imageBytes.Length
    }

    foreach ($imageBytes in $imageDataList) {
      $writer.Write($imageBytes)
    }

    [System.IO.File]::WriteAllBytes($DestinationIcoPath, $memoryStream.ToArray())
  } finally {
    $image.Dispose()
  }
}

function Resolve-PreferredIcon {
  param(
    [string[]]$Candidates
  )

  foreach ($candidate in $Candidates) {
    if (Test-Path -LiteralPath $candidate -PathType Leaf) {
      return $candidate
    }
  }

  return $null
}

function Ensure-Directory {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  if (-not (Test-Path -LiteralPath $Path -PathType Container)) {
    New-Item -ItemType Directory -Path $Path | Out-Null
  }
}

function Resolve-CommandOrFallback {
  param(
    [Parameter(Mandatory = $true)]
    [string]$CommandName,

    [string[]]$Fallbacks = @()
  )

  $command = Get-Command $CommandName -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  foreach ($candidate in $Fallbacks) {
    if (Test-Path -LiteralPath $candidate) {
      return (Resolve-Path -LiteralPath $candidate).Path
    }
  }

  return $null
}

function Import-EnvironmentFromBatch {
  param(
    [Parameter(Mandatory = $true)]
    [string]$BatchFile
  )

  $escapedBatchFile = $BatchFile.Replace('"', '""')
  $commandOutput = cmd.exe /c """$escapedBatchFile"" >nul 2>&1 && set"
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to import environment from batch file: $BatchFile"
  }

  foreach ($line in $commandOutput) {
    if ($line -match '^(.*?)=(.*)$') {
      $name = $matches[1]
      $value = $matches[2]
      Set-Item -Path "Env:$name" -Value $value
    }
  }
}

function Invoke-LoggedCommand {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath,

    [string[]]$ArgumentList = @(),

    [Parameter(Mandatory = $true)]
    [string]$LogFile
  )

  $quotedArgs = @($ArgumentList | ForEach-Object {
      $value = $_
      if ($null -eq $value) {
        '""'
      } else {
        $stringValue = [string]$value
        if ($stringValue -match '[\s"]') {
          '"{0}"' -f ($stringValue -replace '"', '\"')
        } else {
          $stringValue
        }
      }
    })

  $displayArgs = if ($quotedArgs.Count -gt 0) {
    $quotedArgs -join ' '
  } else {
    ''
  }

  ">>> $FilePath $displayArgs" | Tee-Object -FilePath $LogFile -Append

  $startInfo = New-Object System.Diagnostics.ProcessStartInfo
  $startInfo.FileName = $FilePath
  $startInfo.WorkingDirectory = $ProjectRoot
  $startInfo.UseShellExecute = $false
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError = $true
  $startInfo.CreateNoWindow = $true
  $startInfo.Arguments = $displayArgs

  foreach ($entry in Get-ChildItem Env:) {
    $startInfo.Environment[$entry.Name] = $entry.Value
  }

  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $startInfo
  [void]$process.Start()

  while (-not $process.StandardOutput.EndOfStream) {
    $line = $process.StandardOutput.ReadLine()
    $line | Tee-Object -FilePath $LogFile -Append
  }

  while (-not $process.StandardError.EndOfStream) {
    $line = $process.StandardError.ReadLine()
    $line | Tee-Object -FilePath $LogFile -Append
  }

  $process.WaitForExit()
  $exitCode = $process.ExitCode
  if ($exitCode -ne 0) {
    throw "Command failed with exit code ${exitCode}: $FilePath $displayArgs"
  }
}

function Write-Step {
  param([string]$Message)
  Write-Host ''
  Write-Host "==> $Message"
}

if ($Clean) {
  foreach ($path in @($ArtifactsRoot, $ReleaseRoot, $LogsRoot)) {
    if (Test-Path -LiteralPath $path) {
      Remove-Item -LiteralPath $path -Recurse -Force
    }
  }
}

Ensure-Directory -Path $ArtifactsRoot
Ensure-Directory -Path $ReleaseRoot
Ensure-Directory -Path $LogsRoot
Ensure-Directory -Path $GeneratedIconsRoot

$cargoBin = Join-Path $env:USERPROFILE '.cargo\bin'
$vsCmakeBin = 'C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin'
$vcVars64 = 'C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat'

if (Test-Path -LiteralPath $cargoBin -PathType Container) {
  $env:PATH = "$cargoBin;$env:PATH"
}

if (Test-Path -LiteralPath $vsCmakeBin -PathType Container) {
  $env:PATH = "$vsCmakeBin;$env:PATH"
}

if (Test-Path -LiteralPath $vcVars64 -PathType Leaf) {
  Import-EnvironmentFromBatch -BatchFile $vcVars64
  if (Test-Path -LiteralPath $cargoBin -PathType Container) {
    $env:PATH = "$cargoBin;$env:PATH"
  }
  if (Test-Path -LiteralPath $vsCmakeBin -PathType Container) {
    $env:PATH = "$vsCmakeBin;$env:PATH"
  }
}

$env:CARGO_TARGET_DIR = $CargoTarget

$npxPath = Resolve-CommandOrFallback -CommandName 'npx.cmd' -Fallbacks @(
  (Join-Path (Split-Path -Parent (Get-Command node -ErrorAction Stop).Source) 'npx.cmd')
)
if (-not $npxPath) {
  throw 'npx.cmd is not available in PATH.'
}

$doctorLog = Join-Path $LogsRoot 'doctor.log'
$typecheckLog = Join-Path $LogsRoot 'typecheck.log'
$viteLog = Join-Path $LogsRoot 'vite-build.log'
$tauriLog = Join-Path $LogsRoot 'tauri-build.log'
$versionOverridePath = Join-Path $ArtifactsRoot 'tauri.version.override.json'

Write-Step -Message 'Running environment check'
Invoke-LoggedCommand -FilePath 'powershell.exe' -ArgumentList @(
  '-NoProfile',
  '-ExecutionPolicy',
  'Bypass',
  '-File',
  $DoctorScript
) -LogFile $doctorLog

$tauriConfig = Get-Content -LiteralPath $RootTauriConfig -Raw | ConvertFrom-Json
$packageVersion = if ($Version) { $Version } else { $tauriConfig.version }

if (-not $packageVersion) {
  throw 'Unable to determine package version.'
}

if ($Version) {
  @{ version = $Version } | ConvertTo-Json | Set-Content -LiteralPath $versionOverridePath -Encoding UTF8
}

$sourceIcon = Resolve-PreferredIcon -Candidates $PreferredIconCandidates
if ($sourceIcon) {
  $iconLabel = Split-Path -Leaf $sourceIcon
  Write-Step -Message "Generating Windows icon from packing\\$iconLabel"
  New-IconFromPng -SourcePngPath $sourceIcon -DestinationIcoPath $GeneratedIconIco
}

Write-Step -Message 'Running frontend type check'
Invoke-LoggedCommand -FilePath $npxPath -ArgumentList @(
  'vue-tsc',
  '--noEmit',
  '-p',
  'tsconfig.app.json'
) -LogFile $typecheckLog

Write-Step -Message 'Building frontend assets'
Invoke-LoggedCommand -FilePath $npxPath -ArgumentList @(
  'vite',
  'build',
  '--config',
  $ViteConfig
) -LogFile $viteLog

$tauriArgs = @(
  'tauri',
  'build',
  '--config',
  $TauriOverrideConfig,
  '--bundles',
  'nsis'
)

if ($Version) {
  $tauriArgs += @('--config', $versionOverridePath)
}

Write-Step -Message 'Building Tauri NSIS installer'
Invoke-LoggedCommand -FilePath $npxPath -ArgumentList $tauriArgs -LogFile $tauriLog

$nsisOutputDir = Join-Path $CargoTarget 'release\bundle\nsis'
if (-not (Test-Path -LiteralPath $nsisOutputDir -PathType Container)) {
  throw "NSIS output directory not found: $nsisOutputDir"
}

$installer = Get-ChildItem -LiteralPath $nsisOutputDir -Filter '*.exe' -File |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

if (-not $installer) {
  throw "No NSIS installer executable found in $nsisOutputDir"
}

$sanitizedVersion = $packageVersion -replace '[^0-9A-Za-z\.\-_]', '-'
$finalInstallerName = "Helldiver-Practice-v$sanitizedVersion-windows-x64-nsis$($installer.Extension)"
$finalInstallerPath = Join-Path $ReleaseRoot $finalInstallerName

Copy-Item -LiteralPath $installer.FullName -Destination $finalInstallerPath -Force

Write-Host ''
Write-Host "Installer ready: $finalInstallerPath"
