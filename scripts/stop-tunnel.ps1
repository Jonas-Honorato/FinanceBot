$ErrorActionPreference = "SilentlyContinue"

Get-Process cloudflared | Stop-Process -Force
Write-Host "Túnel cloudflared parado."
