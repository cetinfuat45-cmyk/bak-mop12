# AKG Gazbeton CMMS - Saha Bakım & Arıza Takip Sistemi (PWA & Çoklu Platform)

Bu proje, **AKG Gazbeton** fabrikası için geliştirilmiş; **Windows**, **Android** ve **iOS (iPhone/iPad)** cihazlarla %100 uyumlu, **Progressive Web App (PWA)** ve **Capacitor** mimarisine sahip gerçek zamanlı Saha Bakım Yönetim Sistemi (CMMS) ve Arıza Takip platformudur.

---

## 💻 1. Windows Kurulumu ve Çalıştırma (1-Tıkla Başlatma)

Windows bilgisayarınızda (Masaüstü veya Laptop) uygulamayı 2 farklı yöntemle çalıştırabilirsiniz:

### YÖNTEM A: Çift Tıklayarak Yerel Başlatma (Geliştirici / Saha Bilgisayarı)
1. İndirilen ZIP dosyasını klasöre çıkartın.
2. Klasör içindeki **`BASLAT.bat`** (veya `BAŞLAT.bat` / `BASLAT.ps1`) dosyasına **çift tıklayın**.
3. Sistem otomatik olarak:
   - Node.js kontrolü yapar,
   - İlk açılışta gerekli paketleri kurar (`npm install`),
   - Tarayıcınızda (`http://localhost:3000`) sistemi açar.

### YÖNTEM B: Windows Masaüstü Uygulaması Olarak Kurma (PWA Desktop)
1. Google Chrome veya Microsoft Edge ile sistem adresini açın (`http://localhost:3000` veya canlı URL).
2. Adres çubuğunun en sağındaki **"Uygulamayı Yükle"** (monitör veya artı `⊕`) simgesine tıklayın.
3. **Yükle** butonuna bastığınızda, sistem Windows Başlat menünüze ve Görev Çubuğunuza ayrı bir masaüstü uygulaması olarak eklenir, pencere şeklinde tam ekran çalışır.

---

## 📱 2. Android Mobil Kurulum Kılavuzu

### YÖNTEM A: Doğrudan Telefona Yükleme (PWA - Tavsiye Edilen)
1. Android telefonunuzda **Google Chrome** tarayıcısını açın ve sistem adresine gidin.
2. Ekranda otomatik çıkan **"Telefona Yükle"** butonuna dokunun VEYA sağ üstteki **üç nokta (⋮)** menüsünü açın.
3. **"Uygulamayı Yükle"** veya **"Ana Ekrana Ekle"** seçeneğine dokunun.
4. Uygulama, cihazınızın uygulama çekmecesine **AKG Bakım** simgesiyle yüklenir; adres çubuğu olmadan tam ekran mobil uygulama olarak çalışır.

### YÖNTEM B: Capacitor ile Android APK Derleme (Google Play / Yerel APK)
Projede `capacitor.config.json` yapılandırması hazır bulunmaktadır:
```bash
# 1. Projeyi derleyin
npm run build

# 2. Capacitor Android paketlerini yükleyin
npm install @capacitor/core @capacitor/cli @capacitor/android

# 3. Android platformunu ekleyin ve açın
npx cap add android
npx cap copy
npx cap open android
```
*Android Studio açılacaktır; Build -> Generate Signed Bundle / APK seçeneğiyle doğrudan APK veya AAB üretebilirsiniz.*

---

## 🍏 3. iOS (iPhone & iPad) Mobil Kurulum Kılavuzu

### YÖNTEM A: Safari Ana Ekrana Ekleme (PWA)
1. iPhone veya iPad'inizde **Safari** tarayıcısını açın ve sistem adresine gidin.
2. Ekranın alt kısmında yer alan **Paylaş (Share)** simgesine (kare içinde yukarı ok ⎋) dokunun.
3. Menüyü aşağı kaydırıp **"Ana Ekrana Ekle" (Add to Home Screen)** seçeneğini seçin.
4. Sağ üstteki **"Ekle"** butonuna basın.
5. Uygulama, iPhone'unuzun ana ekranına **AKG Bakım** simgesiyle yüklenir; Apple Dynamic Island ve çentik korumasıyla (Safe Area) tam ekran çalışır.

### YÖNTEM B: Capacitor ile iOS Xcode Derleme (TestFlight / App Store / IPA)
Mac bilgisayarınızda Xcode kurulu ise:
```bash
npm run build
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap add ios
npx cap copy
npx cap open ios
```
*Xcode açılarak doğrudan simülatöre veya bağlı iPhone'a yüklenebilir.*

---

## 🐙 4. GitHub'a Yükleme ve Dağıtım Adımları

Bu projeyi GitHub üzerinde kendi reponuzda yayınlamak için aşağıdaki adımları izleyin:

### 1. Yeni Git Deposu Başlatma ve İlk Commit
Proje ana klasöründe terminal açın:
```bash
# Git deposunu başlatın
git init

# Tüm dosyaları ekleyin
git add .

# İlk commit'i oluşturun
git commit -m "feat: AKG CMMS Saha Bakim ve Ariza Takip Sistemi"
```

### 2. GitHub Deponuzu Bağlama ve Yükleme (Push)
GitHub üzerinde (`https://github.com/new`) yeni bir boş repo açın (örn: `akg-bakim-sistemi`). Ardından:
```bash
# Ana dalı main olarak ayarlayın
git branch -M main

# Kendi GitHub reponuzun URL'sini ekleyin
git remote add origin https://github.com/KULLANICI_ADINIZ/akg-bakim-sistemi.git

# Kodları GitHub'a gönderin
git push -u origin main
```

### 3. GitHub Pages ile Ücretsiz Canlı Yayına Alma
Projede hazır bulunan `.github/workflows/deploy.yml` sayesinde GitHub otomatik build alır:
1. GitHub reponuza gidin: **Settings** (Ayarlar) -> sol menüden **Pages** sekmesini açın.
2. **Build and deployment** başlığı altındaki **Source** açılır kutusunu:
   👉 **`GitHub Actions`** olarak seçin.
3. Otomatik olarak deploy iş akışı tetiklenir ve siteniz canlıya geçer!

---

## 🔐 5. Giriş Ekranı ve Gizlilik

- **Açılışta Kayıtlı Teknisyen Listesi Gizlidir:** Açılış sayfası doğrudan sade ve güvenli PIN tuş takımı ile karşılar. Cihaz başındaki yetkisiz kişilerin tüm teknisyen listesini ve PIN kodlarını doğrudan görmesi engellenmiştir.
- **Dinamik Eşleşme:** Teknisyen kendi PIN'ini tuşladığında ismi ve fotoğrafı otomatik eşleşir ve 1 dokunuşla sisteme girer.
- **İsteğe Bağlı Liste:** İhtiyaç duyulduğunda alt kısımdaki *"Teknisyen Listesi"* butonuna tıklanarak modal pencereden isimle arama ve seçim yapılabilir.

---

## 🚀 6. ZIP Paketi İndirme

- Uygulama giriş ekranının sağ üst köşesindeki **`GitHub Paketi (.ZIP)`** butonuna tıklayarak en güncel, GitHub'a doğrudan yüklenebilir ve Windows / Android / iOS uyumlu arşivi tek tıkla cihazınıza indirebilirsiniz.
- Konsolda `npm run pack-zip` veya `npm run build` komutları çalıştırıldığında bu paket otomatik olarak `public/akg-cmms-github-release.zip` konumuna güncellenir.

