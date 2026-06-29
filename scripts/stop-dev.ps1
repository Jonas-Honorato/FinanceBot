$ErrorActionPreference = "SilentlyContinue"

$ports = @(4000, 5173)

foreach ($port in $ports) {
  Get-NetTCPConnection -LocalPort $port |
    Select-Object -ExpandProperty OwningProcess -Unique |
    ForEach-Object {
      Stop-Process -Id $_ -Force
      Write-Host "Stopped process $_ on port $port"
    }
}
