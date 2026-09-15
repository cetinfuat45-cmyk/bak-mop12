import React, { useState } from 'react';
import { X, Copy, Check, Code2, Download } from 'lucide-react';
import { MERMAID_DIAGRAMS } from '../data/schemaData';
import { FlowCategory } from '../types';

interface MermaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategory: FlowCategory;
}

export const MermaidModal: React.FC<MermaidModalProps> = ({
  isOpen,
  onClose,
  activeCategory
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string>(
    MERMAID_DIAGRAMS[activeCategory] ? activeCategory : 'master'
  );

  if (!isOpen) return null;

  const currentCode = MERMAID_DIAGRAMS[selectedKey] || MERMAID_DIAGRAMS.master;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `akg_${selectedKey}_flowchart.mmd`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Mermaid.js Akış Şeması Kodu
              </h3>
              <p className="text-[11px] text-slate-400">
                Teknik dokümantasyon, GitHub veya Markdown içine kopyalayabilirsiniz
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subnav to pick diagram */}
        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex gap-2 overflow-x-auto text-xs">
          {Object.keys(MERMAID_DIAGRAMS).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedKey(key)}
              className={`px-2.5 py-1 rounded font-medium capitalize transition-colors ${
                selectedKey === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {key === 'master' ? 'Ana Akış' : key}
            </button>
          ))}
        </div>

        {/* Code Content */}
        <div className="p-4 flex-1 overflow-auto bg-slate-950 font-mono text-xs text-cyan-300">
          <pre className="p-3 bg-slate-900 rounded-xl border border-slate-800 leading-relaxed overflow-x-auto">
            {currentCode}
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500">
            Tip: mermaid.live veya GitHub Markdown içinde ```mermaid bloğuna yapıştırabilirsiniz.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>.mmd İndir</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md shadow-cyan-600/20"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Kopyalandı!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Kodu Kopyala</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
