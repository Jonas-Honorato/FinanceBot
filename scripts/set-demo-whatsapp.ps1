throw "Use .\scripts\register-whatsapp-user.ps1 para cadastrar um usuário com WhatsApp pela API em execução."

param(
  [Parameter(Mandatory = $true)]
  [string] $WhatsappNumber
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "backend"

Push-Location $backend
try {
  $escapedNumber = $WhatsappNumber.Replace("'", "''")
  $script = @"
import { query } from './src/db/pool.js';

await query(
  "UPDATE users SET whatsapp_number = `$1 WHERE email = 'demo@financebot.dev'",
  ['$escapedNumber'],
);

console.log('Número do usuário demo atualizado para: $escapedNumber');
"@

  $scriptPath = Join-Path $backend ".set-demo-whatsapp.tmp.mjs"
  Set-Content -Path $scriptPath -Value $script
  node $scriptPath
  Remove-Item $scriptPath -Force
} finally {
  Pop-Location
}
