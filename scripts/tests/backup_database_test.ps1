$ErrorActionPreference = 'Stop'
$scriptFile = Join-Path $PSScriptRoot '../backup_database.ps1'
$testRoot = Join-Path ([IO.Path]::GetTempPath()) ('peakguide-backup-test-' + [Guid]::NewGuid().ToString('N'))
$global:testMode = 'success'
$global:dumpArguments = $null
$global:dumpCalls = 0
$global:restoreCalls = 0
function global:pg_dump {
    $global:dumpArguments = $args
    $global:dumpCalls++
    if ($env:PGSSLMODE -ne 'require' -or $env:PGCONNECT_TIMEOUT -ne '20') { throw 'Missing connection settings' }
    $file = $args[[Array]::IndexOf($args, '--file') + 1]
    if ($global:testMode -ne 'missing') {
        if ($global:testMode -eq 'empty') { [IO.File]::WriteAllText($file, '') }
        else { [IO.File]::WriteAllText($file, 'PGDMP-test-content') }
    }
    if ($global:testMode -eq 'dump-fail') { $global:LASTEXITCODE = 1 }
    else { $global:LASTEXITCODE = 0 }
}
function global:pg_restore {
    $global:restoreCalls++
    $file = $args[[Array]::IndexOf($args, '--file') + 1]
    if ($global:testMode -eq 'list-empty') { [IO.File]::WriteAllText($file, '') }
    else { [IO.File]::WriteAllText($file, '; Archive contents') }
    if ($global:testMode -eq 'list-fail') { $global:LASTEXITCODE = 1 }
    else { $global:LASTEXITCODE = 0 }
}
function Assert($condition, $message) { if (-not $condition) { throw $message } }
$oldSsl = [Environment]::GetEnvironmentVariable('PGSSLMODE', 'Process')
$oldTimeout = [Environment]::GetEnvironmentVariable('PGCONNECT_TIMEOUT', 'Process')
try {
    $env:PGSSLMODE = 'verify-full'
    $env:PGCONNECT_TIMEOUT = '7'
    $result = & $scriptFile -DbHost 'example.pooler.supabase.com' -DbUser 'postgres.example' -OutputDirectory $testRoot
    Assert (Test-Path $result.FullName) 'Missing verified archive'
    Assert ($result.RestoreTested -eq $false) 'Must not claim a tested restore'
    $info = Get-Content ($result.FullName + '.backup-info.json') -Raw | ConvertFrom-Json
    Assert ($info.sha256 -eq (Get-FileHash $result.FullName).Hash) 'Hash mismatch'
    Assert ($info.archive_list_readable -and -not $info.restore_tested) 'Wrong verification claims'
    Assert ($env:PGSSLMODE -eq 'verify-full' -and $env:PGCONNECT_TIMEOUT -eq '7') 'Environment not restored'
    Assert ($global:dumpArguments -contains '--password') 'Native password prompt missing'
    Assert (-not ($global:dumpArguments -match 'postgresql://')) 'Credential URL must not be used'
    $second = & $scriptFile -DbHost 'example.pooler.supabase.com' -DbUser 'postgres.example' -OutputDirectory $testRoot
    Assert ($result.FullName -ne $second.FullName) 'Backup filenames may not collide'
    Assert ((Get-Content $result.FullName -Raw) -eq 'PGDMP-test-content') 'Earlier backup overwritten'
    foreach ($mode in @('dump-fail', 'missing', 'empty', 'list-fail', 'list-empty')) {
        $global:testMode = $mode
        $dir = Join-Path $testRoot $mode
        $caught = $false
        try { & $scriptFile -DbHost 'example.pooler.supabase.com' -DbUser 'postgres.example' -OutputDirectory $dir | Out-Null }
        catch { $caught = $true }
        Assert $caught ('Expected rejection: ' + $mode)
        Assert (@(Get-ChildItem $dir -File).Count -eq 0) ('Unverified files left: ' + $mode)
        Assert ($env:PGSSLMODE -eq 'verify-full' -and $env:PGCONNECT_TIMEOUT -eq '7') 'Environment leaked on failure'
    }
    $calls = $global:dumpCalls
    $caught = $false
    try { & $scriptFile -DbHost 'https://invalid.example:5432' -DbUser 'postgres.example' -OutputDirectory $testRoot | Out-Null }
    catch { $caught = $true }
    Assert ($caught -and $global:dumpCalls -eq $calls) 'Invalid host must fail before pg_dump'
    # Also verify originally absent connection variables are removed after execution.
    Remove-Item Env:PGSSLMODE, Env:PGCONNECT_TIMEOUT -ErrorAction SilentlyContinue
    $global:testMode = 'success'
    & $scriptFile -DbHost 'example.pooler.supabase.com' -DbUser 'postgres.example' -OutputDirectory $testRoot | Out-Null
    Assert ($null -eq [Environment]::GetEnvironmentVariable('PGSSLMODE', 'Process')) 'SSL variable unexpectedly retained'
    Assert ($null -eq [Environment]::GetEnvironmentVariable('PGCONNECT_TIMEOUT', 'Process')) 'Timeout variable unexpectedly retained'
    Write-Host 'PASS backup success, checksum, unique files, native password prompt, five failure modes, input validation and environment cleanup'
}
finally {
    Remove-Item $testRoot -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item Function:pg_dump, Function:pg_restore -ErrorAction SilentlyContinue
    if ($null -eq $oldSsl) { Remove-Item Env:PGSSLMODE -ErrorAction SilentlyContinue } else { $env:PGSSLMODE = $oldSsl }
    if ($null -eq $oldTimeout) { Remove-Item Env:PGCONNECT_TIMEOUT -ErrorAction SilentlyContinue } else { $env:PGCONNECT_TIMEOUT = $oldTimeout }
}
