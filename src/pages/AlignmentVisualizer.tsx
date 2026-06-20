import { useState, useMemo } from 'react';
import { RefreshCw, Layers, Target, GitBranch, ChevronDown, ChevronUp } from 'lucide-react';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import BlastDotPlot from '@/components/BlastDotPlot';
import ClustalLogoViewer from '@/components/ClustalLogoViewer';
import { generateBlastDotPlotData, generateClustalAlignmentData } from '@shared/mockData';
import type { BlastDotPlotData, ClustalAlignmentData } from '@shared/types';

type VisualizerTab = 'blast' | 'clustalw';

export default function AlignmentVisualizer() {
  const { samples, analyses } = useAnalysisStore();
  const [activeTab, setActiveTab] = useState<VisualizerTab>('blast');

  const [blastQueryId, setBlastQueryId] = useState(samples[0]?.id || 'sample_001');
  const [blastSubjectId, setBlastSubjectId] = useState('chr17_reference');
  const [blastData, setBlastData] = useState<BlastDotPlotData>(() =>
    generateBlastDotPlotData(samples[0]?.id || 'sample_001', 'chr17_reference')
  );

  const [clustalSequenceCount, setClustalSequenceCount] = useState(6);
  const [clustalAlignmentLength, setClustalAlignmentLength] = useState(300);
  const [clustalSequenceType, setClustalSequenceType] = useState<'dna' | 'protein'>('dna');
  const [clustalData, setClustalData] = useState<ClustalAlignmentData>(() =>
    generateClustalAlignmentData(6, 300, 'dna')
  );

  const [expandedSection, setExpandedSection] = useState<'controls' | null>('controls');

  const sampleOptions = useMemo(() => samples.slice(0, 10), [samples]);

  const regenerateBlast = () => {
    setBlastData(generateBlastDotPlotData(blastQueryId, blastSubjectId));
  };

  const regenerateClustal = () => {
    setClustalData(
      generateClustalAlignmentData(clustalSequenceCount, clustalAlignmentLength, clustalSequenceType)
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">序列比对可视化器</h1>
          <p className="text-slate-400">交互式可视化 BLAST 和 ClustalW 的序列比对结果</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          className={`px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
            activeTab === 'blast'
              ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-lg shadow-teal-500/20'
              : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700'
          }`}
          onClick={() => setActiveTab('blast')}
        >
          <Target size={18} />
          BLAST 点阵图
        </button>
        <button
          className={`px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
            activeTab === 'clustalw'
              ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/20'
              : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700'
          }`}
          onClick={() => setActiveTab('clustalw')}
        >
          <GitBranch size={18} />
          ClustalW 一致性标识图
        </button>
      </div>

      <div className="card p-4">
        <button
          className="w-full flex items-center justify-between text-left"
          onClick={() => setExpandedSection(expandedSection === 'controls' ? null : 'controls')}
        >
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-primary-400" />
            <span className="font-medium text-white">数据设置</span>
          </div>
          {expandedSection === 'controls' ? (
            <ChevronUp size={20} className="text-slate-400" />
          ) : (
            <ChevronDown size={20} className="text-slate-400" />
          )}
        </button>

        {expandedSection === 'controls' && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            {activeTab === 'blast' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Query 序列</label>
                  <select
                    className="select-field"
                    value={blastQueryId}
                    onChange={(e) => setBlastQueryId(e.target.value)}
                  >
                    {sampleOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.id})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Subject 序列/染色体</label>
                  <input
                    type="text"
                    className="input-field"
                    value={blastSubjectId}
                    onChange={(e) => setBlastSubjectId(e.target.value)}
                    placeholder="输入 Subject ID"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    className="btn-primary w-full flex items-center justify-center gap-2"
                    onClick={regenerateBlast}
                  >
                    <RefreshCw size={16} />
                    重新生成比对数据
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">序列数量</label>
                  <input
                    type="number"
                    className="input-field"
                    min={2}
                    max={20}
                    value={clustalSequenceCount}
                    onChange={(e) =>
                      setClustalSequenceCount(Math.max(2, Math.min(20, Number(e.target.value))))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">比对长度 (bp)</label>
                  <input
                    type="number"
                    className="input-field"
                    min={50}
                    max={2000}
                    step={50}
                    value={clustalAlignmentLength}
                    onChange={(e) =>
                      setClustalAlignmentLength(Math.max(50, Math.min(2000, Number(e.target.value))))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">序列类型</label>
                  <select
                    className="select-field"
                    value={clustalSequenceType}
                    onChange={(e) => setClustalSequenceType(e.target.value as 'dna' | 'protein')}
                  >
                    <option value="dna">DNA</option>
                    <option value="protein">Protein</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    className="btn-primary w-full flex items-center justify-center gap-2"
                    onClick={regenerateClustal}
                  >
                    <RefreshCw size={16} />
                    重新生成比对数据
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {activeTab === 'blast' ? (
        <BlastDotPlot data={blastData} />
      ) : (
        <ClustalLogoViewer data={clustalData} sequenceType={clustalSequenceType} />
      )}

      {activeTab === 'blast' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <p className="text-xs text-slate-400 mb-1">HSP 数量</p>
            <p className="text-2xl font-bold text-white">{blastData.hsps.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-slate-400 mb-1">平均一致性</p>
            <p className="text-2xl font-bold text-green-400">
              {(
                blastData.hsps.reduce((s, h) => s + h.percentIdentity, 0) /
                Math.max(1, blastData.hsps.length)
              ).toFixed(1)}
              %
            </p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-slate-400 mb-1">平均比对长度</p>
            <p className="text-2xl font-bold text-blue-400">
              {Math.round(
                blastData.hsps.reduce((s, h) => s + h.alignmentLength, 0) /
                  Math.max(1, blastData.hsps.length)
              )}
              <span className="text-sm font-normal text-slate-400 ml-1">bp</span>
            </p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-slate-400 mb-1">最高 Bit Score</p>
            <p className="text-2xl font-bold text-yellow-400">
              {Math.round(Math.max(...blastData.hsps.map((h) => h.bitScore)))}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'clustalw' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <p className="text-xs text-slate-400 mb-1">序列数量</p>
            <p className="text-2xl font-bold text-white">{clustalData.sequences.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-slate-400 mb-1">比对长度</p>
            <p className="text-2xl font-bold text-primary-400">
              {clustalData.alignmentLength}
              <span className="text-sm font-normal text-slate-400 ml-1">
                {clustalSequenceType === 'dna' ? 'bp' : 'aa'}
              </span>
            </p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-slate-400 mb-1">平均保守性</p>
            <p className="text-2xl font-bold text-green-400">
              {(
                (clustalData.conservationScores.reduce((s, c) => s + c, 0) /
                  Math.max(1, clustalData.conservationScores.length)) *
                100
              ).toFixed(1)}
              %
            </p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-slate-400 mb-1">高度保守位点 (≥90%)</p>
            <p className="text-2xl font-bold text-yellow-400">
              {clustalData.conservationScores.filter((c) => c >= 0.9).length}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'blast' && (
        <div className="card p-5">
          <h3 className="text-lg font-semibold text-white mb-4">HSP 列表</h3>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Query 范围</th>
                  <th>Subject 范围</th>
                  <th>一致性</th>
                  <th>长度</th>
                  <th>链</th>
                  <th>Bit Score</th>
                  <th>E-Value</th>
                </tr>
              </thead>
              <tbody>
                {blastData.hsps
                  .sort((a, b) => b.bitScore - a.bitScore)
                  .slice(0, 15)
                  .map((hsp, idx) => (
                    <tr key={idx}>
                      <td className="text-slate-400">{idx + 1}</td>
                      <td className="font-mono text-slate-200">
                        {hsp.queryStart} - {hsp.queryEnd}
                      </td>
                      <td className="font-mono text-slate-200">
                        {hsp.subjectStart} - {hsp.subjectEnd}
                      </td>
                      <td>
                        <span className="text-green-400 font-medium">
                          {hsp.percentIdentity.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-blue-400">{hsp.alignmentLength}</td>
                      <td>
                        <span
                          className={`badge ${
                            hsp.strand === 'plus'
                              ? 'bg-teal-500/20 text-teal-400'
                              : 'bg-orange-500/20 text-orange-400'
                          }`}
                        >
                          {hsp.strand}
                        </span>
                      </td>
                      <td className="text-yellow-400 font-mono">{hsp.bitScore.toFixed(0)}</td>
                      <td className="text-rose-400 font-mono">{hsp.eValue.toExponential(2)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
