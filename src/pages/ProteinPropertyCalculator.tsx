import { useState, useMemo } from 'react';
import {
  Dna, Settings, Play, RotateCcw, ChevronDown, ChevronUp, Search,
  Info, ArrowUpDown, Calculator, FlaskConical, Beaker,
  Droplets, Thermometer, Activity, Gauge
} from 'lucide-react';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import type { ProteinAnalysisResult } from '@shared/types';

const MIN_ORF_LENGTHS = [75, 100, 150, 200, 300, 450];
const WINDOW_SIZES = [5, 7, 9, 11, 15, 21];

type SortField = 'proteinLength' | 'molecularWeight' | 'isoelectricPoint' | 'instabilityIndex';
type SortDir = 'asc' | 'desc';

function AminoAcidChart({ result }: { result: ProteinAnalysisResult }) {
  const width = 600;
  const height = 280;
  const margin = { top: 20, right: 20, bottom: 50, left: 50 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  const maxCount = Math.max(...result.aminoAcidCounts.map(a => a.percentage), 15);
  const barWidth = plotW / result.aminoAcidCounts.length * 0.8;
  const gap = plotW / result.aminoAcidCounts.length * 0.2;

  const getAminoAcidColor = (code: string) => {
    const colors: Record<string, string> = {
      'R': '#ef4444', 'K': '#ef4444', 'H': '#f97316',
      'D': '#3b82f6', 'E': '#3b82f6',
      'S': '#22c55e', 'T': '#22c55e', 'N': '#22c55e', 'Q': '#22c55e', 'C': '#22c55e', 'Y': '#22c55e',
      'A': '#8b5cf6', 'V': '#8b5cf6', 'L': '#8b5cf6', 'I': '#8b5cf6', 'P': '#8b5cf6', 'F': '#8b5cf6', 'M': '#8b5cf6', 'W': '#8b5cf6', 'G': '#8b5cf6',
    };
    return colors[code] || '#64748b';
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {[0, 0.25, 0.5, 0.75, 1.0].map((tick, i) => {
        const y = margin.top + plotH - tick * plotH;
        return (
          <g key={i}>
            <line x1={margin.left} y1={y} x2={margin.left + plotW} y2={y} stroke="#334155" strokeDasharray="3,3" strokeWidth={0.5} />
            <text x={margin.left - 8} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize={10}>
              {Math.round(tick * maxCount)}%
            </text>
          </g>
        );
      })}

      {result.aminoAcidCounts.map((aa, i) => {
        const x = margin.left + i * (plotW / result.aminoAcidCounts.length) + gap / 2;
        const barH = (aa.percentage / maxCount) * plotH;
        const y = margin.top + plotH - barH;
        return (
          <g key={aa.code}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              fill={getAminoAcidColor(aa.code)}
              rx={2}
              opacity={0.85}
            />
            <text
              x={x + barWidth / 2}
              y={y - 5}
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize={9}
            >
              {aa.percentage.toFixed(1)}%
            </text>
            <text
              x={x + barWidth / 2}
              y={margin.top + plotH + 15}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize={11}
              fontWeight="bold"
            >
              {aa.code}
            </text>
            <text
              x={x + barWidth / 2}
              y={margin.top + plotH + 28}
              textAnchor="middle"
              fill="#64748b"
              fontSize={9}
            >
              {aa.count}
            </text>
          </g>
        );
      })}

      <text x={margin.left + plotW / 2} y={height - 8} textAnchor="middle" fill="#64748b" fontSize={10}>
        氨基酸 (下侧数字为绝对计数)
      </text>
      <text x={12} y={height / 2} textAnchor="middle" fill="#94a3b8" fontSize={10} transform={`rotate(-90, 12, ${height / 2})`}>
        百分比 (%)
      </text>
    </svg>
  );
}

function HydrophobicityChart({ result }: { result: ProteinAnalysisResult }) {
  const width = 800;
  const height = 220;
  const margin = { top: 20, right: 20, bottom: 30, left: 50 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  const data = result.hydrophobicityProfile;
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        蛋白质序列过短，无法绘制亲疏水性图谱
      </div>
    );
  }

  const minVal = Math.min(...data.map(d => d.value), -3);
  const maxVal = Math.max(...data.map(d => d.value), 3);
  const range = maxVal - minVal;

  const xScale = (i: number) => margin.left + (i / (data.length - 1 || 1)) * plotW;
  const yScale = (v: number) => margin.top + plotH - ((v - minVal) / (range || 1)) * plotH;

  const pathData = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.value)}`).join(' ');

  const areaData = [
    `M ${xScale(0)} ${yScale(0)}`,
    ...data.map((d, i) => `L ${xScale(i)} ${yScale(d.value)}`),
    `L ${xScale(data.length - 1)} ${yScale(0)}`
  ].join(' ');

  const zeroY = yScale(0);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {[-2, 0, 2].map((tick, i) => {
        const y = yScale(tick);
        return (
          <g key={i}>
            <line x1={margin.left} y1={y} x2={margin.left + plotW} y2={y} stroke={tick === 0 ? '#475569' : '#334155'} strokeDasharray={tick === 0 ? '0' : '3,3'} strokeWidth={tick === 0 ? 1 : 0.5} />
            <text x={margin.left - 8} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize={10}>
              {tick}
            </text>
          </g>
        );
      })}

      <path d={areaData} fill="rgba(20, 184, 166, 0.2)" />
      <path d={pathData} stroke="#14b8a6" strokeWidth={1.5} fill="none" />

      {data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 8)) === 0).map((d, idx, arr) => {
        const x = xScale(d.position - 1);
        return (
          <text key={idx} x={x} y={zeroY + 15} textAnchor="middle" fill="#94a3b8" fontSize={9}>
            {d.position}
          </text>
        );
      })}

      <text x={margin.left + plotW / 2} y={height - 8} textAnchor="middle" fill="#94a3b8" fontSize={11}>
        氨基酸位置
      </text>
      <text x={14} y={height / 2} textAnchor="middle" fill="#94a3b8" fontSize={10} transform={`rotate(-90, 14, ${height / 2})`}>
        亲疏水性 (Kyte-Doolittle)
      </text>

      <g transform={`translate(${width - margin.right - 120}, ${margin.top})`}>
        <rect x={0} y={0} width={10} height={10} fill="#14b8a6" rx={2} opacity={0.8} />
        <text x={16} y={9} fill="#94a3b8" fontSize={10}>正值 = 疏水</text>
        <rect x={0} y={16} width={10} height={10} fill="#64748b" rx={2} opacity={0.8} />
        <text x={16} y={25} fill="#94a3b8" fontSize={10}>负值 = 亲水</text>
      </g>
    </svg>
  );
}

function ChargeChart({ result }: { result: ProteinAnalysisResult }) {
  const width = 800;
  const height = 180;
  const margin = { top: 20, right: 20, bottom: 30, left: 50 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  const data = result.chargeProfile;
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        蛋白质序列过短，无法绘制电荷图谱
      </div>
    );
  }

  const maxCharge = Math.max(Math.max(...data.map(d => d.charge)), 1);
  const minCharge = Math.min(Math.min(...data.map(d => d.charge)), -1);
  const range = maxCharge - minCharge;

  const xScale = (i: number) => margin.left + (i / (data.length - 1 || 1)) * plotW;
  const yScale = (v: number) => margin.top + plotH - ((v - minCharge) / (range || 1)) * plotH;

  const zeroY = yScale(0);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <line x1={margin.left} y1={zeroY} x2={margin.left + plotW} y2={zeroY} stroke="#475569" strokeWidth={1} />
      <text x={margin.left - 8} y={zeroY + 4} textAnchor="end" fill="#94a3b8" fontSize={10}>0</text>
      {[minCharge < 0 ? minCharge : -1, maxCharge > 0 ? maxCharge : 1].map((tick, i) => {
        if (tick === 0) return null;
        const y = yScale(tick);
        return (
          <g key={i}>
            <line x1={margin.left} y1={y} x2={margin.left + plotW} y2={y} stroke="#334155" strokeDasharray="3,3" strokeWidth={0.5} />
            <text x={margin.left - 8} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize={10}>
              {tick.toFixed(1)}
            </text>
          </g>
        );
      })}

      {data.map((d, i) => {
        const x = xScale(i);
        const y = yScale(d.charge);
        const color = d.charge > 0 ? '#ef4444' : '#3b82f6';
        return (
          <rect
            key={i}
            x={x - 1.5}
            y={Math.min(y, zeroY)}
            width={3}
            height={Math.abs(zeroY - y)}
            fill={color}
            opacity={0.7}
          />
        );
      })}

      {data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 10)) === 0).map((d, idx) => {
        const x = xScale(d.position - 1);
        return (
          <text key={idx} x={x} y={zeroY + 15} textAnchor="middle" fill="#94a3b8" fontSize={9}>
            {d.position}
          </text>
        );
      })}

      <text x={margin.left + plotW / 2} y={height - 8} textAnchor="middle" fill="#94a3b8" fontSize={11}>
        氨基酸位置
      </text>
      <text x={14} y={height / 2} textAnchor="middle" fill="#94a3b8" fontSize={10} transform={`rotate(-90, 14, ${height / 2})`}>
        电荷 (pH 7.0)
      </text>

      <g transform={`translate(${width - margin.right - 120}, ${margin.top})`}>
        <rect x={0} y={0} width={10} height={10} fill="#ef4444" rx={2} opacity={0.8} />
        <text x={16} y={9} fill="#94a3b8" fontSize={10}>正电荷</text>
        <rect x={0} y={16} width={10} height={10} fill="#3b82f6" rx={2} opacity={0.8} />
        <text x={16} y={25} fill="#94a3b8" fontSize={10}>负电荷</text>
      </g>
    </svg>
  );
}

function PropertyCard({ icon: Icon, label, value, unit, highlight, sublabel }: {
  icon: typeof Dna;
  label: string;
  value: string | number;
  unit?: string;
  highlight?: 'positive' | 'negative' | 'neutral';
  sublabel?: string;
}) {
  const highlightClasses = {
    positive: 'text-emerald-400',
    negative: 'text-rose-400',
    neutral: 'text-primary-400'
  };

  return (
    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className="text-slate-400" />
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <div className={`text-xl font-bold ${highlight ? highlightClasses[highlight] : 'text-white'}`}>
        {value}
        {unit && <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>}
      </div>
      {sublabel && <p className="text-xs text-slate-500 mt-1">{sublabel}</p>}
    </div>
  );
}

export default function ProteinPropertyCalculator() {
  const {
    samples, orfPredictionResult, proteinCalcResult,
    predictOrf, calculateProteinProperties, loading, error, clearProteinResults
  } = useAnalysisStore();

  const [selectedSampleId, setSelectedSampleId] = useState('');
  const [minOrfLength, setMinOrfLength] = useState(150);
  const [windowSize, setWindowSize] = useState(9);
  const [expandedProteinId, setExpandedProteinId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('proteinLength');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [searchText, setSearchText] = useState('');
  const [inputMode, setInputMode] = useState<'sample' | 'custom'>('sample');
  const [customSequence, setCustomSequence] = useState('');
  const [customAnalysisResult, setCustomAnalysisResult] = useState<ProteinAnalysisResult | null>(null);

  const dnaSamples = useMemo(() => samples.filter(s => s.sequenceType === 'dna'), [samples]);
  const selectedSample = samples.find(s => s.id === selectedSampleId);

  const handleCalculate = async () => {
    if (inputMode === 'sample') {
      if (!selectedSampleId) return;
      if (!orfPredictionResult || orfPredictionResult.sequenceId !== selectedSampleId || orfPredictionResult.minOrfLength !== minOrfLength) {
        await predictOrf(selectedSampleId, minOrfLength);
      }
      await calculateProteinProperties(selectedSampleId, minOrfLength, windowSize);
    } else {
      if (!customSequence.trim()) return;
      const result = useAnalysisStore.getState().analyzeSingleProtein(customSequence.trim().toUpperCase(), 'custom', windowSize);
      setCustomAnalysisResult(result);
    }
  };

  const handleReset = () => {
    setSelectedSampleId('');
    setMinOrfLength(150);
    setWindowSize(9);
    setExpandedProteinId(null);
    setSearchText('');
    setCustomSequence('');
    setCustomAnalysisResult(null);
    clearProteinResults();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const filteredProteins = useMemo(() => {
    const results = proteinCalcResult?.results || [];
    let result = results;

    if (searchText.trim()) {
      const q = searchText.toUpperCase();
      result = result.filter(p =>
        p.proteinSequence.toUpperCase().includes(q) ||
        p.orfId.toUpperCase().includes(q)
      );
    }

    result = [...result].sort((a, b) => {
      let va: number, vb: number;
      if (sortField === 'proteinLength') {
        va = a.proteinLength;
        vb = b.proteinLength;
      } else if (sortField === 'molecularWeight') {
        va = a.properties.molecularWeight;
        vb = b.properties.molecularWeight;
      } else if (sortField === 'isoelectricPoint') {
        va = a.properties.isoelectricPoint;
        vb = b.properties.isoelectricPoint;
      } else {
        va = a.properties.instabilityIndex;
        vb = b.properties.instabilityIndex;
      }
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [proteinCalcResult, searchText, sortField, sortDir]);

  const displayResult = inputMode === 'custom' ? customAnalysisResult : null;

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
          <h1 className="text-3xl font-bold text-white mb-2">蛋白质理化性质计算器</h1>
          <p className="text-slate-400">将预测 ORF 翻译为蛋白质序列后，计算分子量、等电点、消光系数、溶解度、不稳定指数、亲疏水性图谱等</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary flex items-center gap-2" onClick={handleReset}>
            <RotateCcw size={16} />
            重置
          </button>
          <button
            className="btn-primary flex items-center gap-2"
            onClick={handleCalculate}
            disabled={loading || (inputMode === 'sample' ? !selectedSampleId : !customSequence.trim())}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                计算中...
              </>
            ) : (
              <>
                <Calculator size={16} />
                开始计算
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
              输入模式
            </h2>
            <div className="flex items-center gap-2 p-1 bg-slate-800/50 rounded-lg mb-4">
              <button
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all flex-1 ${
                  inputMode === 'sample' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                onClick={() => setInputMode('sample')}
              >
                选择样本
              </button>
              <button
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all flex-1 ${
                  inputMode === 'custom' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                onClick={() => setInputMode('custom')}
              >
                自定义序列
              </button>
            </div>

            {inputMode === 'sample' ? (
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
            ) : (
              <div>
                <label className="block text-sm text-slate-400 mb-2">蛋白质序列</label>
                <textarea
                  className="w-full h-32 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 font-mono text-xs"
                  placeholder="输入蛋白质序列 (单字母缩写，例如: MVLSEGEWQLVLHVWAKVEADVAGHGQDILIRLFKSHPETLEKFDRFKHLKTEAEMKASEDLKKHGVTVLTALGAILKKKGHHEAELKPLAQSHATKHKIPIKYLEFISEAIIHVLHSRHPGDFGADAQGAMNKALELFRKDIAAKYKELGYQG)"
                  value={customSequence}
                  onChange={(e) => setCustomSequence(e.target.value)}
                />
                <p className="text-xs text-slate-500 mt-2">支持标准 20 种氨基酸单字母缩写，自动过滤其他字符</p>
              </div>
            )}
          </div>

          <div className="card p-5">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Settings size={20} className="text-primary-400" />
              计算参数
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">最小ORF长度 (nt)</label>
                <select
                  className="select-field"
                  value={minOrfLength}
                  onChange={(e) => setMinOrfLength(Number(e.target.value))}
                  disabled={inputMode === 'custom'}
                >
                  {MIN_ORF_LENGTHS.map(len => (
                    <option key={len} value={len}>{len} nt ({Math.floor(len / 3)} aa)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">疏水性窗口大小</label>
                <select
                  className="select-field"
                  value={windowSize}
                  onChange={(e) => setWindowSize(Number(e.target.value))}
                >
                  {WINDOW_SIZES.map(size => (
                    <option key={size} value={size}>{size} aa</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {(proteinCalcResult || customAnalysisResult) && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Info size={20} className="text-primary-400" />
                计算摘要
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">序列名称</span>
                  <span className="text-white font-medium">
                    {inputMode === 'sample' ? proteinCalcResult?.sequenceName : '自定义序列'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">蛋白质数量</span>
                  <span className="text-primary-400 font-bold text-lg">
                    {inputMode === 'sample' ? proteinCalcResult?.totalProteins : 1}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">窗口大小</span>
                  <span className="text-white">{inputMode === 'sample' ? proteinCalcResult?.windowSize : windowSize} aa</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">计算时间</span>
                  <span className="text-white">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="col-span-9 space-y-6">
          {displayResult ? (
            <div className="space-y-6">
              <div className="card p-5">
                <h3 className="text-lg font-semibold text-white mb-4">基本理化性质</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <PropertyCard
                    icon={FlaskConical}
                    label="分子量"
                    value={displayResult.properties.molecularWeight.toFixed(2)}
                    unit="Da"
                    highlight="neutral"
                  />
                  <PropertyCard
                    icon={Gauge}
                    label="等电点 (pI)"
                    value={displayResult.properties.isoelectricPoint.toFixed(2)}
                    highlight={displayResult.properties.isoelectricPoint < 6 ? 'negative' : displayResult.properties.isoelectricPoint > 8 ? 'positive' : 'neutral'}
                    sublabel={displayResult.properties.isoelectricPoint < 6 ? '酸性蛋白' : displayResult.properties.isoelectricPoint > 8 ? '碱性蛋白' : '中性蛋白'}
                  />
                  <PropertyCard
                    icon={Activity}
                    label="不稳定指数"
                    value={displayResult.properties.instabilityIndex.toFixed(1)}
                    highlight={displayResult.properties.isStable ? 'positive' : 'negative'}
                    sublabel={displayResult.properties.isStable ? '稳定蛋白' : '不稳定蛋白'}
                  />
                  <PropertyCard
                    icon={Droplets}
                    label="溶解度指数"
                    value={displayResult.properties.solubility.toFixed(1)}
                    unit="%"
                    highlight={displayResult.properties.solubility > 60 ? 'positive' : displayResult.properties.solubility < 30 ? 'negative' : 'neutral'}
                  />
                  <PropertyCard
                    icon={Beaker}
                    label="消光系数"
                    value={displayResult.properties.extinctionCoefficient.toLocaleString()}
                    unit="M⁻¹cm⁻¹"
                    highlight="neutral"
                    sublabel={`A₀·¹% = ${displayResult.properties.molarAbsorbance.toFixed(4)}`}
                  />
                  <PropertyCard
                    icon={Thermometer}
                    label="脂肪族指数"
                    value={displayResult.properties.aliphaticIndex.toFixed(1)}
                    highlight="neutral"
                  />
                  <PropertyCard
                    icon={Gauge}
                    label="总平均亲水性"
                    value={displayResult.properties.grandAverageHydropathicity.toFixed(3)}
                    highlight={displayResult.properties.grandAverageHydropathicity > 0 ? 'negative' : 'positive'}
                    sublabel={displayResult.properties.grandAverageHydropathicity > 0 ? '疏水性蛋白' : '亲水性蛋白'}
                  />
                  <PropertyCard
                    icon={Calculator}
                    label="蛋白长度"
                    value={displayResult.proteinLength}
                    unit="aa"
                    highlight="neutral"
                  />
                </div>
              </div>

              <div className="card p-5">
                <h3 className="text-lg font-semibold text-white mb-4">氨基酸组成分析</h3>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                    <p className="text-xs text-slate-500">碱性氨基酸</p>
                    <p className="text-lg font-bold text-rose-400">{displayResult.basicCount}</p>
                    <p className="text-xs text-slate-400">
                      R, H, K ({((displayResult.basicCount / displayResult.proteinLength) * 100).toFixed(1)}%)
                    </p>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                    <p className="text-xs text-slate-500">酸性氨基酸</p>
                    <p className="text-lg font-bold text-blue-400">{displayResult.acidicCount}</p>
                    <p className="text-xs text-slate-400">
                      D, E ({((displayResult.acidicCount / displayResult.proteinLength) * 100).toFixed(1)}%)
                    </p>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                    <p className="text-xs text-slate-500">极性氨基酸</p>
                    <p className="text-lg font-bold text-emerald-400">{displayResult.polarCount}</p>
                    <p className="text-xs text-slate-400">
                      S, T, N, Q, C, Y ({((displayResult.polarCount / displayResult.proteinLength) * 100).toFixed(1)}%)
                    </p>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                    <p className="text-xs text-slate-500">非极性氨基酸</p>
                    <p className="text-lg font-bold text-violet-400">{displayResult.nonpolarCount}</p>
                    <p className="text-xs text-slate-400">
                      A, V, L, I, P, F, M, W, G ({((displayResult.nonpolarCount / displayResult.proteinLength) * 100).toFixed(1)}%)
                    </p>
                  </div>
                </div>
                <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-4">
                  <AminoAcidChart result={displayResult} />
                </div>
                <div className="flex items-center gap-6 text-xs text-slate-500 mt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-rose-500" />
                    <span>碱性</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-orange-500" />
                    <span>组氨酸</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500" />
                    <span>酸性</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-emerald-500" />
                    <span>极性</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-violet-500" />
                    <span>非极性</span>
                  </div>
                </div>
              </div>

              <div className="card p-5">
                <h3 className="text-lg font-semibold text-white mb-4">亲疏水性图谱 (Kyte-Doolittle)</h3>
                <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-4">
                  <HydrophobicityChart result={displayResult} />
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-3">
                  <Info size={14} />
                  <span>使用 Kyte-Doolittle 量表，窗口大小 {windowSize} aa，正值表示疏水区域，负值表示亲水区域</span>
                </div>
              </div>

              <div className="card p-5">
                <h3 className="text-lg font-semibold text-white mb-4">电荷分布图谱 (pH 7.0)</h3>
                <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-4">
                  <ChargeChart result={displayResult} />
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-3">
                  <Info size={14} />
                  <span>显示每个氨基酸在生理 pH 7.0 下的净电荷，包括 N 端和 C 端的贡献</span>
                </div>
              </div>

              <div className="card p-5">
                <h3 className="text-lg font-semibold text-white mb-4">蛋白质序列</h3>
                <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 max-h-32 overflow-y-auto break-all leading-relaxed">
                  {displayResult.proteinSequence}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>序列长度: {displayResult.proteinLength} 氨基酸</span>
                  <span>
                    芳香族氨基酸 (F, Y, W): {displayResult.aromaticCount} ({((displayResult.aromaticCount / displayResult.proteinLength) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          ) : proteinCalcResult ? (
            <>
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">蛋白质列表</h3>
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
                    <span className="text-xs text-slate-500">{filteredProteins.length} / {proteinCalcResult.totalProteins} 蛋白质</span>
                  </div>
                </div>

                <div className="max-h-[500px] overflow-y-auto">
                  <table className="data-table">
                    <thead className="sticky top-0 z-10">
                      <tr>
                        <th>ORF ID</th>
                        <SortHeader field="proteinLength" label="长度" />
                        <SortHeader field="molecularWeight" label="分子量" />
                        <SortHeader field="isoelectricPoint" label="pI" />
                        <SortHeader field="instabilityIndex" label="不稳定指数" />
                        <th>稳定性</th>
                        <th>亲疏水性</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProteins.map(protein => (
                        <>
                          <tr key={protein.orfId}>
                            <td className="font-mono text-xs font-medium text-primary-400">
                              {protein.orfId}
                            </td>
                            <td className="text-white">{protein.proteinLength} aa</td>
                            <td>{protein.properties.molecularWeight.toFixed(1)} Da</td>
                            <td>
                              <span className={`font-bold ${
                                protein.properties.isoelectricPoint < 6 ? 'text-blue-400' :
                                protein.properties.isoelectricPoint > 8 ? 'text-rose-400' : 'text-white'
                              }`}>
                                {protein.properties.isoelectricPoint.toFixed(2)}
                              </span>
                            </td>
                            <td>
                              <span className={`font-bold ${
                                protein.properties.isStable ? 'text-emerald-400' : 'text-rose-400'
                              }`}>
                                {protein.properties.instabilityIndex.toFixed(1)}
                              </span>
                            </td>
                            <td>
                              <span className={`badge text-xs ${
                                protein.properties.isStable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                              }`}>
                                {protein.properties.isStable ? '稳定' : '不稳定'}
                              </span>
                            </td>
                            <td>
                              <span className={protein.properties.grandAverageHydropathicity > 0 ? 'text-amber-400' : 'text-cyan-400'}>
                                {protein.properties.grandAverageHydropathicity.toFixed(2)}
                              </span>
                            </td>
                            <td>
                              <button
                                className="p-1 text-slate-400 hover:text-white transition-colors"
                                onClick={() => setExpandedProteinId(expandedProteinId === protein.orfId ? null : protein.orfId)}
                              >
                                {expandedProteinId === protein.orfId ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </td>
                          </tr>
                          {expandedProteinId === protein.orfId && (
                            <tr key={`${protein.orfId}-detail`}>
                              <td colSpan={8} className="bg-slate-800/30 p-4">
                                <div className="grid grid-cols-2 gap-6">
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                      <PropertyCard
                                        icon={FlaskConical}
                                        label="分子量"
                                        value={protein.properties.molecularWeight.toFixed(2)}
                                        unit="Da"
                                        highlight="neutral"
                                      />
                                      <PropertyCard
                                        icon={Gauge}
                                        label="等电点"
                                        value={protein.properties.isoelectricPoint.toFixed(2)}
                                        highlight="neutral"
                                      />
                                      <PropertyCard
                                        icon={Activity}
                                        label="不稳定指数"
                                        value={protein.properties.instabilityIndex.toFixed(1)}
                                        highlight={protein.properties.isStable ? 'positive' : 'negative'}
                                      />
                                      <PropertyCard
                                        icon={Droplets}
                                        label="溶解度"
                                        value={protein.properties.solubility.toFixed(1)}
                                        unit="%"
                                        highlight="neutral"
                                      />
                                      <PropertyCard
                                        icon={Beaker}
                                        label="消光系数"
                                        value={protein.properties.extinctionCoefficient.toLocaleString()}
                                        unit="M⁻¹cm⁻¹"
                                        highlight="neutral"
                                      />
                                      <PropertyCard
                                        icon={Gauge}
                                        label="GRAVY"
                                        value={protein.properties.grandAverageHydropathicity.toFixed(3)}
                                        highlight="neutral"
                                      />
                                    </div>
                                    <div>
                                      <p className="text-xs text-slate-500 mb-2">氨基酸类别统计</p>
                                      <div className="grid grid-cols-4 gap-2">
                                        <div className="p-2 bg-slate-900/50 rounded-lg text-center">
                                          <p className="text-xs text-slate-500">碱性</p>
                                          <p className="text-sm font-bold text-rose-400">{protein.basicCount}</p>
                                        </div>
                                        <div className="p-2 bg-slate-900/50 rounded-lg text-center">
                                          <p className="text-xs text-slate-500">酸性</p>
                                          <p className="text-sm font-bold text-blue-400">{protein.acidicCount}</p>
                                        </div>
                                        <div className="p-2 bg-slate-900/50 rounded-lg text-center">
                                          <p className="text-xs text-slate-500">极性</p>
                                          <p className="text-sm font-bold text-emerald-400">{protein.polarCount}</p>
                                        </div>
                                        <div className="p-2 bg-slate-900/50 rounded-lg text-center">
                                          <p className="text-xs text-slate-500">非极性</p>
                                          <p className="text-sm font-bold text-violet-400">{protein.nonpolarCount}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="space-y-4">
                                    <div>
                                      <p className="text-xs text-slate-500 mb-2">亲疏水性图谱</p>
                                      <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-3">
                                        <HydrophobicityChart result={protein} />
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-xs text-slate-500 mb-2">蛋白质序列</p>
                                      <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 max-h-24 overflow-y-auto break-all leading-relaxed">
                                        {protein.proteinSequence}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                  {filteredProteins.length === 0 && (
                    <div className="text-center py-10 text-slate-500">
                      未找到匹配的蛋白质
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="card p-5">
              <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-xl">
                <Calculator className="mx-auto text-slate-600 mb-3" size={48} />
                <p className="text-slate-500">选择样本或输入自定义序列，点击「开始计算」分析蛋白质理化性质</p>
                <p className="text-slate-600 text-sm mt-2">将计算分子量、等电点、消光系数、溶解度、不稳定指数、亲疏水性图谱等参数</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
