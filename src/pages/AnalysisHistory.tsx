import { useState, useEffect, useMemo } from 'react';
import {
  History, Filter, Search, ChevronDown, ChevronRight, Clock, User,
  GitBranch, FileText, Play, BarChart3, Settings, Download, Eye,
  RefreshCw, AlertCircle, CheckCircle, Loader2, X, Workflow,
  GitCompare, ArrowRight
} from 'lucide-react';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import StatusBadge from '@/components/StatusBadge';
import VersionDiffView from '@/components/VersionDiffView';
import { computeVersionDiff } from '@/utils/diffUtils';
import type { AnalysisRecord, AnalysisStep, AnalysisVersionHistory } from '@shared/types';
import { ALIGNMENT_TOOLS } from '@shared/toolConfigs';

export default function AnalysisHistory() {
  const {
    analyses, projects, batches, samples,
    fetchAnalyses, fetchProjects, fetchBatches, fetchSamples,
    setCurrentAnalysis, generateReport, loading
  } = useAnalysisStore();

  const [searchText, setSearchText] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisRecord | null>(null);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showParameterModal, setShowParameterModal] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [diffBaseVersion, setDiffBaseVersion] = useState<number | null>(null);

  useEffect(() => {
    fetchProjects();
    fetchBatches();
    fetchSamples();
    fetchAnalyses();
  }, []);

  const filteredBatches = filterProject
    ? batches.filter(b => b.projectId === filterProject)
    : batches;

  const filteredAnalyses = analyses.filter(a => {
    if (searchText && !a.name.toLowerCase().includes(searchText.toLowerCase()) &&
        !a.description.toLowerCase().includes(searchText.toLowerCase())) {
      return false;
    }
    if (filterProject && a.projectId !== filterProject) return false;
    if (filterBatch && a.batchId !== filterBatch) return false;
    if (filterStatus && a.status !== filterStatus) return false;
    return true;
  });

  const getProjectName = (id: string) => projects.find(p => p.id === id)?.name || id;
  const getBatchName = (id?: string) => id ? batches.find(b => b.id === id)?.name || id : '-';
  const getSampleNames = (ids: string[]) => ids.map(id => samples.find(s => s.id === id)?.name || id).join(', ');
  const getToolName = (toolId: string) => ALIGNMENT_TOOLS.find(t => t.id === toolId)?.name || toolId;

  const handleGenerateReport = async (analysisId: string) => {
    await generateReport(analysisId);
    alert('报告生成成功！可在报告中心查看。');
  };

  const handleRerunAnalysis = (analysis: AnalysisRecord) => {
    setCurrentAnalysis(analysis);
    alert(`分析 "${analysis.name}" 已加载到工作台，可修改参数后重新运行。`);
  };

  const handleExportAnalyses = () => {
    if (filteredAnalyses.length === 0) {
      alert('没有可导出的分析记录');
      return;
    }
    const headers = ['ID', 'Name', 'Tool', 'Status', 'Project', 'Batch', 'Samples', 'Version', 'StartTime', 'EndTime'];
    const rows = filteredAnalyses.map(a => [
      a.id, a.name, a.steps[0]?.toolId || '-', a.status,
      getProjectName(a.projectId),
      getBatchName(a.batchId),
      a.sampleIds.length,
      a.version,
      a.startedAt || '-',
      a.completedAt || '-',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers, ...rows].map(r => r.join(',')).join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `analysis_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert(`已导出 ${filteredAnalyses.length} 条分析记录`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">分析历史</h1>
          <p className="text-slate-400">追踪所有分析记录，查看参数版本和结果详情</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="btn-secondary flex items-center gap-2"
            onClick={() => fetchAnalyses()}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            刷新
          </button>
          <button className="btn-primary flex items-center gap-2" onClick={handleExportAnalyses}>
            <Download size={16} />
            导出记录
          </button>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-primary-400" />
          <h3 className="font-semibold text-white">筛选条件</h3>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">搜索</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                className="input-field pl-10"
                placeholder="分析名称或描述..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">项目</label>
            <select
              className="select-field"
              value={filterProject}
              onChange={(e) => { setFilterProject(e.target.value); setFilterBatch(''); }}
            >
              <option value="">全部项目</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">批次</label>
            <select
              className="select-field"
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
            >
              <option value="">全部批次</option>
              {filteredBatches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">状态</label>
            <select
              className="select-field"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">全部状态</option>
              <option value="pending">待运行</option>
              <option value="running">运行中</option>
              <option value="completed">已完成</option>
              <option value="failed">失败</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="card p-12 text-center">
            <Loader2 size={32} className="mx-auto text-primary-500 animate-spin mb-4" />
            <p className="text-slate-400">加载分析记录...</p>
          </div>
        ) : filteredAnalyses.length === 0 ? (
          <div className="card p-12 text-center border-2 border-dashed border-slate-700">
            <History size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-500 mb-2">暂无符合条件的分析记录</p>
            <p className="text-slate-600 text-sm">调整筛选条件或创建新的分析</p>
          </div>
        ) : (
          filteredAnalyses.map((analysis) => (
            <AnalysisCard
              key={analysis.id}
              analysis={analysis}
              expanded={expandedId === analysis.id}
              onToggle={() => setExpandedId(expandedId === analysis.id ? null : analysis.id)}
              onViewDetails={() => { setSelectedAnalysis(analysis); setShowVersionModal(true); }}
              onViewParameters={() => { setSelectedAnalysis(analysis); setShowParameterModal(true); }}
              onGenerateReport={() => handleGenerateReport(analysis.id)}
              onRerun={() => handleRerunAnalysis(analysis)}
              getProjectName={getProjectName}
              getBatchName={getBatchName}
              getSampleNames={getSampleNames}
              getToolName={getToolName}
            />
          ))
        )}
      </div>

      {showVersionModal && selectedAnalysis && (
        <VersionHistoryModal
          analysis={selectedAnalysis}
          onClose={() => setShowVersionModal(false)}
          getToolName={getToolName}
          onCompare={(baseVersion) => {
            setDiffBaseVersion(baseVersion);
            setShowVersionModal(false);
            setShowDiffModal(true);
          }}
        />
      )}

      {showParameterModal && selectedAnalysis && (
        <ParameterSnapshotModal
          analysis={selectedAnalysis}
          onClose={() => setShowParameterModal(false)}
        />
      )}

      {showDiffModal && selectedAnalysis && diffBaseVersion !== null && (
        <VersionDiffModal
          analysis={selectedAnalysis}
          baseVersion={diffBaseVersion}
          onClose={() => {
            setShowDiffModal(false);
            setDiffBaseVersion(null);
          }}
        />
      )}
    </div>
  );
}

interface AnalysisCardProps {
  analysis: AnalysisRecord;
  expanded: boolean;
  onToggle: () => void;
  onViewDetails: () => void;
  onViewParameters: () => void;
  onGenerateReport: () => void;
  onRerun: () => void;
  getProjectName: (id: string) => string;
  getBatchName: (id?: string) => string;
  getSampleNames: (ids: string[]) => string;
  getToolName: (id: string) => string;
}

function AnalysisCard({
  analysis, expanded, onToggle, onViewDetails, onViewParameters,
  onGenerateReport, onRerun, getProjectName, getBatchName, getSampleNames, getToolName
}: AnalysisCardProps) {
  const { samples } = useAnalysisStore();
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getDuration = () => {
    if (!analysis.startedAt || !analysis.completedAt) return '-';
    const start = new Date(analysis.startedAt).getTime();
    const end = new Date(analysis.completedAt).getTime();
    const mins = Math.floor((end - start) / 60000);
    if (mins < 60) return `${mins} 分钟`;
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hours} 小时 ${remainMins} 分钟`;
  };

  return (
    <div className="card overflow-hidden">
      <div
        className="p-5 cursor-pointer hover:bg-slate-800/30 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-white">{analysis.name}</h3>
              <StatusBadge status={analysis.status} />
              <span className="badge bg-slate-700 text-slate-300 text-xs">
                v{analysis.version}
              </span>
              {analysis.parentAnalysisId && (
                <span className="badge bg-accent-500/20 text-accent-400 text-xs">
                  衍生分析
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 mb-4">{analysis.description}</p>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <FileText size={14} className="text-primary-400" />
                <span>{getProjectName(analysis.projectId)}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <GitBranch size={14} className="text-primary-400" />
                <span>{getBatchName(analysis.batchId)}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <User size={14} className="text-primary-400" />
                <span>{analysis.createdBy}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Clock size={14} className="text-primary-400" />
                <span>{formatDate(analysis.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-8 ml-8">
            {analysis.resultSummary && (
              <div className="flex items-center gap-6">
                <StatItem
                  label="变异数"
                  value={analysis.resultSummary.totalVariants.toLocaleString()}
                  color="text-rose-400"
                />
                <StatItem
                  label="比对率"
                  value={`${analysis.resultSummary.alignmentRate.toFixed(1)}%`}
                  color="text-blue-400"
                />
                <StatItem
                  label="平均质量"
                  value={`${analysis.resultSummary.meanQuality.toFixed(1)}`}
                  color="text-emerald-400"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">
                {analysis.steps.length} 步骤
              </span>
              {expanded ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-700/50 bg-slate-800/20">
          <div className="p-5">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-8">
                <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Workflow size={16} className="text-primary-400" />
                  分析步骤详情
                </h4>
                {analysis.steps.length > 0 ? (
                  <div className="space-y-3">
                    {analysis.steps.map((step, idx) => (
                      <StepTimelineItem
                        key={step.stepId}
                        step={step}
                        index={idx}
                        isLast={idx === analysis.steps.length - 1}
                        getToolName={getToolName}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border-2 border-dashed border-slate-700/50 rounded-xl">
                    <AlertCircle size={24} className="mx-auto text-slate-600 mb-2" />
                    <p className="text-sm text-slate-500">暂无分析步骤</p>
                  </div>
                )}
              </div>

              <div className="col-span-4 space-y-4">
                <div className="card p-4 bg-slate-800/50">
                  <h4 className="text-sm font-semibold text-white mb-3">分析样本</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {analysis.sampleIds.map((sampleId) => (
                      <div key={sampleId} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary-500" />
                        <span className="text-slate-300 font-mono">{samples.find(s => s.id === sampleId)?.name || sampleId}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card p-4 bg-slate-800/50">
                  <h4 className="text-sm font-semibold text-white mb-3">运行信息</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">开始时间</span>
                      <span className="text-slate-300">{analysis.startedAt ? formatDate(analysis.startedAt) : '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">完成时间</span>
                      <span className="text-slate-300">{analysis.completedAt ? formatDate(analysis.completedAt) : '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">运行时长</span>
                      <span className="text-slate-300">{getDuration()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">当前步骤</span>
                      <span className="text-slate-300">{analysis.currentStep}/{analysis.steps.length}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
                    onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
                  >
                    <Eye size={14} />
                    查看版本历史
                  </button>
                  <button
                    className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
                    onClick={(e) => { e.stopPropagation(); onViewParameters(); }}
                  >
                    <Settings size={14} />
                    查看参数快照
                  </button>
                  <button
                    className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
                    onClick={(e) => { e.stopPropagation(); onGenerateReport(); }}
                  >
                    <BarChart3 size={14} />
                    生成分析报告
                  </button>
                  <button
                    className="w-full btn-primary text-sm flex items-center justify-center gap-2"
                    onClick={(e) => { e.stopPropagation(); onRerun(); }}
                  >
                    <Play size={14} />
                    重新运行分析
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function StepTimelineItem({
  step, index, isLast, getToolName
}: { step: AnalysisStep; index: number; isLast: boolean; getToolName: (id: string) => string }) {
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '-';
    const date = new Date(timeStr);
    return date.toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const statusConfig = {
    completed: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/20' },
    running: { icon: Loader2, color: 'text-primary-500', bg: 'bg-primary-500/20' },
    pending: { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-500/20' },
    failed: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/20' },
  }[step.status];

  const StatusIcon = statusConfig.icon;

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full ${statusConfig.bg} flex items-center justify-center flex-shrink-0`}>
          <StatusIcon size={14} className={`${statusConfig.color} ${step.status === 'running' ? 'animate-spin' : ''}`} />
        </div>
        {!isLast && <div className="w-px h-full bg-slate-700 my-1" />}
      </div>
      <div className="flex-1 pb-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-white">{step.stepName}</span>
            <span className="text-xs text-slate-500">{getToolName(step.toolId)} v{step.toolVersion}</span>
          </div>
          <StatusBadge status={step.status} />
        </div>
        <div className="text-xs text-slate-500 mb-2">
          {formatTime(step.startTime)} - {formatTime(step.endTime)}
        </div>
        {step.log && (
          <div className="p-2 bg-slate-950/50 rounded-lg text-xs text-slate-400 font-mono">
            {step.log}
          </div>
        )}
        {Object.keys(step.parameters).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {Object.entries(step.parameters).slice(0, 4).map(([k, v]) => (
              <span key={k} className="text-xs px-2 py-0.5 bg-slate-700/50 rounded text-slate-400">
                {k}: {String(v)}
              </span>
            ))}
            {Object.keys(step.parameters).length > 4 && (
              <span className="text-xs px-2 py-0.5 bg-slate-700/50 rounded text-slate-400">
                +{Object.keys(step.parameters).length - 4} 更多
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface VersionHistoryModalProps {
  analysis: AnalysisRecord;
  onClose: () => void;
  getToolName: (id: string) => string;
  onCompare?: (baseVersion: number) => void;
}

function VersionHistoryModal({
  analysis, onClose, getToolName, onCompare
}: VersionHistoryModalProps) {
  const { updateAnalysis } = useAnalysisStore();
  const [compareMode, setCompareMode] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  const handleRestoreVersion = async (version: number) => {
    const versionData = analysis.versionHistory.find(v => v.version === version);
    if (!versionData) return;
    const confirmed = confirm(`确定要恢复到版本 v${version} 吗？这将创建新版本并保留历史记录。`);
    if (!confirmed) return;
    await updateAnalysis(analysis.id, {
      steps: versionData.steps,
      parametersSnapshot: versionData.parametersSnapshot,
      sampleIds: versionData.sampleIds,
    }, `恢复到版本 v${version}：${versionData.description}`);
    alert('版本恢复成功！已创建新版本。');
  };

  const handleSelectForCompare = (version: number) => {
    if (selectedVersion === null) {
      setSelectedVersion(version);
    } else if (selectedVersion === version) {
      setSelectedVersion(null);
    } else {
      const baseVersion = Math.min(selectedVersion, version);
      onCompare?.(baseVersion);
    }
  };

  const sortedHistory = [...analysis.versionHistory].sort((a, b) => b.version - a.version);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-3xl max-h-[80vh] overflow-hidden">
        <div className="p-5 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">版本历史 - {analysis.name}</h2>
            <p className="text-sm text-slate-400">
              当前版本 v{analysis.version} · 共 {analysis.versionHistory.length} 个历史版本
            </p>
          </div>
          <div className="flex items-center gap-2">
            {analysis.versionHistory.length >= 2 && (
              <button
                className={`btn-secondary text-sm flex items-center gap-2 ${
                  compareMode ? 'bg-primary-500/20 text-primary-400 border-primary-500/30' : ''
                }`}
                onClick={() => {
                  setCompareMode(!compareMode);
                  setSelectedVersion(null);
                }}
              >
                <GitCompare size={14} />
                {compareMode ? '取消对比' : '对比版本'}
              </button>
            )}
            <button
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              onClick={onClose}
            >
              <X size={20} className="text-slate-400" />
            </button>
          </div>
        </div>
        {compareMode && (
          <div className="px-5 py-3 bg-primary-500/10 border-b border-primary-500/20">
            <p className="text-sm text-primary-300">
              {selectedVersion === null
                ? '请选择第一个版本进行对比'
                : `已选择 v${selectedVersion}，请选择第二个版本进行对比`}
            </p>
          </div>
        )}
        <div className="p-5 overflow-y-auto max-h-[calc(80vh-120px)]">
          <div className="space-y-4">
            {sortedHistory.map((v) => (
              <VersionHistoryCard
                key={v.version}
                version={v}
                isCurrent={v.version === analysis.version}
                isSelected={selectedVersion === v.version}
                compareMode={compareMode}
                getToolName={getToolName}
                onRestore={() => handleRestoreVersion(v.version)}
                onSelect={() => handleSelectForCompare(v.version)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface VersionHistoryCardProps {
  version: AnalysisVersionHistory;
  isCurrent: boolean;
  isSelected: boolean;
  compareMode: boolean;
  getToolName: (id: string) => string;
  onRestore: () => void;
  onSelect: () => void;
}

function VersionHistoryCard({
  version, isCurrent, isSelected, compareMode, getToolName, onRestore, onSelect
}: VersionHistoryCardProps) {
  return (
    <div
      className={`card p-4 bg-slate-800/50 transition-all cursor-pointer ${
        compareMode ? 'hover:border-primary-500/50' : ''
      } ${
        isSelected ? 'border-primary-500 ring-2 ring-primary-500/30' : ''
      }`}
      onClick={compareMode ? onSelect : undefined}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
            isCurrent
              ? 'bg-gradient-to-br from-primary-500 to-primary-600'
              : isSelected
                ? 'bg-primary-600'
                : 'bg-slate-700'
          }`}>
            v{version.version}
          </div>
          <div>
            <p className="font-medium text-white">{version.description}</p>
            <p className="text-xs text-slate-500">
              {new Date(version.timestamp).toLocaleString('zh-CN')} · {version.changedBy}
            </p>
          </div>
        </div>
        {compareMode ? (
          isSelected ? (
            <span className="badge bg-primary-500/20 text-primary-400">已选择</span>
          ) : (
            <span className="badge bg-slate-700 text-slate-400">点击选择</span>
          )
        ) : isCurrent ? (
          <span className="badge bg-primary-500/20 text-primary-400">当前版本</span>
        ) : (
          <button
            className="btn-secondary text-xs"
            onClick={(e) => { e.stopPropagation(); onRestore(); }}
          >
            恢复此版本
          </button>
        )}
      </div>
      <div className="text-sm text-slate-400 space-y-1">
        <p><span className="text-slate-500">分析步骤：</span>{version.steps.length > 0 ? version.steps.map(s => getToolName(s.toolId)).join(' → ') : '-'}</p>
        <p><span className="text-slate-500">样本数：</span>{version.sampleIds.length} 个</p>
        {Object.keys(version.parametersSnapshot).length > 0 && (
          <p><span className="text-slate-500">参数配置：</span>{Object.keys(version.parametersSnapshot).length} 项</p>
        )}
      </div>
      {version.steps.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <p className="text-xs text-slate-500 mb-2">步骤详情：</p>
          <div className="flex flex-wrap gap-1">
            {version.steps.map(s => (
              <span key={s.stepId} className="text-xs px-2 py-1 bg-slate-900/50 rounded text-slate-400">
                {s.stepName} ({getToolName(s.toolId)})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ParameterSnapshotModal({
  analysis, onClose
}: { analysis: AnalysisRecord; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="p-5 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">参数快照 - {analysis.name}</h2>
            <p className="text-sm text-slate-400">版本 v{analysis.version}</p>
          </div>
          <button
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            onClick={onClose}
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto max-h-[calc(80vh-80px)]">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-white mb-2">全局参数</h4>
              <pre className="p-4 bg-slate-950/70 rounded-xl text-sm text-slate-300 font-mono overflow-x-auto">
                {JSON.stringify(analysis.parametersSnapshot, null, 2)}
              </pre>
            </div>
            {analysis.steps.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-white mb-3">步骤参数</h4>
                <div className="space-y-3">
                  {analysis.steps.map((step, idx) => (
                    <div key={step.stepId} className="p-4 bg-slate-900/50 rounded-xl">
                      <p className="text-sm font-medium text-white mb-2">
                        步骤 {idx + 1}: {step.stepName}
                      </p>
                      <pre className="text-xs text-slate-400 font-mono overflow-x-auto">
                        {JSON.stringify(step.parameters, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface VersionDiffModalProps {
  analysis: AnalysisRecord;
  baseVersion: number;
  onClose: () => void;
}

function VersionDiffModal({ analysis, baseVersion, onClose }: VersionDiffModalProps) {
  const { samples } = useAnalysisStore();
  const [compareVersion, setCompareVersion] = useState<number>(() => {
    const versions = analysis.versionHistory.map(v => v.version).sort((a, b) => b - a);
    const baseIdx = versions.indexOf(baseVersion);
    if (baseIdx > 0) return versions[0];
    if (versions.length > 1) return versions[1];
    return baseVersion;
  });

  const sortedVersions = useMemo(
    () => [...analysis.versionHistory].sort((a, b) => b.version - a.version),
    [analysis.versionHistory]
  );

  const sampleNameMap = useMemo(() => {
    const map = new Map<string, string>();
    samples.forEach(s => map.set(s.id, s.name));
    return map;
  }, [samples]);

  const oldVersion = analysis.versionHistory.find(v => v.version === baseVersion);
  const newVersion = analysis.versionHistory.find(v => v.version === compareVersion);

  const diff = useMemo(() => {
    if (!oldVersion || !newVersion) return null;
    const older = oldVersion.version < newVersion.version ? oldVersion : newVersion;
    const newer = oldVersion.version < newVersion.version ? newVersion : oldVersion;
    return computeVersionDiff(older, newer, sampleNameMap);
  }, [oldVersion, newVersion, sampleNameMap]);

  if (!oldVersion || !newVersion || !diff) {
    return null;
  }

  const effectiveOld = oldVersion.version < newVersion.version ? oldVersion : newVersion;
  const effectiveNew = oldVersion.version < newVersion.version ? newVersion : oldVersion;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-700 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">版本对比 - {analysis.name}</h2>
            <p className="text-sm text-slate-400">
              v{effectiveOld.version} <ArrowRight size={14} className="inline mx-1" /> v{effectiveNew.version}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400">对比版本：</span>
              <select
                className="select-field text-xs w-28"
                value={compareVersion}
                onChange={(e) => setCompareVersion(Number(e.target.value))}
              >
                {sortedVersions
                  .filter(v => v.version !== baseVersion)
                  .map(v => (
                    <option key={v.version} value={v.version}>
                      v{v.version}
                    </option>
                  ))}
              </select>
            </div>
            <button
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              onClick={onClose}
            >
              <X size={20} className="text-slate-400" />
            </button>
          </div>
        </div>
        <div className="p-5 overflow-y-auto flex-1">
          <VersionDiffView
            diff={diff}
            oldVersion={effectiveOld}
            newVersion={effectiveNew}
          />
        </div>
      </div>
    </div>
  );
}
