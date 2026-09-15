import React, { useState, useRef } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Database, 
  Cloud, 
  User, 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Cpu, 
  HelpCircle
} from 'lucide-react';
import { FlowDiagram, FlowNode, FlowEdge } from '../types';

interface FlowchartCanvasProps {
  diagram: FlowDiagram;
  selectedNodeId: string | null;
  onSelectNode: (node: FlowNode) => void;
  activeSimNodeId: string | null;
  searchQuery: string;
}

export const FlowchartCanvas: React.FC<FlowchartCanvasProps> = ({
  diagram,
  selectedNodeId,
  onSelectNode,
  activeSimNodeId,
  searchQuery
}) => {
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 1.8));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.6));
  const handleResetZoom = () => setZoom(1);

  // Helper to get node position by ID
  const getNode = (id: string): FlowNode | undefined => {
    return diagram.nodes.find((n) => n.id === id);
  };

  // Calculate SVG curve between two nodes
  const renderEdge = (edge: FlowEdge) => {
    const fromNode = getNode(edge.from);
    const toNode = getNode(edge.to);
    if (!fromNode || !toNode) return null;

    const fromW = fromNode.width || 240;
    const fromH = fromNode.height || 70;
    const toW = toNode.width || 240;
    const toH = toNode.height || 70;

    // Start point at bottom-center or right of fromNode
    const x1 = fromNode.x + fromW / 2;
    const y1 = fromNode.y + fromH;

    // End point at top-center of toNode
    const x2 = toNode.x + toW / 2;
    const y2 = toNode.y;

    // Control points for cubic bezier
    const deltaY = Math.max(Math.abs(y2 - y1) / 2, 40);
    const cx1 = x1;
    const cy1 = y1 + deltaY;
    const cx2 = x2;
    const cy2 = y2 - deltaY;

    const pathD = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;

    // Midpoint for label
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    const isSimPath = activeSimNodeId === edge.to || activeSimNodeId === edge.from;

    let strokeColor = '#475569'; // default slate-600
    if (edge.variant === 'success') strokeColor = '#10b981';
    else if (edge.variant === 'warning') strokeColor = '#f59e0b';
    else if (edge.variant === 'danger') strokeColor = '#ef4444';
    else if (edge.variant === 'purple') strokeColor = '#a855f7';

    if (isSimPath) strokeColor = '#06b6d4'; // cyan active

    return (
      <g key={edge.id} className="transition-all duration-300">
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth={isSimPath ? 3 : 2}
          strokeDasharray={edge.dashed ? '6 4' : undefined}
          markerEnd={`url(#arrow-${edge.variant || 'default'})`}
          className={isSimPath ? 'animate-pulse' : ''}
        />
        {edge.label && (
          <g transform={`translate(${midX}, ${midY})`}>
            <rect
              x={-edge.label.length * 3.8 - 6}
              y={-11}
              width={edge.label.length * 7.6 + 12}
              height={20}
              rx={4}
              fill="#0f172a"
              stroke={strokeColor}
              strokeWidth={1}
              className="shadow-md"
            />
            <text
              textAnchor="middle"
              y={3}
              fill="#e2e8f0"
              fontSize={10}
              fontWeight={600}
              className="select-none pointer-events-none"
            >
              {edge.label}
            </text>
          </g>
        )}
      </g>
    );
  };

  // Determine node styling based on actor and type
  const getNodeBadge = (node: FlowNode) => {
    switch (node.actor) {
      case 'operator':
        return { label: 'Operatör / Teknisyen', color: 'bg-blue-950 text-blue-300 border-blue-800', icon: <User className="w-3 h-3" /> };
      case 'admin':
        return { label: 'Yönetici (Admin)', color: 'bg-purple-950 text-purple-300 border-purple-800', icon: <Shield className="w-3 h-3" /> };
      case 'firebase':
        return { label: 'Firebase Firestore', color: 'bg-emerald-950 text-emerald-300 border-emerald-800', icon: <Database className="w-3 h-3" /> };
      case 'google':
        return { label: 'Google Sheets / Script', color: 'bg-amber-950 text-amber-300 border-amber-800', icon: <Cloud className="w-3 h-3" /> };
      case 'system':
      default:
        return { label: 'Sistem Süreci', color: 'bg-slate-800 text-slate-300 border-slate-700', icon: <Cpu className="w-3 h-3" /> };
    }
  };

  // Check search query match
  const matchesSearch = (node: FlowNode) => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return (
      node.label.toLowerCase().includes(q) ||
      (node.sublabel && node.sublabel.toLowerCase().includes(q)) ||
      node.description.toLowerCase().includes(q) ||
      (node.codeFunction && node.codeFunction.toLowerCase().includes(q)) ||
      (node.firestoreCollection && node.firestoreCollection.toLowerCase().includes(q))
    );
  };

  // Canvas bounds calculation
  const maxX = Math.max(...diagram.nodes.map((n) => n.x + (n.width || 240)), 900);
  const maxY = Math.max(...diagram.nodes.map((n) => n.y + (n.height || 70)), 900) + 120;

  return (
    <div className="relative flex-1 bg-slate-950 overflow-hidden flex flex-col">
      {/* Canvas Top Bar Info */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div>
          <span className="font-semibold text-slate-200">{diagram.title}</span>
          <span className="text-slate-400 ml-2 hidden sm:inline">— {diagram.subtitle}</span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          <button
            onClick={handleZoomOut}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            title="Uzaklaştır"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="px-2 font-mono text-[11px] text-slate-300">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            title="Yakınlaştır"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors border-l border-slate-800"
            title="Sıfırla"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Flowchart Viewport */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-8 flex justify-center items-start cursor-grab active:cursor-grabbing select-none"
      >
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            width: maxX + 100,
            height: maxY,
            transition: 'transform 0.15s ease-out'
          }}
          className="relative"
        >
          {/* SVG Connectors Layer */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ width: maxX + 100, height: maxY }}
          >
            <defs>
              <marker
                id="arrow-default"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
              </marker>
              <marker
                id="arrow-success"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
              </marker>
              <marker
                id="arrow-warning"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
              </marker>
              <marker
                id="arrow-danger"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
              </marker>
              <marker
                id="arrow-purple"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#a855f7" />
              </marker>
            </defs>
            {diagram.edges.map(renderEdge)}
          </svg>

          {/* Interactive Nodes Layer */}
          {diagram.nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isSimActive = activeSimNodeId === node.id;
            const isMatched = matchesSearch(node);
            const badge = getNodeBadge(node);
            const width = node.width || 240;
            const height = node.height || 70;

            let borderStyle = 'border-slate-800 hover:border-slate-600 bg-slate-900/90';
            if (node.actor === 'operator') borderStyle = 'border-blue-900/60 hover:border-blue-600 bg-slate-900/90';
            else if (node.actor === 'admin') borderStyle = 'border-purple-900/60 hover:border-purple-600 bg-slate-900/90';
            else if (node.actor === 'firebase') borderStyle = 'border-emerald-900/60 hover:border-emerald-600 bg-slate-900/90';
            else if (node.actor === 'google') borderStyle = 'border-amber-900/60 hover:border-amber-600 bg-slate-900/90';

            if (node.type === 'decision') {
              borderStyle += ' border-dashed';
            }

            if (isSelected) {
              borderStyle = 'border-cyan-400 bg-slate-900 ring-2 ring-cyan-500/40 shadow-lg shadow-cyan-500/20';
            }

            if (isSimActive) {
              borderStyle = 'border-emerald-400 bg-slate-900 ring-4 ring-emerald-500/60 shadow-2xl shadow-emerald-500/30 scale-105 animate-pulse';
            }

            if (isMatched) {
              borderStyle += ' ring-2 ring-yellow-400/80 shadow-yellow-500/20';
            }

            return (
              <div
                key={node.id}
                onClick={() => onSelectNode(node)}
                style={{
                  left: node.x,
                  top: node.y,
                  width: width,
                  minHeight: height
                }}
                className={`absolute rounded-xl border p-3 cursor-pointer transition-all duration-200 flex flex-col justify-between backdrop-blur-md shadow-md hover:shadow-xl hover:-translate-y-0.5 ${borderStyle}`}
              >
                {/* Node Top Row: Actor Badge & Node Type Indicator */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.color}`}>
                    {badge.icon}
                    <span>{badge.label}</span>
                  </div>

                  {node.type === 'decision' && (
                    <span className="text-[10px] text-amber-400 font-bold bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800">
                      Karar ?
                    </span>
                  )}
                  {node.type === 'start' && (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800">
                      Başlangıç
                    </span>
                  )}
                  {node.type === 'end' && (
                    <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800">
                      Sonuç
                    </span>
                  )}
                  {node.type === 'alert' && (
                    <span className="text-[10px] text-red-400 font-bold bg-red-950/60 px-1.5 py-0.2 rounded border border-red-800">
                      Uyarı
                    </span>
                  )}
                </div>

                {/* Node Content */}
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-100 leading-snug">
                    {node.label}
                  </h3>
                  {node.sublabel && (
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium leading-tight">
                      {node.sublabel}
                    </p>
                  )}
                </div>

                {/* Function / Collection Tags */}
                {(node.codeFunction || node.firestoreCollection) && (
                  <div className="flex flex-wrap gap-1 mt-2 pt-1.5 border-t border-slate-800/80">
                    {node.codeFunction && (
                      <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-900/50">
                        ƒ {node.codeFunction.split('(')[0]}
                      </span>
                    )}
                    {node.firestoreCollection && (
                      <span className="text-[9px] font-mono text-emerald-300 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-900/50">
                        🗄️ {node.firestoreCollection}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Canvas Bottom Legend */}
      <div className="bg-slate-900/80 border-t border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold text-slate-300">Rol Renkleri:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span>Teknisyen</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
            <span>Admin</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Firestore</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Google Sheets</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span>Sistem Motoru</span>
          </div>
        </div>

        <div className="text-slate-400 hidden lg:block">
          💡 Detaylı kod analizi ve veritabanı işlemlerini incelemek için kutulara tıklayın.
        </div>
      </div>
    </div>
  );
};
