# AKG Bakim ve Ariza Takip Sistemi - Windows PowerShell Baslatici
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "AKG Bakim ve Ariza Takip Sistemi (CMMS)"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   AKG GAZBETON - SAHA BAKIM VE ARIZA TAKIP SISTEMI (CMMS)" -ForegroundColor Yellow
Write-Host "   Windows, Android ve iOS PWA & Desktop Baslatici" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot

# 1. Node.js Kontrolu
if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "[OK] Node.js tespit edildi." -ForegroundColor Green
    
    if (-not (Test-Path "node_modules")) {
        Write-Host "[INFO] Ilk kurulum: Bagimliliklar yukleniyor (npm install)..." -ForegroundColor Yellow
        npm install
    }
    
    Write-Host "[INFO] Gelistirme sunucusu baslatiliyor (http://localhost:3000)..." -ForegroundColor Green
    Start-Process "http://localhost:3000"
    npm run dev
    exit
}

# 2. Python Alternatifi
if (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Host "[INFO] Node.js bulunamadi, Python yerel sunucusu kullaniliyor..." -ForegroundColor Yellow
    if (Test-Path "dist") {
        Set-Location "dist"
    }
    Start-Process "http://localhost:3000"
    python -m http.server 3000
    exit
}

# 3. Bilgilendirme
Write-Host "[HATA] Sisteminizde Node.js kurulu degil." -ForegroundColor Red
Write-Host "Lutfen https://nodejs.org adresinden Node.js indirip kurun." -ForegroundColor Yellow
Write-Host "Kurulumdan sonra bu dosyaya veya BASLAT.bat dosyasina tekrar cift tiklayin." -ForegroundColor Yellow
Write-Host ""
Read-Host "Kapatmak icin Enter tusuna basin..."
