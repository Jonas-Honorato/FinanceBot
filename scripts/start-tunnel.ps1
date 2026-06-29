$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$logPath = Join-Path $root "cloudflared-tunnel.log"
$errPath = Join-Path $root "cloudflared-tunnel.err.log"
$cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue

if (-not $cloudflared) {
  $cloudflared = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Recurse -Filter cloudflared.exe -ErrorAction SilentlyContinue |
    Select-Object -First 1
}

if (-not $cloudflared) {
  throw "cloudflared não foi encontrado. Instale com: winget install --id Cloudflare.cloudflared -e"
}

$cloudflaredPath = if ($cloudflared.Source) { $cloudflared.Source } else { $cloudflared.FullName }

if (Test-Path $logPath) {
  Remove-Item $logPath -Force
}

if (Test-Path $errPath) {
  Remove-Item $errPath -Force
}

Start-Process -FilePath $cloudflaredPath -ArgumentList @(
  "tunnel",
  "--url",
  "http://127.0.0.1:4000",
  "--no-autoupdate"
) -WorkingDirectory $root -RedirectStandardOutput $logPath -RedirectStandardError $errPath -WindowStyle Hidden

Start-Sleep -Seconds 8

$log = @()
$log += Get-Content $logPath -ErrorAction SilentlyContinue
$log += Get-Content $errPath -ErrorAction SilentlyContinue
$url = $log | Select-String -Pattern "https://[a-zA-Z0-9.-]+\.trycloudflare\.com" | Select-Object -First 1

if ($url) {
  $publicUrl = $url.Matches[0].Value
  Write-Host "Tunnel URL: $publicUrl"
  Write-Host "Webhook URL: $publicUrl/api/webhook/whatsapp"
} else {
  Write-Host "Túnel iniciado, mas a URL ainda não apareceu. Veja o log em: $logPath"
}
