# AKG Gazbeton CMMS - Saha Bakım & Arıza Takip Sistemi (PWA)

Bu proje, **AKG Gazbeton** fabrikası için geliştirilmiş, **Android** ve **iOS (iPhone/iPad)** cihazlarla %100 tam uyumlu, **Progressive Web App (PWA)** mimarisine sahip gerçek zamanlı Saha Bakım Yönetim Sistemi (CMMS) ve Arıza Takip platformudur.

---

## 📱 Android & iOS Mobil Kurulum Kılavuzu (Telefona Yükleme)

Uygulama, hem **Google Chrome (Android)** hem de **Apple Safari (iOS)** üzerinde herhangi bir uygulama mağazasına ihtiyaç duymadan **yerel bir mobil uygulama (Native App)** gibi ana ekrana yüklenebilir ve tam ekran olarak çalışır.

### 🍏 iPhone & iPad (iOS Safari) Kurulumu:
1. iPhone veya iPad'inizde **Safari** tarayıcısını açın ve sistem adresine gidin.
2. Ekranın alt kısmında yer alan **Paylaş (Share)** simgesine (kare içinde yukarı ok ⎋) dokunun.
3. Menüyü aşağı kaydırıp **"Ana Ekrana Ekle" (Add to Home Screen)** seçeneğini seçin.
4. Sağ üstteki **"Ekle"** butonuna basın.
5. Uygulama, telefonunuzun ana ekranına **AKG Bakım** simgesiyle yüklenir; Safari çubuğu olmadan tam ekran çalışır.

### 🤖 Android (Google Chrome & Samsung Internet) Kurulumu:
1. Android telefonunuzda **Google Chrome** tarayıcısını açın ve sistem adresine gidin.
2. Ekranda otomatik çıkan **"Telefona Yükle"** butonuna dokunun VEYA sağ üstteki **üç nokta (⋮)** menüsünü açın.
3. **"Uygulamayı Yükle"** veya **"Ana Ekrana Ekle"** seçeneğine dokunun.
4. Onay verdikten sonra uygulama, cihazınızın uygulama çekmecesine ve ana ekranına bağımsız bir uygulama olarak kurulur.

---

## 🐙 GitHub'a Yükleme ve Dağıtım Adımları

Bu projeyi GitHub üzerinde kendi reponuzda yayınlamak ve ekibinizle paylaşmak için aşağıdaki adımları izleyebilirsiniz:

### 1. Yeni Git Deposu Başlatma ve İlk Commit
Terminal veya komut satırını proje klasöründe açın:
```bash
# Git deposunu başlatın
git init

# Tüm dosyaları ekleyin
git add .

# İlk commit'i oluşturun
git commit -m "feat: AKG CMMS Saha Bakim ve Ariza Takip Sistemi (Android & iOS PWA)"
```

### 2. GitHub Deponuzu Bağlama ve Yükleme (Push)
GitHub üzerinde (`https://github.com/new`) yeni bir repo açın (örn: `bak-mop12`). Ardından:
```bash
# Ana dalı main olarak ayarlayın
git branch -M main

# GitHub reponuzun URL'sini ekleyin (kendi repo adresinizi yazın)
git remote add origin https://github.com/KULLANICI_ADINIZ/bak-mop12.git

# Kodları GitHub'a gönderin
git push -u origin main
```

### 3. GitHub Pages ile Canlı Yayına Alma (Boş Ekran Sorununu Çözme)
GitHub Pages'de projenizi canlıya almak için iki yöntem bulunur:

#### YÖNTEM A: GitHub Actions ile Otomatik Dağıtım (En Kolay & Önerilen)
Projede hazır bulunan `.github/workflows/deploy.yml` sayesinde GitHub otomatik build alır:
1. GitHub reponuza gidin: **Settings** (Ayarlar) -> sol menüden **Pages** sekmesini açın.
2. **Build and deployment** başlığı altındaki **Source** açılır kutusunu:
   👉 **`GitHub Actions`** olarak seçin.
3. Otomatik olarak deploy iş akışı tetiklenir ve `https://KULLANICI_ADINIZ.github.io/REPO_ADINIZ/` adresinde siteniz hatasız canlıya geçer!

#### YÖNTEM B: Hazır `dist/` Klasörünü Yükleme
Eğer doğrudan derlenmiş dosyaları GitHub'a yüklemek istiyorsanız:
1. ZIP içindeki **`dist/`** klasörünün içindeki tüm dosyaları (`index.html`, `assets/`, `manifest.webmanifest` vb.) kopyalayın.
2. Reponuzun ana dizinine veya `gh-pages` dalına yapıştırıp commit edin.
3. Artık göreceli yol (`base: './'`) yapılandırması sayesinde alt klasörde (`/bak-mop12/`) doğrudan çalışacaktır!

### 3. GitHub Releases ile ZIP Dağıtımı
Proje dizininde yer alan `public/akg-cmms-github-release.zip` veya `npm run pack-zip` komutu ile oluşturulan ZIP arşivini GitHub Releases bölümünden ekibinize dağıtabilirsiniz:
1. GitHub reponuzun ana sayfasında sağ taraftaki **"Releases"** -> **"Draft a new release"** seçeneğine tıklayın.
2. Tag olarak `v1.0.0` girin.
3. Oluşturulan `akg-cmms-github-release.zip` dosyasını sürüm ekleri alanına sürükleyip bırakın ve **"Publish release"** butonuna basın.

---

## 🚀 Yerel Geliştirme (Local Setup)

Bilgisayarınızda **Node.js** (v18 veya üzeri) kurulu olmalıdır:

1. **Bağımlılıkları Yükleyin:**
   ```bash
   npm install
   ```

2. **Geliştirme Sunucusunu Başlatın:**
   ```bash
   npm run dev
   ```
   *Uygulama `http://localhost:3000` adresinde çalışacaktır.*

3. **Üretim (Production) Derlemesi ve ZIP Paketleme:**
   ```bash
   npm run build
   ```
   *Bu komut hem PWA üretim kodlarını `dist/` klasörüne derler hem de `akg-cmms-github-release.zip` dağıtım paketini otomatik üretir.*

4. **Manuel ZIP Üretme:**
   ```bash
   npm run pack-zip
   ```

---

## ⚙️ Canlıya Alma (Hosting / Deploy) Seçenekleri

- **Vercel / Netlify:** GitHub reponuzu bağlayıp `Framework: Vite` seçerek tek tıkla canlıya alabilirsiniz.
- **Docker / Cloud Run:** Sağlanan container konfigürasyonuyla Cloud Run veya kendi şirket içi sunucunuza kolayca konuşlandırabilirsiniz.
- **PWA HTTPS Zorunluluğu:** PWA servis çalışanlarının (Service Worker) ve kamera tabanlı QR kod okuyucusunun çalışabilmesi için canlı ortamda **HTTPS** protokolünün aktif olması gereklidir (Vercel, Netlify ve Cloud Run bunu otomatik sağlar).

---

## 🌟 Öne Çıkan Özellikler

- **📱 Android & iOS Tam Destek:** Standalone tam ekran çalışma, safe-area (çentik/Dynamic Island) uyumu, dokunma optimizasyonu.
- **⚡ Otomatik Müdahale & Süre Takibi:** Teknisyen ve yardımcı operatörlerin çalışma süreleri katıldıkları andan itibaren sistem tarafından **otomatik ve net dakika** olarak hesaplanır.
- **📊 Google E-Tablo & Apps Script API Entegrasyonu:** Kapatılan arızalar Google E-Tablolardaki 16 sütunlu resmi bakım loguna ve operatör performans tablosuna otomatik kaydedilir.
- **📷 Karekod / QR ile Makine Doğrulama:** Sahada bakım yapılacak makinenin QR kodunu okutarak doğrudan arızaya müdahale başlatma veya yeni arıza kaydı açma.
- **📴 Çevrimdışı (Offline) Önbellek Desteği:** Workbox tabanlı service worker sayesinde saha içindeki WiFi kopmalarında dahi sistem kesintisiz arayüz sunar.
- **🔔 Endüstriyel Ses Efektleri:** Arıza açılışı, operatör çağrısı ve kapanış işlemleri için özel ses bildirimleri.
- **💬 Operatörler Arası Mesajlaşma (P2P):** Vardiyadaki teknisyenler arasında canlı bildirim ve anlık bilgi akışı.
- **🔐 PIN Korumalı Operatör Girişi & Yönetici Paneli:** Yetki bazlı arıza kodları yönetimi, QR muafiyet tanımlama ve haftalık WhatsApp özet raporları.
