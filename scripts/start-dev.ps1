$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"

Write-Host "Starting FinanceBot API on http://localhost:4000"
Start-Process -FilePath "powershell" -ArgumentList @(
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-Command",
  "npm start *> backend-dev.log"
) -WorkingDirectory $backend -WindowStyle Hidden

Write-Host "Starting FinanceBot dashboard on http://localhost:5173"
Start-Process -FilePath "powershell" -ArgumentList @(
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-Command",
  "npm run dev *> frontend-dev.log"
) -WorkingDirectory $frontend -WindowStyle Hidden

Start-Sleep -Seconds 8
Write-Host "Backend log:"
Get-Content (Join-Path $backend "backend-dev.log") -ErrorAction SilentlyContinue | Select-Object -Last 20
Write-Host ""
Write-Host "Frontend log:"
Get-Content (Join-Path $frontend "frontend-dev.log") -ErrorAction SilentlyContinue | Select-Object -Last 20
Write-Host ""
Write-Host "Ready:"
Write-Host "- API: http://localhost:4000"
Write-Host "- Swagger: http://localhost:4000/docs"
Write-Host "- Dashboard: http://localhost:5173"
