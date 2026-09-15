import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  X, 
  Terminal, 
  CheckCircle2, 
  User, 
  Sparkles 
} from 'lucide-react';
import { SIMULATION_SCENARIOS } from '../data/flowData';
import { SimulationScenario } from '../types';

interface ProcessSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  onStepChange: (nodeId: string | null) => void;
}

export const ProcessSimulator: React.FC<ProcessSimulatorProps> = ({
  isOpen,
  onClose,
  onStepChange
}) => {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const scenario: SimulationScenario = SIMULATION_SCENARIOS[selectedScenarioIndex];
  const currentStep = scenario.steps[currentStepIndex];

  // Notify parent of active node ID
  useEffect(() => {
    if (isOpen && currentStep) {
      onStepChange(currentStep.nodeId);
    } else {
      onStepChange(null);
    }
  }, [isOpen, currentStepIndex, selectedScenarioIndex]);

  // Handle scenario switch
  const handleScenarioChange = (index: number) => {
    setSelectedScenarioIndex(index);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setLogs([`🚀 Senaryo seçildi: ${SIMULATION_SCENARIOS[index].title}`]);
  };

  // Next step
  const handleNextStep = () => {
    if (currentStepIndex < scenario.steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      const nextStep = scenario.steps[nextIndex];
      setLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] ${nextStep.actionTitle} -> ${nextStep.systemLog}`,
        ...prev.slice(0, 8)
      ]);
    } else {
      setIsPlaying(false);
      setLogs((prev) => [
        `🎉 Senaryo başarıyla tamamlandı! Tüm adımlar ve durum geçişleri doğrulandı.`,
        ...prev.slice(0, 8)
      ]);
    }
  };

  // Prev step
  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  // Reset
  const handleReset = () => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setLogs([`🔄 Senaryo sıfırlandı: ${scenario.title}`]);
  };

  // Auto-play interval
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        if (currentStepIndex < scenario.steps.length - 1) {
          handleNextStep();
        } else {
          setIsPlaying(false);
        }
      }, 2500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, currentStepIndex, scenario.steps.length]);

  if (!isOpen) return null;

  const progressPct = ((currentStepIndex + 1) / scenario.steps.length) * 100;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-40 w-auto sm:w-[500px] bg-slate-900/98 backdrop-blur-xl border border-slate-700 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="bg-slate-950 p-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400">
            <Play className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <span>İnteraktif Süreç Simülatörü</span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800">
                Canlı İzleme
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Saha adımlarını şema üzerinde adım adım canlandırın
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3.5 max-h-[70vh] overflow-y-auto">
        {/* Scenario Selector */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
            Canlandırılacak Senaryo:
          </label>
          <select
            value={selectedScenarioIndex}
            onChange={(e) => handleScenarioChange(Number(e.target.value))}
            className="w-full text-xs bg-slate-950 border border-slate-700 text-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
          >
            {SIMULATION_SCENARIOS.map((scen, idx) => (
              <option key={scen.id} value={idx}>
                {scen.title}
              </option>
            ))}
          </select>
        </div>

        {/* Scenario Meta */}
        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="flex items-center gap-1 text-cyan-300">
              <User className="w-3 h-3" />
              <span>Rol: {scenario.role}</span>
            </span>
            <span>
              Adım {currentStepIndex + 1} / {scenario.steps.length}
            </span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {scenario.description}
          </p>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Current Step Card */}
        {currentStep && (
          <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-300 mb-1">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mevcut Adım:</span>
              </span>
              <span className="text-[10px] bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800 font-mono">
                {currentStep.nodeId}
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white mb-1.5">
              {currentStep.actionTitle}
            </h4>
            <div className="text-[11px] font-mono text-cyan-300 bg-slate-950/90 p-2 rounded border border-cyan-900/40">
              {currentStep.stateChange}
            </div>
          </div>
        )}

        {/* Terminal Logs */}
        <div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 mb-1">
            <Terminal className="w-3 h-3 text-emerald-400" />
            <span>Sistem Konsol Kayıtları:</span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 h-20 overflow-y-auto space-y-1">
            {logs.map((log, i) => (
              <div key={i} className="text-slate-300 leading-snug">
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleReset}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Başa Dön"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isPlaying
                  ? 'bg-amber-600 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Durdur</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Otomatik Oynat</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevStep}
              disabled={currentStepIndex === 0}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              Önceki
            </button>
            <button
              onClick={handleNextStep}
              disabled={currentStepIndex >= scenario.steps.length - 1}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition-colors"
            >
              <span>Sonraki</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
