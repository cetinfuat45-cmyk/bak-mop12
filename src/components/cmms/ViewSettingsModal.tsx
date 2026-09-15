import React from 'react';
import { X, Sliders, Check } from 'lucide-react';
import { ViewSettings } from '../../types';

interface ViewSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ViewSettings;
  onUpdateSettings: (newSettings: ViewSettings) => void;
}

export const ViewSettingsModal: React.FC<ViewSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Operatör Veri Gösterge Ayarları
              </h3>
              <p className="text-[11px] text-slate-400">
                Kart yerleşimi ve arıza detay görünürlüğü
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-4 space-y-4 text-xs">
          {/* Display Mode */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
              Görünüm Düzeni:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'card', label: 'Kart Görünümü' },
                { id: 'compact', label: 'Kompakt' },
                { id: 'row', label: 'Satır / Tablo' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() =>
                    onUpdateSettings({
                      ...settings,
                      displayMode: m.id as ViewSettings['displayMode']
                    })
                  }
                  className={`p-2.5 rounded-xl font-bold border text-center transition-all ${
                    settings.displayMode === m.id
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grouping Mode */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
              Ana Ekran Gruplama:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'faultType', label: 'Renk Kodu ve Arıza Türü' },
                { id: 'none', label: 'Tek Liste (Gruplama Yok)' }
              ].map((g) => (
                <button
                  key={g.id}
                  onClick={() =>
                    onUpdateSettings({
                      ...settings,
                      groupBy: g.id as ViewSettings['groupBy']
                    })
                  }
                  className={`p-2.5 rounded-xl font-bold border text-center transition-all text-xs ${
                    settings.groupBy === g.id
                      ? 'bg-indigo-950 border-indigo-500 text-indigo-300 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Details Visibility Toggles */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
              Görünecek Bilgi Alanları:
            </label>

            {[
              { key: 'showDescription', label: 'Arıza Açıklaması' },
              { key: 'showReporter', label: 'Bildiren Kişi' },
              { key: 'showShift', label: 'Vardiya Bilgisi' },
              { key: 'showAssignee', label: 'Müdahale Eden Teknisyen' }
            ].map((field) => (
              <label
                key={field.key}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer"
              >
                <span className="text-slate-300 font-medium">
                  {field.label}
                </span>
                <input
                  type="checkbox"
                  checked={
                    settings[field.key as keyof ViewSettings] as boolean
                  }
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      [field.key]: e.target.checked
                    })
                  }
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 accent-cyan-500"
                />
              </label>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
            >
              Tamam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
