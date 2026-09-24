Add-Type -AssemblyName System.Speech
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root "public\audio\lines"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$lines = Get-Content (Join-Path $root "scripts\northwind-lines.json") -Raw | ConvertFrom-Json
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 0
foreach ($line in $lines) {
  $voice = if ($line.speakerId -eq "jonah") { "Microsoft David Desktop" } else { "Microsoft Zira Desktop" }
  $synth.SelectVoice($voice)
  $path = Join-Path $outDir ("{0:d2}.wav" -f [int]$line.index)
  if (Test-Path $path) { Remove-Item $path }
  $synth.SetOutputToWaveFile($path)
  $synth.Speak($line.text)
  $synth.SetOutputToNull()
}
$synth.Dispose()
Write-Output "OUT $outDir"
Write-Output (Get-ChildItem $outDir | Measure-Object).Count
