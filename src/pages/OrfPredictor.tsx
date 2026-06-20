import { useState, useMemo } from 'react';
import {
  Dna, Settings, Play, RotateCcw, Search, ChevronDown, ChevronUp, Info, ArrowUpDown
} from 'lucide-react';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import type { OrfRecord } from '@shared/types';

const MIN_ORF_LENGTHS = [75, 100, 150, 200, 300, 450];

type SortField = 'orfLength' | 'gcPercent' | 'proteinLength' | 'startPosition';
type SortDir = 'asc' | 'desc';

function OrfMap({ orfs, sequenceLength }: { orfs: OrfRecord[]; sequenceLength: number }) {
  const width = 900;
  const rowHeight = 18;
  const margin = { top: 30, right: 40, bottom: 30, left: 60 };
  const plotW = width - margin.left - margin.right;

  const strandGroups: Record<string, OrfRecord[]> = {};
  for (const orf of orfs) {
    const key = `${orf.strand}${orf.frame}`;
    if (!strandGroups[key]) strandGroups[key] = [];
    strandGroups[key].push(orf);
  }

  const sortedKeys = Object.keys(strandGroups).sort((a, b) => {
    if (a[0] !== b[0]) return a[0] === '+' ? -1 : 1;
    return parseInt(a[1]) - parseInt(b[1]);
  });

  const totalRows = sortedKeys.length;
  const height = margin.top + margin.bottom + totalRows * rowHeight + 20;

  const rowLabels: Record<string, string> = {};
  for (const key of sortedKeys) {
    const strand = key[0] === '+' ? '正链' : '负链';
    const frame = key[1];
    rowLabels[key] = `${strand} +${frame}`;
  }

  const strandColors: Record<string, string> = {
    '+': '#14b8a6',
    '-': '#f59e0b',
  };

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

      <text x={width / 2} y={height - 5} textAnchor="middle" fill="#94a3b8" fontSize={11}>
        序列位置 (bp)
      </text>

      {sortedKeys.map((key, rowIdx) => {
        const y = margin.top + rowIdx * rowHeight + rowHeight / 2;
        const groupOrfs = strandGroups[key];
        const color = strandColors[key[0]];

        return (
          <g key={key}>
            <text x={margin.left - 8} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize={10}>
              {rowLabels[key]}
            </text>
            {groupOrfs.map((orf, oi) => {
              const x1 = margin.left + (orf.startPosition / sequenceLength) * plotW;
              const x2 = margin.left + (orf.endPosition / sequenceLength) * plotW;
              const w = Math.max(x2 - x1, 2);
              const opacity = 0.4 + 0.6 * Math.min(orf.orfLength / 500, 1);
              return (
                <rect
                  key={oi}
                  x={x1}
                  y={y - 5}
                  width={w}
                  height={10}
                  fill={color}
                  opacity={opacity}
                  rx={2}
                />
              );
            })}
          </g>
        );
      })}

      {sortedKeys.length > 0 && (
        <g transform={`translate(${width - margin.right - 80}, ${margin.top})`}>
          <rect x={0} y={0} width={12} height={10} fill="#14b8a6" rx={2} opacity={0.8} />
          <text x={16} y={9} fill="#94a3b8" fontSize={10}>正链 (+)</text>
          <rect x={0} y={16} width={12} height={10} fill="#f59e0b" rx={2} opacity={0.8} />
          <text x={16} y={25} fill="#94a3b8" fontSize={10}>负链 (-)</text>
        </g>
      )}
    </svg>
  );
}

function GcDistributionChart({ orfs }: { orfs: OrfRecord[] }) {
  const width = 400;
  const height = 220;
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  const bins = Array.from({ length: 10 }, (_, i) => ({
    min: i * 10,
    max: (i + 1) * 10,
    count: 0,
  }));

  for (const orf of orfs) {
    const binIdx = Math.min(Math.floor(orf.gcPercent / 10), 9);
    bins[binIdx].count++;
  }

  const maxCount = Math.max(...bins.map(b => b.count), 1);
  const barWidth = plotW / bins.length * 0.7;
  const gap = plotW / bins.length * 0.3;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {[0, 0.25, 0.5, 0.75, 1.0].map(tick => {
        const y = margin.top + plotH - tick * plotH;
        return (
          <g key={tick}>
            <line x1={margin.left} y1={y} x2={margin.left + plotW} y2={y} stroke="#334155" strokeDasharray="3,3" strokeWidth={0.5} />
            <text x={margin.left - 8} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize={10}>
              {Math.round(tick * maxCount)}
            </text>
          </g>
        );
      })}

      {bins.map((bin, i) => {
        const x = margin.left + i * (plotW / bins.length) + gap / 2;
        const barH = maxCount > 0 ? (bin.count / maxCount) * plotH : 0;
        const y = margin.top + plotH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={barH} fill="#14b8a6" rx={3} opacity={0.8} />
            <text x={x + barWidth / 2} y={margin.top + plotH + 16} textAnchor="middle" fill="#94a3b8" fontSize={9}>
              {bin.min}-{bin.max}
            </text>
          </g>
        );
      })}

      <text x={width / 2} y={height - 3} textAnchor="middle" fill="#94a3b8" fontSize={11}>
        GC含量 (%)
      </text>
      <text x={14} y={height / 2} textAnchor="middle" fill="#94a3b8" fontSize={11} transform={`rotate(-90, 14, ${height / 2})`}>
        ORF数量
      </text>
    </svg>
  );
}

export default function OrfPredictor() {
  const {
    samples, orfPredictionResult, predictOrf, loading, error
  } = useAnalysisStore();

  const [selectedSampleId, setSelectedSampleId] = useState('');
  const [minOrfLength, setMinOrfLength] = useState(150);
  const [expandedOrfId, setExpandedOrfId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('orfLength');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [strandFilter, setStrandFilter] = useState<'all' | '+' | '-'>('all');
  const [searchText, setSearchText] = useState('');

  const dnaSamples = useMemo(() => samples.filter(s => s.sequenceType === 'dna'), [samples]);
  const selectedSample = samples.find(s => s.id === selectedSampleId);

  const handlePredict = () => {
    if (!selectedSampleId) return;
    predictOrf(selectedSampleId, minOrfLength);
  };

  const handleReset = () => {
    setSelectedSampleId('');
    setMinOrfLength(150);
    setExpandedOrfId(null);
    setStrandFilter('all');
    setSearchText('');
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const filteredOrfs = useMemo(() => {
    if (!orfPredictionResult) return [];
    let result = orfPredictionResult.orfs;

    if (strandFilter !== 'all') {
      result = result.filter(o => o.strand === strandFilter);
    }

    if (searchText.trim()) {
      const q = searchText.toUpperCase();
      result = result.filter(o =>
        o.proteinSequence.toUpperCase().includes(q) ||
        o.nucleotideSequence.toUpperCase().includes(q) ||
        o.id.toUpperCase().includes(q)
      );
    }

    result = [...result].sort((a, b) => {
      const va = a[sortField];
      const vb = b[sortField];
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [orfPredictionResult, strandFilter, searchText, sortField, sortDir]);

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <th
      className="cursor-pointer select-none hover:text-white transition-colors"
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown size={12} className={sortField === field ? 'text-primary-400' : 'text-slate-600'} />
      </span>
    </th>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">开放阅读框预测器</h1>
          <p className="text-slate-400">扫描6个阅读框，识别所有潜在ORF（起始密码子→终止密码子），输出蛋白质序列、长度及GC特征</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary flex items-center gap-2" onClick={handleReset}>
            <RotateCcw size={16} />
            重置
          </button>
          <button
            className="btn-primary flex items-center gap-2"
            onClick={handlePredict}
            disabled={loading || !selectedSampleId}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                预测中...
              </>
            ) : (
              <>
                <Play size={16} />
                开始预测
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
              预测参数
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">最小ORF长度 (nt)</label>
                <select
                  className="select-field"
                  value={minOrfLength}
                  onChange={(e) => setMinOrfLength(Number(e.target.value))}
                >
                  {MIN_ORF_LENGTHS.map(len => (
                    <option key={len} value={len}>{len} nt ({Math.floor(len / 3)} aa)</option>
                  ))}
                </select>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 space-y-2">
                <p className="text-xs text-slate-500">阅读框说明</p>
                <div className="flex items-center gap-2">
                  <span className="badge bg-teal-500/20 text-teal-400">+1 +2 +3</span>
                  <span className="text-xs text-slate-400">正链3个阅读框</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge bg-amber-500/20 text-amber-400">-1 -2 -3</span>
                  <span className="text-xs text-slate-400">负链3个阅读框</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">起始密码子: ATG | 终止密码子: TAA / TAG / TGA</p>
              </div>
            </div>
          </div>

          {orfPredictionResult && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Info size={20} className="text-primary-400" />
                预测摘要
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">序列长度</span>
                  <span className="text-white">{orfPredictionResult.sequenceLength.toLocaleString()} bp</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">最小ORF长度</span>
                  <span className="text-white">{orfPredictionResult.minOrfLength} nt</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">检出ORF总数</span>
                  <span className="text-primary-400 font-bold text-lg">{orfPredictionResult.totalOrfs}</span>
                </div>
                {orfPredictionResult.orfs.length > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">最长ORF</span>
                      <span className="text-white">{orfPredictionResult.orfs[0].orfLength} nt ({orfPredictionResult.orfs[0].proteinLength} aa)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">最短ORF</span>
                      <span className="text-white">{orfPredictionResult.orfs[orfPredictionResult.orfs.length - 1].orfLength} nt</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">平均GC含量</span>
                      <span className="text-white">
                        {(orfPredictionResult.orfs.reduce((s, o) => s + o.gcPercent, 0) / orfPredictionResult.orfs.length).toFixed(2)}%
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-xs text-slate-500 mb-3">各阅读框ORF数量</p>
                <div className="space-y-1.5">
                  {orfPredictionResult.frameSummary.map(fs => (
                    <div key={`${fs.strand}${fs.frame}`} className="flex items-center justify-between text-xs">
                      <span className={fs.strand === '+' ? 'text-teal-400' : 'text-amber-400'}>
                        {fs.strand === '+' ? '正链' : '负链'} +{fs.frame}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-white">{fs.orfCount}</span>
                        {fs.longestOrf > 0 && (
                          <span className="text-slate-500">最长 {fs.longestOrf}nt</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="col-span-9 space-y-6">
          {orfPredictionResult ? (
            <>
              <div className="card p-5">
                <h3 className="text-lg font-semibold text-white mb-4">ORF分布图谱</h3>
                <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-4">
                  <OrfMap orfs={orfPredictionResult.orfs} sequenceLength={orfPredictionResult.sequenceLength} />
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-3">
                  <Info size={14} />
                  <span>每条水平线代表一个阅读框，矩形色块为检出的ORF，颜色深浅反映ORF长度</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="card p-5">
                  <h3 className="text-lg font-semibold text-white mb-4">GC含量分布</h3>
                  <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-4">
                    <GcDistributionChart orfs={orfPredictionResult.orfs} />
                  </div>
                </div>

                <div className="card p-5">
                  <h3 className="text-lg font-semibold text-white mb-4">GC1/GC2/GC3 位置偏好</h3>
                  <div className="space-y-4">
                    {orfPredictionResult.orfs.slice(0, 5).map(orf => (
                      <div key={orf.id} className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-400 font-mono">{orf.id}</span>
                          <span className={`badge text-xs ${orf.strand === '+' ? 'bg-teal-500/20 text-teal-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {orf.strand === '+' ? '正链' : '负链'} +{orf.frame}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {([['GC1', orf.gc1Percent], ['GC2', orf.gc2Percent], ['GC3', orf.gc3Percent]] as const).map(([label, val]) => (
                            <div key={label}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-slate-500">{label}</span>
                                <span className="text-xs font-bold text-primary-400">{val.toFixed(1)}%</span>
                              </div>
                              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
                                  style={{ width: `${val}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">ORF详细列表</h3>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                      <input
                        type="text"
                        placeholder="搜索序列..."
                        className="pl-8 pr-3 py-1.5 text-sm bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 w-48"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-1 p-1 bg-slate-800/50 rounded-lg">
                      {(['all', '+', '-'] as const).map(val => (
                        <button
                          key={val}
                          className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                            strandFilter === val
                              ? 'bg-primary-600 text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                          onClick={() => setStrandFilter(val)}
                        >
                          {val === 'all' ? '全部' : val === '+' ? '正链' : '负链'}
                        </button>
                      ))}
                    </div>
                    <span className="text-xs text-slate-500">{filteredOrfs.length} / {orfPredictionResult.orfs.length} ORF</span>
                  </div>
                </div>

                <div className="max-h-[600px] overflow-y-auto">
                  <table className="data-table">
                    <thead className="sticky top-0 z-10">
                      <tr>
                        <SortHeader field="startPosition" label="位置" />
                        <th>链/框</th>
                        <SortHeader field="orfLength" label="ORF长度" />
                        <SortHeader field="proteinLength" label="蛋白长度" />
                        <SortHeader field="gcPercent" label="GC%" />
                        <th>GC1/2/3</th>
                        <th>起始→终止</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrfs.map(orf => (
                        <>
                          <tr key={orf.id}>
                            <td className="font-mono text-xs">
                              {orf.startPosition.toLocaleString()} - {orf.endPosition.toLocaleString()}
                            </td>
                            <td>
                              <span className={`badge text-xs ${orf.strand === '+' ? 'bg-teal-500/20 text-teal-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                {orf.strand === '+' ? '+' : '-'}{orf.frame}
                              </span>
                            </td>
                            <td className="font-medium text-white">{orf.orfLength} nt</td>
                            <td>{orf.proteinLength} aa</td>
                            <td>
                              <span className={`font-bold ${
                                orf.gcPercent > 60 ? 'text-blue-400' :
                                orf.gcPercent < 40 ? 'text-rose-400' : 'text-white'
                              }`}>
                                {orf.gcPercent.toFixed(1)}%
                              </span>
                            </td>
                            <td className="text-xs text-slate-400 font-mono">
                              {orf.gc1Percent.toFixed(0)}/{orf.gc2Percent.toFixed(0)}/{orf.gc3Percent.toFixed(0)}
                            </td>
                            <td className="text-xs font-mono">
                              <span className="text-emerald-400">{orf.startCodon}</span>
                              <span className="text-slate-600">→</span>
                              <span className="text-rose-400">{orf.stopCodon}</span>
                            </td>
                            <td>
                              <button
                                className="p-1 text-slate-400 hover:text-white transition-colors"
                                onClick={() => setExpandedOrfId(expandedOrfId === orf.id ? null : orf.id)}
                              >
                                {expandedOrfId === orf.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </td>
                          </tr>
                          {expandedOrfId === orf.id && (
                            <tr key={`${orf.id}-detail`}>
                              <td colSpan={8} className="bg-slate-800/30 p-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-xs text-slate-500 mb-2">核苷酸序列</p>
                                    <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 max-h-32 overflow-y-auto break-all leading-relaxed">
                                      {orf.nucleotideSequence}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-500 mb-2">蛋白质序列 ({orf.proteinLength} aa)</p>
                                    <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 max-h-32 overflow-y-auto break-all leading-relaxed">
                                      {orf.proteinSequence}
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-3 grid grid-cols-6 gap-3">
                                  <div className="p-2 bg-slate-900/50 rounded-lg text-center">
                                    <p className="text-xs text-slate-500">位置</p>
                                    <p className="text-sm text-white font-medium">{orf.startPosition}-{orf.endPosition}</p>
                                  </div>
                                  <div className="p-2 bg-slate-900/50 rounded-lg text-center">
                                    <p className="text-xs text-slate-500">ORF长度</p>
                                    <p className="text-sm text-white font-medium">{orf.orfLength} nt</p>
                                  </div>
                                  <div className="p-2 bg-slate-900/50 rounded-lg text-center">
                                    <p className="text-xs text-slate-500">蛋白长度</p>
                                    <p className="text-sm text-white font-medium">{orf.proteinLength} aa</p>
                                  </div>
                                  <div className="p-2 bg-slate-900/50 rounded-lg text-center">
                                    <p className="text-xs text-slate-500">GC%</p>
                                    <p className="text-sm text-primary-400 font-bold">{orf.gcPercent.toFixed(2)}%</p>
                                  </div>
                                  <div className="p-2 bg-slate-900/50 rounded-lg text-center">
                                    <p className="text-xs text-slate-500">GC1</p>
                                    <p className="text-sm text-white font-medium">{orf.gc1Percent.toFixed(1)}%</p>
                                  </div>
                                  <div className="p-2 bg-slate-900/50 rounded-lg text-center">
                                    <p className="text-xs text-slate-500">GC3</p>
                                    <p className="text-sm text-white font-medium">{orf.gc3Percent.toFixed(1)}%</p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                  {filteredOrfs.length === 0 && (
                    <div className="text-center py-10 text-slate-500">
                      未找到匹配的ORF
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="card p-5">
              <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-xl">
                <Dna className="mx-auto text-slate-600 mb-3" size={48} />
                <p className="text-slate-500">选择样本并设置参数，点击「开始预测」扫描6个阅读框中的ORF</p>
                <p className="text-slate-600 text-sm mt-2">将识别从起始密码子 (ATG) 到终止密码子 (TAA/TAG/TGA) 的所有开放阅读框</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
