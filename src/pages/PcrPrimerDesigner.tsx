import { useState, useMemo } from 'react';
import {
  Dna, Settings, Play, RotateCcw, Info, ChevronDown, ChevronUp,
  Thermometer, Gauge, AlertTriangle, CheckCircle, Copy, Sparkles
} from 'lucide-react';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import SelectableSequenceViewer from '@/components/SelectableSequenceViewer';
import type { PrimerPair, Primer, PrimerConstraints } from '@shared/types';

function MetricBadge({ value, min, max, unit = '', label }: {
  value: number; min?: number; max?: number; unit?: string; label: string;
}) {
  const inRange = (min == null || value >= min) && (max == null || value <= max);
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-slate-500">{label}:</span>
      <span className={`text-xs font-mono font-bold ${inRange ? 'text-emerald-400' : 'text-rose-400'}`}>
        {value.toFixed(1)}{unit}
      </span>
    </div>
  );
}

function PrimerCard({ primer, direction }: { primer: Primer; direction: 'forward' | 'reverse' }) {
  const isForward = direction === 'forward';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(primer.sequence);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={`p-4 rounded-xl border space-y-2 ${isForward ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`badge ${isForward ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
            {isForward ? '正向引物 F' : '反向引物 R'}
          </span>
          <span className="text-xs text-slate-500 font-mono">
            {primer.start.toLocaleString()} - {primer.end.toLocaleString()}
          </span>
        </div>
        <button
          className="p-1 text-slate-500 hover:text-white transition-colors"
          onClick={handleCopy}
          title="复制序列"
        >
          {copied ? <CheckCircle size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>
      </div>
      <div className="p-2 bg-slate-950/50 rounded-lg font-mono text-sm text-slate-200 break-all">
        {primer.sequence}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <MetricBadge value={primer.metrics.length} unit="bp" label="长度" min={18} max={25} />
        <MetricBadge value={primer.metrics.tm} unit="°C" label="Tm" min={55} max={65} />
        <MetricBadge value={primer.metrics.gcPercent} unit="%" label="GC%" min={40} max={60} />
        <MetricBadge value={primer.metrics.homopolymerMax} unit="bp" label="同源" min={0} max={4} />
        <MetricBadge value={primer.metrics.dimerDeltaG} unit="kcal/mol" label="二聚体ΔG" min={-6} />
        <MetricBadge value={primer.metrics.hairpinDeltaG} unit="kcal/mol" label="发夹ΔG" min={-6} />
      </div>
    </div>
  );
}

export default function PcrPrimerDesigner() {
  const {
    samples, primerDesignResult, primerConstraints,
    designPcrPrimers, setPrimerConstraints, clearPrimerResults, loading, error
  } = useAnalysisStore();

  const [selectedSampleId, setSelectedSampleId] = useState('');
  const [regionStart, setRegionStart] = useState<number | null>(null);
  const [regionEnd, setRegionEnd] = useState<number | null>(null);
  const [selectedPairIdx, setSelectedPairIdx] = useState<number | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sortBy, setSortBy] = useState<'penalty' | 'tm' | 'size'>('penalty');

  const dnaSamples = useMemo(() => samples.filter(s => s.sequenceType === 'dna'), [samples]);
  const selectedSample = samples.find(s => s.id === selectedSampleId);

  const handleSelection = (start: number, end: number) => {
    setRegionStart(start);
    setRegionEnd(end);
  };

  const handleDesign = () => {
    if (!selectedSampleId || regionStart == null || regionEnd == null) return;
    designPcrPrimers(selectedSampleId, regionStart, regionEnd, primerConstraints);
  };

  const handleReset = () => {
    setSelectedSampleId('');
    setRegionStart(null);
    setRegionEnd(null);
    setSelectedPairIdx(null);
    clearPrimerResults();
  };

  const handleConstraintChange = (key: keyof PrimerConstraints, value: number | boolean) => {
    setPrimerConstraints({ [key]: value } as Partial<PrimerConstraints>);
  };

  const sortedPairs = useMemo(() => {
    if (!primerDesignResult) return [];
    const pairs = [...primerDesignResult.pairs];
    switch (sortBy) {
      case 'tm':
        return pairs.sort((a, b) => a.tmDifference - b.tmDifference);
      case 'size':
        return pairs.sort((a, b) => Math.abs(a.productSize - 250) - Math.abs(b.productSize - 250));
      default:
        return pairs.sort((a, b) => a.penaltyScore - b.penaltyScore);
    }
  }, [primerDesignResult, sortBy]);

  const selectedPair: PrimerPair | null = selectedPairIdx != null ? sortedPairs[selectedPairIdx] : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Sparkles className="text-primary-400" size={32} />
            PCR 引物设计助手
          </h1>
          <p className="text-slate-400">
            在序列上拖拽选择目标区域，系统自动按照 Tm 值、GC%、二聚体、发夹结构等约束生成候选引物对
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary flex items-center gap-2" onClick={handleReset}>
            <RotateCcw size={16} />
            重置
          </button>
          <button
            className="btn-primary flex items-center gap-2"
            onClick={handleDesign}
            disabled={loading || !selectedSampleId || regionStart == null || regionEnd == null}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                设计中...
              </>
            ) : (
              <>
                <Play size={16} />
                设计引物
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
                  onChange={(e) => { setSelectedSampleId(e.target.value); setRegionStart(null); setRegionEnd(null); clearPrimerResults(); }}
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
              {regionStart != null && regionEnd != null && (
                <div className="p-3 rounded-xl bg-primary-500/10 border border-primary-500/30 space-y-1">
                  <p className="text-xs text-slate-500">选中区域</p>
                  <p className="text-sm font-mono font-bold text-primary-400">
                    {regionStart.toLocaleString()} - {regionEnd.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400">
                    长度: {(regionEnd - regionStart + 1).toLocaleString()} bp
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Settings size={20} className="text-primary-400" />
              约束参数
            </h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">最小长度</label>
                  <input
                    type="number"
                    className="input-field py-2 text-sm"
                    value={primerConstraints.minLength}
                    onChange={(e) => handleConstraintChange('minLength', parseInt(e.target.value) || 18)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">最大长度</label>
                  <input
                    type="number"
                    className="input-field py-2 text-sm"
                    value={primerConstraints.maxLength}
                    onChange={(e) => handleConstraintChange('maxLength', parseInt(e.target.value) || 25)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">最小 Tm</label>
                  <input
                    type="number"
                    className="input-field py-2 text-sm"
                    value={primerConstraints.minTm}
                    onChange={(e) => handleConstraintChange('minTm', parseFloat(e.target.value) || 55)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">最大 Tm</label>
                  <input
                    type="number"
                    className="input-field py-2 text-sm"
                    value={primerConstraints.maxTm}
                    onChange={(e) => handleConstraintChange('maxTm', parseFloat(e.target.value) || 65)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">最小 GC%</label>
                  <input
                    type="number"
                    className="input-field py-2 text-sm"
                    value={primerConstraints.minGc}
                    onChange={(e) => handleConstraintChange('minGc', parseFloat(e.target.value) || 40)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">最大 GC%</label>
                  <input
                    type="number"
                    className="input-field py-2 text-sm"
                    value={primerConstraints.maxGc}
                    onChange={(e) => handleConstraintChange('maxGc', parseFloat(e.target.value) || 60)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Tm 差异阈值 (°C)</label>
                <input
                  type="number"
                  className="input-field py-2 text-sm"
                  value={primerConstraints.tmDifference}
                  onChange={(e) => handleConstraintChange('tmDifference', parseFloat(e.target.value) || 3)}
                />
              </div>

              <button
                className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-white transition-colors py-2"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <span className="flex items-center gap-1">
                  <Gauge size={14} />
                  高级参数
                </span>
                {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showAdvanced && (
                <div className="space-y-3 pt-3 border-t border-slate-700">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">产物最小 bp</label>
                      <input
                        type="number"
                        className="input-field py-2 text-sm"
                        value={primerConstraints.productMinSize}
                        onChange={(e) => handleConstraintChange('productMinSize', parseInt(e.target.value) || 100)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">产物最大 bp</label>
                      <input
                        type="number"
                        className="input-field py-2 text-sm"
                        value={primerConstraints.productMaxSize}
                        onChange={(e) => handleConstraintChange('productMaxSize', parseInt(e.target.value) || 500)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">二聚体 ΔG</label>
                      <input
                        type="number"
                        className="input-field py-2 text-sm"
                        value={primerConstraints.maxDimerDeltaG}
                        onChange={(e) => handleConstraintChange('maxDimerDeltaG', parseFloat(e.target.value) || -6)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">发夹 ΔG</label>
                      <input
                        type="number"
                        className="input-field py-2 text-sm"
                        value={primerConstraints.maxHairpinDeltaG}
                        onChange={(e) => handleConstraintChange('maxHairpinDeltaG', parseFloat(e.target.value) || -6)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">最大同源聚合</label>
                    <input
                      type="number"
                      className="input-field py-2 text-sm"
                      value={primerConstraints.maxHomopolymer}
                      onChange={(e) => handleConstraintChange('maxHomopolymer', parseInt(e.target.value) || 4)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">3' GC 夹 (bp)</label>
                    <input
                      type="number"
                      className="input-field py-2 text-sm"
                      value={primerConstraints.gcClamp3Prime}
                      onChange={(e) => handleConstraintChange('gcClamp3Prime', parseInt(e.target.value) || 2)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="avoidAt"
                      className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-primary-500 focus:ring-primary-500/30"
                      checked={primerConstraints.avoid5PrimeAT}
                      onChange={(e) => handleConstraintChange('avoid5PrimeAT', e.target.checked)}
                    />
                    <label htmlFor="avoidAt" className="text-xs text-slate-400">
                      避免 5' 端 A/T 起始
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {primerDesignResult && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Info size={20} className="text-primary-400" />
                设计统计
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">检查正向引物</span>
                  <span className="text-white font-mono">{primerDesignResult.totalForwardChecked.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">检查反向引物</span>
                  <span className="text-white font-mono">{primerDesignResult.totalReverseChecked.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">评估引物对</span>
                  <span className="text-white font-mono">{primerDesignResult.totalPairsEvaluated.toLocaleString()}</span>
                </div>
                <div className="pt-2 mt-2 border-t border-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400">通过候选正向</span>
                    <span className="text-emerald-400 font-mono font-bold">{primerDesignResult.forwardCandidates.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">通过候选反向</span>
                    <span className="text-emerald-400 font-mono font-bold">{primerDesignResult.reverseCandidates.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">推荐引物对</span>
                    <span className="text-primary-400 font-mono font-bold text-lg">{sortedPairs.length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="col-span-9 space-y-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Dna size={20} className="text-primary-400" />
                序列选择
              </h2>
              {selectedSample && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Info size={14} />
                  <span>在序列上按下鼠标拖拽选择目标扩增区域</span>
                </div>
              )}
            </div>
            {selectedSample ? (
              <div>
                <SelectableSequenceViewer
                  sequence={selectedSample.sequence}
                  lineLength={80}
                  selectionStart={regionStart ?? undefined}
                  selectionEnd={regionEnd ?? undefined}
                  onSelectionChange={handleSelection}
                  primers={primerDesignResult ? {
                    forward: primerDesignResult.forwardCandidates,
                    reverse: primerDesignResult.reverseCandidates,
                  } : undefined}
                  selectedPair={selectedPair ? {
                    forward: selectedPair.forward,
                    reverse: selectedPair.reverse,
                  } : undefined}
                />
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-primary-500/30 border border-primary-500/50" />
                    <span>选中区域</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/50" />
                    <span>正向引物</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-rose-500/30 border border-rose-500/50" />
                    <span>反向引物</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-xl">
                <Dna className="mx-auto text-slate-600 mb-3" size={48} />
                <p className="text-slate-500">请先选择一个 DNA 样本</p>
              </div>
            )}
          </div>

          {primerDesignResult && (
            <>
              {selectedPair && (
                <div className="card p-5 border-primary-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Sparkles size={20} className="text-primary-400" />
                      选中引物对 #{(selectedPairIdx ?? 0) + 1}
                      {selectedPair.passesConstraints && (
                        <span className="badge bg-emerald-500/20 text-emerald-400 text-xs">
                          <CheckCircle size={12} className="inline mr-1" />
                          全部约束通过
                        </span>
                      )}
                    </h2>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Thermometer size={14} className="text-slate-500" />
                        <span className="text-slate-400">产物</span>
                        <span className="font-mono font-bold text-primary-400">{selectedPair.productSize} bp</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Thermometer size={14} className="text-slate-500" />
                        <span className="text-slate-400">平均 Tm</span>
                        <span className="font-mono font-bold text-emerald-400">{selectedPair.productTm.toFixed(1)}°C</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">评分</span>
                        <span className="font-mono font-bold text-amber-400">{selectedPair.penaltyScore.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {selectedPair.warnings.length > 0 && (
                    <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={16} className="text-amber-400" />
                        <span className="text-sm font-medium text-amber-400">注意事项</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedPair.warnings.map((w, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs text-amber-300/80">
                            <span className="w-1 h-1 rounded-full bg-amber-400/60" />
                            {w}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <PrimerCard primer={selectedPair.forward} direction="forward" />
                    <PrimerCard primer={selectedPair.reverse} direction="reverse" />
                  </div>
                </div>
              )}

              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">候选引物对</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">排序:</span>
                    <select
                      className="select-field py-1.5 text-sm w-40"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    >
                      <option value="penalty">综合评分</option>
                      <option value="tm">Tm 差异最小</option>
                      <option value="size">产物大小</option>
                    </select>
                  </div>
                </div>

                {sortedPairs.length > 0 ? (
                  <div className="max-h-[600px] overflow-y-auto">
                    <table className="data-table">
                      <thead className="sticky top-0 z-10">
                        <tr>
                          <th className="w-12">#</th>
                          <th>正向序列 (5'→3')</th>
                          <th>反向序列 (5'→3')</th>
                          <th>产物大小</th>
                          <th>F Tm</th>
                          <th>R Tm</th>
                          <th>ΔTm</th>
                          <th>F GC%</th>
                          <th>R GC%</th>
                          <th>评分</th>
                          <th>状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedPairs.map((pair, idx) => (
                          <tr
                            key={pair.id}
                            className={`cursor-pointer transition-colors ${selectedPairIdx === idx ? 'bg-primary-500/10' : ''}`}
                            onClick={() => setSelectedPairIdx(idx)}
                          >
                            <td className="font-mono text-slate-500">{idx + 1}</td>
                            <td className="font-mono text-xs text-emerald-400">{pair.forward.sequence}</td>
                            <td className="font-mono text-xs text-rose-400">{pair.reverse.sequence}</td>
                            <td className="font-mono text-white">{pair.productSize} bp</td>
                            <td className="font-mono text-xs text-slate-300">{pair.forward.metrics.tm.toFixed(1)}°C</td>
                            <td className="font-mono text-xs text-slate-300">{pair.reverse.metrics.tm.toFixed(1)}°C</td>
                            <td className={`font-mono text-xs ${pair.tmDifference <= 1 ? 'text-emerald-400' : pair.tmDifference <= 3 ? 'text-amber-400' : 'text-rose-400'}`}>
                              {pair.tmDifference.toFixed(1)}°C
                            </td>
                            <td className="font-mono text-xs text-slate-300">{pair.forward.metrics.gcPercent.toFixed(1)}%</td>
                            <td className="font-mono text-xs text-slate-300">{pair.reverse.metrics.gcPercent.toFixed(1)}%</td>
                            <td className="font-mono text-xs text-primary-400 font-bold">{pair.penaltyScore.toFixed(1)}</td>
                            <td>
                              {pair.passesConstraints ? (
                                <span className="badge bg-emerald-500/20 text-emerald-400 text-xs">
                                  <CheckCircle size={10} className="inline mr-1" />
                                  通过
                                </span>
                              ) : (
                                <span className="badge bg-amber-500/20 text-amber-400 text-xs">
                                  <AlertTriangle size={10} className="inline mr-1" />
                                  {pair.warnings.length}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-xl">
                    <AlertTriangle className="mx-auto text-slate-600 mb-3" size={40} />
                    <p className="text-slate-500 mb-2">未找到符合约束条件的引物对</p>
                    <p className="text-slate-600 text-sm">
                      请尝试放宽约束参数（如扩大 Tm 范围、降低 GC% 要求等）或选择更长的序列区域
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {!primerDesignResult && selectedSample && regionStart != null && regionEnd != null && (
            <div className="card p-5">
              <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-xl">
                <Sparkles className="mx-auto text-slate-600 mb-3" size={48} />
                <p className="text-slate-500 mb-2">已选择目标区域</p>
                <p className="text-slate-400 text-sm font-mono mb-4">
                  {regionStart.toLocaleString()} - {regionEnd.toLocaleString()}
                  ({(regionEnd - regionStart + 1).toLocaleString()} bp)
                </p>
                <button
                  className="btn-primary inline-flex items-center gap-2"
                  onClick={handleDesign}
                  disabled={loading}
                >
                  <Play size={16} />
                  开始设计引物
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
