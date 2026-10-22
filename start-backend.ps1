param([ValidateRange(1024,65535)][int]$Port = 8080)
$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$jar = Join-Path $projectRoot 'target\localtix-persistent.jar'
if (!(Test-Path -LiteralPath $jar)) {
    throw 'Build first: mvn "-Dlocaltix.jar.name=localtix-persistent" package'
}
if (!(Get-Command java -ErrorAction SilentlyContinue)) {
    throw 'Java 17 or newer is required. Install Java and reopen PowerShell.'
}
$client = New-Object System.Net.Sockets.TcpClient
$occupied = $false
try {
    $connection = $client.ConnectAsync('localhost', $Port)
    $occupied = $connection.Wait(1000) -and $client.Connected
} catch { $occupied = $false } finally { $client.Dispose() }
if ($occupied) {
    throw "Port $Port is already occupied. Use the running backend or stop it before starting another."
}
Push-Location -LiteralPath $projectRoot
try {
    Write-Host "Starting LocalTix on port $Port. Persistent database: $projectRoot\data\localtix.mv.db"
    & java -jar $jar '--spring.profiles.active=h2' "--server.port=$Port"
    if ($LASTEXITCODE -ne 0) { throw "Backend exited with code $LASTEXITCODE" }
} finally { Pop-Location }
