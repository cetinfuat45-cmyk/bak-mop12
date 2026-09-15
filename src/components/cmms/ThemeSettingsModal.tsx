import React from 'react';
import { X, Palette, Type, Check } from 'lucide-react';
import { ViewSettings } from '../../types';

interface ThemeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ViewSettings;
  onUpdateSettings: (newSettings: ViewSettings) => void;
}

const THEME_PALETTES = [
  { id: 'cyan', name: 'Steel Cyan (Varsayılan)', color: 'bg-cyan-500' },
  { id: 'blue', name: 'Industrial Blue', color: 'bg-blue-600' },
  { id: 'emerald', name: 'Emerald Workshop', color: 'bg-emerald-500' },
  { id: 'amber', name: 'Amber Warning', color: 'bg-amber-500' },
  { id: 'purple', name: 'High-Tech Violet', color: 'bg-purple-600' },
  { id: 'slate', name: 'Midnight Charcoal', color: 'bg-slate-400' }
];

export const ThemeSettingsModal: React.FC<ThemeSettingsModalProps> = ({
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
            <div className="p-2 rounded-xl bg-purple-950 border border-purple-800 text-purple-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Tema & Renk Ayarları
              </h3>
              <p className="text-[11px] text-slate-400">
                Arayüz vurgusu ve metin boyutu ölçeği
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

        {/* Content */}
        <div className="p-4 space-y-4 text-xs">
          {/* Color Palettes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
              Tema Vurgu Rengi:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {THEME_PALETTES.map((t) => (
                <button
                  key={t.id}
                  onClick={() =>
                    onUpdateSettings({ ...settings, themeColor: t.id })
                  }
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                    settings.themeColor === t.id
                      ? 'bg-slate-800 border-cyan-500 font-bold text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full ${t.color}`} />
                  <span className="truncate">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Font size slider */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5" />
                <span>Yazı Boyutu Ölçeği:</span>
              </label>
              <span className="font-bold text-cyan-400 font-mono">
                {settings.fontSize} px
              </span>
            </div>
            <input
              type="range"
              min={13}
              max={18}
              step={1}
              value={settings.fontSize}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  fontSize: Number(e.target.value)
                })
              }
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Kompakt (13px)</span>
              <span>Standart (15px)</span>
              <span>Büyük (18px)</span>
            </div>
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
