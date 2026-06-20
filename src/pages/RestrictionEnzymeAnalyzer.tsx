import { useState, useMemo } from 'react';
import {
  Scissors, Settings, Play, RotateCcw, Search, Info, ChevronDown, ChevronUp, X
} from 'lucide-react';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import type { CutSite, DigestionFragment, RestrictionEnzyme } from '@shared/types';

const ENZYME_COLORS: Record<string, string> = {
  EcoRI: '#ef4444', BamHI: '#f97316', HindIII: '#eab308', XbaI: '#84cc16',
  SalI: '#22c55e', PstI: '#14b8a6', SphI: '#06b6d4', KpnI: '#3b82f6',
  SacI: '#6366f1', SmaI: '#8b5cf6', XhoI: '#a855f7', NotI: '#d946ef',
  NcoI: '#ec4899', NdeI: '#f43f5e', NheI: '#fb923c', ApaI: '#fbbf24',
  BglII: '#a3e635', ClaI: '#4ade80', EcoRV: '#2dd4bf', ScaI: '#22d3ee',
  SpeI: '#60a5fa', AvrII: '#818cf8', MluI: '#a78bfa', AflII: '#c084fc',
  AgeI: '#e879f9', AscI: '#f472b6', FseI: '#fb7185', PacI: '#fdba74',
  SwuI: '#fcd34d', SbfI: '#bef264', AluI: '#86efac', HaeIII: '#5eead4',
  MspI: '#67e8f9', TaqI: '#93c5fd', HinfI: '#a5b4fc', DdeI: '#c4b5fd',
  RsaI: '#d8b4fe', MboI: '#f0abfc', Sau3AI: '#fda4af', Bsu36I: '#fca5a5',
  BstEII: '#fed7aa', NarI: '#fef08a', BsiWI: '#d9f99d', BsrGI: '#bbf7d0',
  SfiI: '#99f6e4', BsmBI: '#a5f3fc', BsaI: '#bae6fd', FokI: '#c7d2fe',
  BbsI: '#ddd6fe', SapI: '#e9d5ff', HpaI: '#f5d0fe', NruI: '#fecdd3',
  PvuII: '#fde68a', StuI: '#d9f99d', SgrAI: '#a7f3d0', BsrBI: '#bae6fd',
};

const getEnzymeColor = (name: string): string => {
  return ENZYME_COLORS[name] || '#94a3b8';
};

function CutSiteMap({
  cutSites, sequenceLength
}: {
  cutSites: CutSite[];
  sequenceLength: number;
}) {
  const width = 900;
  const height = 80;
  const margin = { top: 25, right: 40, bottom: 25, left: 60 };
  const plotW = width - margin.left - margin.right;

  const enzymeGroups: Record<string, CutSite[]> = {};
  for (const cs of cutSites) {
    if (!enzymeGroups[cs.enzymeName]) enzymeGroups[cs.enzymeName] = [];
    enzymeGroups[cs.enzymeName].push(cs);
  }
  const enzymeNames = Object.keys(enzymeGroups);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <rect x={margin.left} y={margin.top} width={plotW} height={height - margin.top - margin.bottom} fill="rgba(15,23,42,0.4)" rx="4" />

      {Array.from({ length: 9 }, (_, i) => {
        const pos = (sequenceLength / 8) * i;
        const x = margin.left + (pos / sequenceLength) * plotW;
        return (
          <g key={i}>
            <line x1={x} y1={margin.top} x2={x} y2={height - margin.bottom} stroke="#334155" strokeDasharray="4,4" strokeWidth={0.5} />
            <text x={x} y={margin.top - 8} textAnchor="middle" fill="#94a3b8" fontSize={10}>
              {Math.round(pos).toLocaleString()}
            </text>
          </g>
        );
      })}

      {enzymeNames.map((name, gi) => {
        const y = margin.top + 8 + (gi % 3) * 12;
        const color = getEnzymeColor(name);
        return enzymeGroups[name].map((cs, ci) => {
          const x = margin.left + ((cs.position + cs.topCutOffset) / sequenceLength) * plotW;
          return (
            <g key={`${name}_${ci}`}>
              <line x1={x} y1={y} x2={x} y2={y + 20} stroke={color} strokeWidth={1.5} />
              <circle cx={x} cy={y} r={2.5} fill={color} />
              <circle cx={x} cy={y + 20} r={2.5} fill={color} />
            </g>
          );
        });
      })}

      <text x={width / 2} y={height - 3} textAnchor="middle" fill="#94a3b8" fontSize={11}>
        序列位置 (bp)
      </text>
    </svg>
  );
}

function VirtualGelElectrophoresis({
  fragments, selectedEnzymes
}: {
  fragments: DigestionFragment[];
  selectedEnzymes: string[];
}) {
  const laneWidth = 60;
  const laneGap = 30;
  const margin = { top: 40, right: 30, bottom: 50, left: 80 };
  const maxFragmentLen = fragments.length > 0 ? fragments[0].length : 1;
  const logMax = Math.log10(Math.max(maxFragmentLen, 10));
  const logMin = Math.log10(Math.max(1, fragments.length > 0 ? fragments[fragments.length - 1].length : 1));
  const laneHeight = 450;

  const bpToY = (bp: number): number => {
    if (bp <= 0) return laneHeight;
    const logBp = Math.log10(bp);
    const t = (logBp - logMin) / (logMax - logMin + 0.001);
    return laneHeight - t * laneHeight;
  };

  const ladderBps = [10000, 8000, 6000, 5000, 4000, 3000, 2500, 2000, 1500, 1000, 750, 500, 250, 100];

  const totalLanes = 2 + selectedEnzymes.length;
  const totalWidth = margin.left + margin.right + totalLanes * laneWidth + (totalLanes - 1) * laneGap;
  const totalHeight = margin.top + laneHeight + margin.bottom;

  return (
    <svg viewBox={`0 0 ${totalWidth} ${totalHeight}`} className="w-full h-auto" style={{ maxWidth: '900px' }}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="gelBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
      </defs>

      {ladderBps.filter(bp => bp <= maxFragmentLen * 2 || bp >= (fragments.length > 0 ? fragments[fragments.length - 1].length : 0) / 2).map(bp => {
        const y = margin.top + bpToY(bp);
        if (y < margin.top || y > margin.top + laneHeight) return null;
        return (
          <g key={`ladder_${bp}`}>
            <line x1={margin.left - 5} y1={y} x2={margin.left + totalLanes * (laneWidth + laneGap) - laneGap + 5} y2={y} stroke="#1e293b" strokeWidth={0.3} />
            <text x={margin.left - 10} y={y + 4} textAnchor="end" fill="#64748b" fontSize={9}>
              {bp >= 1000 ? `${(bp / 1000).toFixed(bp % 1000 === 0 ? 0 : 1)}kb` : `${bp}bp`}
            </text>
          </g>
        );
      })}

      {(() => {
        const ladderX = margin.left;
        return (
          <g>
            <rect x={ladderX} y={margin.top} width={laneWidth} height={laneHeight} fill="url(#gelBg)" rx={4} opacity={0.7} />
            <text x={ladderX + laneWidth / 2} y={margin.top - 12} textAnchor="middle" fill="#94a3b8" fontSize={10} fontWeight="600">Marker</text>
            {ladderBps.filter(bp => bp <= maxFragmentLen * 1.5).map(bp => {
              const y = margin.top + bpToY(bp);
              if (y < margin.top || y > margin.top + laneHeight) return null;
              return (
                <rect
                  key={`mark_${bp}`}
                  x={ladderX + 8}
                  y={y - 1.5}
                  width={laneWidth - 16}
                  height={3}
                  fill="#94a3b8"
                  opacity={0.6}
                  rx={1}
                />
              );
            })}
          </g>
        );
      })()}

      {(() => {
        const allX = margin.left + laneWidth + laneGap;
        return (
          <g>
            <rect x={allX} y={margin.top} width={laneWidth} height={laneHeight} fill="url(#gelBg)" rx={4} opacity={0.7} />
            <text x={allX + laneWidth / 2} y={margin.top - 12} textAnchor="middle" fill="#94a3b8" fontSize={10} fontWeight="600">全酶切</text>
            {fragments.map((frag, fi) => {
              const y = margin.top + bpToY(frag.length);
              const barHeight = Math.max(2, 5 - Math.log10(frag.length) * 0.5);
              const color = getEnzymeColor(frag.leftEnzyme) !== '#94a3b8' ? getEnzymeColor(frag.leftEnzyme) : getEnzymeColor(frag.rightEnzyme);
              return (
                <g key={`frag_${fi}`} filter="url(#glow)">
                  <rect
                    x={allX + 6}
                    y={y - barHeight / 2}
                    width={laneWidth - 12}
                    height={barHeight}
                    fill={color}
                    opacity={0.9}
                    rx={1}
                  />
                </g>
              );
            })}
          </g>
        );
      })()}

      {selectedEnzymes.map((enzymeName, ei) => {
        const enzFragments = fragments.filter(f => f.leftEnzyme === enzymeName || f.rightEnzyme === enzymeName);
        const enzCutSites: number[] = [];
        for (const f of fragments) {
          if (f.leftEnzyme === enzymeName) enzCutSites.push(f.start);
          if (f.rightEnzyme === enzymeName) enzCutSites.push(f.end);
        }

        const singleFragments: DigestionFragment[] = [];
        const allCuts = [...new Set(enzCutSites)].sort((a, b) => a - b);
        if (allCuts.length === 0) {
          singleFragments.push({ start: 1, end: fragments.length > 0 ? fragments[0].length + (fragments.length > 1 ? fragments.reduce((s, f) => s + f.length, 0) - fragments[0].length : 0) : 0, length: fragments.reduce((s, f) => s + f.length, 0), leftEnzyme: '—', rightEnzyme: '—' });
        } else {
          const totalLen = fragments.reduce((s, f) => s + f.length, 0);
          if (allCuts[0] > 1) singleFragments.push({ start: 1, end: allCuts[0] - 1, length: allCuts[0] - 1, leftEnzyme: '—', rightEnzyme: enzymeName });
          for (let i = 0; i < allCuts.length - 1; i++) {
            singleFragments.push({ start: allCuts[i], end: allCuts[i + 1] - 1, length: allCuts[i + 1] - allCuts[i], leftEnzyme: enzymeName, rightEnzyme: enzymeName });
          }
          if (allCuts[allCuts.length - 1] <= totalLen) singleFragments.push({ start: allCuts[allCuts.length - 1], end: totalLen, length: totalLen - allCuts[allCuts.length - 1] + 1, leftEnzyme: enzymeName, rightEnzyme: '—' });
        }

        const laneX = margin.left + (2 + ei) * (laneWidth + laneGap);
        const color = getEnzymeColor(enzymeName);

        return (
          <g key={`enz_${enzymeName}`}>
            <rect x={laneX} y={margin.top} width={laneWidth} height={laneHeight} fill="url(#gelBg)" rx={4} opacity={0.7} />
            <text x={laneX + laneWidth / 2} y={margin.top - 12} textAnchor="middle" fill={color} fontSize={9} fontWeight="600">{enzymeName}</text>
            {singleFragments.map((frag, fi) => {
              const y = margin.top + bpToY(frag.length);
              const barHeight = Math.max(2, 5 - Math.log10(Math.max(frag.length, 1)) * 0.5);
              return (
                <g key={`efrag_${fi}`} filter="url(#glow)">
                  <rect
                    x={laneX + 6}
                    y={y - barHeight / 2}
                    width={laneWidth - 12}
                    height={barHeight}
                    fill={color}
                    opacity={0.85}
                    rx={1}
                  />
                </g>
              );
            })}
          </g>
        );
      })}

      <text x={margin.left - 10} y={margin.top + laneHeight / 2} textAnchor="middle" fill="#94a3b8" fontSize={11} transform={`rotate(-90, ${margin.left - 10}, ${margin.top + laneHeight / 2})`}>
        片段大小 (bp)
      </text>
    </svg>
  );
}

function SequenceViewerWithCuts({
  sequence, cutSites
}: {
  sequence: string;
  cutSites: CutSite[];
}) {
  const charsPerLine = 60;
  const totalLines = Math.ceil(sequence.length / charsPerLine);
  const [visibleLines, setVisibleLines] = useState(10);
  const showExpand = totalLines > visibleLines;

  const cutPositions = new Map<number, CutSite>();
  for (const cs of cutSites) {
    cutPositions.set(cs.position, cs);
  }

  const renderLine = (lineIdx: number) => {
    const start = lineIdx * charsPerLine;
    const end = Math.min(start + charsPerLine, sequence.length);
    const lineNum = start + 1;
    const chars: React.ReactNode[] = [];

    for (let i = start; i < end; i++) {
      const base = sequence[i];
      const cs = cutPositions.get(i);
      if (cs) {
        const color = getEnzymeColor(cs.enzymeName);
        chars.push(
          <span key={i} style={{ color, fontWeight: 700, backgroundColor: `${color}20`, borderRadius: '2px', padding: '0 1px' }} title={`${cs.enzymeName} @ ${i + 1}`}>
            {base}
          </span>
        );
      } else {
        chars.push(<span key={i} className="text-slate-300">{base}</span>);
      }
    }

    return (
      <div key={lineIdx} className="flex items-start gap-3 font-mono text-xs leading-relaxed">
        <span className="text-slate-600 w-16 text-right shrink-0 select-none">{lineNum.toLocaleString()}</span>
        <span className="tracking-wider break-all">{chars}</span>
      </div>
    );
  };

  return (
    <div className="space-y-0.5">
      {Array.from({ length: Math.min(totalLines, visibleLines) }, (_, i) => renderLine(i))}
      {showExpand && (
        <button
          className="text-xs text-primary-400 hover:text-primary-300 mt-2"
          onClick={() => setVisibleLines(Math.min(totalLines, visibleLines + 20))}
        >
          显示更多 ({totalLines - visibleLines} 行剩余)...
        </button>
      )}
    </div>
  );
}

export default function RestrictionEnzymeAnalyzer() {
  const {
    samples, digestionResult, restrictionEnzymes, analyzeRestrictionEnzyme, loading, error
  } = useAnalysisStore();

  const [selectedSampleId, setSelectedSampleId] = useState('');
  const [selectedEnzymeNames, setSelectedEnzymeNames] = useState<string[]>([]);
  const [enzymeSearch, setEnzymeSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'II' | 'IIS'>('all');
  const [expandedFragmentIdx, setExpandedFragmentIdx] = useState<number | null>(null);
  const [showEnzymePanel, setShowEnzymePanel] = useState(false);

  const dnaSamples = useMemo(() => samples.filter(s => s.sequenceType === 'dna'), [samples]);
  const selectedSample = samples.find(s => s.id === selectedSampleId);

  const filteredEnzymes = useMemo(() => {
    let result = restrictionEnzymes;
    if (typeFilter !== 'all') {
      result = result.filter(e => e.type === typeFilter);
    }
    if (enzymeSearch.trim()) {
      const q = enzymeSearch.toUpperCase();
      result = result.filter(e =>
        e.name.toUpperCase().includes(q) ||
        e.recognitionSite.toUpperCase().includes(q) ||
        e.organism.toUpperCase().includes(q)
      );
    }
    return result;
  }, [restrictionEnzymes, typeFilter, enzymeSearch]);

  const toggleEnzyme = (name: string) => {
    setSelectedEnzymeNames(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const handleDigest = () => {
    if (!selectedSampleId || selectedEnzymeNames.length === 0) return;
    analyzeRestrictionEnzyme(selectedSampleId, selectedEnzymeNames);
  };

  const handleReset = () => {
    setSelectedSampleId('');
    setSelectedEnzymeNames([]);
    setEnzymeSearch('');
    setTypeFilter('all');
    setExpandedFragmentIdx(null);
    setShowEnzymePanel(false);
  };

  const enzymeCutSiteCounts = useMemo(() => {
    if (!digestionResult) return {};
    const counts: Record<string, number> = {};
    for (const cs of digestionResult.cutSites) {
      counts[cs.enzymeName] = (counts[cs.enzymeName] || 0) + 1;
    }
    return counts;
  }, [digestionResult]);

  const quickEnzymeSets = useMemo(() => [
    { label: '常用II型酶', enzymes: ['EcoRI', 'BamHI', 'HindIII', 'XbaI', 'SalI', 'XhoI', 'NotI', 'PstI'] },
    { label: '平末端酶', enzymes: ['SmaI', 'EcoRV', 'HpaI', 'PvuII', 'StuI', 'NruI', 'AluI', 'HaeIII', 'ScaI', 'RsaI'] },
    { label: 'IIS型酶', enzymes: ['BsmBI', 'BsaI', 'FokI', 'BbsI', 'SapI'] },
    { label: '稀有切割酶', enzymes: ['NotI', 'AscI', 'PacI', 'FseI', 'SfiI', 'SbfI', 'SgrAI'] },
  ], []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">限制性内切酶虚拟酶切</h1>
          <p className="text-slate-400">内置 {restrictionEnzymes.length}+ 种限制酶识别位点数据库，在序列上标记切位，生成虚拟凝胶电泳条带模式图</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary flex items-center gap-2" onClick={handleReset}>
            <RotateCcw size={16} />
            重置
          </button>
          <button
            className="btn-primary flex items-center gap-2"
            onClick={handleDigest}
            disabled={loading || !selectedSampleId || selectedEnzymeNames.length === 0}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                酶切中...
              </>
            ) : (
              <>
                <Scissors size={16} />
                开始酶切
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
              <Scissors size={20} className="text-primary-400" />
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
              选择内切酶
            </h2>

            <div className="space-y-3">
              <p className="text-xs text-slate-500">快捷选择</p>
              {quickEnzymeSets.map(qs => (
                <div key={qs.label} className="space-y-1">
                  <p className="text-xs text-slate-400">{qs.label}</p>
                  <div className="flex flex-wrap gap-1">
                    {qs.enzymes.map(name => {
                      const selected = selectedEnzymeNames.includes(name);
                      return (
                        <button
                          key={name}
                          className={`px-2 py-0.5 text-xs rounded-md font-mono transition-all ${
                            selected
                              ? 'text-white shadow-sm'
                              : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700'
                          }`}
                          style={selected ? { backgroundColor: getEnzymeColor(name) } : undefined}
                          onClick={() => toggleEnzyme(name)}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700">
              <button
                className="w-full text-sm text-primary-400 hover:text-primary-300 flex items-center justify-center gap-1"
                onClick={() => setShowEnzymePanel(!showEnzymePanel)}
              >
                {showEnzymePanel ? '收起' : '展开'}全部酶列表
                {showEnzymePanel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {showEnzymePanel && (
              <div className="mt-3 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input
                    type="text"
                    placeholder="搜索酶名称/位点..."
                    className="pl-8 pr-3 py-1.5 text-sm bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 w-full"
                    value={enzymeSearch}
                    onChange={(e) => setEnzymeSearch(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-800/50 rounded-lg">
                  {(['all', 'II', 'IIS'] as const).map(val => (
                    <button
                      key={val}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                        typeFilter === val
                          ? 'bg-primary-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      onClick={() => setTypeFilter(val)}
                    >
                      {val === 'all' ? '全部' : val === 'II' ? 'II型' : 'IIS型'}
                    </button>
                  ))}
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredEnzymes.map(enzyme => {
                    const selected = selectedEnzymeNames.includes(enzyme.name);
                    return (
                      <button
                        key={enzyme.name}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-all ${
                          selected
                            ? 'bg-primary-600/20 text-white border border-primary-500/30'
                            : 'bg-slate-800/30 text-slate-400 hover:bg-slate-800/50 border border-transparent'
                        }`}
                        onClick={() => toggleEnzyme(enzyme.name)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getEnzymeColor(enzyme.name) }} />
                          <span className="font-mono font-medium">{enzyme.name}</span>
                        </div>
                        <span className="font-mono text-slate-500">{enzyme.recognitionSite}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedEnzymeNames.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-500">已选择 {selectedEnzymeNames.length} 种酶</p>
                  <button
                    className="text-xs text-red-400 hover:text-red-300"
                    onClick={() => setSelectedEnzymeNames([])}
                  >
                    清除全部
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedEnzymeNames.map(name => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md font-mono text-white"
                      style={{ backgroundColor: getEnzymeColor(name) }}
                    >
                      {name}
                      <button onClick={() => toggleEnzyme(name)} className="hover:bg-white/20 rounded-full p-0.5">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {digestionResult && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Info size={20} className="text-primary-400" />
                酶切摘要
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">序列长度</span>
                  <span className="text-white">{digestionResult.sequenceLength.toLocaleString()} bp</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">使用酶数</span>
                  <span className="text-white">{digestionResult.selectedEnzymes.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">切点总数</span>
                  <span className="text-primary-400 font-bold text-lg">{digestionResult.totalCutSites}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">片段数</span>
                  <span className="text-white">{digestionResult.fragmentCount}</span>
                </div>
                {digestionResult.fragments.length > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">最大片段</span>
                      <span className="text-white">{digestionResult.fragments[0].length.toLocaleString()} bp</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">最小片段</span>
                      <span className="text-white">{digestionResult.fragments[digestionResult.fragments.length - 1].length.toLocaleString()} bp</span>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-xs text-slate-500 mb-3">各酶切点数</p>
                <div className="space-y-1.5">
                  {digestionResult.selectedEnzymes.map(name => (
                    <div key={name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getEnzymeColor(name) }} />
                        <span className="font-mono" style={{ color: getEnzymeColor(name) }}>{name}</span>
                      </div>
                      <span className="text-white">{enzymeCutSiteCounts[name] || 0} 切点</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="col-span-9 space-y-6">
          {digestionResult ? (
            <>
              <div className="card p-5">
                <h3 className="text-lg font-semibold text-white mb-4">切位点分布图谱</h3>
                <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-4">
                  <CutSiteMap cutSites={digestionResult.cutSites} sequenceLength={digestionResult.sequenceLength} />
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-3">
                  <Info size={14} />
                  <span>彩色竖线标记各酶切位点位置，不同颜色对应不同内切酶</span>
                </div>
                <div className="flex flex-wrap gap-3 mt-3">
                  {digestionResult.selectedEnzymes.map(name => (
                    <div key={name} className="flex items-center gap-1.5 text-xs">
                      <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: getEnzymeColor(name) }} />
                      <span className="font-mono" style={{ color: getEnzymeColor(name) }}>{name}</span>
                      <span className="text-slate-500">({enzymeCutSiteCounts[name] || 0})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-5">
                <h3 className="text-lg font-semibold text-white mb-4">虚拟凝胶电泳</h3>
                <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-6">
                  <VirtualGelElectrophoresis fragments={digestionResult.fragments} selectedEnzymes={digestionResult.selectedEnzymes} />
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-3">
                  <Info size={14} />
                  <span>左起第一泳道为 DNA Marker，第二泳道为全酶切结果，后续各泳道为单酶切结果。Y轴采用对数刻度</span>
                </div>
              </div>

              <div className="card p-5">
                <h3 className="text-lg font-semibold text-white mb-4">序列切位标记</h3>
                <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                  <SequenceViewerWithCuts
                    sequence={selectedSample?.sequence.toUpperCase().replace(/[^ATGC]/g, '') || ''}
                    cutSites={digestionResult.cutSites}
                  />
                </div>
                <div className="flex flex-wrap gap-3 mt-3">
                  {digestionResult.selectedEnzymes.map(name => (
                    <div key={name} className="flex items-center gap-1.5 text-xs">
                      <span className="font-mono font-bold" style={{ color: getEnzymeColor(name), backgroundColor: `${getEnzymeColor(name)}20`, padding: '1px 4px', borderRadius: '3px' }}>
                        A
                      </span>
                      <span className="text-slate-400">{name} 切位标记</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-5">
                <h3 className="text-lg font-semibold text-white mb-4">酶切片段列表</h3>
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="data-table">
                    <thead className="sticky top-0 z-10">
                      <tr>
                        <th>序号</th>
                        <th>起止位置</th>
                        <th>片段长度</th>
                        <th>5&apos;端酶</th>
                        <th>3&apos;端酶</th>
                        <th>末端类型</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {digestionResult.fragments.map((frag, idx) => {
                        const leftEnzyme = restrictionEnzymes.find(e => e.name === frag.leftEnzyme);
                        const rightEnzyme = restrictionEnzymes.find(e => e.name === frag.rightEnzyme);
                        const isBluntLeft = leftEnzyme && leftEnzyme.cutTopStrand === leftEnzyme.cutBottomStrand;
                        const isBluntRight = rightEnzyme && rightEnzyme.cutTopStrand === rightEnzyme.cutBottomStrand;
                        const isBlunt = (isBluntLeft && frag.leftEnzyme !== '—') || (isBluntRight && frag.rightEnzyme !== '—');

                        return (
                          <>
                            <tr key={idx}>
                              <td className="font-mono text-xs">{idx + 1}</td>
                              <td className="font-mono text-xs">{frag.start.toLocaleString()} - {frag.end.toLocaleString()}</td>
                              <td>
                                <span className={`font-bold ${
                                  frag.length > 1000 ? 'text-primary-400' :
                                  frag.length > 500 ? 'text-teal-400' :
                                  frag.length > 100 ? 'text-amber-400' : 'text-rose-400'
                                }`}>
                                  {frag.length.toLocaleString()} bp
                                </span>
                              </td>
                              <td>
                                {frag.leftEnzyme === '—' ? (
                                  <span className="text-slate-500">—</span>
                                ) : (
                                  <span className="font-mono text-xs" style={{ color: getEnzymeColor(frag.leftEnzyme) }}>{frag.leftEnzyme}</span>
                                )}
                              </td>
                              <td>
                                {frag.rightEnzyme === '—' ? (
                                  <span className="text-slate-500">—</span>
                                ) : (
                                  <span className="font-mono text-xs" style={{ color: getEnzymeColor(frag.rightEnzyme) }}>{frag.rightEnzyme}</span>
                                )}
                              </td>
                              <td>
                                {isBlunt ? (
                                  <span className="badge bg-slate-500/20 text-slate-400">平末端</span>
                                ) : (
                                  <span className="badge bg-primary-500/20 text-primary-400">粘性末端</span>
                                )}
                              </td>
                              <td>
                                <button
                                  className="p-1 text-slate-400 hover:text-white transition-colors"
                                  onClick={() => setExpandedFragmentIdx(expandedFragmentIdx === idx ? null : idx)}
                                >
                                  {expandedFragmentIdx === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                              </td>
                            </tr>
                            {expandedFragmentIdx === idx && (
                              <tr key={`${idx}-detail`}>
                                <td colSpan={7} className="bg-slate-800/30 p-4">
                                  <div className="grid grid-cols-4 gap-3">
                                    <div className="p-2 bg-slate-900/50 rounded-lg text-center">
                                      <p className="text-xs text-slate-500">起始</p>
                                      <p className="text-sm text-white font-medium">{frag.start.toLocaleString()}</p>
                                    </div>
                                    <div className="p-2 bg-slate-900/50 rounded-lg text-center">
                                      <p className="text-xs text-slate-500">终止</p>
                                      <p className="text-sm text-white font-medium">{frag.end.toLocaleString()}</p>
                                    </div>
                                    <div className="p-2 bg-slate-900/50 rounded-lg text-center">
                                      <p className="text-xs text-slate-500">长度</p>
                                      <p className="text-sm text-primary-400 font-bold">{frag.length.toLocaleString()} bp</p>
                                    </div>
                                    <div className="p-2 bg-slate-900/50 rounded-lg text-center">
                                      <p className="text-xs text-slate-500">末端</p>
                                      <p className="text-sm text-white font-medium">{isBlunt ? '平末端' : '粘性末端'}</p>
                                    </div>
                                  </div>
                                  {leftEnzyme && (
                                    <div className="mt-2 p-2 bg-slate-900/50 rounded-lg text-xs">
                                      <span className="text-slate-500">5&apos;端酶: </span>
                                      <span className="font-mono" style={{ color: getEnzymeColor(frag.leftEnzyme) }}>{frag.leftEnzyme}</span>
                                      <span className="text-slate-500"> | 位点: </span>
                                      <span className="text-white font-mono">{leftEnzyme.recognitionSite}</span>
                                      <span className="text-slate-500"> | 切割: </span>
                                      <span className="text-white font-mono">{leftEnzyme.cutTopStrand}/{leftEnzyme.cutBottomStrand}</span>
                                    </div>
                                  )}
                                  {rightEnzyme && (
                                    <div className="mt-1 p-2 bg-slate-900/50 rounded-lg text-xs">
                                      <span className="text-slate-500">3&apos;端酶: </span>
                                      <span className="font-mono" style={{ color: getEnzymeColor(frag.rightEnzyme) }}>{frag.rightEnzyme}</span>
                                      <span className="text-slate-500"> | 位点: </span>
                                      <span className="text-white font-mono">{rightEnzyme.recognitionSite}</span>
                                      <span className="text-slate-500"> | 切割: </span>
                                      <span className="text-white font-mono">{rightEnzyme.cutTopStrand}/{rightEnzyme.cutBottomStrand}</span>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="card p-5">
              <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-xl">
                <Scissors className="mx-auto text-slate-600 mb-3" size={48} />
                <p className="text-slate-500">选择样本和限制酶，点击「开始酶切」进行虚拟酶切分析</p>
                <p className="text-slate-600 text-sm mt-2">系统内置 {restrictionEnzymes.length}+ 种常见限制酶，支持IUPAC模糊匹配和多酶联合酶切</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
