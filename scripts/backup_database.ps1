[CmdletBinding()]
param(
    [string]$DbHost,
    [string]$DbUser,
    [ValidateRange(1, 65535)][int]$DbPort = 5432,
    [string]$OutputDirectory = (Join-Path ([Environment]::GetFolderPath('UserProfile')) 'PeakGuide-backups')
)

$ErrorActionPreference = 'Stop'
$dumpCommand = Get-Command pg_dump -ErrorAction Stop
$restoreCommand = Get-Command pg_restore -ErrorAction Stop
if ([string]::IsNullOrWhiteSpace($DbHost)) { $DbHost = Read-Host 'Host from Supabase Connect - Session pooler' }
if ([string]::IsNullOrWhiteSpace($DbUser)) { $DbUser = Read-Host 'User from Supabase Connect - Session pooler' }
$DbHost = $DbHost.Trim()
$DbUser = $DbUser.Trim()
if ($DbHost -notmatch '^[A-Za-z0-9.-]+$') { throw 'Enter only the database hostname, without a URL, port or password.' }
if ($DbUser -notmatch '^[A-Za-z0-9_.-]+$') { throw 'Enter only the database user from Supabase Connect.' }

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$unique = [Guid]::NewGuid().ToString('N').Substring(0, 8)
$archive = Join-Path $OutputDirectory "peakguide-$stamp-$unique.dump"
$partial = "$archive.partial"
$list = "$archive.list.txt"
$listPartial = "$list.partial"
$manifest = "$archive.backup-info.json"
$oldSslMode = [Environment]::GetEnvironmentVariable('PGSSLMODE', 'Process')
$oldTimeout = [Environment]::GetEnvironmentVariable('PGCONNECT_TIMEOUT', 'Process')

try {
    if ($oldSslMode -in @('verify-ca', 'verify-full')) { $env:PGSSLMODE = $oldSslMode }
    else { $env:PGSSLMODE = 'require' }
    $env:PGCONNECT_TIMEOUT = '20'
    Write-Host 'Enter the DATABASE password when pg_dump asks. Do not paste it into chat.'
    $dumpArgs = @('--host', $DbHost, '--port', "$DbPort", '--username', $DbUser,
        '--dbname', 'postgres', '--password', '--format=custom', '--verbose', '--file', $partial)
    & $dumpCommand @dumpArgs
    if ($LASTEXITCODE -ne 0) { throw 'pg_dump failed. No verified backup was created.' }
    if (-not (Test-Path -LiteralPath $partial) -or (Get-Item -LiteralPath $partial).Length -eq 0) {
        throw 'pg_dump did not create a non-empty archive.'
    }
    & $restoreCommand --list --file $listPartial $partial
    if ($LASTEXITCODE -ne 0) { throw 'pg_restore could not read the archive list.' }
    if (-not (Test-Path -LiteralPath $listPartial) -or [string]::IsNullOrWhiteSpace((Get-Content -LiteralPath $listPartial -Raw))) {
        throw 'The archive list is empty. Review the export before using it.'
    }
    $length = (Get-Item -LiteralPath $partial).Length
    $hash = (Get-FileHash -LiteralPath $partial -Algorithm SHA256).Hash
    Move-Item -LiteralPath $partial -Destination $archive
    Move-Item -LiteralPath $listPartial -Destination $list
    [ordered]@{
        created_utc = [DateTime]::UtcNow.ToString('o')
        archive_name = [IO.Path]::GetFileName($archive)
        size_bytes = $length
        sha256 = $hash
        archive_list_readable = $true
        restore_tested = $false
    } | ConvertTo-Json | Set-Content -LiteralPath $manifest -Encoding UTF8
    Write-Host 'Export complete; archive list readable. A full restore has NOT been tested.'
    [pscustomobject]@{ FullName = $archive; Length = $length; SHA256 = $hash; RestoreTested = $false }
}
finally {
    # Delete only temporary files from this invocation, never previous backups.
    Remove-Item -LiteralPath $partial, $listPartial -Force -ErrorAction SilentlyContinue
    if ($null -eq $oldSslMode) { Remove-Item Env:PGSSLMODE -ErrorAction SilentlyContinue }
    else { $env:PGSSLMODE = $oldSslMode }
    if ($null -eq $oldTimeout) { Remove-Item Env:PGCONNECT_TIMEOUT -ErrorAction SilentlyContinue }
    else { $env:PGCONNECT_TIMEOUT = $oldTimeout }
}
