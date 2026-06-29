param(
  [Parameter(Mandatory = $true)]
  [string] $Name,

  [Parameter(Mandatory = $true)]
  [string] $Email,

  [Parameter(Mandatory = $true)]
  [string] $Password,

  [Parameter(Mandatory = $true)]
  [string] $WhatsappNumber,

  [string] $ApiUrl = "http://localhost:4000"
)

$ErrorActionPreference = "Stop"

$body = @{
  name = $Name
  email = $Email
  password = $Password
  whatsappNumber = $WhatsappNumber
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "$ApiUrl/api/auth/register" `
  -ContentType "application/json" `
  -Body $body
