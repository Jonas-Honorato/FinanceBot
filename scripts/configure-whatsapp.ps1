param(
  [Parameter(Mandatory = $true)]
  [string] $TwilioAccountSid,

  [Parameter(Mandatory = $true)]
  [string] $TwilioAuthToken,

  [Parameter(Mandatory = $true)]
  [string] $TwilioWhatsappFrom,

  [string] $PublicDashboardUrl = "http://localhost:5173"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $root ".env"

if (-not (Test-Path $envPath)) {
  Copy-Item (Join-Path $root ".env.example") $envPath
}

$values = @{
  "WHATSAPP_PROVIDER" = "twilio"
  "TWILIO_ACCOUNT_SID" = $TwilioAccountSid
  "TWILIO_AUTH_TOKEN" = $TwilioAuthToken
  "TWILIO_WHATSAPP_FROM" = $TwilioWhatsappFrom
  "PUBLIC_DASHBOARD_URL" = $PublicDashboardUrl
}

$content = Get-Content $envPath

foreach ($key in $values.Keys) {
  $value = $values[$key]
  if ($content -match "^$key=") {
    $content = $content -replace "^$key=.*", "$key=$value"
  } else {
    $content += "$key=$value"
  }
}

Set-Content -Path $envPath -Value $content
Write-Host "Credenciais do WhatsApp configuradas em .env"
Write-Host "Reinicie a API com: .\scripts\stop-dev.ps1; .\scripts\start-dev.ps1"
