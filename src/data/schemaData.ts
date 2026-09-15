export interface SchemaField {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface CollectionSchema {
  name: string;
  description: string;
  documentExampleId: string;
  fields: SchemaField[];
}

export const FIRESTORE_COLLECTIONS: CollectionSchema[] = [
  {
    name: 'arizalar',
    description: 'Sistemdeki tüm aktif ve güncel kapalı arıza kayıtlarının tutulduğu ana koleksiyon.',
    documentExampleId: 'ariza_doc_kaiser123',
    fields: [
      { name: 'machine', type: 'string', required: true, description: 'Arızalı makinenin adı (Örn: KOMPRESÖR KAİSER, PRES HATTI 2)' },
      { name: 'status', type: 'string', required: true, description: 'Mevcut durum: "Açık", "Müdahale Ediliyor", "Parça Bekliyor", "Devredildi", "Dış Servis Bekliyor", "Geçici Çözüm", "Kapalı"' },
      { name: 'shift', type: 'string', required: false, description: 'Vardiya bilgisi (Örn: "08:00 - 16:00", "16:00 - 24:00")' },
      { name: 'jobType', type: 'string', required: true, description: 'Arıza kategorisi: "Mekanik", "Elektrik", "İş Güvenliği", "Planlı Bakım", "Tekrar Eden"' },
      { name: 'description', type: 'string', required: true, description: 'Arızayı açanın girdiği ilk problem tanımı' },
      { name: 'reporter', type: 'string', required: false, description: 'Arıza kaydını bildiren üretim operatörünün adı' },
      { name: 'assignedTo', type: 'string', required: false, description: 'Şu an işi yürüten ana bakım teknisyeni (silindiğinde havuza düşer)' },
      { name: 'helpers', type: 'string[]', required: false, description: 'Ana teknisyene yardıma gelen teknisyenlerin isim listesi' },
      { name: 'startedAt', type: 'ISO String', required: false, description: 'Ana teknisyenin "Çalışmaya Başla" dediği anın zaman damgası' },
      { name: 'completedAt', type: 'ISO String', required: false, description: 'Arızanın "Kapalı" yapıldığı kesin bitiş zamanı' },
      { name: 'completedBy', type: 'string', required: false, description: 'Arızayı kapatan teknisyenin adı' },
      { name: 'faultReason', type: 'string', required: false, description: 'Kök neden analizi: Arıza nedeni (Excel\'den gelen liste)' },
      { name: 'stoppageReason', type: 'string', required: false, description: 'Kök neden analizi: Duruş nedeni (Excel\'den gelen liste)' },
      { name: 'actionTaken', type: 'string', required: false, description: 'Teknisyenin yaptığı fiziksel tamir / müdahale detayları' },
      { name: 'partsChanged', type: 'string', required: false, description: 'Değiştirilen yedek parçalar (Örn: Rulman 6204, V kayış)' },
      { name: 'interventions', type: 'Array<InterventionLog>', required: false, description: 'Tüm ana ve yardımcı operatörlerin süre ve işlem log dizisi' }
    ]
  },
  {
    name: 'settings/config',
    description: 'Sistem operatörleri, PIN şifreleri, yetkileri ve Excel\'den çekilen kök neden parametreleri.',
    documentExampleId: 'config',
    fields: [
      { name: 'operators', type: 'Array<{name, pin, role, qrExemptUntil, imageUrl}>', required: true, description: 'Teknisyen listesi, PINleri ve QR muafiyet zaman damgaları' },
      { name: 'faultReasons', type: 'string[]', required: true, description: 'Arıza nedeni seçim listesi (Excel veri sekmesi)' },
      { name: 'stoppageReasons', type: 'string[]', required: true, description: 'Duruş nedeni seçim listesi (Excel veri sekmesi)' },
      { name: 'rootCauses', type: 'string[]', required: false, description: 'Kök neden genel kategorileri' },
      { name: 'lastUpdated', type: 'Timestamp', required: true, description: 'Excel senkronizasyonunun en son yapıldığı tarih' }
    ]
  },
  {
    name: 'settings/weeklyStats',
    description: 'Haftalık operatör çalışma süreleri ve tamamlanan iş adetlerinin gün gün tutulduğu özet belge.',
    documentExampleId: 'weeklyStats',
    fields: [
      { name: 'weekStartDate', type: 'string (DD.MM.YYYY)', required: true, description: 'Cari haftanın Pazartesi gününün tarihi' },
      { name: 'stats', type: 'Record<OperatorName, Record<Gun, {mins: number, count: number}>>', required: true, description: 'Pazartesi-Pazar arası her operatörün toplam dakikası ve kapattığı iş sayısı' }
    ]
  },
  {
    name: 'messages',
    description: 'Operatörler arası anlık ekran üstü (P2P) mesajlaşma koleksiyonu.',
    documentExampleId: 'msg_doc_abc',
    fields: [
      { name: 'sender', type: 'string', required: true, description: 'Mesajı gönderen operatörün adı' },
      { name: 'text', type: 'string', required: true, description: 'Mesaj içeriği' },
      { name: 'targetUsers', type: 'string[]', required: true, description: 'Hedef operatörler (veya ["ALL"])' },
      { name: 'readBy', type: 'string[]', required: true, description: 'Mesajı görüp "Okudum" butonuna basan operatörlerin listesi' },
      { name: 'createdAt', type: 'Timestamp', required: true, description: 'Mesajın atıldığı zaman damgası' }
    ]
  }
];

export const GOOGLE_SHEETS_COLUMNS = [
  { col: 'A', name: 'TARİH', description: 'Arıza açılış tarih ve saati (Örn: 11.09.2026 11:39)' },
  { col: 'B', name: 'İŞ İSTEK AÇAN', description: 'İş isteği açan kişi / operatör (Örn: fuat çetin)' },
  { col: 'C', name: 'maliyet merkezi', description: 'Maliyet merkezi kodu (Örn: 01-350522-BAKIM VE ONARIM & ÜRETİM)' },
  { col: 'D', name: 'İŞ İSTEK MAKİNE', description: 'Arızalanan makine adı (Örn: 1000 KVA TRAFO)' },
  { col: 'E', name: 'VARDİYA', description: 'Vardiya bilgisi (Örn: 2.VARDİYA 08:00 // 16:00)' },
  { col: 'F', name: 'İŞ TÜRÜ', description: 'İş / arıza türü (Örn: PLANLI BAKIM KODU, MEKANİK ARIZA)' },
  { col: 'G', name: 'YAPILMASI İSTENEN İŞİN AÇIKLAMASI', description: 'Bildirilen arıza veya yapılması istenen iş açıklaması' },
  { col: 'H', name: 'FOTO', description: 'Ekli fotoğraf linki veya Yok' },
  { col: 'I', name: 'BAKIM LOGU', description: 'Müdahale logları ve kapanma bilgisi (Örn: FUAT ÇETİN ARIZAYI KAPATTI ( 14 dk ))' },
  { col: 'J', name: 'BİT TARİH', description: 'Kapanış tarihi (Örn: 11.09.2026)' },
  { col: 'K', name: 'SAAT', description: 'Müdahale başlama ve bitiş saat aralığı (Örn: 11:23 - 11:36)' },
  { col: 'L', name: 'SÜRE', description: 'Toplam duruş / müdahale süresi (Örn: 14 dk)' },
  { col: 'M', name: 'DURUŞ NEDENİ', description: 'Kök neden analizi duruş nedeni (Örn: MAKİNE ARIZA)' },
  { col: 'N', name: 'YAPILAN BAKIM', description: 'Yapılan bakım / arıza kök nedeni (Örn: YANLIŞ KULLANIM)' },
  { col: 'O', name: 'ACIKLAMA', description: 'Teknisyenin uyguladığı çözüm açıklaması' },
  { col: 'P', name: 'DEĞİŞEN PARÇA', description: 'Değiştirilen parça adı veya -' }
];

export const MERMAID_DIAGRAMS: Record<string, string> = {
  master: `flowchart TD
    Start([Saha Arıza Bildirimi]) --> Dashboard[(Canlı Arıza Paneli: Firestore)]
    OpLogin[Teknisyen PIN Girişi] --> Dashboard
    Dashboard --> ClickCard{Arıza Kartına Tıklanır}
    ClickCard -->|Admin veya QR Muafiyeti| DirectModal[Doğrudan Arıza Modalı]
    ClickCard -->|Normal Teknisyen| QRScan[Saha Kamera QR Okuma]
    QRScan -->|Doğru Makine| FaultAction{Aksiyon Seçimi}
    DirectModal --> FaultAction
    FaultAction -->|Çalışmaya Başla| WorkInProgress[Müdahale Ediliyor: Süre Başlar]
    FaultAction -->|Yardımcı Olarak Katıl| JoinHelper[Yardımcı Bakımcı Eklenir]
    WorkInProgress --> FormModal{Müdahale Formu}
    JoinHelper --> FormModal
    FormModal -->|Parça Bekliyor / Devir| PoolWait[Havuza Düşer: Sorumlu Silinir]
    FormModal -->|Arızayı Kapat| CloseFault[Kök Neden & Analiz Formu]
    CloseFault --> UpdateStats[(Haftalık İstatistik Güncelleme)]
    UpdateStats --> DailyArchive[Gün Sonu Otomatik Arşivleme]
    DailyArchive --> GoogleSheets[(Google E-Tablolar: 16 Sütun)]
    GoogleSheets --> BatchDelete[Firestore Batch Delete]
    BatchDelete --> Finish([Arşiv Tamamlandı: Temiz Sistem])`,

  auth: `flowchart TD
    Boot([Sayfa Yüklendi]) --> FetchConfig[(Firebase settings/config)]
    FetchConfig --> CheckEmpty{Veritabanı Boş mu?}
    CheckEmpty -->|Evet| SyncSheets[Google Sheets İlk Kurulum]
    CheckEmpty -->|Hayır| CheckSaved{Kayıtlı Oturum Var mı?}
    SyncSheets --> CheckSaved
    CheckSaved -->|Yok| PinScreen[4 Haneli PIN Girişi]
    CheckSaved -->|Var| VerifyRole{Yetki Rolü Nedir?}
    PinScreen --> VerifyRole
    VerifyRole -->|Admin / Yönetici| AdminPanel[Tüm Yönetimsel Araçlar Açık]
    VerifyRole -->|Normal Teknisyen| TechPanel[Standart Bakımcı Ekranı]
    AdminPanel --> QRExemptRule[Süreli QR Muafiyeti Yönetimi]
    TechPanel --> QRExemptRule`,

  qr: `flowchart TD
    Click[Karta Tıklandı] --> CheckExempt{Admin veya QR Muafiyeti?}
    CheckExempt -->|Evet| Bypass[Doğrudan Arıza Modalı]
    CheckExempt -->|Hayır| StartCam[Kamera Başlat: Environment]
    StartCam --> ScanResult[Karekod Okundu]
    ScanResult --> CheckAppSheet{AppSheet Linki mi?}
    CheckAppSheet -->|Evet: row=ID| DictLookup[(GViz JSONP Makine Sözlüğü)]
    CheckAppSheet -->|Hayır| MatchTest{Tıklanan Makine ile Aynı mı?}
    DictLookup --> MatchTest
    MatchTest -->|Farklı Makine| AlertError[Hata: Yanlış Makine Okutuldu!]
    MatchTest -->|Eşleşti| OpenFaults[O Makinedeki Açık Arızalar Listelenir]
    Bypass --> OpenFaults`,

  intervention: `flowchart TD
    OpenState([AÇIK: Müdahale Bekliyor]) --> ClickStart[Çalışmaya Başla Butonu]
    ClickStart --> InProgress[MÜDAHALE EDİLİYOR]
    InProgress --> WhoClicks{Kim Tıklıyor?}
    WhoClicks -->|Ana Sorumlu| FinishForm[Müdahaleyi Bitir / Güncelle]
    WhoClicks -->|2. Teknisyen| HelperStatus{Zaten Yardımcı mı?}
    HelperStatus -->|Hayır| Join[Yardımcı Olarak Katıl: arrayUnion]
    HelperStatus -->|Evet| Leave[Bakımdan Ayrıl: Süre Logu & arrayRemove]
    FinishForm --> DecisionStatus{Seçilen Durum?}
    DecisionStatus -->|Parça Bekliyor / Devir| ResetPool[Sorumlu Silinir: Havuza Düşer]
    DecisionStatus -->|Kapalı| Closed([KAPALI: Çözüldü & Bitti])
    ResetPool --> Takeover[Parça Geldi / İşi Devral]
    Takeover --> InProgress`
};
