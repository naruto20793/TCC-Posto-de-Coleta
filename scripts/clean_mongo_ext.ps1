# Script para limpar dados da extensão MongoDB for VS Code e reinstalar
Write-Output 'Iniciando limpeza da extensão MongoDB for VS Code...'
# Parar instâncias do VS Code
try {
    taskkill /IM Code.exe /F | Out-Null
    Write-Output 'VS Code processes terminated (if any)'
} catch {
    Write-Output 'No Code process or error terminating processes.'
}
# Remover globalStorage da extensão
$gs = Join-Path $env:APPDATA 'Code\User\globalStorage\mongodb.mongodb-vscode'
if (Test-Path $gs) {
    Remove-Item -Recurse -Force $gs
    Write-Output "Removed: $gs"
} else {
    Write-Output "Not found: $gs"
}
# Remover pastas da extensão instalada em %USERPROFILE%\.vscode\extensions
$extDir = Join-Path $env:USERPROFILE '.vscode\extensions'
if (Test-Path $extDir) {
    $found = Get-ChildItem -Path $extDir -Directory -Filter 'mongodb.mongodb-vscode*' -ErrorAction SilentlyContinue
    if ($found) {
        foreach ($d in $found) {
            Remove-Item -Recurse -Force $d.FullName
            Write-Output "Removed extension folder: $($d.FullName)"
        }
    } else {
        Write-Output 'No extension folders found in user .vscode\extensions'
    }
} else {
    Write-Output "Extensions dir not found: $extDir"
}
# Reinstalar via code CLI se disponível
if (Get-Command code -ErrorAction SilentlyContinue) {
    Write-Output 'Installing extension via code CLI...'
    code --install-extension mongodb.mongodb-vscode
    Write-Output 'Reinstallation attempted via code CLI.'
} else {
    Write-Output 'code CLI not found; please reinstall via Extensions UI in VS Code.'
}
Write-Output 'Operação concluída.'
