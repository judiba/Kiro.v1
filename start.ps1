# Script para iniciar o projeto TaskFlow
# Resolve o problema do PATH com o bun no Windows

$bunExe = "$env:USERPROFILE\.bun\bin\bun.exe"

if (-not (Test-Path $bunExe)) {
    Write-Host "Bun nao encontrado em $bunExe" -ForegroundColor Red
    Write-Host "Instale com: powershell -c 'irm bun.sh/install.ps1 | iex'" -ForegroundColor Yellow
    exit 1
}

Write-Host "Instalando dependencias..." -ForegroundColor Cyan
& $bunExe install

Write-Host "Compilando frontend..." -ForegroundColor Cyan
& $bunExe run build.ts

Write-Host "Iniciando servidor..." -ForegroundColor Green
& $bunExe run server/index.ts
