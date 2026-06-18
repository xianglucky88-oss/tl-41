import { useState, useEffect } from 'react';
import {
  Workflow, Play, Save, RotateCcw, Plus, Trash2, ChevronRight,
  Settings, GitBranch, Clock, FileText, Zap, Copy, History
} from 'lucide-react';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import StatusBadge from '@/components/StatusBadge';
import DnaSequenceViewer from '@/components/DnaSequenceViewer';
import type { AlignmentTool, AlignmentToolConfig, AnalysisStep, AnalysisRecord, AlignmentResult } from '@shared/types';
import { ALIGNMENT_TOOLS } from '@shared/toolConfigs';

type StepEditorMode = 'select' | 'configure' | 'result';

export default function AnalysisWorkbench() {
  const {
    samples, projects, batches, analyses, alignmentResults,
    selectedSampleIds, setSelectedSampleIds,
    currentAnalysis, setCurrentAnalysis,
    createAnalysis, updateAnalysis, runAlignment, loading, error
  } = useAnalysisStore();

  const [analysisName, setAnalysisName] = useState('');
  const [analysisDescription, setAnalysisDescription] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [steps, setSteps] = useState<Array<{ id: string; toolId: AlignmentTool; parameters: Record<string, string | number | boolean> }>>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<StepEditorMode>('select');
  const [selectedTool, setSelectedTool] = useState<AlignmentToolConfig | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  const availableSamples = selectedBatchId
    ? samples.filter(s => s.batchId === selectedBatchId)
    : selectedProjectId
    ? samples.filter(s => s.projectId === selectedProjectId)
    : samples;

  const selectedStep = steps.find(s => s.id === selectedStepId);
  const selectedToolConfig = selectedStep ? ALIGNMENT_TOOLS.find(t => t.id === selectedStep.toolId) : null;

  const addStep = (toolId: AlignmentTool) => {
    const tool = ALIGNMENT_TOOLS.find(t => t.id === toolId);
    if (!tool) return;

    const defaultParams: Record<string, string | number | boolean> = {};
    tool.parameters.forEach(p => {
      defaultParams[p.name] = p.defaultValue;
    });

    const newStep = {
      id: `step_${Date.now()}`,
      toolId,
      parameters: defaultParams,
    };

    setSteps([...steps, newStep]);
    setSelectedStepId(newStep.id);
    setSelectedTool(tool);
    setEditorMode('configure');
  };

  const updateStepParameter = (stepId: string, paramName: string, value: string | number | boolean) => {
    setSteps(steps.map(s =>
      s.id === stepId ? { ...s, parameters: { ...s.parameters, [paramName]: value } } : s
    ));
  };

  const removeStep = (stepId: string) => {
    setSteps(steps.filter(s => s.id !== stepId));
    if (selectedStepId === stepId) {
      setSelectedStepId(null);
      setEditorMode('select');
    }
  };

  const runAnalysis = async () => {
    if (!analysisName || !selectedProjectId || selectedSampleIds.length === 0 || steps.length === 0) {
      alert('请填写分析名称、选择项目、样本和至少一个分析步骤');
      return;
    }

    const analysisData: Partial<AnalysisRecord> = {
      name: analysisName,
      description: analysisDescription,
      projectId: selectedProjectId,
      batchId: selectedBatchId || undefined,
      sampleIds: selectedSampleIds,
      status: 'running',
      steps: steps.map((s, idx) => ({
        stepId: s.id,
        stepName: `${ALIGNMENT_TOOLS.find(t => t.id === s.toolId)?.name || '分析'} - 步骤${idx + 1}`,
        toolId: s.toolId,
        toolVersion: ALIGNMENT_TOOLS.find(t => t.id === s.toolId)?.version || '1.0',
        parameters: s.parameters,
        startTime: new Date().toISOString(),
        endTime: '',
        status: idx === 0 ? 'running' : 'pending',
        inputFileIds: [],
        outputFileIds: [],
        log: idx === 0 ? '分析进行中...' : '',
      })),
      parametersSnapshot: {
        steps: steps.map(s => ({
          tool: s.toolId,
          parameters: s.parameters,
        })),
        selectedSamples: selectedSampleIds,
      },
    };

    const newAnalysis = await createAnalysis(analysisData);

    for (const step of steps) {
      await runAlignment(step.toolId, step.parameters, selectedSampleIds);
    }

    const totalVars = Math.floor(100 + Math.random() * 1000);
    const snpCount = Math.floor(totalVars * 0.85);
    const indelCount = totalVars - snpCount;
    const pathogenicCount = Math.floor(totalVars * 0.02);
    await updateAnalysis(newAnalysis.id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      resultSummary: {
        totalVariants: totalVars,
        snpCount,
        indelCount,
        pathogenicCount,
        alignedReads: Math.floor(1000000 + Math.random() * 10000000),
        alignmentRate: 95 + Math.random() * 5,
        meanQuality: 90 + Math.random() * 10,
      },
    });

    alert('分析完成！');
  };

  const saveAsTemplate = () => {
    alert('分析流程已保存为模板');
  };

  const resetForm = () => {
    setAnalysisName('');
    setAnalysisDescription('');
    setSelectedProjectId('');
    setSelectedBatchId('');
    setSteps([]);
    setSelectedStepId(null);
    setSelectedTool(null);
    setEditorMode('select');
    setSelectedSampleIds([]);
    setCurrentAnalysis(null);
  };

  const filteredBatches = selectedProjectId
    ? batches.filter(b => b.projectId === selectedProjectId)
    : batches;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">序列分析工作台</h1>
          <p className="text-slate-400">配置比对工具、设置参数、运行分析流程</p>
        </div>
        <div className="flex items-center gap-3">
          {currentAnalysis && (
            <button
              className="btn-secondary flex items-center gap-2"
              onClick={() => setShowVersionHistory(!showVersionHistory)}
            >
              <History size={16} />
              版本 v{currentAnalysis.version}
            </button>
          )}
          <button className="btn-secondary flex items-center gap-2" onClick={resetForm}>
            <RotateCcw size={16} />
            重置
          </button>
          <button className="btn-secondary flex items-center gap-2" onClick={saveAsTemplate}>
            <Save size={16} />
            保存模板
          </button>
          <button className="btn-primary flex items-center gap-2" onClick={runAnalysis} disabled={loading}>
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                运行中...
              </>
            ) : (
              <>
                <Play size={16} />
                运行分析
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
        <div className="col-span-4 space-y-6">
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText size={20} className="text-primary-400" />
              基本信息
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">分析名称 *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="输入分析名称"
                  value={analysisName}
                  onChange={(e) => setAnalysisName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">分析描述</label>
                <textarea
                  className="input-field min-h-[80px] resize-none"
                  placeholder="输入分析描述"
                  value={analysisDescription}
                  onChange={(e) => setAnalysisDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">所属项目 *</label>
                <select
                  className="select-field"
                  value={selectedProjectId}
                  onChange={(e) => { setSelectedProjectId(e.target.value); setSelectedBatchId(''); }}
                >
                  <option value="">选择项目</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">所属批次</label>
                <select
                  className="select-field"
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                >
                  <option value="">全部批次</option>
                  {filteredBatches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Workflow size={20} className="text-primary-400" />
              分析步骤
              <button
                className="ml-auto p-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 transition-colors"
                onClick={() => { setEditorMode('select'); setSelectedStepId(null); }}
              >
                <Plus size={16} />
              </button>
            </h2>

            {steps.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-700 rounded-xl">
                <Workflow className="mx-auto text-slate-600 mb-3" size={32} />
                <p className="text-slate-500 text-sm">点击上方 + 按钮添加分析步骤</p>
              </div>
            ) : (
              <div className="space-y-2">
                {steps.map((step, idx) => {
                  const tool = ALIGNMENT_TOOLS.find(t => t.id === step.toolId);
                  const isSelected = selectedStepId === step.id;
                  return (
                    <div key={step.id}>
                      <div
                        className={`p-3 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-primary-500/10 border border-primary-500/30'
                            : 'bg-slate-800/50 border border-transparent hover:border-slate-700'
                        }`}
                        onClick={() => { setSelectedStepId(step.id); setEditorMode('configure'); }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-sm font-bold text-white">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-white text-sm">{tool?.name}</p>
                            <p className="text-xs text-slate-500">{tool?.description.slice(0, 30)}...</p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeStep(step.id); }}
                            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                          <ChevronRight size={16} className="text-slate-500" />
                        </div>
                      </div>
                      {idx < steps.length - 1 && <div className="step-connector" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card p-5">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <GitBranch size={20} className="text-primary-400" />
              选择样本 <span className="text-sm font-normal text-slate-400">({selectedSampleIds.length} 已选)</span>
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availableSamples.slice(0, 15).map((sample) => (
                <label
                  key={sample.id}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                    selectedSampleIds.includes(sample.id)
                      ? 'bg-primary-500/10 border border-primary-500/30'
                      : 'bg-slate-800/30 border border-transparent hover:bg-slate-800/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSampleIds.includes(sample.id)}
                    onChange={() => {
                      if (selectedSampleIds.includes(sample.id)) {
                        setSelectedSampleIds(selectedSampleIds.filter(id => id !== sample.id));
                      } else {
                        setSelectedSampleIds([...selectedSampleIds, sample.id]);
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-primary-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm text-white truncate">{sample.name}</p>
                    <p className="text-xs text-slate-500">{sample.organism}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-8 space-y-6">
          <div className="card p-5">
            {editorMode === 'select' && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">选择比对工具</h3>
                <div className="grid grid-cols-2 gap-4">
                  {ALIGNMENT_TOOLS.map((tool) => (
                    <div
                      key={tool.id}
                      className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-primary-500/30 hover:bg-slate-800/80 cursor-pointer transition-all group"
                      onClick={() => addStep(tool.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-white group-hover:text-primary-400 transition-colors">{tool.name}</h4>
                          <span className="text-xs text-slate-500">v{tool.version}</span>
                        </div>
                        <span className="badge bg-primary-500/20 text-primary-400 text-xs">{tool.category}</span>
                      </div>
                      <p className="text-sm text-slate-400 mb-4">{tool.description}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Settings size={12} />
                        <span>{tool.parameters.length} 个可配置参数</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {editorMode === 'configure' && selectedStep && selectedToolConfig && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{selectedToolConfig.name} - 参数配置</h3>
                    <p className="text-sm text-slate-400">{selectedToolConfig.description}</p>
                  </div>
                  <button
                    className="btn-secondary text-sm flex items-center gap-2"
                    onClick={() => setEditorMode('result')}
                  >
                    <Zap size={14} />
                    预览结果
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {selectedToolConfig.parameters.map((param) => (
                    <div key={param.name}>
                      <label className="block text-sm text-slate-300 mb-2">
                        {param.label}
                        <span className="text-xs text-slate-500 ml-2">{param.description}</span>
                      </label>
                      {param.type === 'select' ? (
                        <select
                          className="select-field"
                          value={String(selectedStep.parameters[param.name])}
                          onChange={(e) => updateStepParameter(selectedStep.id, param.name, e.target.value)}
                        >
                          {param.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : param.type === 'boolean' ? (
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(selectedStep.parameters[param.name])}
                            onChange={(e) => updateStepParameter(selectedStep.id, param.name, e.target.checked)}
                            className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-primary-500"
                          />
                          <span className="text-sm text-slate-400">
                            {selectedStep.parameters[param.name] ? '已启用' : '已禁用'}
                          </span>
                        </label>
                      ) : (
                        <input
                          type={param.type === 'number' ? 'number' : 'text'}
                          className="input-field"
                          value={String(selectedStep.parameters[param.name])}
                          onChange={(e) => updateStepParameter(
                            selectedStep.id,
                            param.name,
                            param.type === 'number' ? Number(e.target.value) : e.target.value
                          )}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-slate-950/50 rounded-xl border border-slate-700">
                  <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                    <Copy size={16} className="text-primary-400" />
                    命令行预览
                  </h4>
                  <code className="font-mono text-sm text-slate-400">
                    {selectedToolConfig.id} {Object.entries(selectedStep.parameters).map(([k, v]) =>
                      typeof v === 'boolean' ? (v ? `--${k}` : '') : `--${k} ${v}`
                    ).filter(Boolean).join(' ')}
                  </code>
                </div>
              </div>
            )}

            {editorMode === 'result' && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText size={20} className="text-primary-400" />
                  比对结果预览
                </h3>
                {alignmentResults.length > 0 ? (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {alignmentResults.slice(0, 5).map((result, idx) => (
                      <AlignmentResultCard key={idx} result={result} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-xl">
                    <FileText className="mx-auto text-slate-600 mb-3" size={48} />
                    <p className="text-slate-500">运行分析后将显示比对结果</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {currentAnalysis && (
            <div className="card p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock size={20} className="text-primary-400" />
                当前分析状态
              </h3>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-slate-400 mb-1">分析名称</p>
                  <p className="font-medium text-white">{currentAnalysis.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">状态</p>
                  <StatusBadge status={currentAnalysis.status} />
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">版本</p>
                  <p className="font-medium text-white">v{currentAnalysis.version}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">步骤进度</p>
                  <p className="font-medium text-white">{currentAnalysis.currentStep}/{currentAnalysis.steps.length}</p>
                </div>
                <div className="flex-1">
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500"
                      style={{ width: `${currentAnalysis.steps.length > 0 ? (currentAnalysis.currentStep / currentAnalysis.steps.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AlignmentResultCard({ result }: { result: AlignmentResult }) {
  return (
    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div>
            <p className="font-mono text-sm text-white">{result.queryId}</p>
            <p className="text-xs text-slate-500">→ {result.subjectId}</p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="text-center">
            <p className="text-primary-400 font-bold">{result.percentIdentity.toFixed(1)}%</p>
            <p className="text-xs text-slate-500">一致性</p>
          </div>
          <div className="text-center">
            <p className="text-blue-400 font-bold">{result.alignmentLength}</p>
            <p className="text-xs text-slate-500">比对长度</p>
          </div>
          <div className="text-center">
            <p className="text-accent-400 font-bold">{result.bitScore.toFixed(0)}</p>
            <p className="text-xs text-slate-500">Bit Score</p>
          </div>
          <div className="text-center">
            <p className="text-rose-400 font-bold">{result.eValue.toExponential(2)}</p>
            <p className="text-xs text-slate-500">E-Value</p>
          </div>
        </div>
      </div>

      <div className="space-y-1 font-mono text-xs">
        <div className="flex">
          <span className="text-slate-500 w-24 flex-shrink-0">Query {result.queryStart}</span>
          <span className="flex-1 sequence-display">
            {result.querySequence.split('').map((base, i) => (
              <span key={i} className={`dna-base-${base.toLowerCase()}`}>{base}</span>
            ))}
          </span>
          <span className="text-slate-500 w-24 text-right flex-shrink-0">{result.queryEnd}</span>
        </div>
        <div className="flex">
          <span className="w-24 flex-shrink-0" />
          <span className="flex-1 text-slate-500">{result.midline}</span>
          <span className="w-24 flex-shrink-0" />
        </div>
        <div className="flex">
          <span className="text-slate-500 w-24 flex-shrink-0">Sbjct {result.subjectStart}</span>
          <span className="flex-1 sequence-display">
            {result.subjectSequence.split('').map((base, i) => (
              <span key={i} className={`dna-base-${base.toLowerCase()}`}>{base}</span>
            ))}
          </span>
          <span className="text-slate-500 w-24 text-right flex-shrink-0">{result.subjectEnd}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between text-xs text-slate-500">
        <span>错配: {result.mismatches}</span>
        <span>空位: {result.gapOpens}</span>
      </div>
    </div>
  );
}
