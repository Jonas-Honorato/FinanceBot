param(
  [Parameter(Mandatory = $true)]
  [string] $MetaWhatsappToken,

  [Parameter(Mandatory = $true)]
  [string] $MetaPhoneNumberId,

  [Parameter(Mandatory = $true)]
  [string] $MetaVerifyToken,

  [string] $MetaGraphApiVersion = "v20.0",

  [string] $PublicDashboardUrl = "http://localhost:5173"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $root ".env"

if (-not (Test-Path $envPath)) {
  Copy-Item (Join-Path $root ".env.example") $envPath
}

$values = @{
  "WHATSAPP_PROVIDER" = "meta"
  "META_WHATSAPP_TOKEN" = $MetaWhatsappToken
  "META_PHONE_NUMBER_ID" = $MetaPhoneNumberId
  "META_VERIFY_TOKEN" = $MetaVerifyToken
  "META_GRAPH_API_VERSION" = $MetaGraphApiVersion
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
Write-Host "Credenciais da Meta WhatsApp Cloud API configuradas em .env"
Write-Host "Webhook de verificacao: GET/POST /api/webhook/whatsapp"
Write-Host "Reinicie a API com: .\scripts\stop-dev.ps1; .\scripts\start-dev.ps1"
