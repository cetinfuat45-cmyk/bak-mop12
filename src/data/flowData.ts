import { FlowDiagram, SimulationScenario } from '../types';

export const FLOW_DIAGRAMS: FlowDiagram[] = [
  // 1. MASTER FLOWCHART (Uçtan Uca Ana Akış)
  {
    id: 'master',
    title: 'AKG Bakım & Arıza Yönetim Sistemi - Uçtan Uca Ana Akış Şeması',
    subtitle: 'Saha operatör girişi, karekod eşleşmesi, müdahale süreci, kök neden analizi ve Excel arşiv döngüsü',
    badge: 'Genel Sistem Akışı',
    description: 'AKG fabrikasındaki tüm arıza kayıtlarının üretim sahasından başlayarak teknisyene atanması, çözülmesi ve Google Sheets arşivine aktarılması sürecinin genel mimarisi.',
    nodes: [
      {
        id: 'start_fault',
        label: 'Saha Arıza Bildirimi',
        sublabel: 'Üretim operatörü veya sistem arıza açar',
        type: 'start',
        actor: 'system',
        x: 400,
        y: 40,
        width: 220,
        height: 60,
        firestoreCollection: 'arizalar',
        description: 'Üretim bandındaki operatör veya AppSheet üzerinden makine için arıza kaydı açılır (status: "Açık").',
        details: [
          'Arıza bildirildiğinde Firestore "arizalar" koleksiyonuna yeni belge düşer.',
          'Kayıtta machine, shift, jobType, description, reporter ve createdAt yer alır.'
        ],
        codeSnippet: `// Firestore 'arizalar' koleksiyonuna yeni kayıt eklenir
db.collection('arizalar').add({
  machine: "KOMPRESÖR KAİSER",
  status: "Açık",
  shift: "08:00 - 16:00",
  jobType: "Mekanik",
  description: "Rulman aşırı ısınıyor ve ses yapıyor",
  createdAt: firebase.firestore.FieldValue.serverTimestamp()
});`
      },
      {
        id: 'op_login',
        label: 'Teknisyen PIN Girişi',
        sublabel: '4 Haneli PIN Doğrulama',
        type: 'process',
        actor: 'operator',
        x: 400,
        y: 140,
        width: 220,
        height: 65,
        codeFunction: 'login() / checkSavedLogin()',
        description: 'Bakım teknisyeni (operatör) 4 haneli PIN kodunu girer. Sistem Firebase settings/config belgesindeki operatör listesinde şifreyi doğrular.',
        details: [
          'PIN kodu eşleştiğinde localStorage("loggedInOperator") saklanır.',
          'Giriş yapanın yetkisine (Admin / Teknisyen) göre özel butonlar açılır.'
        ],
        codeSnippet: `function login() {
  const pinInput = document.getElementById('pinCode').value.trim();
  const operator = operatorsList.find(op => String(op.pin).trim() === pinInput);
  if (operator) {
    loggedInOperator = operator;
    localStorage.setItem("loggedInOperator", JSON.stringify(operator));
    showDashboard();
  }
}`
      },
      {
        id: 'dashboard_listen',
        label: 'Canlı Arıza Paneli',
        sublabel: 'Firestore onSnapshot Dinleyicisi',
        type: 'database',
        actor: 'firebase',
        x: 400,
        y: 250,
        width: 240,
        height: 70,
        codeFunction: 'fetchOpenFaults()',
        firestoreCollection: 'arizalar',
        description: 'Firestore veritabanı canlı dinlenerek açık arızalar 3 grupta listelenir: Güncel Açık Arızalar, Bana Atanan Görevler ve Önceki Günlerden Kalanlar.',
        details: [
          'Yeni arıza düştüğünde sesli bip ritmi (playNotificationSound) ve ekran üstü bildirim (Toast) tetiklenir.',
          'İş türlerine göre renk kodları verilir: Mekanik (Cyan), Elektrik (Sarı), İSG (Kırmızı), vb.'
        ]
      },
      {
        id: 'dec_qr_exempt',
        label: 'Admin veya QR Muafiyeti Var mı?',
        sublabel: 'qrExemptUntil > Date.now() / Admin',
        type: 'decision',
        actor: 'system',
        x: 390,
        y: 370,
        width: 260,
        height: 80,
        codeFunction: 'handleFaultClick(fault)',
        description: 'Karta tıklandığında operatörün Admin olup olmadığı veya şeften alınmış süreli QR tıklama muafiyeti kontrol edilir.',
        edgeCases: [
          'Admin veya muafiyeti olan teknisyen doğrudan müdahale formuna geçer.',
          'Normal teknisyen makinenin yanına gitmeye ve kamerayla QR okutmaya zorlanır.'
        ]
      },
      {
        id: 'qr_scanner',
        label: 'Saha Karekod Doğrulama',
        sublabel: 'Kamera ile Makine QR Taraması',
        type: 'process',
        actor: 'operator',
        x: 180,
        y: 500,
        width: 240,
        height: 70,
        codeFunction: 'startQROnlyCamera() / onScanSuccess()',
        description: 'Html5Qrcode arka kamerayı (environment) açar. AppSheet URL veya düz metin okunarak makine sözlüğü ile doğrulanır.',
        details: [
          'Okutulan karekod ile tıklanan arızanın makinesi uyuşmazsa sistem sesli/yazılı uyarı verir: "Yanlış Makine!"',
          'Doğru makine okutulduğunda arıza seçim penceresi açılır.'
        ]
      },
      {
        id: 'direct_modal',
        label: 'Doğrudan Arıza Seçim Modalı',
        sublabel: 'QR Okutmadan Anında Erişim',
        type: 'process',
        actor: 'admin',
        x: 620,
        y: 500,
        width: 220,
        height: 70,
        codeFunction: 'openFaultSelectionModal([fault])',
        description: 'Admin veya QR muafiyeti olan operatörler için doğrudan modal açılır; uzaktan görevli atayabilir veya müdahaleyi başlatabilir.'
      },
      {
        id: 'fault_action_choice',
        label: 'Müdahale Rolü & Aksiyon Seçimi',
        sublabel: 'Ana Sorumlu / Yardımcı / Atama',
        type: 'decision',
        actor: 'system',
        x: 390,
        y: 620,
        width: 260,
        height: 80,
        codeFunction: 'openFaultSelectionModal()',
        description: 'Arızanın durumuna göre dinamik butonlar üretilir: İşe Başla, Müdahaleyi Bitir/Güncelle, Yardımcı Katıl, Bakımdan Ayrıl veya Admin Görevli Ata.'
      },
      {
        id: 'work_in_progress',
        label: 'Çalışma Başlatıldı',
        sublabel: 'status: "Müdahale Ediliyor"',
        type: 'process',
        actor: 'operator',
        x: 180,
        y: 750,
        width: 220,
        height: 70,
        codeFunction: 'startWork(faultId)',
        firestoreCollection: 'arizalar',
        description: 'Teknisyen işi üzerine alır. Firestore üzerinde assignedTo güncellenir, startedAt zaman damgası kaydedilir ve arıza kartı yeşil neon kenarlıkla parlar.'
      },
      {
        id: 'multi_tech_collab',
        label: 'Çoklu Teknisyen Yardımlaşması',
        sublabel: 'Yardımcı Katıl / Ayrıl Döngüsü',
        type: 'process',
        actor: 'operator',
        x: 600,
        y: 750,
        width: 240,
        height: 70,
        codeFunction: 'joinAsHelper() / leaveHelper()',
        firestoreCollection: 'arizalar',
        description: 'İkinci bir teknisyen aynı makineye gelip QR okuttuğunda yardım olarak katılır (helpers array). Ayrıldığında süresi hesaplanıp loglanır.'
      },
      {
        id: 'intervention_form',
        label: 'Müdahale Formu & Durum Kararı',
        sublabel: 'Kapalı / Parça Bekliyor / Devredildi',
        type: 'decision',
        actor: 'operator',
        x: 390,
        y: 880,
        width: 260,
        height: 80,
        codeFunction: 'saveIntervention()',
        description: 'Teknisyen arızanın durumunu belirler: Arızayı Kapat, Parça Bekliyor, Vardiyaya Devret, Dış Servis Bekliyor veya Geçici Çözüm.'
      },
      {
        id: 'interim_status',
        label: 'Bekleme / Devir Havuzu',
        sublabel: 'Görevli ve Süre Sıfırlama',
        type: 'process',
        actor: 'system',
        x: 150,
        y: 1020,
        width: 240,
        height: 75,
        firestoreCollection: 'arizalar',
        description: 'Arıza "Parça Bekliyor" veya "Devredildi" olduğunda görevli silinir (FieldValue.delete()), böylece diğer vardiyadaki veya yeni teknisyen devralabilir.'
      },
      {
        id: 'close_fault',
        label: 'Kök Neden ile Arıza Kapatma',
        sublabel: 'Zorunlu Analiz ve Süre Hesabı',
        type: 'process',
        actor: 'operator',
        x: 610,
        y: 1020,
        width: 240,
        height: 75,
        codeFunction: 'saveIntervention() -> status: "Kapalı"',
        firestoreCollection: 'arizalar, weeklyStats',
        description: 'Arıza Kapatılırken Arıza Nedeni, Duruş Nedeni ve Yapılan İşlem zorunlu girilir. Toplam çalışma süresi hesaplanır ve haftalık istatistiklere işlenir.'
      },
      {
        id: 'daily_archive',
        label: 'Otomatik Günlük Arşivleme',
        sublabel: 'Google Sheets Aktarımı & Batch Delete',
        type: 'integration',
        actor: 'google',
        x: 610,
        y: 1160,
        width: 250,
        height: 75,
        codeFunction: 'autoExportPreviousDayFaults()',
        firestoreCollection: 'arizalar -> Google Sheets',
        description: 'Dünün kapatılmış arızaları Google Apps Script Web App üzerinden Excel / Google Sheets "arıza-giris" sekmesine 16 sütun olarak aktarılır ve Firestore\'dan temizlenir.'
      },
      {
        id: 'system_end',
        label: 'Arşiv Tamamlandı & Temiz Sistem',
        sublabel: 'Hafif Veritabanı & Raporlama Hazır',
        type: 'end',
        actor: 'system',
        x: 610,
        y: 1290,
        width: 250,
        height: 60,
        description: 'Sistem Firestore veritabanı boyutunu asgari düzeyde tutar; haftalık ve günlük teslim raporları WhatsApp ve PDF üzerinden paylaşılmaya hazırdır.'
      }
    ],
    edges: [
      { id: 'e1', from: 'start_fault', to: 'dashboard_listen', label: 'Firestore Snapshot' },
      { id: 'e2', from: 'op_login', to: 'dashboard_listen', label: 'Oturum Açıldı' },
      { id: 'e3', from: 'dashboard_listen', to: 'dec_qr_exempt', label: 'Arıza Kartına Tıklama' },
      { id: 'e4', from: 'dec_qr_exempt', to: 'direct_modal', label: 'Evet (Admin / Muaf)', variant: 'purple' },
      { id: 'e5', from: 'dec_qr_exempt', to: 'qr_scanner', label: 'Hayır (Normal Teknisyen)', variant: 'warning' },
      { id: 'e6', from: 'qr_scanner', to: 'fault_action_choice', label: 'Doğru QR Okundu', variant: 'success' },
      { id: 'e7', from: 'direct_modal', to: 'fault_action_choice', label: 'Doğrudan Seçim' },
      { id: 'e8', from: 'fault_action_choice', to: 'work_in_progress', label: 'Çalışmaya Başla', variant: 'success' },
      { id: 'e9', from: 'fault_action_choice', to: 'multi_tech_collab', label: 'Yardımcı Olarak Katıl', variant: 'purple' },
      { id: 'e10', from: 'work_in_progress', to: 'intervention_form', label: 'Müdahaleyi Bitir / Güncelle' },
      { id: 'e11', from: 'multi_tech_collab', to: 'intervention_form', label: 'Yardımcı Ayrıldı / Süre Logu' },
      { id: 'e12', from: 'intervention_form', to: 'interim_status', label: 'Parça Bekliyor / Devir / Geçici', variant: 'warning' },
      { id: 'e13', from: 'intervention_form', to: 'close_fault', label: 'Kapalı (Çözüldü)', variant: 'success' },
      { id: 'e14', from: 'interim_status', to: 'dashboard_listen', label: 'Havuza Düşer (Tekrar Açık)', dashed: true },
      { id: 'e15', from: 'close_fault', to: 'daily_archive', label: '1 Gün Sonra Otomatik Arşiv' },
      { id: 'e16', from: 'daily_archive', to: 'system_end', label: 'Firestore Batch Delete', variant: 'success' }
    ]
  },

  // 2. AUTH & RBAC FLOW (Giriş ve Yetkilendirme)
  {
    id: 'auth',
    title: '1. Giriş, Kimlik Doğrulama & Yetki Matrisi Akışı',
    subtitle: 'PIN girişi, Firebase config, Google Sheets ilk kurulum, Admin ayrıcalıkları ve QR muafiyet süre yönetimi',
    badge: 'Kimlik & Yetki (RBAC)',
    description: 'Operatörün sisteme güvenli erişimi, rol bazlı kontroller, çevrimdışı önbellek senkronizasyonu ve süreli QR muafiyet mekanizmasının detaylı mantığı.',
    nodes: [
      {
        id: 'auth_open',
        label: 'Sayfa Açılışı (DOMContentLoaded)',
        sublabel: 'Önbellek & Konfigürasyon Yükleme',
        type: 'start',
        actor: 'system',
        x: 400,
        y: 40,
        width: 250,
        height: 60,
        codeFunction: 'DOMContentLoaded dinleyicisi',
        description: 'Uygulama açıldığında Firebase config, makine sözlüğü ve operatör arayüz ayarları paralel olarak yüklenir.'
      },
      {
        id: 'auth_fetch_cfg',
        label: 'Firebase Ayarları Kontrolü',
        sublabel: 'doc(settings/config).get()',
        type: 'database',
        actor: 'firebase',
        x: 400,
        y: 140,
        width: 240,
        height: 70,
        codeFunction: 'fetchConfigFromFirebase()',
        description: 'Firestore settings/config dokümanı okunur: operators, rootCauses, faultReasons, stoppageReasons listeleri belleğe alınır.'
      },
      {
        id: 'auth_dec_empty',
        label: 'Firebase Veritabanı Boş mu?',
        sublabel: 'docSnap.exists Kontrolü',
        type: 'decision',
        actor: 'system',
        x: 390,
        y: 250,
        width: 260,
        height: 75,
        description: 'Eğer sistem ilk kez kuruluyorsa ve Firestore tamamen boşsa, otomatik olarak Google Sheets Web App linkine bağlanarak ilk kurulumu yapar.'
      },
      {
        id: 'auth_sync_sheets',
        label: 'Google Sheets İlk Kurulum',
        sublabel: 'GOOGLE_SCRIPT_URL Fetch',
        type: 'integration',
        actor: 'google',
        x: 150,
        y: 360,
        width: 240,
        height: 70,
        codeFunction: 'syncFromExcel()',
        description: 'Apps Script üzerinden Excel "veri" sekmesindeki operatörler, PINler, yetkiler ve kök neden listeleri Firestore\'a aktarılır.'
      },
      {
        id: 'auth_check_saved',
        label: 'Kayıtlı Oturum Var mı?',
        sublabel: 'localStorage("loggedInOperator")',
        type: 'decision',
        actor: 'system',
        x: 520,
        y: 360,
        width: 240,
        height: 75,
        codeFunction: 'checkSavedLogin()',
        description: 'Kullanıcının tarayıcısında önceden kaydedilmiş oturum aranır ve güncel operatör listesindeki PIN ile eşleştiği teyit edilir.'
      },
      {
        id: 'auth_pin_screen',
        label: 'PIN Giriş Ekranı',
        sublabel: 'Teknisyen 4 Haneli PIN Girer',
        type: 'process',
        actor: 'operator',
        x: 350,
        y: 480,
        width: 230,
        height: 70,
        codeFunction: 'login()',
        description: 'Kullanıcı PIN girer ve "GİRİŞ YAP" butonuna tıklar. PIN kodu operatör listesinde aranır.'
      },
      {
        id: 'auth_dec_role',
        label: 'Kullanıcı Yetki Tipi Nedir?',
        sublabel: 'opRole.includes("admin")',
        type: 'decision',
        actor: 'system',
        x: 400,
        y: 600,
        width: 250,
        height: 80,
        description: 'Kullanıcının rolü incelenir. "Admin", "Yönetici" veya "Şef" ise yetkili araçlar açılır; aksi halde normal operatör paneli açılır.'
      },
      {
        id: 'auth_admin_panel',
        label: 'Yönetici (Admin) Paneli',
        sublabel: 'Tam Denetim ve Menü Butonları',
        type: 'process',
        actor: 'admin',
        x: 200,
        y: 730,
        width: 240,
        height: 75,
        description: 'Admin kullanıcılara: Op Ayarları, Haftalık Rapor, Şimdi Aktar ve Sil, Canlı Mesaj İzleme ve Yeni Operatör Ekleme butonları görünür hale gelir.'
      },
      {
        id: 'auth_tech_panel',
        label: 'Saha Teknisyen Paneli',
        sublabel: 'Kişiselleştirilmiş Çalışma Alanı',
        type: 'process',
        actor: 'operator',
        x: 580,
        y: 730,
        width: 240,
        height: 75,
        description: 'Teknisyen kendi adını (kısaltılmış: Örn. E.Vardar), bugünkü bitirdiği iş sayısını ve süresini görür. Canlı arıza akışını izler.'
      },
      {
        id: 'auth_qr_exempt_rule',
        label: 'QR Muafiyet Kuralı',
        sublabel: 'qrExemptUntil Zaman Aşımı Denetimi',
        type: 'process',
        actor: 'system',
        x: 400,
        y: 860,
        width: 260,
        height: 70,
        description: 'Operatör düzenleme ekranından verilen geçici (1s, 3s, 24s) veya kalıcı (-1) QR muafiyet süresi her tıklamada milisaniye cinsinden kontrol edilir.'
      }
    ],
    edges: [
      { id: 'ae1', from: 'auth_open', to: 'auth_fetch_cfg' },
      { id: 'ae2', from: 'auth_fetch_cfg', to: 'auth_dec_empty' },
      { id: 'ae3', from: 'auth_dec_empty', to: 'auth_sync_sheets', label: 'Evet (İlk Kurulum)', variant: 'warning' },
      { id: 'ae4', from: 'auth_dec_empty', to: 'auth_check_saved', label: 'Hayır (Mevcut Veri)' },
      { id: 'ae5', from: 'auth_sync_sheets', to: 'auth_check_saved' },
      { id: 'ae6', from: 'auth_check_saved', to: 'auth_dec_role', label: 'Oturum Var', variant: 'success' },
      { id: 'ae7', from: 'auth_check_saved', to: 'auth_pin_screen', label: 'Oturum Yok' },
      { id: 'ae8', from: 'auth_pin_screen', to: 'auth_dec_role', label: 'PIN Doğrulandı', variant: 'success' },
      { id: 'ae9', from: 'auth_dec_role', to: 'auth_admin_panel', label: 'Admin / Yönetici', variant: 'purple' },
      { id: 'ae10', from: 'auth_dec_role', to: 'auth_tech_panel', label: 'Standart Teknisyen' },
      { id: 'ae11', from: 'auth_admin_panel', to: 'auth_qr_exempt_rule' },
      { id: 'ae12', from: 'auth_tech_panel', to: 'auth_qr_exempt_rule' }
    ]
  },

  // 3. QR & MACHINE VERIFICATION FLOW (QR ve Makine Eşleşmesi)
  {
    id: 'qr',
    title: '2. Saha Karekod Doğrulama & Makine Eşleşme Akışı',
    subtitle: 'Kamera taraması, AppSheet row link çözümlemesi, GViz JSONP makine sözlüğü ve güvenlik kontrolleri',
    badge: 'QR & Saha Doğrulama',
    description: 'Teknisyenin makine başında olduğunu fiziksel olarak garanti eden kamera ve karekod mekanizması. AppSheet URL parametrelerini otomatik makine adına dönüştürür.',
    nodes: [
      {
        id: 'qr_click_card',
        label: 'Arıza Kartına Tıklanır',
        sublabel: 'handleFaultClick(fault)',
        type: 'start',
        actor: 'operator',
        x: 400,
        y: 40,
        width: 240,
        height: 60,
        description: 'Operatör listedeki bir arızaya tıklar veya sağ üst menüden "Manuel QR Okut" seçeneğini seçer.'
      },
      {
        id: 'qr_check_bypass',
        label: 'QR Zorunluluğu Var mı?',
        sublabel: 'Admin veya qrExemptUntil > Now',
        type: 'decision',
        actor: 'system',
        x: 390,
        y: 140,
        width: 260,
        height: 75,
        description: 'Operatör Admin ise veya şeften alınmış süreli QR tıklama izni aktifse doğrudan arıza kartı açılır, kamera açılmaz.'
      },
      {
        id: 'qr_bypass_yes',
        label: 'Doğrudan Arıza Modalı Aç',
        sublabel: 'openFaultSelectionModal([fault])',
        type: 'process',
        actor: 'admin',
        x: 650,
        y: 250,
        width: 220,
        height: 65,
        description: 'Kamera açılmadan doğrudan o arızaya ait seçim ve müdahale ekranı açılır.'
      },
      {
        id: 'qr_cam_start',
        label: 'Html5Qrcode Kamera Başlat',
        sublabel: 'facingMode: "environment"',
        type: 'process',
        actor: 'operator',
        x: 220,
        y: 250,
        width: 240,
        height: 70,
        codeFunction: 'startQROnlyCamera(targetFault)',
        description: 'Kullanıcının telefonunda doğrudan ARKA KAMERA açılır. Galeri seçimine izin verilmez, canlı tarama mecburidir.'
      },
      {
        id: 'qr_scan_success',
        label: 'Karekod Başarıyla Okundu',
        sublabel: 'onScanSuccess(decodedText)',
        type: 'process',
        actor: 'system',
        x: 220,
        y: 360,
        width: 240,
        height: 70,
        description: 'Taranan metin yakalanır, kamera hemen durdurulur ve gizlenir.'
      },
      {
        id: 'qr_is_appsheet',
        label: 'AppSheet Linki mi?',
        sublabel: 'text.includes("row=")',
        type: 'decision',
        actor: 'system',
        x: 210,
        y: 470,
        width: 260,
        height: 75,
        description: 'Eski fabrika QR kodları AppSheet URL linki taşır (#row=ID). Sistem URL içindeki benzersiz row ID parametresini çeker.'
      },
      {
        id: 'qr_dict_lookup',
        label: 'Makine Sözlüğünde Ara',
        sublabel: 'machineDictionary[extractedId]',
        type: 'database',
        actor: 'system',
        x: 100,
        y: 590,
        width: 230,
        height: 70,
        description: 'Google Visualization API (GViz JSONP) ile Google Sheets tablosundan önbelleğe alınmış makine sözlüğünde ID aranır.'
      },
      {
        id: 'qr_match_verify',
        label: 'Makine Arıza ile Eşleşiyor mu?',
        sublabel: 'scannedMachine == fault.machine',
        type: 'decision',
        actor: 'system',
        x: 370,
        y: 700,
        width: 260,
        height: 80,
        description: 'Taranan makinenin adı ile tıklanan arıza kartındaki makine adı karşılaştırılır.'
      },
      {
        id: 'qr_error_alert',
        label: 'Hata Uyarısı Ver',
        sublabel: '"❌ Yanlış Makine Karekodu!"',
        type: 'alert',
        actor: 'system',
        x: 150,
        y: 820,
        width: 230,
        height: 65,
        description: 'Kullanıcıya tıkladığı makine ile okuttuğu makinenin uyuşmadığı bildirilir. İşlem iptal edilir.'
      },
      {
        id: 'qr_open_selection',
        label: 'O Makinenin Açık Arızaları Açılır',
        sublabel: 'openFaultSelectionModal(faults)',
        type: 'end',
        actor: 'operator',
        x: 520,
        y: 820,
        width: 250,
        height: 70,
        description: 'Eşleşme başarılı! İlgili makinedeki tüm bekleyen açık arızalar listelenir ve müdahaleye hazır hale gelir.'
      }
    ],
    edges: [
      { id: 'qe1', from: 'qr_click_card', to: 'qr_check_bypass' },
      { id: 'qe2', from: 'qr_check_bypass', to: 'qr_bypass_yes', label: 'Evet (Admin / Muaf)', variant: 'purple' },
      { id: 'qe3', from: 'qr_check_bypass', to: 'qr_cam_start', label: 'Hayır (Saha Kamerası)', variant: 'warning' },
      { id: 'qe4', from: 'qr_cam_start', to: 'qr_scan_success' },
      { id: 'qe5', from: 'qr_scan_success', to: 'qr_is_appsheet' },
      { id: 'qe6', from: 'qr_is_appsheet', to: 'qr_dict_lookup', label: 'AppSheet Linki', variant: 'warning' },
      { id: 'qe7', from: 'qr_is_appsheet', to: 'qr_match_verify', label: 'Düz Makine Adı' },
      { id: 'qe8', from: 'qr_dict_lookup', to: 'qr_match_verify', label: 'Makine Adı Bulundu' },
      { id: 'qe9', from: 'qr_match_verify', to: 'qr_error_alert', label: 'Uyuşmuyor (Hata)', variant: 'danger' },
      { id: 'qe10', from: 'qr_match_verify', to: 'qr_open_selection', label: 'Doğru Makine!', variant: 'success' },
      { id: 'qe11', from: 'qr_bypass_yes', to: 'qr_open_selection' }
    ]
  },

  // 4. INTERVENTION & MULTI-TECH STATE MACHINE (Müdahale ve Çoklu Teknisyen)
  {
    id: 'intervention',
    title: '3. Müdahale & Çoklu Teknisyen Durum Makinesi',
    subtitle: 'Ana görevli, yardımcı bakımcı katılımı, ayrılış süresi hesabı, parça bekleme ve vardiya devri döngüsü',
    badge: 'Durum Makinesi (State Machine)',
    description: 'Bir arızanın açık durumdan başlayarak birden fazla teknisyenin eşzamanlı katılımı ve geçiş durumlarını (Parça Bekliyor, Devredildi vb.) yöneten çekirdek durum makinesi.',
    nodes: [
      {
        id: 'st_state_open',
        label: 'AÇIK (Müdahale Bekliyor)',
        sublabel: 'status: "Açık" / assignedTo: null',
        type: 'start',
        actor: 'system',
        x: 400,
        y: 40,
        width: 250,
        height: 60,
        description: 'Arıza açılmış ancak henüz hiçbir teknisyen müdahale etmemiştir. Kart turuncu/kırmızı alev simgesiyle gösterilir.'
      },
      {
        id: 'st_btn_start',
        label: '"Çalışmaya Başla" Tıklanır',
        sublabel: 'SweetAlert Onayı ile Başlatma',
        type: 'process',
        actor: 'operator',
        x: 400,
        y: 140,
        width: 240,
        height: 65,
        codeFunction: 'startWork(faultId)',
        description: 'Teknisyene onay sorulur. Onay verildiğinde Firestore belgesi güncellenir.'
      },
      {
        id: 'st_state_progress',
        label: 'MÜDAHALE EDİLİYOR',
        sublabel: 'assignedTo: op.name, startedAt: ISO',
        type: 'process',
        actor: 'operator',
        x: 400,
        y: 250,
        width: 250,
        height: 70,
        description: 'Arıza ana sorumluya zimmetlenmiştir. Kartta "MÜDAHALE EDİLİYOR (Engin Vardar)" etiketi ve neon yeşil gösterge belirir.'
      },
      {
        id: 'st_dec_who',
        label: 'Yeni Tıklayan Kim?',
        sublabel: 'fault.assignedTo == loggedInOperator',
        type: 'decision',
        actor: 'system',
        x: 390,
        y: 370,
        width: 260,
        height: 80,
        description: 'Kart başka birisi veya ana görevli tarafından tıklandığında kimliğe göre uygun butonlar gösterilir.'
      },
      {
        id: 'st_primary_action',
        label: 'Ana Görevli: "Müdahaleyi Bitir / Güncelle"',
        sublabel: 'openInterventionForm(fault)',
        type: 'process',
        actor: 'operator',
        x: 180,
        y: 500,
        width: 240,
        height: 70,
        description: 'Ana sorumlu müdahale sonucunu seçmek için formu açar: Kapalı, Parça Bekliyor, Devredildi, Dış Servis veya Geçici Çözüm.'
      },
      {
        id: 'st_dec_helper',
        label: '2. Teknisyen Zaten Yardımcı mı?',
        sublabel: 'helpers.includes(loggedInOperator.name)',
        type: 'decision',
        actor: 'system',
        x: 600,
        y: 500,
        width: 260,
        height: 75,
        description: 'Başka bir teknisyen arızaya tıkladığında daha önce yardımcı olarak katılıp katılmadığı kontrol edilir.'
      },
      {
        id: 'st_join_helper',
        label: 'Yardımcı Olarak Katıl',
        sublabel: 'arrayUnion(helpers) + joinLog',
        type: 'process',
        actor: 'operator',
        x: 480,
        y: 630,
        width: 230,
        height: 70,
        codeFunction: 'joinAsHelper(faultId)',
        description: 'İkinci teknisyen yardımcı bakımcı olarak eklenir. Katıldığı anın zaman damgası interventions dizisine yazılır.'
      },
      {
        id: 'st_leave_helper',
        label: 'Bakımdan Ayrıl',
        sublabel: 'arrayRemove(helpers) + durationMin',
        type: 'process',
        actor: 'operator',
        x: 730,
        y: 630,
        width: 230,
        height: 70,
        codeFunction: 'leaveHelper(faultId)',
        description: 'Yardımcı teknisyen işi bıraktığında katıldığı andan itibaren geçen dakika hesaplanır ve "Yardımdan ayrıldı (X dk)" olarak loglanır.'
      },
      {
        id: 'st_status_wait',
        label: 'PARÇA BEKLİYOR / DEVREDİLDİ / DIŞ SERVİS',
        sublabel: 'assignedTo & helpers Sıfırlanır',
        type: 'process',
        actor: 'system',
        x: 100,
        y: 650,
        width: 250,
        height: 75,
        description: 'Parça bekleniyorsa veya vardiya devredilmişse arıza havuzda beklemeye geçer. Görevliler serbest kalır.'
      },
      {
        id: 'st_takeover',
        label: 'Parça Geldi / İşi Devral',
        sublabel: 'Yeni Teknisyen Başlar',
        type: 'process',
        actor: 'operator',
        x: 100,
        y: 800,
        width: 240,
        height: 70,
        description: 'Yeni gelen veya parça geldiğinde butona basan yeni teknisyen arızanın yeni ana sorumlusu olur ve süre yeniden işlemeye başlar.'
      },
      {
        id: 'st_state_closed',
        label: 'KAPALI (Çözüldü ve Bitti)',
        sublabel: 'completedAt: ISO, completedBy: name',
        type: 'end',
        actor: 'operator',
        x: 400,
        y: 800,
        width: 240,
        height: 65,
        description: 'Arıza başarıyla çözülerek kapatılır. Bakım ve duruş süreleri kesinleşir.'
      }
    ],
    edges: [
      { id: 'se1', from: 'st_state_open', to: 'st_btn_start' },
      { id: 'se2', from: 'st_btn_start', to: 'st_state_progress', label: 'Başlatıldı', variant: 'success' },
      { id: 'se3', from: 'st_state_progress', to: 'st_dec_who' },
      { id: 'se4', from: 'st_dec_who', to: 'st_primary_action', label: 'Ana Görevli', variant: 'success' },
      { id: 'se5', from: 'st_dec_who', to: 'st_dec_helper', label: 'Diğer Teknisyen', variant: 'purple' },
      { id: 'se6', from: 'st_dec_helper', to: 'st_join_helper', label: 'Katılmamış', variant: 'purple' },
      { id: 'se7', from: 'st_dec_helper', to: 'st_leave_helper', label: 'Zaten Yardımcı', variant: 'warning' },
      { id: 'se8', from: 'st_primary_action', to: 'st_status_wait', label: 'Bekleme / Devir', variant: 'warning' },
      { id: 'se9', from: 'st_primary_action', to: 'st_state_closed', label: 'Arızayı Kapat', variant: 'success' },
      { id: 'se10', from: 'st_status_wait', to: 'st_takeover', label: 'Parça Geldiğinde' },
      { id: 'se11', from: 'st_takeover', to: 'st_state_progress', label: 'Yeni Sahip Atandı', variant: 'success' }
    ]
  },

  // 5. ROOT CAUSE & CLOSURE FLOW (Kök Neden & Kapanış)
  {
    id: 'closure',
    title: '4. Kök Neden Analizi & Arıza Kapatma Akışı',
    subtitle: 'Zorunlu form kontrolleri, duruş süresi hesaplaması, yardımcı logları ve haftalık istatistik güncellemesi',
    badge: 'Kök Neden & Kapanış',
    description: 'Arıza kapatılırken verilerin doğrulanması, ana sorumlu ve tüm yardımcı bakımcıların çalışma sürelerinin ayrıştırılarak kaydedilmesi mantığı.',
    nodes: [
      {
        id: 'cl_click_finish',
        label: 'Müdahale Formu Açılır',
        sublabel: 'openInterventionForm(fault)',
        type: 'start',
        actor: 'operator',
        x: 400,
        y: 40,
        width: 240,
        height: 60,
        description: 'Teknisyen "Arızaya Müdahale" penceresini açar.'
      },
      {
        id: 'cl_select_status',
        label: 'Durum Seçimi: "Kapalı"',
        sublabel: 'radio: [x] Arızayı Kapat (Çözüldü)',
        type: 'process',
        actor: 'operator',
        x: 400,
        y: 140,
        width: 240,
        height: 65,
        description: 'Radyo butonundan "Kapalı" seçildiğinde kök neden ve duruş nedeni açılır kutuları (dropdown) görünür hale gelir.'
      },
      {
        id: 'cl_validation',
        label: 'Zorunlu Alan Doğrulaması',
        sublabel: 'İşlem, Arıza Nedeni, Duruş Nedeni',
        type: 'decision',
        actor: 'system',
        x: 380,
        y: 250,
        width: 280,
        height: 80,
        description: 'Yapılan İşlem metni, Arıza Nedeni ve Duruş Nedeni seçilmiş mi kontrol edilir.'
      },
      {
        id: 'cl_val_fail',
        label: 'Eksik Alan Uyarısı',
        sublabel: '"⚠️ Lütfen alanları doldurun!"',
        type: 'alert',
        actor: 'system',
        x: 140,
        y: 370,
        width: 230,
        height: 65,
        description: 'Zorunlu alanlar doldurulmadan arızanın kapatılmasına izin verilmez.'
      },
      {
        id: 'cl_calc_duration',
        label: 'Çalışma Süresi Hesabı',
        sublabel: 'Math.round((endTime - startedAt) / 60000)',
        type: 'process',
        actor: 'system',
        x: 520,
        y: 370,
        width: 260,
        height: 70,
        description: 'Ana operatörün işe başladığı andan itibaren geçen süre dakika cinsinden hesaplanır (en az 1 dk).'
      },
      {
        id: 'cl_calc_helpers',
        label: 'Yardımcıların Süre Logları',
        sublabel: 'Her Yardımcıya Ayrı intervention Kaydı',
        type: 'process',
        actor: 'system',
        x: 520,
        y: 480,
        width: 260,
        height: 75,
        description: 'Arızada kayıtlı tüm yardımcı teknisyenler taranır, her birinin katıldığı süreden itibaren geçen dakika tek tek hesaplanır.'
      },
      {
        id: 'cl_write_firestore',
        label: 'Firestore Belgesi Güncellenir',
        sublabel: 'updateData + arrayUnion(...allNewLogs)',
        type: 'database',
        actor: 'firebase',
        x: 400,
        y: 600,
        width: 260,
        height: 80,
        firestoreCollection: 'arizalar',
        description: 'completedAt, completedBy, faultReason, stoppageReason, actionTaken, partsChanged ve tüm loglar Firestore\'a kaydedilir.'
      },
      {
        id: 'cl_update_weekly',
        label: 'Haftalık İstatistikler Güncellenir',
        sublabel: 'updateWeeklyStats(op, mins, isHelper)',
        type: 'database',
        actor: 'firebase',
        x: 400,
        y: 730,
        width: 260,
        height: 75,
        firestoreCollection: 'settings/weeklyStats',
        description: 'İlgili günün hanesine (Pzt, Salı...) operatörlerin çalışma dakikaları ve iş adetleri eklenir.'
      },
      {
        id: 'cl_header_badge',
        label: 'Üst Başlık Sayacı Güncellenir',
        sublabel: '"(Bugün 3 iş - 1s 45d)"',
        type: 'end',
        actor: 'operator',
        x: 400,
        y: 850,
        width: 250,
        height: 65,
        codeFunction: 'updateDailyStatsHeader()',
        description: 'Teknisyenin üst menüdeki günlük bitirdiği iş ve toplam çalışma saati anında yenilenir.'
      }
    ],
    edges: [
      { id: 'ce1', from: 'cl_click_finish', to: 'cl_select_status' },
      { id: 'ce2', from: 'cl_select_status', to: 'cl_validation' },
      { id: 'ce3', from: 'cl_validation', to: 'cl_val_fail', label: 'Eksik Alan Var', variant: 'danger' },
      { id: 'ce4', from: 'cl_validation', to: 'cl_calc_duration', label: 'Tüm Alanlar Dolu', variant: 'success' },
      { id: 'ce5', from: 'cl_val_fail', to: 'cl_click_finish', dashed: true },
      { id: 'ce6', from: 'cl_calc_duration', to: 'cl_calc_helpers' },
      { id: 'ce7', from: 'cl_calc_helpers', to: 'cl_write_firestore' },
      { id: 'ce8', from: 'cl_write_firestore', to: 'cl_update_weekly' },
      { id: 'ce9', from: 'cl_update_weekly', to: 'cl_header_badge', variant: 'success' }
    ]
  },

  // 6. EXCEL & DAILY ARCHIVE FLOW (Google Sheets ve Günlük Arşivleme)
  {
    id: 'archive',
    title: '5. Google Sheets Arşivleme & Veritabanı Temizlik Akışı',
    subtitle: 'Günlük otomatik tetikleyici, 16 sütunlu veri dönüştürme, Apps Script Web App ve Firestore Batch Delete',
    badge: 'Arşivleme & Google Sheets',
    description: '1 gün öncesinde kapatılmış arızaların Google Sheets "arıza-giris" tablosuna aktarılması ve Firestore veritabanından kalıcı olarak silinmesi süreci.',
    nodes: [
      {
        id: 'ar_trigger',
        label: 'Günlük Arşiv Kontrolü',
        sublabel: 'checkDailySync() / Şimdi Aktar Butonu',
        type: 'start',
        actor: 'system',
        x: 400,
        y: 40,
        width: 260,
        height: 60,
        description: 'Her yeni gün girişinde otomatik olarak veya Admin tarafından manuel tetiklenir.'
      },
      {
        id: 'ar_query_closed',
        label: 'Dünden Kalan Kapalı Arızaları Tara',
        sublabel: 'status == "Kapalı" && completedAt != today',
        type: 'database',
        actor: 'firebase',
        x: 400,
        y: 140,
        width: 270,
        height: 70,
        description: 'Bugün kapatılanlar gün sonuna kadar panelde tutulur. 1 gün geçmiş kapalı kayıtlar seçilir.'
      },
      {
        id: 'ar_dec_any',
        label: 'Aktarılacak Kayıt Var mı?',
        sublabel: 'docIdsToDelete.length > 0',
        type: 'decision',
        actor: 'system',
        x: 400,
        y: 250,
        width: 250,
        height: 75,
        description: 'Eski kapalı arıza bulunup bulunmadığı kontrol edilir.'
      },
      {
        id: 'ar_no_records',
        label: 'İşlem Gerekmiyor',
        sublabel: 'Sessizce çıkılır',
        type: 'end',
        actor: 'system',
        x: 150,
        y: 360,
        width: 200,
        height: 60,
        description: 'Sistem günceldir, gereksiz API isteği atılmaz.'
      },
      {
        id: 'ar_format_16_cols',
        label: '16 Sütunlu Excel Formatına Dönüştür',
        sublabel: 'A\'dan P\'ye Standart Tablo Şeması',
        type: 'process',
        actor: 'system',
        x: 520,
        y: 360,
        width: 270,
        height: 80,
        description: 'Başlangıç Tarihi, Bildiren, Masraf Merkezi, Makine, Vardiya, Tür, Açıklama, Bakım Logu, Bitiş Tarihi, Saatler, Duruş Süresi, Nedenler, Yapılan İşlem, Değişen Parça.'
      },
      {
        id: 'ar_post_sheets',
        label: 'Google Apps Script POST İsteği',
        sublabel: '{ action: "exportClosedFaults", data }',
        type: 'integration',
        actor: 'google',
        x: 520,
        y: 490,
        width: 270,
        height: 75,
        codeFunction: 'fetch(GOOGLE_SCRIPT_URL, POST)',
        description: 'Google E-Tablolar Web App makrosuna JSON yükü iletilir. Satırlar Google Sheets\'e alt alta eklenir.'
      },
      {
        id: 'ar_batch_delete',
        label: 'Firestore Batch Delete İle Sil',
        sublabel: 'batch.delete(docRef) + batch.commit()',
        type: 'database',
        actor: 'firebase',
        x: 520,
        y: 620,
        width: 270,
        height: 75,
        description: 'Excel\'e yazma başarılı olduktan sonra Firestore batch silme işlemi ile belgeler temizlenir.'
      },
      {
        id: 'ar_complete',
        label: 'Arşivleme Başarıyla Tamamlandı',
        sublabel: 'Hafif & Hızlı Firestore Veritabanı',
        type: 'end',
        actor: 'system',
        x: 520,
        y: 750,
        width: 270,
        height: 60,
        description: 'Tüm eski veriler güvenle kurumsal Excel dosyasında saklanır; mobil uygulama hızlı kalır.'
      }
    ],
    edges: [
      { id: 'are1', from: 'ar_trigger', to: 'ar_query_closed' },
      { id: 'are2', from: 'ar_query_closed', to: 'ar_dec_any' },
      { id: 'are3', from: 'ar_dec_any', to: 'ar_no_records', label: 'Kayıt Yok' },
      { id: 'are4', from: 'ar_dec_any', to: 'ar_format_16_cols', label: 'Eski Kayıtlar Var', variant: 'success' },
      { id: 'are5', from: 'ar_format_16_cols', to: 'ar_post_sheets' },
      { id: 'are6', from: 'ar_post_sheets', to: 'ar_batch_delete', label: 'Sheets Onayı Alındı', variant: 'success' },
      { id: 'are7', from: 'ar_batch_delete', to: 'ar_complete', variant: 'success' }
    ]
  },

  // 7. MESSAGING & REPORTING FLOW (Mesajlaşma ve Raporlama)
  {
    id: 'messaging',
    title: '6. P2P Mesajlaşma, WhatsApp & Haftalık Rapor Akışı',
    subtitle: 'Canlı bildirim banner sistemi, sesli uyarı, WhatsApp teslim mesajı ve html2pdf PDF üretimi',
    badge: 'İletişim & Raporlar',
    description: 'Operatörler arası anlık mesajlaşma, okunma teyitleri, admin gözetim modu, vardiya teslim WhatsApp raporu ve haftalık operasyonel rapor mekanizması.',
    nodes: [
      {
        id: 'msg_start',
        label: 'İletişim & Raporlama Modülü',
        sublabel: 'Operatörler Arası İletişim',
        type: 'start',
        actor: 'operator',
        x: 400,
        y: 40,
        width: 240,
        height: 60,
        description: 'Teknisyenler arası hızlı haberleşme ve vardiya teslim özetleri.'
      },
      {
        id: 'msg_send_modal',
        label: 'Mesaj Gönderme Penceresi',
        sublabel: 'Herkese Gönder veya Tek Tek Seç',
        type: 'process',
        actor: 'operator',
        x: 180,
        y: 150,
        width: 240,
        height: 70,
        codeFunction: 'submitSendMessage()',
        firestoreCollection: 'messages',
        description: 'Kullanıcı mesaj yazar, alıcıları seçer ve Firestore "messages" koleksiyonuna ekler.'
      },
      {
        id: 'msg_listen_banner',
        label: 'Canlı Mesaj Banner & Sesli Çalma',
        sublabel: 'AudioContext + readBy Güncellemesi',
        type: 'process',
        actor: 'system',
        x: 180,
        y: 280,
        width: 240,
        height: 75,
        codeFunction: 'listenForMessages()',
        description: 'Alıcı teknisyenin ekranının üstünde yeşil WhatsApp stili kayan banner çıkar, uyarı melodisi çalar ve "Cevapla / Okudum" butonları sunulur.'
      },
      {
        id: 'msg_admin_monitor',
        label: 'Admin Hayalet İzleme Modu',
        sublabel: 'openAdminMessageMonitor()',
        type: 'process',
        actor: 'admin',
        x: 180,
        y: 410,
        width: 240,
        height: 70,
        description: 'Adminler sistemdeki tüm mesajları, kimin kime yazdığını ve okuyanları canlı izleyebilir, tek tek veya topluca silebilir.'
      },
      {
        id: 'rep_whatsapp',
        label: 'Vardiya Sonu WhatsApp Raporu',
        sublabel: 'generateWhatsAppReport()',
        type: 'integration',
        actor: 'operator',
        x: 600,
        y: 150,
        width: 240,
        height: 75,
        description: 'Bugün kapatılan işler, operatör çalışma süreleri ve diğer vardiyaya kalan açık arızalar taranarak formatlı WhatsApp teslim metni oluşturulur.'
      },
      {
        id: 'rep_weekly_grid',
        label: 'Haftalık Operatör Tablosu',
        sublabel: 'Pzt-Paz Matrisi & Senkronizasyon',
        type: 'process',
        actor: 'admin',
        x: 600,
        y: 280,
        width: 240,
        height: 75,
        codeFunction: 'openWeeklyReportModal()',
        firestoreCollection: 'settings/weeklyStats',
        description: 'Tüm operatörlerin 7 günlük çalışma süreleri ve iş adetleri matris halinde tabloda gösterilir.'
      },
      {
        id: 'rep_pdf_export',
        label: 'Haftalık Rapor PDF İndir',
        sublabel: 'html2pdf.js ile A3 Yatay PDF',
        type: 'end',
        actor: 'admin',
        x: 600,
        y: 410,
        width: 240,
        height: 70,
        codeFunction: 'exportReportToPDF()',
        description: 'Tablo kurumsal başlık ve tarih damgasıyla doğrudan PDF formatında dışa aktarılır.'
      }
    ],
    edges: [
      { id: 'me1', from: 'msg_start', to: 'msg_send_modal', label: 'Anlık Mesaj' },
      { id: 'me2', from: 'msg_send_modal', to: 'msg_listen_banner', label: 'Firestore Dinleme', variant: 'success' },
      { id: 'me3', from: 'msg_listen_banner', to: 'msg_admin_monitor', label: 'Admin Denetimi', variant: 'purple' },
      { id: 'me4', from: 'msg_start', to: 'rep_whatsapp', label: 'Vardiya Teslimi', variant: 'success' },
      { id: 'me5', from: 'msg_start', to: 'rep_weekly_grid', label: 'Haftalık Analiz' },
      { id: 'me6', from: 'rep_weekly_grid', to: 'rep_pdf_export', label: 'PDF Dışa Aktar', variant: 'purple' }
    ]
  }
];

export const SIMULATION_SCENARIOS: SimulationScenario[] = [
  {
    id: 'scen_normal_repair',
    title: 'Senaryo A: Teknisyenin Sahada QR ile Arıza Kapatması',
    description: 'Normal bakım teknisyeni PIN girer, panodan arızayı seçer, sahadaki makine QR kodunu okutur, çalışmayı başlatır ve kök neden girerek arızayı tamamlar.',
    role: 'Engin Vardar (Teknisyen)',
    steps: [
      {
        nodeId: 'op_login',
        actionTitle: '1. PIN Kodu Girildi (1234)',
        stateChange: 'loggedInOperator = { name: "Engin Vardar", role: "Teknisyen" }',
        systemLog: 'Engin Vardar başarıyla giriş yaptı. Dashboard yüklendi.'
      },
      {
        nodeId: 'dashboard_listen',
        actionTitle: '2. "KOMPRESÖR KAİSER" Arızası Seçildi',
        stateChange: 'Arıza: Mekanik, Durum: "Açık", Makine: "KOMPRESÖR KAİSER"',
        systemLog: 'Firestore dinleyicisinden arıza seçildi. QR kontrolü tetiklendi.'
      },
      {
        nodeId: 'dec_qr_exempt',
        actionTitle: '3. QR Zorunluluğu Kontrol Edildi',
        stateChange: 'Admin: Hayır, QR Muafiyeti: Yok -> Kamera Zorunlu',
        systemLog: 'Operatör normal teknisyen olduğu için arka kamera (Html5Qrcode) açıldı.'
      },
      {
        nodeId: 'qr_scanner',
        actionTitle: '4. Makinedeki Karekod Okutuldu',
        stateChange: 'Okunan: "KOMPRESÖR KAİSER" -> Doğrulama Başarılı',
        systemLog: 'Kamera kapatıldı. Doğru makine onaylandı, arıza seçim modalı açıldı.'
      },
      {
        nodeId: 'work_in_progress',
        actionTitle: '5. "Çalışmaya Başla" Tıklandı',
        stateChange: 'status: "Müdahale Ediliyor", assignedTo: "Engin Vardar", startedAt: 10:15',
        systemLog: 'Firestore güncellendi. Kart neon yeşil çerçeveyle parladı.'
      },
      {
        nodeId: 'intervention_form',
        actionTitle: '6. Müdahale Tamamlandı & Kök Neden Seçildi',
        stateChange: 'Arıza Nedeni: "Mekanik Aşınma", Duruş Nedeni: "Rulman Dağılması"',
        systemLog: 'Yapılan işlem ve değişen parçalar forma yazıldı.'
      },
      {
        nodeId: 'close_fault',
        actionTitle: '7. "Kaydet ve Kapat" ile Arıza Kapatıldı',
        stateChange: 'status: "Kapalı", completedBy: "Engin Vardar", süre: 45 dk',
        systemLog: 'Arıza başarıyla kapatıldı. Haftalık istatistik ve üst sayaç güncellendi.'
      }
    ]
  },
  {
    id: 'scen_multi_tech',
    title: 'Senaryo B: Çoklu Teknisyen Yardımlaşması (Yardımcı Katıl & Ayrıl)',
    description: 'Engin çalışırken Ahmet QR okutarak yardımcı bakımcı olarak katılır. 30 dakika sonra işi bırakıp ayrılır, süreleri ayrı ayrı loglanır.',
    role: 'Ahmet Yılmaz (Yardımcı Teknisyen)',
    steps: [
      {
        nodeId: 'dashboard_listen',
        actionTitle: '1. Ahmet Sisteme Giriş Yapar',
        stateChange: 'loggedInOperator = "Ahmet Yılmaz"',
        systemLog: 'Ahmet panoda "Müdahale Ediliyor (Engin Vardar)" kartını görür.'
      },
      {
        nodeId: 'qr_scanner',
        actionTitle: '2. Ahmet Makinedeki QR Kodu Okutur',
        stateChange: 'Makine Doğrulandı: "PRES HATTI 2"',
        systemLog: 'Doğrulandı. Engin ana sorumlu olduğu için "Yardımcı Olarak Katıl" butonu belirdi.'
      },
      {
        nodeId: 'multi_tech_collab',
        actionTitle: '3. "Yardımcı Olarak Katıl" Onaylandı',
        stateChange: 'helpers: ["Ahmet Yılmaz"], log: "Yardıma katıldı (11:00)"',
        systemLog: 'Firestore arrayUnion ile Ahmet yardımcılar listesine eklendi.'
      },
      {
        nodeId: 'multi_tech_collab',
        actionTitle: '4. Ahmet İşi Bitirip "Bakımdan Ayrıl" Tıklar',
        stateChange: 'helpers: [], log: "Yardımdan ayrıldı ( 35 dk )"',
        systemLog: 'Ahmet 35 dakika yardım etti ve başarıyla ayrıldı. Engin çalışmaya devam ediyor.'
      }
    ]
  },
  {
    id: 'scen_part_waiting',
    title: 'Senaryo C: Yedek Parça Bekleme & Vardiya Devri',
    description: 'Rulman depoda bulunamadığı için arıza "Parça Bekliyor" durumuna alınır, teknisyen serbest kalır ve parça gelince sonraki vardiya devralır.',
    role: 'Engin Vardar (Teknisyen)',
    steps: [
      {
        nodeId: 'work_in_progress',
        actionTitle: '1. Arıza İncelendi, Parça Gerekli',
        stateChange: 'status: "Müdahale Ediliyor"',
        systemLog: 'Depoda uygun conta bulunamadı, sipariş açıldı.'
      },
      {
        nodeId: 'intervention_form',
        actionTitle: '2. Durum "Parça Bekliyor" Seçildi',
        stateChange: 'Radyo Butonu: "📦 Yedek Parça Bekliyor"',
        systemLog: 'Form kaydedilmek üzere hazırlandı.'
      },
      {
        nodeId: 'interim_status',
        actionTitle: '3. Sorumluluk Sıfırlandı & Havuza Alındı',
        stateChange: 'status: "Parça Bekliyor", assignedTo: SILINDI, startedAt: SILINDI',
        systemLog: 'Arıza havuza düştü. Engin başka işlere geçebilir.'
      },
      {
        nodeId: 'dashboard_listen',
        actionTitle: '4. Parça Geldiğinde Mehmet İşi Devralır',
        stateChange: 'Yeni Buton: "Parça Geldi / İşi Devral"',
        systemLog: 'Mehmet arızayı üzerine alarak süreyi yeniden başlattı.'
      }
    ]
  },
  {
    id: 'scen_admin_remote',
    title: 'Senaryo D: Admin Uzaktan Görevli Atama & QR Muafiyeti',
    description: 'Yönetici ofisinden QR okutmadan bir arızaya tıklar, operatör atar veya operatöre 3 saatlik QR tıklama izni verir.',
    role: 'Akif Bey (Bakım Yöneticisi - Admin)',
    steps: [
      {
        nodeId: 'op_login',
        actionTitle: '1. Admin PIN ile Giriş Yapar',
        stateChange: 'role: "Admin" -> Tüm Yönetici Araçları Açık',
        systemLog: 'Admin tespit edildi. Üst menüde özel yetkiler etkinleşti.'
      },
      {
        nodeId: 'dec_qr_exempt',
        actionTitle: '2. Arızaya Tıklar (Kamera Açılmaz)',
        stateChange: 'Admin Kontrolü: EVET -> QR Bypass Edildi',
        systemLog: 'Kamera pas geçildi, doğrudan arıza penceresi açıldı.'
      },
      {
        nodeId: 'direct_modal',
        actionTitle: '3. Açılır Listeden "Mehmet Kaya" Atanır',
        stateChange: 'db.collection("arizalar").update({ assignedTo: "Mehmet Kaya" })',
        systemLog: 'Mehmet Kaya arızaya atandı. Mehmet\'in ekranında görev belirdi.'
      },
      {
        nodeId: 'auth_qr_exempt_rule',
        actionTitle: '4. Mehmet\'e 3 Saatlik QR Muafiyeti Verilir',
        stateChange: 'qrExemptUntil = Date.now() + 3 Saat',
        systemLog: 'Mehmet 3 saat boyunca sahada QR okutmadan işi başlatabilir.'
      }
    ]
  },
  {
    id: 'scen_daily_archive',
    title: 'Senaryo E: Gece / Gün Sonu Otomatik Excel Arşivleme',
    description: 'Önceki gün kapatılmış olan tüm arıza kayıtları toplanır, 16 sütunlu Google Sheets formatına çevrilir ve Firestore veritabanından silinir.',
    role: 'Sistem Arka Plan Servisi (Automated Task)',
    steps: [
      {
        nodeId: 'ar_trigger',
        actionTitle: '1. Yeni Gün Girişi Algılandı',
        stateChange: 'localStorage("lastAutoExportDate") != Bugün',
        systemLog: 'Yeni gün tespit edildi. Arşiv kontrolü başlatıldı.'
      },
      {
        nodeId: 'ar_query_closed',
        actionTitle: '2. Dünün Kapanan 8 Arızası Tespit Edildi',
        stateChange: 'completedAt < Bugün, status == "Kapalı"',
        systemLog: 'Bugünün işlerine dokunulmadı, dünün 8 kaydı ayrıştırıldı.'
      },
      {
        nodeId: 'ar_format_16_cols',
        actionTitle: '3. Sütunlar A-P Arası Formatlandı',
        stateChange: 'Tarih, Makine, Vardiya, Bakım Logu, Duruş Süresi vb.',
        systemLog: 'Teknisyenlerin dakika süreleri ve bakım açıklamaları birleştirildi.'
      },
      {
        nodeId: 'ar_post_sheets',
        actionTitle: '4. Google Sheets Apps Script\'e Gönderildi',
        stateChange: 'POST GOOGLE_SCRIPT_URL -> 200 OK',
        systemLog: 'Google E-Tablolar "arıza-giris" sekmesine 8 satır eklendi.'
      },
      {
        nodeId: 'ar_batch_delete',
        actionTitle: '5. Firestore\'dan 8 Belge Batch Commit ile Silindi',
        stateChange: 'batch.delete(...) -> Firestore Hafifletildi',
        systemLog: 'Tüm eski kayıtlar güvenle Excel\'de! Firestore kotası korundu.'
      }
    ]
  }
];
