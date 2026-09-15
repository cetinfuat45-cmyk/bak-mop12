import React, { useState, useEffect } from 'react';
import {
  Search,
  Flame,
  Clock,
  CheckCircle2,
  Layers,
  List
} from 'lucide-react';
import { Fault, Operator, ViewSettings } from '../../types';
import { FaultCard } from './FaultCard';
import { FaultRow } from './FaultRow';
import {
  FAULT_COLOR_CODES,
  ORDERED_FAULT_TYPES,
  getFaultTypeConfig,
  isMatchingFaultGroup,
  VERI_SHEET_COLUMN_G_GROUPS
} from '../../utils/faultColors';

interface FaultsListProps {
  faults: Fault[];
  currentOperator: Operator;
  viewSettings: ViewSettings;
  onStartIntervention: (fault: Fault) => void;
  onOpenInterventionModal: (fault: Fault) => void;
  onJoinHelper: (fault: Fault) => void;
  onLeaveHelper: (fault: Fault) => void;
  onReassign: (fault: Fault, newOpName: string) => void;
  allOperators: Operator[];
  onUpdateViewSettings?: (newSettings: ViewSettings) => void;
}

export const FaultsList: React.FC<FaultsListProps> = ({
  faults,
  currentOperator,
  viewSettings,
  onStartIntervention,
  onOpenInterventionModal,
  onJoinHelper,
  onLeaveHelper,
  onReassign,
  allOperators,
  onUpdateViewSettings
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [filterMode, setFilterMode] = useState<'all' | 'mine' | 'unassigned'>(
    'all'
  );
  const [groupByType, setGroupByType] = useState<boolean>(
    viewSettings.groupBy !== 'none'
  );

  // Sync when viewSettings.groupBy updates from settings modal
  useEffect(() => {
    setGroupByType(viewSettings.groupBy !== 'none');
  }, [viewSettings.groupBy]);

  const isRowMode = viewSettings.displayMode === 'row';
  const isCompactMode = viewSettings.displayMode === 'compact';

  const todayStr = new Date().toLocaleDateString('tr-TR');

  // Filter based on search and category
  const filtered = faults.filter((f) => {
    // Exclude closed ones from main list (they are in ClosedToday or Archive)
    if (f.status === 'Kapalı') return false;

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        f.machine.toLowerCase().includes(q) ||
        (f.machineCode && f.machineCode.toLowerCase().includes(q)) ||
        f.description.toLowerCase().includes(q) ||
        f.reportedBy.toLowerCase().includes(q) ||
        (f.assignedTo && f.assignedTo.toLowerCase().includes(q));
      if (!match) return false;
    }

    // Category filter matching Google Sheet 'veri' tab Column G (İŞ İSTEK TÜRÜ)
    if (selectedType !== 'ALL') {
      if (!isMatchingFaultGroup(f.faultType, selectedType)) {
        return false;
      }
    }

    // Scope filter (mine vs unassigned)
    if (filterMode === 'mine') {
      const isMine =
        f.assignedTo === currentOperator.name ||
        (f.helpers && f.helpers.includes(currentOperator.name));
      if (!isMine) return false;
    } else if (filterMode === 'unassigned') {
      if (f.assignedTo) return false;
    }

    return true;
  });

  // Sort faults:
  // 1. Müdahale Ediliyor first
  // 2. Acil priority
  // 3. Assigned to current operator
  // 4. Other open faults
  const sortedFaults = [...filtered].sort((a, b) => {
    if (a.status === 'Müdahale Ediliyor' && b.status !== 'Müdahale Ediliyor') return -1;
    if (b.status === 'Müdahale Ediliyor' && a.status !== 'Müdahale Ediliyor') return 1;

    if (a.priority === 'Acil' && b.priority !== 'Acil') return -1;
    if (b.priority === 'Acil' && a.priority !== 'Acil') return 1;

    const aMine =
      a.assignedTo === currentOperator.name ||
      (a.helpers && a.helpers.includes(currentOperator.name));
    const bMine =
      b.assignedTo === currentOperator.name ||
      (b.helpers && b.helpers.includes(currentOperator.name));
    if (aMine && !bMine) return -1;
    if (!aMine && bMine) return 1;

    return 0;
  });

  // Tasks assigned to current operator
  const myAssignedTasks = sortedFaults.filter(
    (f) =>
      f.assignedTo === currentOperator.name ||
      (f.helpers && f.helpers.includes(currentOperator.name))
  );

  // Pool tasks not assigned to current operator
  const poolTasks = sortedFaults.filter(
    (f) =>
      f.assignedTo !== currentOperator.name &&
      !(f.helpers && f.helpers.includes(currentOperator.name))
  );

  const openFaults = faults.filter((f) => f.status !== 'Kapalı');

  // Category filters with explicit color coding matching Google Sheet 'veri' tab Column G (İŞ İSTEK TÜRÜ)
  const categories = [
    { id: 'ALL', label: 'Tümü', shortLabel: 'Tümü', count: openFaults.length, color: '#38BDF8' },
    {
      id: 'MEKANİK ARIZA',
      label: 'Mek Arıza',
      shortLabel: 'Mek Arıza',
      count: openFaults.filter((f) => isMatchingFaultGroup(f.faultType, 'MEKANİK ARIZA')).length,
      color: FAULT_COLOR_CODES.MEKANIK
    },
    {
      id: 'ELEKTRİK ARIZA',
      label: 'Elek Arıza',
      shortLabel: 'Elek Arıza',
      count: openFaults.filter((f) => isMatchingFaultGroup(f.faultType, 'ELEKTRİK ARIZA')).length,
      color: FAULT_COLOR_CODES.ELEKTRIK
    },
    {
      id: 'İŞ GÜVENLİĞİ !!!',
      label: 'İş Güvenliği',
      shortLabel: 'İSG',
      count: openFaults.filter((f) => isMatchingFaultGroup(f.faultType, 'İŞ GÜVENLİĞİ !!!')).length,
      color: FAULT_COLOR_CODES.ISG
    },
    {
      id: 'PLANLI BAKIM KODU',
      label: 'Planlı Bakım',
      shortLabel: 'Planlı Bakım',
      count: openFaults.filter((f) => isMatchingFaultGroup(f.faultType, 'PLANLI BAKIM KODU')).length,
      color: FAULT_COLOR_CODES.PLANLI_BAKIM
    },
    {
      id: 'TEKRAR EDEN ARIZA  !!!!',
      label: 'Tekrar Eden',
      shortLabel: 'Tekrar Eden',
      count: openFaults.filter((f) => isMatchingFaultGroup(f.faultType, 'TEKRAR EDEN ARIZA  !!!!')).length,
      color: FAULT_COLOR_CODES.TEKRAR_EDEN
    }
  ];

  // Grouping by fault type (ordered matching Google Sheet 'veri' tab Column G)
  const typeGroups = ORDERED_FAULT_TYPES.map((typeKey) => {
    const config = getFaultTypeConfig(typeKey);
    const items = sortedFaults.filter((f) => isMatchingFaultGroup(f.faultType, config.sheetName));
    return {
      config,
      items
    };
  }).filter((g) => g.items.length > 0);

  // Catch any items that didn't match standard ordered types
  const matchedIds = new Set(
    typeGroups.flatMap((g) => g.items.map((i) => i.id))
  );
  const leftoverItems = sortedFaults.filter((f) => !matchedIds.has(f.id));
  if (leftoverItems.length > 0) {
    typeGroups.push({
      config: getFaultTypeConfig('Diğer'),
      items: leftoverItems
    });
  }

  return (
    <div className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 max-w-[1600px] mx-auto w-full space-y-4 transition-all">
      {/* Search & Filter Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-lg flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 sm:gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Makine adı, arıza açıklaması veya bildiren ara..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Quick Scope Filter buttons & Grouping Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterMode === 'all'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
              }`}
            >
              Tüm Arızalar ({filtered.length})
            </button>
            <button
              onClick={() => setFilterMode('mine')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterMode === 'mine'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
              }`}
            >
              Üzerimdekiler
            </button>
            <button
              onClick={() => setFilterMode('unassigned')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterMode === 'unassigned'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
              }`}
            >
              Boştakiler
            </button>
          </div>

          <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

          {/* Group View Toggle */}
          <button
            onClick={() => {
              const nextState = !groupByType;
              setGroupByType(nextState);
              if (onUpdateViewSettings) {
                onUpdateViewSettings({
                  ...viewSettings,
                  groupBy: nextState ? 'faultType' : 'none'
                });
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              groupByType
                ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-950/30'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Renk Koduna Göre Grupla"
          >
            {groupByType ? (
              <>
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Gruplu Görünüm</span>
              </>
            ) : (
              <>
                <List className="w-3.5 h-3.5 text-slate-400" />
                <span>Tek Liste</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Color Standards Legend & Quick Category Filter */}
      <div className="space-y-2">
        {/* Category Pills with Exact Color Badges - Auto wrap, responsive auto sizing */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
          {categories.map((c, cIdx) => {
            const isActive = selectedType === c.id;
            return (
              <button
                key={`category-filter-${c.id}-${cIdx}`}
                onClick={() => setSelectedType(c.id)}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-bold transition-all border shadow-sm flex-shrink-0"
                style={{
                  borderColor: isActive
                    ? c.color
                    : 'rgba(51, 65, 85, 0.7)',
                  backgroundColor: isActive
                    ? `${c.color}25`
                    : 'rgba(15, 23, 42, 0.8)',
                  color: isActive ? c.color : '#94A3B8',
                  boxShadow: isActive ? `0 0 12px ${c.color}30` : 'none'
                }}
              >
                {c.id !== 'ALL' && (
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                )}
                <span>{c.label}</span>
                <span
                  className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{
                    backgroundColor: isActive ? `${c.color}35` : 'rgba(51, 65, 85, 0.5)',
                    color: isActive ? c.color : '#94A3B8'
                  }}
                >
                  {c.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty State or Faults Grid */}
      {sortedFaults.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-400/60 mx-auto mb-3" />
          <p className="text-sm sm:text-base font-bold text-slate-200">
            {searchTerm || selectedType !== 'ALL' || filterMode !== 'all'
              ? 'Seçilen filtrelere uygun açık arıza bulunamadı.'
              : 'Şu anda açık arıza kaydı bulunmuyor.'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {searchTerm || selectedType !== 'ALL' || filterMode !== 'all'
              ? 'Arama terimini temizleyebilir veya kategori filtrelerini değiştirebilirsiniz.'
              : 'Tüm hatlar sorunsuz çalışıyor veya tüm arızalara müdahale tamamlandı.'}
          </p>
        </div>
      ) : groupByType ? (
        /* SECTION: Grouped by Fault Type & Color Code */
        <div className="space-y-6">
          {typeGroups.map((group) => {
            const TypeIcon = group.config.icon;
            return (
              <section
                key={`group-${group.config.id}`}
                className="space-y-3 p-1 rounded-3xl"
              >
                {/* Group Header Banner */}
                <div
                  className="flex items-center justify-between p-3.5 px-4 rounded-2xl border backdrop-blur-md transition-all shadow-lg"
                  style={{
                    borderLeftColor: group.config.color,
                    borderLeftWidth: '6px',
                    borderColor: `${group.config.color}45`,
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    boxShadow: `0 4px 20px -4px ${group.config.color}15`
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-inner"
                      style={{
                        backgroundColor: `${group.config.color}20`,
                        color: group.config.color,
                        border: `1px solid ${group.config.color}50`
                      }}
                    >
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-white tracking-wide">
                        {group.config.shortName || group.config.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {group.items.length} arıza kaydı müdahale bekliyor
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className="px-3.5 py-1 rounded-full text-xs font-extrabold shadow-sm"
                      style={{
                        backgroundColor: `${group.config.color}20`,
                        color: group.config.color,
                        border: `1px solid ${group.config.color}60`
                      }}
                    >
                      {group.items.length} Arıza
                    </span>
                  </div>
                </div>

                {/* Group Faults Grid / Row List */}
                {isRowMode ? (
                  <div className="flex flex-col gap-1.5 w-full">
                    {group.items.map((f, fIdx) => (
                      <FaultRow
                        key={`grouped-row-${group.config.id}-${f.id || 'flt'}-${fIdx}`}
                        fault={f}
                        currentOperator={currentOperator}
                        viewSettings={viewSettings}
                        onStartIntervention={onStartIntervention}
                        onOpenInterventionModal={onOpenInterventionModal}
                        onJoinHelper={onJoinHelper}
                        onLeaveHelper={onLeaveHelper}
                        onReassign={onReassign}
                        allOperators={allOperators}
                        hideTypeBadge={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    className={`grid gap-3 ${
                      isCompactMode
                        ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
                        : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                    }`}
                  >
                    {group.items.map((f, fIdx) => (
                      <FaultCard
                        key={`grouped-${group.config.id}-${f.id || 'flt'}-${fIdx}`}
                        fault={f}
                        currentOperator={currentOperator}
                        viewSettings={viewSettings}
                        onStartIntervention={onStartIntervention}
                        onOpenInterventionModal={onOpenInterventionModal}
                        onJoinHelper={onJoinHelper}
                        onLeaveHelper={onLeaveHelper}
                        onReassign={onReassign}
                        allOperators={allOperators}
                        hideTypeBadge={true}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        /* SECTION: Flat View (Tasks Assigned + Pool) */
        <>
          {/* SECTION 1: Tasks Assigned to Current Operator */}
          {myAssignedTasks.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Üzerimdeki Görevler ({myAssignedTasks.length})</span>
              </div>
              {isRowMode ? (
                <div className="flex flex-col gap-1.5 w-full">
                  {myAssignedTasks.map((f, fIdx) => (
                    <FaultRow
                      key={`my-row-${f.id || 'flt'}-${fIdx}`}
                      fault={f}
                      currentOperator={currentOperator}
                      viewSettings={viewSettings}
                      onStartIntervention={onStartIntervention}
                      onOpenInterventionModal={onOpenInterventionModal}
                      onJoinHelper={onJoinHelper}
                      onLeaveHelper={onLeaveHelper}
                      onReassign={onReassign}
                      allOperators={allOperators}
                    />
                  ))}
                </div>
              ) : (
                <div
                  className={`grid gap-3 ${
                    isCompactMode
                      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
                      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                  }`}
                >
                  {myAssignedTasks.map((f, fIdx) => (
                    <FaultCard
                      key={`my-task-${f.id || 'flt'}-${fIdx}`}
                      fault={f}
                      currentOperator={currentOperator}
                      viewSettings={viewSettings}
                      onStartIntervention={onStartIntervention}
                      onOpenInterventionModal={onOpenInterventionModal}
                      onJoinHelper={onJoinHelper}
                      onLeaveHelper={onLeaveHelper}
                      onReassign={onReassign}
                      allOperators={allOperators}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* SECTION 2: General Open Pool / All Open Faults */}
          {poolTasks.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  <Flame className="w-4 h-4 text-cyan-400" />
                  <span>
                    {myAssignedTasks.length > 0
                      ? `Açık Arıza Havuzu (${poolTasks.length})`
                      : `Güncel Açık Arızalar (${poolTasks.length})`}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  Tarih: {todayStr}
                </span>
              </div>

              {isRowMode ? (
                <div className="flex flex-col gap-1.5 w-full">
                  {poolTasks.map((f, fIdx) => (
                    <FaultRow
                      key={`pool-row-${f.id || 'flt'}-${fIdx}`}
                      fault={f}
                      currentOperator={currentOperator}
                      viewSettings={viewSettings}
                      onStartIntervention={onStartIntervention}
                      onOpenInterventionModal={onOpenInterventionModal}
                      onJoinHelper={onJoinHelper}
                      onLeaveHelper={onLeaveHelper}
                      onReassign={onReassign}
                      allOperators={allOperators}
                    />
                  ))}
                </div>
              ) : (
                <div
                  className={`grid gap-3 ${
                    isCompactMode
                      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
                      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                  }`}
                >
                  {poolTasks.map((f, fIdx) => (
                    <FaultCard
                      key={`pool-task-${f.id || 'flt'}-${fIdx}`}
                      fault={f}
                      currentOperator={currentOperator}
                      viewSettings={viewSettings}
                      onStartIntervention={onStartIntervention}
                      onOpenInterventionModal={onOpenInterventionModal}
                      onJoinHelper={onJoinHelper}
                      onLeaveHelper={onLeaveHelper}
                      onReassign={onReassign}
                      allOperators={allOperators}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
};
