import { useState, useMemo } from 'react';
import {
  Workflow, Play, Save, RotateCcw, GitBranch, Clock, FileText, History, Sparkles, Layers
} from 'lucide-react';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import StatusBadge from '@/components/StatusBadge';
import DAGCanvas from '@/components/DAGCanvas/DAGCanvas';
import ToolPalette from '@/components/DAGCanvas/ToolPalette';
import NodePropertyPanel from '@/components/DAGCanvas/NodePropertyPanel';
import { createNode } from '@/components/DAGCanvas/DAGCanvas';
import type { WorkflowGraph, WorkflowNode, WorkflowEdge, AlignmentTool, AnalysisStep, AnalysisRecord, AlignmentResult } from '@shared/types';
import { ALIGNMENT_TOOLS } from '@shared/toolConfigs';

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
    selectedSampleIds, setSelectedSampleIds,
    currentAnalysis, setCurrentAnalysis,
    createAnalysis, updateAnalysis, runAlignment, completeAnalysis,
    saveAnalysisTemplate, loading, error
  } = useAnalysisStore();

  const [analysisName, setAnalysisName] = useState('');
  const [analysisDescription, setAnalysisDescription] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');

  const [graph, setGraph] = useState<WorkflowGraph>(createInitialGraph());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

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

    const analysisData: Partial<AnalysisRecord> = {
      name: analysisName,
      description: analysisDescription,
      projectId: selectedProjectId,
      batchId: selectedBatchId || undefined,
      sampleIds: selectedSampleIds,
      status: 'running',
      startedAt: new Date().toISOString(),
      steps: toolSteps.map((node, idx) => {
        const tool = ALIGNMENT_TOOLS.find(t => t.id === node.toolId);
        return {
          stepId: node.id,
          stepName: node.label || tool?.name || `步骤${idx + 1}`,
          toolId: node.toolId as AlignmentTool,
          toolVersion: tool?.version || '1.0',
          parameters: node.parameters || {},
          startTime: new Date(Date.now() + idx * 60000).toISOString(),
          endTime: '',
          status: idx === 0 ? 'running' : 'pending',
          inputFileIds: [],
          outputFileIds: [],
          log: idx === 0 ? '分析进行中...' : '',
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

    for (let i = 0; i < toolSteps.length; i++) {
      const step = toolSteps[i];
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

          {currentAnalysis && (
            <div className="card p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock size={20} className="text-primary-400" />
                当前分析状态
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-400 mb-1">分析名称</p>
                  <p className="font-medium text-white text-sm truncate">{currentAnalysis.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">状态</p>
                  <StatusBadge status={currentAnalysis.status} />
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">版本</p>
                  <p className="font-medium text-white text-sm">v{currentAnalysis.version}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">步骤进度</p>
                  <p className="font-medium text-white text-sm">
                    {currentAnalysis.currentStep}/{currentAnalysis.steps.length}
                  </p>
                </div>
                <div>
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
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles size={20} className="text-primary-400" />
          工具节点库
        </h2>
        <ToolPalette />
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
