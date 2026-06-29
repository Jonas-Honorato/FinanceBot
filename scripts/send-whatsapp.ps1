param(
  [Parameter(Mandatory = $true)]
  [string] $Message,

  [string] $From = "whatsapp:+5561998392309",
  [string] $ApiUrl = "http://localhost:4000"
)

$ErrorActionPreference = "Stop"

$body = @{
  From = $From
  Body = $Message
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "$ApiUrl/api/webhook/whatsapp" `
  -ContentType "application/json" `
  -Body $body
