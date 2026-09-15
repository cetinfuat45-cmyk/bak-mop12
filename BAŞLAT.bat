@echo off
chcp 65001 >nul
title AKG Bakım & Arıza Takip Sistemi (CMMS) Başlatıcı
color 0B

echo ================================================================
echo    AKG GAZBETON - SAHA BAKIM VE ARIZA TAKİP SİSTEMİ (CMMS)
echo    Android & iOS PWA Destekli Web Uygulaması Başlatılıyor...
echo ================================================================
echo.

cd /d "%~dp0"

:: 1. Node.js Kontrolü
where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [OK] Node.js bulundu.
    
    :: node_modules var mı kontrol et
    if not exist "node_modules\" (
        echo [INFO] Gerekli paketler yükleniyor (npm install)...
        call npm install
    )
    
    echo [INFO] Geliştirme sunucusu başlatılıyor...
    echo [INFO] Tarayıcı http://localhost:3000 adresinde açılacak.
    
    start "" http://localhost:3000
    call npm run dev
    goto end
)

:: 2. Python Kontrolü (Node.js yoksa alternatif)
where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [INFO] Node.js bulunamadı, Python yerel sunucusu başlatılıyor...
    if exist "dist\" (
        cd dist
    )
    start "" http://localhost:3000
    echo [INFO] Sunucu çalışıyor: http://localhost:3000
    python -m http.server 3000
    goto end
)

:: 3. Ne Node ne Python varsa kullanıcıya rehberlik
echo.
echo ================================================================
echo [HATA] Sisteminizde Node.js veya Python bulunamadı!
echo ================================================================
echo.
echo Modern web uygulamalarını (React/TypeScript) yerel bilgisayarda
echo çalıştırmak için Node.js gereklidir.
echo.
echo Lütfen aşağıdaki ücretsiz adımı takip edin:
echo 1. https://nodejs.org adresinden Node.js (LTS sürümünü) indirin ve kurun.
echo 2. Kurulum tamamlandıktan sonra bu "BAŞLAT.bat" dosyasına tekrar çift tıklayın.
echo.
echo VEYA projeyi doğrudan GitHub'a yükleyip Vercel / Netlify üzerinden
echo ücretsiz tek tıkla canlıya alabilirsiniz.
echo.
pause

:end
