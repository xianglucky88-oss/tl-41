import { useState, useMemo, useEffect } from 'react';
import {
  Workflow, Play, Save, RotateCcw, GitBranch, Clock, FileText, History, Sparkles, Layers,
  LayoutTemplate, X, Heart, Star, Clock as ClockIcon, Cpu, HardDrive, ChevronRight, Search
} from 'lucide-react';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import StatusBadge from '@/components/StatusBadge';
import StepLogPanel from '@/components/StepLogPanel';
import DAGCanvas from '@/components/DAGCanvas/DAGCanvas';
import ToolPalette from '@/components/DAGCanvas/ToolPalette';
import NodePropertyPanel from '@/components/DAGCanvas/NodePropertyPanel';
import { createNode } from '@/components/DAGCanvas/DAGCanvas';
import type { WorkflowGraph, WorkflowNode, WorkflowEdge, AlignmentTool, AnalysisStep, AnalysisRecord, AlignmentResult, WorkflowTemplate, LogLine } from '@shared/types';
import { ALIGNMENT_TOOLS } from '@shared/toolConfigs';
import { TEMPLATE_CATEGORY_LABELS } from '@shared/types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function createInitialGraph(): WorkflowGraph {
  const inputNode = createNode('input', { x: 60, y: 200 });
  const toolNode = createNode('tool', { x: 340, y: 200 }, 'blastn');
  const outputNode = createNode('output', { x: 620, y: 200 });

  const edge1: WorkflowEdge = {
    id: `edge_${Date.now()}_1`,
    source: inputNode.id,
    target: toolNode.id,
    sourcePort: 'out-1',
    targetPort: 'in-1',
  };

  const edge2: WorkflowEdge = {
    id: `edge_${Date.now()}_2`,
    source: toolNode.id,
    target: outputNode.id,
    sourcePort: 'out-1',
    targetPort: 'in-1',
  };

  return {
    nodes: [inputNode, toolNode, outputNode],
    edges: [edge1, edge2],
  };
}

function topologicalSort(graph: WorkflowGraph): WorkflowNode[] {
  const inDegree: Record<string, number> = {};
  const adjacency: Record<string, string[]> = {};

  graph.nodes.forEach(node => {
    inDegree[node.id] = 0;
    adjacency[node.id] = [];
  });

  graph.edges.forEach(edge => {
    adjacency[edge.source].push(edge.target);
    inDegree[edge.target] = (inDegree[edge.target] || 0) + 1;
  });

  const queue: string[] = [];
  Object.keys(inDegree).forEach(id => {
    if (inDegree[id] === 0) {
      queue.push(id);
    }
  });

  const result: WorkflowNode[] = [];
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const node = graph.nodes.find(n => n.id === nodeId);
    if (node) {
      result.push(node);
    }
    adjacency[nodeId].forEach(neighbor => {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    });
  }

  return result;
}

export default function AnalysisWorkbench() {
  const {
    samples, projects, batches, analyses, alignmentResults,
    templates, popularTemplates, favoriteTemplates,
    pendingTemplateGraph, pendingTemplateName,
    selectedSampleIds, setSelectedSampleIds,
    currentAnalysis, setCurrentAnalysis,
    createAnalysis, updateAnalysis, runAlignment, completeAnalysis,
    saveAnalysisTemplate, loading, error,
    fetchTemplates, fetchPopularTemplates, fetchFavorites,
    useTemplate, toggleFavorite, clearPendingTemplate,
    appendStepLog, appendStepLogs, setStepStatus, setCurrentStepIndex, initStepLogLines,
  } = useAnalysisStore();

  const [analysisName, setAnalysisName] = useState('');
  const [analysisDescription, setAnalysisDescription] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');

  const [graph, setGraph] = useState<WorkflowGraph>(() => {
    if (pendingTemplateGraph) {
      return pendingTemplateGraph;
    }
    return createInitialGraph();
  });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateTab, setTemplateTab] = useState<'popular' | 'all' | 'favorites'>('popular');
  const [templateSearch, setTemplateSearch] = useState('');
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<string>('all');

  useEffect(() => {
    if (pendingTemplateGraph) {
      setGraph(pendingTemplateGraph);
    }
    if (pendingTemplateName) {
      setAnalysisName(pendingTemplateName);
    }
    if (pendingTemplateGraph || pendingTemplateName) {
      clearPendingTemplate();
    }
    fetchTemplates();
    fetchPopularTemplates();
    fetchFavorites();
  }, []);

  const availableSamples = selectedBatchId
    ? samples.filter(s => s.batchId === selectedBatchId)
    : selectedProjectId
    ? samples.filter(s => s.projectId === selectedProjectId)
    : samples;

  const filteredBatches = selectedProjectId
    ? batches.filter(b => b.projectId === selectedProjectId)
    : batches;

  const selectedNode = useMemo(
    () => graph.nodes.find(n => n.id === selectedNodeId) || null,
    [graph.nodes, selectedNodeId]
  );

  const toolNodes = useMemo(
    () => graph.nodes.filter(n => n.type === 'tool'),
    [graph.nodes]
  );

  const handleAddNode = (node: WorkflowNode) => {
    setGraph(prev => ({
      ...prev,
      nodes: [...prev.nodes, node],
    }));
  };

  const handleUpdateNode = (nodeId: string, updates: Partial<WorkflowNode>) => {
    setGraph(prev => ({
      ...prev,
      nodes: prev.nodes.map(n =>
        n.id === nodeId ? { ...n, ...updates } : n
      ),
    }));
  };

  const handleDeleteNode = (nodeId: string) => {
    setGraph(prev => ({
      nodes: prev.nodes.filter(n => n.id !== nodeId),
      edges: prev.edges.filter(e => e.source !== nodeId && e.target !== nodeId),
    }));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  };

  const handleAddEdge = (edge: WorkflowEdge) => {
    setGraph(prev => ({
      ...prev,
      edges: [...prev.edges, edge],
    }));
  };

  const handleDeleteEdge = (edgeId: string) => {
    setGraph(prev => ({
      ...prev,
      edges: prev.edges.filter(e => e.id !== edgeId),
    }));
  };

  const handleUpdateGraph = (newGraph: WorkflowGraph) => {
    setGraph(newGraph);
  };

  const runAnalysis = async () => {
    if (!analysisName || !selectedProjectId || selectedSampleIds.length === 0 || toolNodes.length === 0) {
      alert('请填写分析名称、选择项目、样本和至少一个工具节点');
      return;
    }

    const sortedNodes = topologicalSort(graph);
    const toolSteps = sortedNodes.filter(n => n.type === 'tool');
    const sampleCount = selectedSampleIds.length;

    const now = new Date();
    const formatTime = (d: Date) => d.toISOString().replace('T', ' ').substring(0, 23);
    const makeLine = (ts: Date, level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'SUCCESS', msg: string) => ({
      timestamp: formatTime(ts),
      level,
      message: msg,
    });

    const analysisData: Partial<AnalysisRecord> = {
      name: analysisName,
      description: analysisDescription,
      projectId: selectedProjectId,
      batchId: selectedBatchId || undefined,
      sampleIds: selectedSampleIds,
      status: 'running',
      startedAt: now.toISOString(),
      steps: toolSteps.map((node, idx) => {
        const tool = ALIGNMENT_TOOLS.find(t => t.id === node.toolId);
        return {
          stepId: node.id,
          stepName: node.label || tool?.name || `步骤${idx + 1}`,
          toolId: node.toolId as AlignmentTool,
          toolVersion: tool?.version || '1.0',
          parameters: node.parameters || {},
          startTime: new Date(now.getTime() + idx * 5000).toISOString(),
          endTime: '',
          status: idx === 0 ? 'running' : 'pending',
          inputFileIds: [],
          outputFileIds: [],
          log: idx === 0 ? '准备执行...' : '',
          logLines: [] as LogLine[],
        } as AnalysisStep;
      }),
      parametersSnapshot: {
        graph: {
        nodes: graph.nodes.map(n => ({
          id: n.id,
          type: n.type,
          tool: n.toolId,
          parameters: n.parameters,
          label: n.label,
        })),
        edges: graph.edges,
      },
        selectedSamples: selectedSampleIds,
      },
    };

    const newAnalysis = await createAnalysis(analysisData);
    const aid = newAnalysis.id;
    setCurrentStepIndex(aid, 0);

    const smallDelay = () => delay(220 + Math.random() * 180);

    for (let i = 0; i < toolSteps.length; i++) {
      const step = toolSteps[i];
      const sid = step.id;
      const tool = ALIGNMENT_TOOLS.find(t => t.id === step.toolId);
      const stepName = step.label || tool?.name || `步骤${i + 1}`;
      const stepStartTs = new Date();

      setCurrentStepIndex(aid, i + 1);
      setStepStatus(aid, sid, 'running');
      initStepLogLines(aid, sid, []);

      appendStepLog(aid, sid, makeLine(stepStartTs, 'INFO', `========== 步骤 ${i + 1} 启动: ${stepName} ==========`));
      await smallDelay();
      appendStepLog(aid, sid, makeLine(new Date(), 'INFO', `工具 ID: ${step.toolId}    版本: ${tool?.version || '1.0.0'}`));
      await smallDelay();
      appendStepLog(aid, sid, makeLine(new Date(), 'INFO', `加载输入文件... 共 ${sampleCount} 个样本, 线程数: 8`));
      await smallDelay();
      appendStepLog(aid, sid, makeLine(new Date(), 'DEBUG', `初始化线程池: worker_0 ~ worker_7 就绪`));
      await smallDelay();
      appendStepLog(aid, sid, makeLine(new Date(), 'INFO', `[1/5] 读取参考基因组 GRCh38.p14 (3,099,750,718 bp)`));
      await smallDelay();
      appendStepLog(aid, sid, makeLine(new Date(), 'INFO', `[2/5] 索引加载完成, 共 195 条 contig`));
      await smallDelay();
      appendStepLog(aid, sid, makeLine(new Date(), 'INFO', `[3/5] 开始执行 ${step.toolId?.toUpperCase()} 核心算法`));
      await smallDelay();

      for (let s = 1; s <= sampleCount; s++) {
        const sampleName = `SAMPLE_${String(s).padStart(3, '0')}`;
        const alignRate = (60 + Math.random() * 38).toFixed(1);
        appendStepLog(aid, sid, makeLine(new Date(), 'INFO', `  → 处理 ${sampleName}: ${alignRate}% reads 已比对到参考序列`));
        if (s === 2 && Math.random() > 0.4) {
          appendStepLog(aid, sid, makeLine(new Date(), 'WARN', `  ⚠ ${sampleName}: 检测到低质量区域, 自动过滤 ${(Math.random() * 3 + 0.5).toFixed(1)}% reads`));
        }
        if (s === 4 && Math.random() > 0.7) {
          appendStepLog(aid, sid, makeLine(new Date(), 'WARN', `  ⚠ ${sampleName}: 插入片段分布偏度 1.42, 建议复核文库质量`));
        }
        await smallDelay();
      }

      appendStepLog(aid, sid, makeLine(new Date(), 'DEBUG', `内存峰值: ${(Math.random() * 6 + 10).toFixed(1)} GB, CPU 利用率: ${(Math.random() * 20 + 75).toFixed(0)}%`));
      await smallDelay();
      appendStepLog(aid, sid, makeLine(new Date(), 'INFO', `[4/5] 写入输出文件 output_${sid}.bam (${(Math.random() * 5 + 1.2).toFixed(2)} GB)`));
      await smallDelay();
      appendStepLog(aid, sid, makeLine(new Date(), 'INFO', `[5/5] 构建 BAM 索引 .bai 完成`));
      await smallDelay();

      const finalRate = (94 + Math.random() * 5).toFixed(2);
      const stepEndTs = new Date();
      const minutes = ((stepEndTs.getTime() - stepStartTs.getTime()) / 60000).toFixed(1);
      appendStepLog(aid, sid, makeLine(stepEndTs, 'SUCCESS', `✅ 步骤 ${i + 1} 完成: 比对率 ${finalRate}%, 平均质量 Q${(30 + Math.random() * 8).toFixed(0)}, 耗时 ${minutes} 分钟`));

      setStepStatus(aid, sid, 'completed', stepEndTs.toISOString());

      if (step.toolId && step.parameters) {
        await runAlignment(step.toolId, step.parameters, selectedSampleIds);
      }
    }

    const totalVars = Math.floor(100 + Math.random() * 1000);
    await completeAnalysis(newAnalysis.id, {
      totalVariants: totalVars,
      snpCount: Math.floor(totalVars * 0.85),
      indelCount: Math.floor(totalVars * 0.15),
      pathogenicCount: Math.floor(totalVars * 0.02),
      alignedReads: Math.floor(1000000 + Math.random() * 10000000),
      alignmentRate: 95 + Math.random() * 5,
      meanQuality: 90 + Math.random() * 10,
    });

    alert('分析完成！报告已生成，可在报告中心查看。');
  };

  const saveAsTemplate = () => {
    const toolNodesCount = graph.nodes.filter(n => n.type === 'tool');
    if (toolNodesCount.length === 0) {
      alert('请先添加至少一个工具节点');
      return;
    }
    const templateName = prompt('请输入模板名称:', `模板_${Date.now()}`);
    if (!templateName || !templateName.trim()) return;

    if (currentAnalysis) {
      saveAnalysisTemplate(templateName.trim());
      alert('分析流程已保存为模板');
    } else {
      const templates = JSON.parse(localStorage.getItem('analysisTemplates') || '[]');
      templates.push({
        id: `template_${Date.now()}`,
        name: templateName.trim(),
        graph: graph,
        parametersSnapshot: {},
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('analysisTemplates', JSON.stringify(templates));
      alert('分析流程已保存为模板');
    }
  };

  const filteredTemplates = useMemo(() => {
    let source = templateTab === 'popular' ? popularTemplates :
                 templateTab === 'favorites' ? favoriteTemplates : templates;

    if (templateSearch) {
      const query = templateSearch.toLowerCase();
      source = source.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (selectedTemplateCategory !== 'all') {
      source = source.filter(t => t.category === selectedTemplateCategory);
    }

    return source;
  }, [templates, popularTemplates, favoriteTemplates, templateTab, templateSearch, selectedTemplateCategory]);

  const favoriteIds = useMemo(() =>
    favoriteTemplates.map(t => t.id),
    [favoriteTemplates]
  );

  const handleUseTemplate = async (template: WorkflowTemplate) => {
    const result = await useTemplate(template.id);
    if (result) {
      setGraph(result.graph);
      setAnalysisName(result.name);
      setShowTemplateModal(false);
    }
  };

  const resetForm = () => {
    setAnalysisName('');
    setAnalysisDescription('');
    setSelectedProjectId('');
    setSelectedBatchId('');
    setGraph(createInitialGraph());
    setSelectedNodeId(null);
    setSelectedSampleIds([]);
    setCurrentAnalysis(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">序列分析工作台</h1>
          <p className="text-slate-400">可视化编排分析流程 · 拖拽节点 · 连接数据流</p>
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
          <button className="btn-secondary flex items-center gap-2" onClick={() => setShowTemplateModal(true)}>
            <LayoutTemplate size={16} />
            从模板导入
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
        <div className="col-span-3 space-y-6">
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Layers size={20} className="text-primary-400" />
              基本信息
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">分析名称 *</label>
                <input
                  type="text"
                  className="input-field text-sm py-2"
                  placeholder="输入分析名称"
                  value={analysisName}
                  onChange={(e) => setAnalysisName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">分析描述</label>
                <textarea
                  className="input-field text-sm py-2 min-h-[60px] resize-none"
                  placeholder="输入分析描述"
                  value={analysisDescription}
                  onChange={(e) => setAnalysisDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">所属项目 *</label>
                <select
                  className="select-field text-sm py-2"
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
                  className="select-field text-sm py-2"
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

        <div className="col-span-6 space-y-6">
          <div className="card p-4" style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Workflow size={20} className="text-primary-400" />
                分析流程画布
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="px-2 py-1 bg-slate-800 rounded-lg">
                  {toolNodes.length} 个工具
                </span>
                <span className="px-2 py-1 bg-slate-800 rounded-lg">
                  {graph.edges.length} 条连线
                </span>
              </div>
            </div>
            <div className="h-[calc(100%-48px)]">
              <DAGCanvas
                graph={graph}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
                onUpdateNode={handleUpdateNode}
                onAddNode={handleAddNode}
                onDeleteNode={handleDeleteNode}
                onAddEdge={handleAddEdge}
                onDeleteEdge={handleDeleteEdge}
                onUpdateGraph={handleUpdateGraph}
              />
            </div>
          </div>
        </div>

        <div className="col-span-3 space-y-6">
          <div className="card p-0 overflow-hidden" style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>
            <NodePropertyPanel
              node={selectedNode}
              onUpdateNode={handleUpdateNode}
              onDeleteNode={handleDeleteNode}
              onClose={() => setSelectedNodeId(null)}
            />
          </div>
        </div>
      </div>

      {currentAnalysis && currentAnalysis.steps.length > 0 && (
        <div className="card p-5">
          <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
                <Clock size={22} className="text-primary-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-white mb-1">分析执行状态</h3>
                <p className="text-sm text-slate-400 truncate max-w-xl">{currentAnalysis.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-1">状态</p>
                <StatusBadge status={currentAnalysis.status} />
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-1">版本</p>
                <p className="text-sm font-medium text-white">v{currentAnalysis.version}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-1">步骤进度</p>
                <p className="text-sm font-medium text-white">
                  {currentAnalysis.currentStep}/{currentAnalysis.steps.length}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2 text-xs">
              <span className="text-slate-500">整体进度</span>
              <span className="text-slate-400 font-mono">
                {currentAnalysis.steps.length > 0
                  ? Math.round((currentAnalysis.currentStep / currentAnalysis.steps.length) * 100)
                  : 0}%
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500"
                style={{
                  width: `${currentAnalysis.steps.length > 0
                    ? (currentAnalysis.currentStep / currentAnalysis.steps.length) * 100
                    : 0}%`,
                }}
              />
            </div>
          </div>

          <div className="space-y-3">
            {currentAnalysis.steps.map((step, idx) => (
              <StepLogPanel
                key={step.stepId}
                stepId={step.stepId}
                stepName={`${idx + 1}. ${step.stepName}`}
                toolId={step.toolId}
                status={step.status}
                logLines={step.logLines || []}
                defaultCollapsed={step.status === 'pending'}
                autoScroll={step.status === 'running'}
              />
            ))}
          </div>
        </div>
      )}

      <div className="card p-5">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles size={20} className="text-primary-400" />
          工具节点库
        </h2>
        <ToolPalette />
      </div>

      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <LayoutTemplate size={24} className="text-primary-400" />
                  选择分析流程模板
                </h2>
                <p className="text-sm text-slate-400 mt-1">选择一个模板快速开始您的分析工作流</p>
              </div>
              <button
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                onClick={() => setShowTemplateModal(false)}
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="p-5 border-b border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1 bg-slate-700/50 rounded-xl p-1">
                  {[
                    { id: 'popular', label: '热门推荐', icon: Star },
                    { id: 'all', label: '全部模板', icon: LayoutTemplate },
                    { id: 'favorites', label: '我的收藏', icon: Heart },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        templateTab === tab.id
                          ? 'bg-primary-500 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                      onClick={() => setTemplateTab(tab.id as typeof templateTab)}
                    >
                      <tab.icon size={16} />
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="搜索模板..."
                      value={templateSearch}
                      onChange={(e) => setTemplateSearch(e.target.value)}
                      className="w-64 bg-slate-700/50 border border-slate-600 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <select
                    value={selectedTemplateCategory}
                    onChange={(e) => setSelectedTemplateCategory(e.target.value)}
                    className="bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                  >
                    <option value="all">全部分类</option>
                    {Object.entries(TEMPLATE_CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-16">
                  <LayoutTemplate size={48} className="mx-auto text-slate-600 mb-4" />
                  <p className="text-slate-400 mb-1">没有找到匹配的模板</p>
                  <p className="text-sm text-slate-500">尝试调整搜索条件或筛选分类</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {filteredTemplates.map((template) => {
                    const isFavorited = favoriteIds.includes(template.id);
                    const toolNodes = template.graph.nodes.filter(n => n.type === 'tool');
                    return (
                      <div
                        key={template.id}
                        className="p-5 rounded-xl bg-slate-700/30 border border-slate-600 hover:border-primary-500/50 transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs px-2 py-0.5 bg-primary-500/20 text-primary-400 rounded-full">
                                {TEMPLATE_CATEGORY_LABELS[template.category as keyof typeof TEMPLATE_CATEGORY_LABELS] || template.category}
                              </span>
                              {template.isBuiltIn && (
                                <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">
                                  官方
                                </span>
                              )}
                              {isFavorited && (
                                <Heart size={14} className="text-rose-400" fill="currentColor" />
                              )}
                            </div>
                            <h3 className="text-lg font-semibold text-white group-hover:text-primary-400 transition-colors">
                              {template.name}
                            </h3>
                          </div>
                          <button
                            className={`p-2 rounded-lg transition-colors ${
                              isFavorited
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-slate-700/50 text-slate-400 hover:text-white'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(template.id);
                            }}
                          >
                            <Heart size={16} fill={isFavorited ? 'currentColor' : 'none'} />
                          </button>
                        </div>

                        <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                          {template.description}
                        </p>

                        <div className="flex items-center gap-4 mb-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <ClockIcon size={12} />
                            {template.estimatedRuntime}
                          </span>
                          <span className="flex items-center gap-1">
                            <Cpu size={12} />
                            {template.requirements.minCores}核
                          </span>
                          <span className="flex items-center gap-1">
                            <HardDrive size={12} />
                            {template.requirements.minRAM}
                          </span>
                          <span className="flex items-center gap-1">
                            <ChevronRight size={12} />
                            {toolNodes.length} 步骤
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                          {template.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-0.5 bg-slate-700/50 text-slate-400 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {template.tags.length > 3 && (
                            <span className="text-xs px-2 py-0.5 bg-slate-700/50 text-slate-400 rounded-full">
                              +{template.tags.length - 3}
                            </span>
                          )}
                        </div>

                        <button
                          className="w-full btn-primary text-sm flex items-center justify-center gap-2"
                          onClick={() => handleUseTemplate(template)}
                        >
                          <ChevronRight size={16} />
                          使用此模板
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
