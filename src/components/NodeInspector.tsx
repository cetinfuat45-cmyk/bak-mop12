import React from 'react';
import { 
  X, 
  Code2, 
  Database, 
  CheckCircle, 
  AlertOctagon, 
  Terminal, 
  Layers,
  ArrowRight,
  User,
  Shield,
  Cloud,
  Cpu
} from 'lucide-react';
import { FlowNode } from '../types';

interface NodeInspectorProps {
  node: FlowNode | null;
  onClose: () => void;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({ node, onClose }) => {
  if (!node) return null;

  const getActorInfo = () => {
    switch (node.actor) {
      case 'operator':
        return { label: 'Operatör / Teknisyen Eylemi', color: 'bg-blue-950 text-blue-300 border-blue-800', icon: <User className="w-3.5 h-3.5" /> };
      case 'admin':
        return { label: 'Admin / Yönetici Eylemi', color: 'bg-purple-950 text-purple-300 border-purple-800', icon: <Shield className="w-3.5 h-3.5" /> };
      case 'firebase':
        return { label: 'Firebase Firestore Veritabanı', color: 'bg-emerald-950 text-emerald-300 border-emerald-800', icon: <Database className="w-3.5 h-3.5" /> };
      case 'google':
        return { label: 'Google Sheets / Apps Script', color: 'bg-amber-950 text-amber-300 border-amber-800', icon: <Cloud className="w-3.5 h-3.5" /> };
      case 'system':
      default:
        return { label: 'Sistem / Otomasyon Mantığı', color: 'bg-slate-800 text-slate-300 border-slate-700', icon: <Cpu className="w-3.5 h-3.5" /> };
    }
  };

  const actorInfo = getActorInfo();

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[480px] bg-slate-900/98 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col transition-all duration-300">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-start justify-between gap-3 bg-slate-950/60">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${actorInfo.color}`}>
              {actorInfo.icon}
              <span>{actorInfo.label}</span>
            </span>
            <span className="text-[10px] uppercase font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
              ID: {node.id}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            {node.label}
          </h2>
          {node.sublabel && (
            <p className="text-xs text-cyan-400 font-medium mt-0.5">
              {node.sublabel}
            </p>
          )}
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title="Kapat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Description */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>İşlem Tanımı</span>
          </h3>
          <div className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-800/60 p-3.5 rounded-xl border border-slate-800">
            {node.description}
          </div>
        </div>

        {/* Function and Database Meta */}
        <div className="grid grid-cols-1 gap-2.5">
          {node.codeFunction && (
            <div className="bg-slate-950/80 p-3 rounded-lg border border-cyan-900/40">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-300 mb-1">
                <Code2 className="w-3.5 h-3.5" />
                <span>Kaynak Koddaki Fonksiyon:</span>
              </div>
              <code className="text-xs font-mono text-cyan-400 block break-all">
                {node.codeFunction}
              </code>
            </div>
          )}

          {node.firestoreCollection && (
            <div className="bg-slate-950/80 p-3 rounded-lg border border-emerald-900/40">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300 mb-1">
                <Database className="w-3.5 h-3.5" />
                <span>İlgili Veritabanı Koleksiyonu:</span>
              </div>
              <code className="text-xs font-mono text-emerald-400 block break-all">
                db.collection('{node.firestoreCollection}')
              </code>
            </div>
          )}
        </div>

        {/* Key Process Details */}
        {node.details && node.details.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Süreç Kuralları & Mantık</span>
            </h3>
            <ul className="space-y-2">
              {node.details.map((detail, idx) => (
                <li
                  key={idx}
                  className="text-xs text-slate-300 flex items-start gap-2 bg-slate-800/40 p-2.5 rounded-lg border border-slate-800/60"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Code Snippet from AKG Codebase */}
        {node.codeSnippet && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-yellow-400" />
              <span>Kaynak Kod Kesiti (Orijinal Mantık)</span>
            </h3>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto text-slate-200">
              <pre className="text-[11px] leading-relaxed text-cyan-300">
                {node.codeSnippet}
              </pre>
            </div>
          </div>
        )}

        {/* Edge Cases & Safety Constraints */}
        {node.edgeCases && node.edgeCases.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
              <span>İstisna Durumları & Güvenlik</span>
            </h3>
            <ul className="space-y-2">
              {node.edgeCases.map((ec, idx) => (
                <li
                  key={idx}
                  className="text-xs text-red-300 bg-red-950/30 p-2.5 rounded-lg border border-red-900/40 flex items-start gap-2"
                >
                  <span className="text-red-400 font-bold">•</span>
                  <span>{ec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Drawer Footer */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
        >
          Kapat
        </button>
      </div>
    </div>
  );
};
