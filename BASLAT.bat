@echo off
chcp 65001 >nul
title AKG Bakim ve Ariza Takip Sistemi (CMMS) Baslatici
color 0B

echo ================================================================
echo    AKG GAZBETON - SAHA BAKIM VE ARIZA TAKIP SISTEMI (CMMS)
echo    Android ve iOS PWA Destekli Web Uygulamasi Baslatiliyor...
echo ================================================================
echo.

cd /d "%~dp0"

:: 1. Node.js Kontrolu
where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [OK] Node.js bulundu.
    
    if not exist "node_modules\" (
        echo [INFO] Gerekli paketler yukleniyor (npm install)...
        call npm install
    )
    
    echo [INFO] Gelistirme sunucusu baslatiliyor...
    echo [INFO] Tarayici http://localhost:3000 adresinde acilacak.
    
    start "" http://localhost:3000
    call npm run dev
    goto end
)

:: 2. Python Kontrolu (Node.js yoksa alternatif)
where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [INFO] Node.js bulunamadi, Python yerel sunucusu baslatiliyor...
    if exist "dist\" (
        cd dist
    )
    start "" http://localhost:3000
    echo [INFO] Sunucu calisiyor: http://localhost:3000
    python -m http.server 3000
    goto end
)

:: 3. Ne Node ne Python varsa kullaniciya rehberlik
echo.
echo ================================================================
echo [HATA] Sisteminizde Node.js veya Python bulunamadi!
echo ================================================================
echo.
echo Modern web uygulamalarini (React/TypeScript) yerel bilgisayarda
echo calistirmak icin Node.js gereklidir.
echo.
echo Lutfen asagidaki adimi takip edin:
echo 1. https://nodejs.org adresinden Node.js indirip kurun.
echo 2. Kurulumdan sonra bu "BASLAT.bat" dosyasina tekrar cift tiklayin.
echo.
echo VEYA projeyi dogrudan GitHub'a yukleyip Vercel / Netlify uzerinden
echo ucretsiz tek tikla canliya alabilirsiniz.
echo.
pause

:end
