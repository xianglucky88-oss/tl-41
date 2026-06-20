import { useState, useMemo } from 'react';
import {
  Dna, Settings, Play, RotateCcw, BarChart3, Table2,
  TrendingUp, Info
} from 'lucide-react';
import { useAnalysisStore } from '@/store/useAnalysisStore';

const SAMPLE_WINDOW_SIZES = [50, 100, 200, 500];
const SAMPLE_STEP_SIZES = [5, 10, 20, 50];

function GcChart({ dataPoints, overallGc, sequenceLength }: {
  dataPoints: { position: number; gcPercent: number }[];
  overallGc: number;
  sequenceLength: number;
}) {
  const width = 900;
  const height = 320;
  const margin = { top: 30, right: 40, bottom: 50, left: 60 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  const maxPos = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].position : sequenceLength;
  const xScale = (pos: number) => margin.left + (pos / maxPos) * plotW;
  const yScale = (pct: number) => margin.top + plotH - (pct / 100) * plotH;

  const linePath = dataPoints.map((pt, i) => {
    const x = xScale(pt.position);
    const y = yScale(pt.gcPercent);
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');

  const areaPath = linePath +
    ` L ${xScale(dataPoints[dataPoints.length - 1]?.position ?? 0).toFixed(1)} ${yScale(0).toFixed(1)}` +
    ` L ${xScale(dataPoints[0]?.position ?? 0).toFixed(1)} ${yScale(0).toFixed(1)} Z`;

  const yTicks = [0, 20, 40, 60, 80, 100];
  const xTickCount = 8;
  const xTicks = Array.from({ length: xTickCount + 1 }, (_, i) => Math.round((maxPos / xTickCount) * i));

  const overallY = yScale(overallGc);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id="gcAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      <rect x={margin.left} y={margin.top} width={plotW} height={plotH} fill="rgba(15,23,42,0.4)" rx="4" />

      {yTicks.map(tick => (
        <g key={tick}>
          <line
            x1={margin.left} y1={yScale(tick)} x2={margin.left + plotW} y2={yScale(tick)}
            stroke="#334155" strokeDasharray="4,4" strokeWidth={0.5}
          />
          <text x={margin.left - 10} y={yScale(tick) + 4} textAnchor="end" fill="#94a3b8" fontSize={11}>
            {tick}%
          </text>
        </g>
      ))}

      {xTicks.map(tick => (
        <g key={tick}>
          <line
            x1={xScale(tick)} y1={margin.top} x2={xScale(tick)} y2={margin.top + plotH}
            stroke="#334155" strokeDasharray="4,4" strokeWidth={0.5}
          />
          <text x={xScale(tick)} y={margin.top + plotH + 20} textAnchor="middle" fill="#94a3b8" fontSize={11}>
            {tick.toLocaleString()}
          </text>
        </g>
      ))}

      <text x={width / 2} y={height - 5} textAnchor="middle" fill="#94a3b8" fontSize={12}>
        序列位置 (bp)
      </text>
      <text x={14} y={height / 2} textAnchor="middle" fill="#94a3b8" fontSize={12} transform={`rotate(-90, 14, ${height / 2})`}>
        GC含量 (%)
      </text>

      {dataPoints.length > 1 && (
        <path d={areaPath} fill="url(#gcAreaGrad)" />
      )}
      {dataPoints.length > 1 && (
        <path d={linePath} fill="none" stroke="#14b8a6" strokeWidth={2} strokeLinejoin="round" />
      )}

      <line
        x1={margin.left} y1={overallY} x2={margin.left + plotW} y2={overallY}
        stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="8,4"
      />
      <rect x={margin.left + plotW + 4} y={overallY - 10} width={36} height={20} rx={4} fill="#f59e0b" fillOpacity={0.15} stroke="#f59e0b" strokeWidth={0.5} />
      <text x={margin.left + plotW + 22} y={overallY + 4} textAnchor="middle" fill="#f59e0b" fontSize={10} fontWeight={600}>
        {overallGc.toFixed(1)}%
      </text>

      <text x={margin.left + 4} y={overallY - 6} fill="#f59e0b" fontSize={9} opacity={0.8}>
        均值
      </text>
    </svg>
  );
}

function PositionFrequencyChart({ frequencies }: { frequencies: { position: 1 | 2 | 3; A: number; T: number; G: number; C: number; gcPercent: number }[] }) {
  const width = 360;
  const height = 220;
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  const barGroupWidth = plotW / 3;
  const barWidth = barGroupWidth * 0.18;
  const bases = ['A', 'T', 'G', 'C'] as const;
  const baseColors: Record<string, string> = { A: '#4ade80', T: '#f87171', G: '#facc15', C: '#60a5fa' };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {[0, 0.25, 0.5, 0.75, 1.0].map(tick => {
        const y = margin.top + plotH - tick * plotH;
        return (
          <g key={tick}>
            <line x1={margin.left} y1={y} x2={margin.left + plotW} y2={y} stroke="#334155" strokeDasharray="3,3" strokeWidth={0.5} />
            <text x={margin.left - 8} y={y + 4} textAnchor="end" fill="#94a3b8" fontSize={10}>
              {(tick * 100).toFixed(0)}%
            </text>
          </g>
        );
      })}

      {frequencies.map((freq, gi) => {
        const groupX = margin.left + gi * barGroupWidth + barGroupWidth * 0.1;
        return (
          <g key={freq.position}>
            {bases.map((base, bi) => {
              const val = freq[base];
              const barH = val * plotH;
              const x = groupX + bi * barWidth * 1.3;
              const y = margin.top + plotH - barH;
              return (
                <rect key={base} x={x} y={y} width={barWidth} height={barH} fill={baseColors[base]} rx={2} opacity={0.85} />
              );
            })}
            <text x={groupX + barGroupWidth * 0.35} y={margin.top + plotH + 18} textAnchor="middle" fill="#e2e8f0" fontSize={12} fontWeight={600}>
              位置 {freq.position}
            </text>
            <text x={groupX + barGroupWidth * 0.35} y={margin.top + plotH + 32} textAnchor="middle" fill="#14b8a6" fontSize={10}>
              GC {freq.gcPercent.toFixed(1)}%
            </text>
          </g>
        );
      })}

      {bases.map((base, i) => (
        <g key={base} transform={`translate(${width - margin.right - 70}, ${margin.top + i * 18})`}>
          <rect width={12} height={12} fill={baseColors[base]} rx={2} />
          <text x={16} y={10} fill="#94a3b8" fontSize={10}>{base}</text>
        </g>
      ))}
    </svg>
  );
}

export default function GcCodonAnalyzer() {
  const {
    samples, gcSlidingWindowResult, codonPreferenceResult,
    analyzeGcContent, analyzeCodonPreference, loading, error
  } = useAnalysisStore();

  const [selectedSampleId, setSelectedSampleId] = useState('');
  const [windowSize, setWindowSize] = useState(100);
  const [stepSize, setStepSize] = useState(10);
  const [activeTab, setActiveTab] = useState<'gc' | 'codon'>('gc');

  const dnaSamples = useMemo(() => samples.filter(s => s.sequenceType === 'dna'), [samples]);

  const selectedSample = samples.find(s => s.id === selectedSampleId);

  const handleAnalyze = () => {
    if (!selectedSampleId) return;
    if (activeTab === 'gc') {
      analyzeGcContent(selectedSampleId, windowSize, stepSize);
    } else {
      analyzeCodonPreference(selectedSampleId);
    }
  };

  const handleAnalyzeAll = () => {
    if (!selectedSampleId) return;
    analyzeGcContent(selectedSampleId, windowSize, stepSize);
    analyzeCodonPreference(selectedSampleId);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">GC含量与密码子偏好分析</h1>
          <p className="text-slate-400">滑动窗口分析 DNA 序列 GC% 变化曲线，统计密码子位置碱基偏好及 RSCU</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="btn-secondary flex items-center gap-2"
            onClick={() => { setSelectedSampleId(''); setWindowSize(100); setStepSize(10); }}
          >
            <RotateCcw size={16} />
            重置
          </button>
          <button
            className="btn-primary flex items-center gap-2"
            onClick={handleAnalyzeAll}
            disabled={loading || !selectedSampleId}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                分析中...
              </>
            ) : (
              <>
                <Play size={16} />
                全部分析
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
              分析参数
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">窗口大小</label>
                <select
                  className="select-field"
                  value={windowSize}
                  onChange={(e) => setWindowSize(Number(e.target.value))}
                >
                  {SAMPLE_WINDOW_SIZES.map(ws => (
                    <option key={ws} value={ws}>{ws} bp</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">步长</label>
                <select
                  className="select-field"
                  value={stepSize}
                  onChange={(e) => setStepSize(Number(e.target.value))}
                >
                  {SAMPLE_STEP_SIZES.map(ss => (
                    <option key={ss} value={ss}>{ss} bp</option>
                  ))}
                </select>
              </div>
              <button
                className="btn-primary w-full flex items-center justify-center gap-2"
                onClick={handleAnalyze}
                disabled={loading || !selectedSampleId}
              >
                <Play size={16} />
                {activeTab === 'gc' ? '分析GC含量' : '分析密码子偏好'}
              </button>
            </div>
          </div>

          {gcSlidingWindowResult && (
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <TrendingUp size={20} className="text-primary-400" />
                GC统计摘要
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">整体GC含量</span>
                  <span className="text-primary-400 font-bold">{gcSlidingWindowResult.overallGcPercent.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">序列长度</span>
                  <span className="text-white">{gcSlidingWindowResult.sequenceLength.toLocaleString()} bp</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">窗口大小</span>
                  <span className="text-white">{gcSlidingWindowResult.windowSize} bp</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">步长</span>
                  <span className="text-white">{gcSlidingWindowResult.stepSize} bp</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">数据点数</span>
                  <span className="text-white">{gcSlidingWindowResult.dataPoints.length}</span>
                </div>
                {gcSlidingWindowResult.dataPoints.length > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">最小GC%</span>
                      <span className="text-blue-400 font-bold">
                        {Math.min(...gcSlidingWindowResult.dataPoints.map(d => d.gcPercent)).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">最大GC%</span>
                      <span className="text-rose-400 font-bold">
                        {Math.max(...gcSlidingWindowResult.dataPoints.map(d => d.gcPercent)).toFixed(2)}%
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="col-span-9 space-y-6">
          <div className="card p-5">
            <div className="flex items-center gap-1 mb-6 p-1 bg-slate-800/50 rounded-xl w-fit">
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'gc' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
                onClick={() => setActiveTab('gc')}
              >
                <BarChart3 size={16} />
                GC滑动窗口
              </button>
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'codon' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
                onClick={() => setActiveTab('codon')}
              >
                <Table2 size={16} />
                密码子偏好
              </button>
            </div>

            {activeTab === 'gc' && (
              <div>
                {gcSlidingWindowResult && gcSlidingWindowResult.dataPoints.length > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-4">
                      <GcChart
                        dataPoints={gcSlidingWindowResult.dataPoints}
                        overallGc={gcSlidingWindowResult.overallGcPercent}
                        sequenceLength={gcSlidingWindowResult.sequenceLength}
                      />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <Info size={14} />
                      <span>黄色虚线为整体GC均值，曲线反映各滑动窗口内的GC%变化趋势</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-xl">
                    <BarChart3 className="mx-auto text-slate-600 mb-3" size={48} />
                    <p className="text-slate-500">选择样本并点击分析，查看GC含量滑动窗口曲线</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'codon' && (
              <div>
                {codonPreferenceResult ? (
                  <div className="space-y-6">
                    <div className="card p-5">
                      <h3 className="text-lg font-semibold text-white mb-4">密码子位置碱基频率</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-4">
                          <PositionFrequencyChart frequencies={codonPreferenceResult.positionFrequencies} />
                        </div>
                        <div className="space-y-4">
                          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                            <h4 className="text-sm font-medium text-slate-300 mb-3">各位置GC含量</h4>
                            <div className="space-y-3">
                              {codonPreferenceResult.positionFrequencies.map(freq => (
                                <div key={freq.position}>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm text-slate-400">位置 {freq.position}</span>
                                    <span className="text-sm font-bold text-primary-400">{freq.gcPercent.toFixed(1)}%</span>
                                  </div>
                                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
                                      style={{ width: `${freq.gcPercent}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                            <h4 className="text-sm font-medium text-slate-300 mb-3">碱基频率详情</h4>
                            <table className="w-full text-sm">
                              <thead>
                                <tr>
                                  <th className="text-left text-slate-500 pb-2">位置</th>
                                  <th className="text-right text-slate-500 pb-2">A</th>
                                  <th className="text-right text-slate-500 pb-2">T</th>
                                  <th className="text-right text-slate-500 pb-2">G</th>
                                  <th className="text-right text-slate-500 pb-2">C</th>
                                </tr>
                              </thead>
                              <tbody>
                                {codonPreferenceResult.positionFrequencies.map(freq => (
                                  <tr key={freq.position} className="border-t border-slate-700/50">
                                    <td className="py-2 text-white font-medium">位置 {freq.position}</td>
                                    <td className="py-2 text-right text-green-400">{(freq.A * 100).toFixed(1)}%</td>
                                    <td className="py-2 text-right text-red-400">{(freq.T * 100).toFixed(1)}%</td>
                                    <td className="py-2 text-right text-yellow-400">{(freq.G * 100).toFixed(1)}%</td>
                                    <td className="py-2 text-right text-blue-400">{(freq.C * 100).toFixed(1)}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-400">总密码子数</span>
                              <span className="text-sm font-bold text-white">{codonPreferenceResult.codonCount.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="card p-5">
                      <h3 className="text-lg font-semibold text-white mb-4">相对同义密码子使用度 (RSCU)</h3>
                      <p className="text-xs text-slate-500 mb-4">
                        RSCU &gt; 1 表示该密码子使用频率高于预期（偏好使用），RSCU &lt; 1 表示使用频率低于预期（避免使用），RSCU = 1 表示无偏好
                      </p>
                      <div className="max-h-[480px] overflow-y-auto">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>氨基酸</th>
                              <th>密码子</th>
                              <th>观察计数</th>
                              <th>期望计数</th>
                              <th>RSCU</th>
                              <th>偏好程度</th>
                            </tr>
                          </thead>
                          <tbody>
                            {codonPreferenceResult.rscuTable.map((entry) => {
                              const bias = entry.rscu > 1.2 ? '偏好' : entry.rscu < 0.8 ? '避免' : '中性';
                              const biasClass = entry.rscu > 1.2 ? 'text-emerald-400' : entry.rscu < 0.8 ? 'text-rose-400' : 'text-slate-400';
                              return (
                                <tr key={entry.codon}>
                                  <td className="font-medium text-white">{entry.aminoAcid}</td>
                                  <td className="font-mono text-primary-400">{entry.codon}</td>
                                  <td>{entry.count}</td>
                                  <td>{entry.expected}</td>
                                  <td>
                                    <span className={`font-bold ${entry.rscu > 1.2 ? 'text-emerald-400' : entry.rscu < 0.8 ? 'text-rose-400' : 'text-white'}`}>
                                      {entry.rscu.toFixed(2)}
                                    </span>
                                  </td>
                                  <td>
                                    <span className={`badge ${entry.rscu > 1.2 ? 'bg-emerald-500/20 text-emerald-400' : entry.rscu < 0.8 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-700 text-slate-400'}`}>
                                      {bias}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-xl">
                    <Table2 className="mx-auto text-slate-600 mb-3" size={48} />
                    <p className="text-slate-500">选择样本并点击分析，查看密码子偏好统计</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
