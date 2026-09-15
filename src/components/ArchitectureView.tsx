import React, { useState } from 'react';
import { 
  Database, 
  Server, 
  Smartphone, 
  Cloud, 
  Share2, 
  FileSpreadsheet, 
  ArrowDown, 
  Code, 
  Check, 
  Copy,
  Table
} from 'lucide-react';
import { FIRESTORE_COLLECTIONS, GOOGLE_SHEETS_COLUMNS } from '../data/schemaData';

export const ArchitectureView: React.FC = () => {
  const [copiedCollection, setCopiedCollection] = useState<string | null>(null);

  const copyJson = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCollection(id);
    setTimeout(() => setCopiedCollection(null), 2000);
  };

  return (
    <div className="flex-1 bg-slate-950 overflow-y-auto p-4 sm:p-8 space-y-8">
      {/* Overview Card */}
      <div className="max-w-6xl mx-auto bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                Sistem Mimarisi & Veri Modeli
              </span>
              <span className="text-xs text-slate-400 font-mono">v1.0.0</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              AKG Tesis Bakım Yönetim Sistemi (CMMS) Mimarisi
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Saha operatör paneli, gerçek zamanlı Firestore veritabanı, Google Apps Script entegrasyonu, kurumsal Google E-Tablolar arşivi ve WhatsApp raporlama motoru arasındaki veri akış katmanları.
            </p>
          </div>
        </div>
      </div>

      {/* Architecture Topology Tier Diagram */}
      <div className="max-w-6xl mx-auto">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <Server className="w-4 h-4 text-cyan-400" />
          <span>Katmanlı Mimari Şeması (Layered Architecture)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Tier 1: Client Front-End */}
          <div className="bg-slate-900/90 border border-blue-900/50 rounded-xl p-4 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-blue-400 mb-2">
                <Smartphone className="w-4 h-4" />
                <span>1. SAHA İSTEMCİSİ (PWA)</span>
              </div>
              <h4 className="text-sm font-bold text-white mb-1">
                Mobil Bakım Paneli
              </h4>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                Teknisyenlerin akıllı telefonlarında tam ekran çalışan PWA uygulaması.
              </p>
              <ul className="text-xs space-y-1.5 text-slate-300">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>Html5Qrcode Kamera Entegrasyonu</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>Offline LocalStorage Sözlük Önbelleği</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>Service Worker & Ağ Uykusu Çözümü</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>AudioContext Bip Uyarısı</span>
                </li>
              </ul>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-blue-300/80">
              Tech: HTML5, CSS3, JS, PWA
            </div>
          </div>

          {/* Tier 2: Real-time Cloud Database */}
          <div className="bg-slate-900/90 border border-emerald-900/50 rounded-xl p-4 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-2">
                <Database className="w-4 h-4" />
                <span>2. CANLI VERİTABANI</span>
              </div>
              <h4 className="text-sm font-bold text-white mb-1">
                Firebase Firestore
              </h4>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                Açık ve aktif müdahale edilen arızaları anlık soket ile tüm teknisyenlere yansıtır.
              </p>
              <ul className="text-xs space-y-1.5 text-slate-300">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>collection('arizalar') Canlı Snapshot</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>collection('settings') Konfigürasyon</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>collection('messages') P2P Mesajlar</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Batch Commit Silme Kotası Koruması</span>
                </li>
              </ul>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-emerald-300/80">
              Cloud: Google Cloud Firestore (NoSQL)
            </div>
          </div>

          {/* Tier 3: Integration Bridge */}
          <div className="bg-slate-900/90 border border-amber-900/50 rounded-xl p-4 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-2">
                <Cloud className="w-4 h-4" />
                <span>3. ENTEGRASYON KÖPRÜSÜ</span>
              </div>
              <h4 className="text-sm font-bold text-white mb-1">
                Google Apps Script
              </h4>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                CORS kısıtlamalarını aşan JSONP GViz ve REST Web App sunucusuz makrosu.
              </p>
              <ul className="text-xs space-y-1.5 text-slate-300">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>GOOGLE_SCRIPT_URL (Webhook)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>exportClosedFaults (16 Sütun Ekleme)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>updateOperators (Kullanıcı Güncelleme)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>GViz JSONP Makine Sözlük Senkronu</span>
                </li>
              </ul>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-amber-300/80">
              API: Serverless Google Apps Script
            </div>
          </div>

          {/* Tier 4: Corporate Storage & Output */}
          <div className="bg-slate-900/90 border border-purple-900/50 rounded-xl p-4 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-purple-400 mb-2">
                <FileSpreadsheet className="w-4 h-4" />
                <span>4. KURUMSAL DEPOLAMA & ÇIKTI</span>
              </div>
              <h4 className="text-sm font-bold text-white mb-1">
                Google E-Tablolar & PDF
              </h4>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                Bütün fabrika geçmişinin saklandığı ana Excel ve yönetimsel raporlama araçları.
              </p>
              <ul className="text-xs space-y-1.5 text-slate-300">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>'arıza-giris' Kalıcı 16 Sütun Tablosu</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>'veri' Operatör & Kök Neden Tablosu</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>html2pdf.js ile A3 Yatay Rapor</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>WhatsApp Click-to-Chat Formatı</span>
                </li>
              </ul>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-purple-300/80">
              Output: Google Sheets, PDF, WhatsApp
            </div>
          </div>
        </div>
      </div>

      {/* Firestore Collections Explorer */}
      <div className="max-w-6xl mx-auto space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Firestore Veri Şemaları (Collections & Fields)</span>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {FIRESTORE_COLLECTIONS.map((col) => (
            <div
              key={col.name}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      collection('{col.name}')
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {col.fields.length} Alan
                  </span>
                </div>
                <p className="text-xs text-slate-300 mb-3">
                  {col.description}
                </p>

                {/* Fields Table */}
                <div className="border border-slate-800 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-2">Alan Adı</th>
                        <th className="p-2">Veri Tipi</th>
                        <th className="p-2">Açıklama</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                      {col.fields.map((f) => (
                        <tr key={f.name} className="hover:bg-slate-800/40">
                          <td className="p-2 font-semibold text-cyan-300">
                            {f.name} {f.required && <span className="text-red-400">*</span>}
                          </td>
                          <td className="p-2 text-slate-400">{f.type}</td>
                          <td className="p-2 text-slate-300 font-sans">{f.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Google Sheets 16-Column Export Specification */}
      <div className="max-w-6xl mx-auto space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Table className="w-4 h-4 text-amber-400" />
          <span>Google E-Tablolar 16 Sütunlu Arşivleme Şeması ('arıza-giris' Sekmesi)</span>
        </h3>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
          <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <span>
              Her gün sonunda veya admin tetiklemesiyle dünün kapatılmış arızaları aşağıdaki 16 sütunluk diziye dönüştürülür:
            </span>
            <span className="font-mono text-amber-400 font-semibold">A - P Sütunları</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-mono">
                <tr>
                  <th className="p-2.5 w-16 text-center">Sütun</th>
                  <th className="p-2.5">Başlık</th>
                  <th className="p-2.5">Kaynak Firestore Alanı / Hesaplama Mantığı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {GOOGLE_SHEETS_COLUMNS.map((item) => (
                  <tr key={item.col} className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-mono text-center font-bold text-amber-400 bg-amber-950/20">
                      {item.col}
                    </td>
                    <td className="p-2.5 font-semibold text-slate-100">{item.name}</td>
                    <td className="p-2.5 text-slate-400">{item.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
