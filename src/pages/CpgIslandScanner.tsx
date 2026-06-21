import { useState, useMemo } from 'react';
import {
  Dna, Settings, Play, RotateCcw, Info, ChevronDown, ChevronUp,
  Search, PieChart, BarChart3, MapPin, ToggleLeft, ToggleRight,
  Zap
} from 'lucide-react';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { DEFAULT_CPG_SCAN_PARAMETERS } from '@shared/types';
import type { CpgIsland, CpgSite } from '@shared/types';

const MIN_LENGTH_OPTIONS = [100, 200, 300, 500, 1000];
const MIN_GC_OPTIONS = [40, 45, 50, 55, 60];
const MIN_OE_OPTIONS = [0.4, 0.5, 0.6, 0.7, 0.8];
const INITIAL_METH_RATES = [0.0, 0.1, 0.2, 0.3, 0.5, 0.7, 1.0];

type SiteFilter = 'all' | 'island' | 'non-island' | 'methylated' | 'unmethylated';
type SortField = 'position' | 'gcPercent' | 'cpgCount' | 'oeRatio' | 'length';
type SortDir = 'asc' | 'desc';

function CpgIslandMap({ islands, cpgSites, sequenceLength, onSiteClick }: {
  islands: CpgIsland[];
  cpgSites: CpgSite[];
  sequenceLength: number;
  onSiteClick: (pos: number) => void;
}) {
  const width = 900;
  const rowHeight = 50;
  const margin = { top: 30, right: 40, bottom: 50, left: 100 };
  const plotW = width - margin.left - margin.right;
  const plotH = 2 * rowHeight;
  const height = margin.top + margin.bottom + plotH + 20;

  const xScale = (pos: number) => margin.left + (pos / sequenceLength) * plotW;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <rect x={margin.left} y={margin.top} width={plotW} height={plotH} fill="rgba(15,23,42,0.4)" rx="4" />

      {Array.from({ length: 9 }, (_, i) => {
        const pos = (sequenceLength / 8) * i;
        const x = xScale(pos);
        return (
          <g key={i}>
            <line x1={x} y1={margin.top} x2={x} y2={margin.top + plotH} stroke="#334155" strokeDasharray="4,4" strokeWidth={0.5} />
            <text x={x} y={margin.top - 8} textAnchor="middle" fill="#94a3b8" fontSize={10}>
              {Math.round(pos).toLocaleString()}
            </text>
          </g>
        );
      })}

      <text x={width / 2} y={height - 5} textAnchor="middle" fill="#94a3b8" fontSize={11}>
        序列位置 (bp)
      </text>

      <text x={margin.left - 8} y={margin.top + rowHeight / 2 + 4} textAnchor="end" fill="#94a3b8" fontSize={10}>
        CpG 岛
      </text>
      <text x={margin.left - 8} y={margin.top + rowHeight + rowHeight / 2 + 4} textAnchor="end" fill="#94a3b8" fontSize={10}>
        CpG 位点
      </text>

      {islands.map((island) => {
        const x1 = xScale(island.startPosition);
        const x2 = xScale(island.endPosition);
        const y = margin.top + 8;
        const w = Math.max(x2 - x1, 2);
        const opacity = 0.5 + 0.5 * Math.min(island.oeRatio / 1.5, 1);
        return (
          <g key={island.id}>
            <rect
              x={x1}
              y={y}
              width={w}
              height={rowHeight - 16}
              fill="#8b5cf6"
              opacity={opacity}
              rx={3}
            />
            <text x={x1 + w / 2} y={y + (rowHeight - 16) / 2 + 4} textAnchor="middle" fill="#fff" fontSize={8} fontWeight={600}>
              {island.length >= 50 ? island.id.replace('cpg_', '') : ''}
            </text>
          </g>
        );
      })}

      {cpgSites.map((site) => {
        const x = xScale(site.position);
        const y = margin.top + rowHeight + rowHeight / 2;
        const color = site.methylated ? '#f43f5e' : '#10b981';
        return (
          <g
            key={site.position}
            className="cursor-pointer"
            onClick={() => onSiteClick(site.position)}
          >
            <circle
              cx={x}
              cy={y}
              r={site.inIsland ? 4 : 2.5}
              fill={color}
              opacity={site.inIsland ? 0.9 : 0.5}
              stroke={site.inIsland ? '#fff' : 'none'}
              strokeWidth={site.inIsland ? 0.5 : 0}
            />
          </g>
        );
      })}

      <g transform={`translate(${width - margin.right - 160}, ${margin.top + 8})`}>
        <rect x={0} y={0} width={12} height={10} fill="#8b5cf6" rx={2} opacity={0.7} />
        <text x={16} y={9} fill="#94a3b8" fontSize={10}>CpG 岛</text>
        <circle cx={6} cy={26} r={4} fill="#f43f5e" />
        <text x={16} y={30} fill="#94a3b8" fontSize={10}>甲基化 CpG</text>
        <circle cx={6} cy={42} r={2.5} fill="#10b981" opacity={0.5} />
        <text x={16} y={46} fill="#94a3b8" fontSize={10}>未甲基化 CpG</text>
      </g>
    </svg>
  );
}

function MethylationPieChart({ methylated, unmethylated }: { methylated: number; unmethylated: number }) {
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const r = 70;
  const total = methylated + unmethylated;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-44 text-slate-500">
        无 CpG 位点
      </div>
    );
  }

  const methAngle = (methylated / total) * 360;
  const methRad = (methAngle * Math.PI) / 180;

  const x1 = cx + r * Math.sin(methRad);
  const y1 = cy - r * Math.cos(methRad);
  const largeArc = methAngle > 180 ? 1 : 0;

  const methPath = methylated > 0
    ? `M ${cx} ${cy - r} A ${r} ${r} 0 ${largeArc} 1 ${x1} ${y1} L ${cx} ${cy} Z`
    : '';
  const unmethPath = methylated === 0
    ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z`
    : methylated === total
    ? ''
    : `M ${x1} ${y1} A ${r} ${r} 0 ${1 - largeArc} 1 ${cx} ${cy - r} L ${cx} ${cy} Z`;

  const methPct = ((methylated / total) * 100).toFixed(1);
  const unmethPct = ((unmethylated / total) * 100).toFixed(1);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-44 h-44">
      {methPath && <path d={methPath} fill="#f43f5e" opacity={0.85} />}
      {unmethPath && <path d={unmethPath} fill="#10b981" opacity={0.7} />}
      <circle cx={cx} cy={cy} r={38} fill="rgba(15,23,42,0.8)" />
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#e2e8f0" fontSize={18} fontWeight={700}>
        {total.toLocaleString()}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#94a3b8" fontSize={10}>
        CpG 位点
      </text>

      <g transform={`translate(8, ${size - 28})`}>
        <rect x={0} y={0} width={10} height={10} fill="#f43f5e" rx={2} opacity={0.85} />
        <text x={14} y={9} fill="#94a3b8" fontSize={10}>甲基化 {methPct}%</text>
        <rect x={90} y={0} width={10} height={10} fill="#10b981" rx={2} opacity={0.7} />
        <text x={104} y={9} fill="#94a3b8" fontSize={10}>未甲基化 {unmethPct}%</text>
      </g>
    </svg>
  );
}

function IslandGcBars({ islands }: { islands: CpgIsland[] }) {
  const width = 500;
  const margin = { top: 20, right: 20, bottom: 50, left: 60 };
  const plotW = width - margin.left - margin.right;
  const plotH = 160;
  const barW = islands.length > 0 ? Math.max(plotW / islands.length * 0.6, 8) : 0;
  const gap = islands.length > 0 ? plotW / islands.length * 0.4 : 0;

  return (
    <svg viewBox={`0 0 ${width} ${margin.top + plotH + margin.bottom}`} className="w-full h-auto">
      {[0, 25, 50, 75, 100].map(tick => {
        const y = margin.top + plotH - (tick / 100) * plotH;
        return (
          <g key={tick}>
            <line x1={margin.left} y1={y} x2={margin.left + plotW} y2={y} stroke="#334155" strokeDasharray="3,3" strokeWidth={0.5} />
            <text x={margin.left - 8} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize={9}>
              {tick}%
            </text>
          </g>
        );
      })}

      {islands.map((island, i) => {
        const x = margin.left + i * (barW + gap) + gap / 2;
        const h = (island.gcPercent / 100) * plotH;
        const y = margin.top + plotH - h;
        const oeH = (Math.min(island.oeRatio, 1.5) / 1.5) * plotH;
        const oeY = margin.top + plotH - oeH;
        return (
          <g key={island.id}>
            <rect x={x} y={y} width={barW * 0.45} height={h} fill="#8b5cf6" opacity={0.8} rx={2} />
            <rect x={x + barW * 0.55} y={oeY} width={barW * 0.45} height={oeH} fill="#06b6d4" opacity={0.8} rx={2} />
            <text x={x + barW / 2} y={margin.top + plotH + 14} textAnchor="middle" fill="#94a3b8" fontSize={8}>
              {String(i + 1)}
            </text>
          </g>
        );
      })}

      <text x={width / 2} y={margin.top + plotH + 38} textAnchor="middle" fill="#94a3b8" fontSize={10}>
        CpG 岛编号
      </text>
      <text x={10} y={margin.top + plotH / 2} textAnchor="middle" fill="#94a3b8" fontSize={10} transform={`rotate(-90, 10, ${margin.top + plotH / 2})`}>
        比例 (%)
      </text>

      <g transform={`translate(${width - margin.right - 100}, ${margin.top})`}>
        <rect x={0} y={0} width={10} height={10} fill="#8b5cf6" rx={2} opacity={0.8} />
        <text x={14} y={9} fill="#94a3b8" fontSize={9}>GC%</text>
        <rect x={0} y={16} width={10} height={10} fill="#06b6d4" rx={2} opacity={0.8} />
        <text x={14} y={25} fill="#94a3b8" fontSize={9}>O/E 比</text>
      </g>
    </svg>
  );
}

export default function CpgIslandScanner() {
  const {
    samples, cpgScanResult, scanCpgIslands, toggleMethylationSite,
    batchToggleMethylationSites, clearCpgResults, loading, error
  } = useAnalysisStore();

  const [selectedSampleId, setSelectedSampleId] = useState('');
  const [minLength, setMinLength] = useState(DEFAULT_CPG_SCAN_PARAMETERS.minLength);
  const [minGcPercent, setMinGcPercent] = useState(DEFAULT_CPG_SCAN_PARAMETERS.minGcPercent);
  const [minOeRatio, setMinOeRatio] = useState(DEFAULT_CPG_SCAN_PARAMETERS.minOeRatio);
  const [initialMethylationRate, setInitialMethylationRate] = useState(DEFAULT_CPG_SCAN_PARAMETERS.initialMethylationRate);
  const [expandedIslandId, setExpandedIslandId] = useState<string | null>(null);
  const [siteFilter, setSiteFilter] = useState<SiteFilter>('all');
  const [searchText, setSearchText] = useState('');
  const [sortField, setSortField] = useState<SortField>('startPosition' as SortField);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const dnaSamples = useMemo(() => samples.filter(s => s.sequenceType === 'dna'), [samples]);
  const selectedSample = samples.find(s => s.id === selectedSampleId);

  const handleScan = () => {
    if (!selectedSampleId) return;
    scanCpgIslands(selectedSampleId, {
      minLength,
      minGcPercent,
      minOeRatio,
      initialMethylationRate,
    });
  };

  const handleReset = () => {
    setSelectedSampleId('');
    setMinLength(DEFAULT_CPG_SCAN_PARAMETERS.minLength);
    setMinGcPercent(DEFAULT_CPG_SCAN_PARAMETERS.minGcPercent);
    setMinOeRatio(DEFAULT_CPG_SCAN_PARAMETERS.minOeRatio);
    setInitialMethylationRate(DEFAULT_CPG_SCAN_PARAMETERS.initialMethylationRate);
    setExpandedIslandId(null);
    setSiteFilter('all');
    setSearchText('');
    clearCpgResults();
  };

  const handleSiteClick = (pos: number) => {
    toggleMethylationSite(pos);
  };

  const handleBatchToggle = (islandId: string, methylate: boolean) => {
    batchToggleMethylationSites(islandId, methylate);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const filteredSites = useMemo(() => {
    if (!cpgScanResult) return [];
    let result = [...cpgScanResult.cpgSites];

    switch (siteFilter) {
      case 'island':
        result = result.filter(s => s.inIsland);
        break;
      case 'non-island':
        result = result.filter(s => !s.inIsland);
        break;
      case 'methylated':
        result = result.filter(s => s.methylated);
        break;
      case 'unmethylated':
        result = result.filter(s => !s.methylated);
        break;
    }

    if (searchText.trim()) {
      const q = searchText.toUpperCase();
      result = result.filter(s =>
        String(s.position).includes(q) ||
        s.contextSequence.toUpperCase().includes(q) ||
        (s.islandId || '').toUpperCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const cmp = a.position < b.position ? -1 : a.position > b.position ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [cpgScanResult, siteFilter, searchText, sortDir]);

  const sortedIslands = useMemo(() => {
    if (!cpgScanResult) return [];
    const result = [...cpgScanResult.islands];
    result.sort((a, b) => {
      let va: number, vb: number;
      switch (sortField) {
        case 'gcPercent':
          va = a.gcPercent; vb = b.gcPercent; break;
        case 'cpgCount':
          va = a.cpgCount; vb = b.cpgCount; break;
        case 'oeRatio':
          va = a.oeRatio; vb = b.oeRatio; break;
        case 'length':
          va = a.length; vb = b.length; break;
        default:
          va = a.startPosition; vb = b.startPosition;
      }
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [cpgScanResult, sortField, sortDir]);

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <th
      className="cursor-pointer select-none hover:text-white transition-colors"
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortField === field && (
          <span className="text-primary-400 text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>
        )}
      </span>
    </th>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">CpG 岛与甲基化位点扫描器</h1>
          <p className="text-slate-400">识别符合定义的 CpG 岛区域，标记所有 CpG 二核苷酸位点，并模拟甲基化状态切换</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary flex items-center gap-2" onClick={handleReset}>
            <RotateCcw size={16} />
            重置
          </button>
          <button
            className="btn-primary flex items-center gap-2"
            onClick={handleScan}
            disabled={loading || !selectedSampleId}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                扫描中...
              </>
            ) : (
              <>
                <Play size={16} />
                开始扫描
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="card p-4 border-red-500/30 bg-red-500/5">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3 space-y-6">
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Dna size={20} className="text-primary-400" />
              选择样本
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">DNA 样本</label>
                <select
                  className="select-field"
                  value={selectedSampleId}
                  onChange={(e) => setSelectedSampleId(e.target.value)}
                >
                  <option value="">选择样本</option>
                  {dnaSamples.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.sequence.length.toLocaleString()} bp)</option>
                  ))}
                </select>
              </div>

              {selectedSample && (
                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 space-y-1">
                  <p className="text-xs text-slate-500">样本详情</p>
                  <p className="text-sm text-white font-medium">{selectedSample.name}</p>
                  <p className="text-xs text-slate-400">物种: {selectedSample.organism}</p>
                  <p className="text-xs text-slate-400">长度: {selectedSample.sequence.length.toLocaleString()} bp</p>
                </div>
              )}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Settings size={20} className="text-primary-400" />
              扫描参数
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">最小 CpG 岛长度</label>
                <select
                  className="select-field"
                  value={minLength}
                  onChange={(e) => setMinLength(Number(e.target.value))}
                >
                  {MIN_LENGTH_OPTIONS.map(len => (
                    <option key={len} value={len}>{len} bp</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">最小 GC 含量</label>
                <select
                  className="select-field"
                  value={minGcPercent}
                  onChange={(e) => setMinGcPercent(Number(e.target.value))}
                >
                  {MIN_GC_OPTIONS.map(gc => (
                    <option key={gc} value={gc}>{gc}%</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">最小 CpG O/E 比</label>
                <select
                  className="select-field"
                  value={minOeRatio}
                  onChange={(e) => setMinOeRatio(Number(e.target.value))}
                >
                  {MIN_OE_OPTIONS.map(oe => (
                    <option key={oe} value={oe}>{oe}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">初始甲基化率</label>
                <select
                  className="select-field"
                  value={initialMethylationRate}
                  onChange={(e) => setInitialMethylationRate(Number(e.target.value))}
                >
                  {INITIAL_METH_RATES.map(r => (
                    <option key={r} value={r}>{Math.round(r * 100)}%</option>
                  ))}
                </select>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 space-y-2">
                <p className="text-xs text-slate-500">Gardiner-Garden & Frommer 标准</p>
                <p className="text-xs text-slate-400">长度 ≥ 200bp · GC% ≥ 50% · O/E ≥ 0.6</p>
                <p className="text-xs text-slate-500 mt-1">O/E = 观察 CpG 数 / (C数 × G数 / 长度)</p>
              </div>
            </div>
          </div>

          {cpgScanResult && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <PieChart size={20} className="text-primary-400" />
                扫描摘要
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">序列长度</span>
                  <span className="text-white">{cpgScanResult.sequenceLength.toLocaleString()} bp</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">CpG 岛数量</span>
                  <span className="text-violet-400 font-bold text-lg">{cpgScanResult.totalIslands}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">CpG 位点总数</span>
                  <span className="text-white">{cpgScanResult.totalCpgSites.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">岛内 CpG</span>
                  <span className="text-white">{cpgScanResult.cpgSites.filter(s => s.inIsland).length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">甲基化位点</span>
                  <span className="text-rose-400 font-medium">{cpgScanResult.methylatedCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">未甲基化位点</span>
                  <span className="text-emerald-400 font-medium">{cpgScanResult.unmethylatedCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">整体甲基化率</span>
                  <span className="text-primary-400 font-bold">
                    {(cpgScanResult.overallMethylationRate * 100).toFixed(2)}%
                  </span>
                </div>
                {cpgScanResult.totalIslands > 0 && (
                  <>
                    <div className="h-px bg-slate-700 my-2" />
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">平均岛长度</span>
                      <span className="text-white">
                        {Math.round(cpgScanResult.islands.reduce((s, i) => s + i.length, 0) / cpgScanResult.totalIslands).toLocaleString()} bp
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">平均岛 GC%</span>
                      <span className="text-white">
                        {(cpgScanResult.islands.reduce((s, i) => s + i.gcPercent, 0) / cpgScanResult.totalIslands).toFixed(1)}%
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="col-span-9 space-y-6">
          {cpgScanResult ? (
            <>
              <div className="card p-5">
                <h3 className="text-lg font-semibold text-white mb-4">CpG 岛与位点分布图谱</h3>
                <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-4">
                  <CpgIslandMap
                    islands={cpgScanResult.islands}
                    cpgSites={cpgScanResult.cpgSites}
                    sequenceLength={cpgScanResult.sequenceLength}
                    onSiteClick={handleSiteClick}
                  />
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-3">
                  <Info size={14} />
                  <span>点击 CpG 位点可切换甲基化状态。紫色条为 CpG 岛，红色点为甲基化位点，绿色点为未甲基化位点</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="card p-5">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <PieChart size={18} className="text-primary-400" />
                    甲基化状态分布
                  </h3>
                  <div className="flex items-center justify-center">
                    <MethylationPieChart
                      methylated={cpgScanResult.methylatedCount}
                      unmethylated={cpgScanResult.unmethylatedCount}
                    />
                  </div>
                </div>

                <div className="card p-5">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 size={18} className="text-primary-400" />
                    CpG 岛 GC% 与 O/E 比
                  </h3>
                  <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-4">
                    {cpgScanResult.islands.length > 0 ? (
                      <IslandGcBars islands={cpgScanResult.islands} />
                    ) : (
                      <div className="text-center py-10 text-slate-500">未检测到 CpG 岛</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <MapPin size={18} className="text-violet-400" />
                    CpG 岛详细列表
                    <span className="text-sm font-normal text-slate-500">
                      ({sortedIslands.length} 个岛)
                    </span>
                  </h3>
                </div>

                <div className="max-h-[450px] overflow-y-auto">
                  <table className="data-table">
                    <thead className="sticky top-0 z-10">
                      <tr>
                        <SortHeader field="position" label="位置" />
                        <SortHeader field="length" label="长度" />
                        <SortHeader field="gcPercent" label="GC%" />
                        <SortHeader field="cpgCount" label="CpG 数" />
                        <SortHeader field="oeRatio" label="O/E 比" />
                        <th>CpG 密度</th>
                        <th>岛内甲基化率</th>
                        <th>批量操作</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedIslands.map(island => {
                        const sitesInIsland = cpgScanResult.cpgSites.filter(s => s.islandId === island.id);
                        const methInIsland = sitesInIsland.filter(s => s.methylated).length;
                        const methRate = sitesInIsland.length > 0
                          ? ((methInIsland / sitesInIsland.length) * 100).toFixed(1)
                          : '0.0';
                        return (
                          <>
                            <tr key={island.id}>
                              <td className="font-mono text-xs">
                                {island.startPosition.toLocaleString()} - {island.endPosition.toLocaleString()}
                              </td>
                              <td className="font-medium text-white">{island.length.toLocaleString()} bp</td>
                              <td>
                                <span className="font-bold text-violet-400">{island.gcPercent.toFixed(1)}%</span>
                              </td>
                              <td>{island.cpgCount}</td>
                              <td>
                                <span className={`font-bold ${island.oeRatio >= 0.6 ? 'text-cyan-400' : 'text-amber-400'}`}>
                                  {island.oeRatio.toFixed(2)}
                                </span>
                              </td>
                              <td className="text-xs text-slate-400">{island.cpgDensity}%</td>
                              <td>
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-rose-500 rounded-full"
                                      style={{ width: `${methRate}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-white">{methRate}%</span>
                                </div>
                              </td>
                              <td>
                                <div className="flex items-center gap-1">
                                  <button
                                    className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                                    title="全部去甲基化"
                                    onClick={() => handleBatchToggle(island.id, false)}
                                  >
                                    <ToggleLeft size={18} />
                                  </button>
                                  <button
                                    className="p-1 text-rose-400 hover:text-rose-300 transition-colors"
                                    title="全部甲基化"
                                    onClick={() => handleBatchToggle(island.id, true)}
                                  >
                                    <ToggleRight size={18} />
                                  </button>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="p-1 text-slate-400 hover:text-white transition-colors"
                                  onClick={() => setExpandedIslandId(expandedIslandId === island.id ? null : island.id)}
                                >
                                  {expandedIslandId === island.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                              </td>
                            </tr>
                            {expandedIslandId === island.id && (
                              <tr key={`${island.id}-detail`}>
                                <td colSpan={9} className="bg-slate-800/30 p-4">
                                  <div className="grid grid-cols-4 gap-3 mb-4">
                                    <div className="p-2 bg-slate-900/50 rounded-lg text-center">
                                      <p className="text-xs text-slate-500">C 位点</p>
                                      <p className="text-sm text-white font-medium">{island.cSites}</p>
                                    </div>
                                    <div className="p-2 bg-slate-900/50 rounded-lg text-center">
                                      <p className="text-xs text-slate-500">G 位点</p>
                                      <p className="text-sm text-white font-medium">{island.gSites}</p>
                                    </div>
                                    <div className="p-2 bg-slate-900/50 rounded-lg text-center">
                                      <p className="text-xs text-slate-500">观察 CpG</p>
                                      <p className="text-sm text-white font-medium">{island.observedCpg}</p>
                                    </div>
                                    <div className="p-2 bg-slate-900/50 rounded-lg text-center">
                                      <p className="text-xs text-slate-500">期望 CpG</p>
                                      <p className="text-sm text-white font-medium">{island.expectedCpg}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-500 mb-2">序列（{Math.min(island.sequence.length, 200)}bp 预览）</p>
                                    <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 max-h-20 overflow-y-auto break-all leading-relaxed">
                                      {island.sequence.length > 200
                                        ? island.sequence.slice(0, 200) + '...'
                                        : island.sequence
                                      }
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                  {sortedIslands.length === 0 && (
                    <div className="text-center py-10 text-slate-500">
                      未检测到符合参数标准的 CpG 岛
                    </div>
                  )}
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Zap size={18} className="text-primary-400" />
                    CpG 位点列表
                    <span className="text-sm font-normal text-slate-500">
                      ({filteredSites.length} / {cpgScanResult.totalCpgSites} 个位点)
                    </span>
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                      <input
                        type="text"
                        placeholder="搜索位置/序列..."
                        className="pl-8 pr-3 py-1.5 text-sm bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 w-48"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-1 p-1 bg-slate-800/50 rounded-lg">
                      {(['all', 'island', 'non-island', 'methylated', 'unmethylated'] as const).map(val => (
                        <button
                          key={val}
                          className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                            siteFilter === val
                              ? 'bg-primary-600 text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                          onClick={() => setSiteFilter(val)}
                        >
                          {val === 'all' ? '全部' :
                            val === 'island' ? '岛内' :
                            val === 'non-island' ? '岛外' :
                            val === 'methylated' ? '甲基化' : '未甲基化'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="max-h-[500px] overflow-y-auto">
                  <table className="data-table">
                    <thead className="sticky top-0 z-10">
                      <tr>
                        <th>位置</th>
                        <th>所属岛</th>
                        <th>上下文序列</th>
                        <th>甲基化状态</th>
                        <th>切换</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSites.slice(0, 500).map(site => (
                        <tr key={site.position}>
                          <td className="font-mono text-xs text-white">{site.position.toLocaleString()}</td>
                          <td>
                            {site.inIsland ? (
                              <span className="badge bg-violet-500/20 text-violet-400 text-xs">
                                {site.islandId}
                              </span>
                            ) : (
                              <span className="badge bg-slate-700 text-slate-400 text-xs">岛外</span>
                            )}
                          </td>
                          <td className="font-mono text-xs">
                            {site.contextSequence.split('').map((base, i) => {
                              const colors: Record<string, string> = {
                                A: 'text-green-400',
                                T: 'text-red-400',
                                G: 'text-yellow-400',
                                C: 'text-blue-400',
                              };
                              return (
                                <span key={i} className={colors[base] || 'text-slate-400'}>
                                  {base}
                                </span>
                              );
                            })}
                          </td>
                          <td>
                            {site.methylated ? (
                              <span className="badge bg-rose-500/20 text-rose-400 text-xs">甲基化</span>
                            ) : (
                              <span className="badge bg-emerald-500/20 text-emerald-400 text-xs">未甲基化</span>
                            )}
                          </td>
                          <td>
                            <button
                              className={`p-1 transition-colors ${
                                site.methylated
                                  ? 'text-rose-400 hover:text-rose-300'
                                  : 'text-emerald-400 hover:text-emerald-300'
                              }`}
                              onClick={() => handleSiteClick(site.position)}
                              title="切换甲基化状态"
                            >
                              {site.methylated ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredSites.length === 0 && (
                    <div className="text-center py-10 text-slate-500">
                      没有匹配筛选条件的 CpG 位点
                    </div>
                  )}
                  {filteredSites.length > 500 && (
                    <div className="text-center py-3 text-xs text-slate-500">
                      仅显示前 500 个位点，共 {filteredSites.length} 个匹配结果
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="card p-5">
              <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-xl">
                <Dna className="mx-auto text-slate-600 mb-3" size={48} />
                <p className="text-slate-500">选择 DNA 样本并设置参数，点击「开始扫描」识别 CpG 岛和甲基化位点</p>
                <p className="text-slate-600 text-sm mt-2">将按照 Gardiner-Garden & Frommer 标准识别 CpG 岛，标记所有 CpG 位点并模拟甲基化状态</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
