import { useState, useEffect } from 'react';
import {
  FileText, Download, Plus, Search, Filter, Eye, RefreshCw,
  Calendar, User, GitBranch, Clock, CheckCircle, AlertCircle,
  Settings, Terminal, Hash, ChevronRight, X, Copy, Check,
  BarChart3, Table, Code, FileJson, Printer, Share2
} from 'lucide-react';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import StatusBadge from '@/components/StatusBadge';
import type { AnalysisReport, AnalysisRecord, ReportSection } from '@shared/types';

export default function Reports() {
  const {
    reports, analyses, projects, batches, samples,
    fetchReports, fetchAnalyses, fetchProjects, fetchBatches, fetchSamples,
    generateReport, loading
  } = useAnalysisStore();

  const [searchText, setSearchText] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [selectedReport, setSelectedReport] = useState<AnalysisReport | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
    fetchBatches();
    fetchSamples();
    fetchAnalyses();
    fetchReports();
  }, []);

  const getAnalysis = (id: string) => analyses.find(a => a.id === id);
  const getProjectName = (id: string) => projects.find(p => p.id === id)?.name || id;

  const filteredReports = reports.filter(r => {
    const analysis = getAnalysis(r.analysisId);
    if (searchText && !r.title.toLowerCase().includes(searchText.toLowerCase())) {
      return false;
    }
    if (filterProject && analysis?.projectId !== filterProject) return false;
    return true;
  });

  const completedAnalyses = analyses.filter(a => a.status === 'completed');

  const handleGenerateReport = async () => {
    if (!selectedAnalysisId) {
      alert('请选择要生成报告的分析');
      return;
    }
    await generateReport(selectedAnalysisId);
    setShowGenerateModal(false);
    setSelectedAnalysisId('');
    alert('报告生成成功！');
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const handleDownloadReport = (report: AnalysisReport) => {
    const content = `# ${report.title}\n\n生成时间: ${formatDate(report.generatedAt)}\n生成者: ${report.generatedBy}\n\n---\n\n` +
      report.sections.map(s => {
        if (s.type === 'text') {
          return `## ${s.title}\n\n${s.content}\n`;
        } else if (s.type === 'table') {
          const rows = s.content as Record<string, unknown>[];
          if (rows.length === 0) return `## ${s.title}\n\n无数据\n`;
          const headers = Object.keys(rows[0] || {});
          const tableRows = rows.map(row => headers.map(h => String(row[h])).join(' | ')).join('\n');
          return `## ${s.title}\n\n${headers.join(' | ')}\n${headers.map(() => '---').join(' | ')}\n${tableRows}\n`;
        } else if (s.type === 'chart') {
          const data = s.content as Record<string, number>;
          return `## ${s.title}\n\n${Object.entries(data).map(([k, v]) => `- ${k}: ${v}`).join('\n')}\n`;
        } else if (s.type === 'code') {
          return `## ${s.title}\n\n\`\`\`json\n${s.content}\n\`\`\`\n`;
        }
        return `## ${s.title}\n\n${JSON.stringify(s.content, null, 2)}\n`;
      }).join('\n---\n\n') +
      `\n\n---\n\n## 可重现性信息\n\n### 软件版本\n${Object.entries(report.reproducibilityInfo.softwareVersions || {}).map(([k, v]) => `- ${k}: ${v}`).join('\n')}\n\n### 命令行\n${(report.reproducibilityInfo.commandLines || []).map(cmd => `\`${cmd}\``).join('\n')}\n\n### 输入文件哈希\n${Object.entries(report.reproducibilityInfo.inputFileHashes || {}).map(([k, v]) => `- ${k}: ${v}`).join('\n')}`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${report.title.replace(/\s+/g, '_').replace(/[^\w\u4e00-\u9fa5.-]/g, '')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert(`报告 "${report.title}" 已下载`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">报告中心</h1>
          <p className="text-slate-400">自动生成可重现的分析流程报告，包含完整的参数和版本信息</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="btn-secondary flex items-center gap-2"
            onClick={() => fetchReports()}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            刷新
          </button>
          <button
            className="btn-primary flex items-center gap-2"
            onClick={() => setShowGenerateModal(true)}
          >
            <Plus size={16} />
            生成新报告
          </button>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-primary-400" />
          <h3 className="font-semibold text-white">筛选条件</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">搜索报告</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                className="input-field pl-10"
                placeholder="报告标题..."
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
              onChange={(e) => setFilterProject(e.target.value)}
            >
              <option value="">全部项目</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <div className="text-sm text-slate-500">
              共 <span className="text-primary-400 font-semibold">{filteredReports.length}</span> 份报告
            </div>
          </div>
        </div>
      </div>

      {selectedReport ? (
        <ReportDetailView
          report={selectedReport}
          analysis={getAnalysis(selectedReport.analysisId)}
          onBack={() => setSelectedReport(null)}
          getProjectName={getProjectName}
          copyToClipboard={copyToClipboard}
          copiedField={copiedField}
          formatDate={formatDate}
        />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filteredReports.length === 0 ? (
            <div className="col-span-3 card p-12 text-center border-2 border-dashed border-slate-700">
              <FileText size={48} className="mx-auto text-slate-600 mb-4" />
              <p className="text-slate-500 mb-2">暂无报告</p>
              <p className="text-slate-600 text-sm mb-4">点击"生成新报告"创建分析报告</p>
              <button
                className="btn-primary inline-flex items-center gap-2"
                onClick={() => setShowGenerateModal(true)}
              >
                <Plus size={16} />
                生成第一份报告
              </button>
            </div>
          ) : (
            filteredReports.map((report) => {
              const analysis = getAnalysis(report.analysisId);
              return (
                <ReportCard
                  key={report.id}
                  report={report}
                  analysis={analysis}
                  getProjectName={getProjectName}
                  formatDate={formatDate}
                  onView={() => setSelectedReport(report)}
                  onDownload={handleDownloadReport}
                />
              );
            })
          )}
        </div>
      )}

      {showGenerateModal && (
        <GenerateReportModal
          analyses={completedAnalyses}
          getProjectName={getProjectName}
          selectedAnalysisId={selectedAnalysisId}
          setSelectedAnalysisId={setSelectedAnalysisId}
          onGenerate={handleGenerateReport}
          onClose={() => { setShowGenerateModal(false); setSelectedAnalysisId(''); }}
          loading={loading}
        />
      )}
    </div>
  );
}

interface ReportCardProps {
  report: AnalysisReport;
  analysis?: AnalysisRecord;
  getProjectName: (id: string) => string;
  formatDate: (date: string) => string;
  onView: () => void;
  onDownload: (report: AnalysisReport) => void;
}

function ReportCard({ report, analysis, getProjectName, formatDate, onView, onDownload }: ReportCardProps) {
  const sectionIcons: Record<string, typeof FileText> = {
    text: FileText,
    table: Table,
    chart: BarChart3,
    code: Code,
    image: FileJson,
  };

  return (
    <div className="card p-5 hover:border-primary-500/30 transition-all cursor-pointer group" onClick={onView}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
          <FileText size={24} className="text-white" />
        </div>
        <button
          className="p-2 opacity-0 group-hover:opacity-100 hover:bg-slate-700 rounded-lg transition-all"
          title="下载报告"
          onClick={(e) => { e.stopPropagation(); onDownload(report); }}
        >
          <Download size={16} className="text-slate-400" />
        </button>
      </div>
      <h3 className="font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors line-clamp-2">
        {report.title}
      </h3>
      <p className="text-sm text-slate-400 mb-4 line-clamp-2">
        {analysis?.description || '分析报告'}
      </p>
      <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
        <div className="flex items-center gap-1">
          <Calendar size={12} />
          <span>{formatDate(report.generatedAt)}</span>
        </div>
        <div className="flex items-center gap-1">
          <User size={12} />
          <span>{report.generatedBy}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 mb-4">
        {report.sections.slice(0, 4).map((section) => {
          const Icon = sectionIcons[section.type] || FileText;
          return (
            <div
              key={section.id}
              className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center"
              title={section.title}
            >
              <Icon size={14} className="text-slate-400" />
            </div>
          );
        })}
        {report.sections.length > 4 && (
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs text-slate-400">
            +{report.sections.length - 4}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
        <span className="text-xs text-slate-500">
          {analysis ? getProjectName(analysis.projectId) : '-'}
        </span>
        <span className="flex items-center gap-1 text-xs text-primary-400">
          查看详情 <ChevronRight size={12} />
        </span>
      </div>
    </div>
  );
}

interface ReportDetailViewProps {
  report: AnalysisReport;
  analysis?: AnalysisRecord;
  onBack: () => void;
  getProjectName: (id: string) => string;
  copyToClipboard: (text: string, fieldId: string) => void;
  copiedField: string | null;
  formatDate: (date: string) => string;
}

function ReportDetailView({
  report, analysis, onBack, getProjectName, copyToClipboard, copiedField, formatDate
}: ReportDetailViewProps) {
  const handlePrint = () => {
    window.print();
    alert('正在打印报告...');
  };

  const handleShare = () => {
    const shareData = {
      title: report.title,
      text: `DNA序列分析报告: ${report.title}`,
      url: window.location.href,
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert('报告链接已复制到剪贴板');
      }).catch(() => {
        alert(`报告链接: ${window.location.href}`);
      });
    }
  };

  const handleExportPDF = () => {
    const content = `# ${report.title}\n\n生成时间: ${formatDate(report.generatedAt)}\n生成者: ${report.generatedBy}\n\n---\n\n` +
      report.sections.map(s => `## ${s.title}\n\n${typeof s.content === 'string' ? s.content : JSON.stringify(s.content, null, 2)}`).join('\n\n---\n\n');
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${report.title.replace(/\s+/g, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert(`报告已导出为 Markdown 格式: ${report.title}`);
  };

  const renderSection = (section: ReportSection) => {
    switch (section.type) {
      case 'text':
        return (
          <div className="prose prose-invert max-w-none">
            <p className="text-slate-300 leading-relaxed">{section.content as string}</p>
          </div>
        );
      case 'table':
        const tableData = section.content as Record<string, unknown>[];
        if (!Array.isArray(tableData) || tableData.length === 0) {
          return <p className="text-slate-500">暂无数据</p>;
        }
        const headers = Object.keys(tableData[0]);
        return (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  {headers.map(h => (
                    <th key={h} className="text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, i) => (
                  <tr key={i}>
                    {headers.map(h => (
                      <td key={h}>{String(row[h])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'chart':
        const chartData = section.content as Record<string, number>;
        return (
          <div className="flex items-end gap-4 h-48">
            {Object.entries(chartData).map(([key, value]) => (
              <div key={key} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-lg transition-all"
                  style={{ height: `${Math.min(100, (value / Math.max(...Object.values(chartData))) * 100)}%` }}
                />
                <span className="text-sm font-medium text-white">{value.toLocaleString()}</span>
                <span className="text-xs text-slate-500">{key}</span>
              </div>
            ))}
          </div>
        );
      case 'code':
        return (
          <div className="relative">
            <pre className="p-4 bg-slate-950/70 rounded-xl text-sm text-slate-300 font-mono overflow-x-auto">
              {section.content as string}
            </pre>
            <button
              className="absolute top-2 right-2 p-1.5 hover:bg-slate-800 rounded-lg"
              onClick={() => copyToClipboard(section.content as string, `section-${section.id}`)}
            >
              {copiedField === `section-${section.id}` ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-slate-400" />}
            </button>
          </div>
        );
      default:
        return <p className="text-slate-500">{String(section.content)}</p>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          onClick={onBack}
        >
          <ChevronRight size={20} className="text-slate-400 rotate-180" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">{report.title}</h2>
          <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
            <span>{formatDate(report.generatedAt)}</span>
            <span>·</span>
            <span>{report.generatedBy}</span>
            {analysis && (
              <>
                <span>·</span>
                <span>{getProjectName(analysis.projectId)}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary flex items-center gap-2" onClick={handlePrint}>
            <Printer size={16} />
            打印
          </button>
          <button className="btn-secondary flex items-center gap-2" onClick={handleShare}>
            <Share2 size={16} />
            分享
          </button>
          <button className="btn-primary flex items-center gap-2" onClick={handleExportPDF}>
            <Download size={16} />
            导出 PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {report.sections.map((section) => (
            <div key={section.id} className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{section.title}</h3>
              {renderSection(section)}
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-500" />
              可重现性信息
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              以下信息确保分析流程可以被完全重现
            </p>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Settings size={12} className="text-primary-400" />
                  软件版本
                </h4>
                <div className="p-3 bg-slate-950/50 rounded-lg space-y-1">
                  {Object.entries(report.reproducibilityInfo.softwareVersions).map(([name, version]) => (
                    <div key={name} className="flex justify-between text-xs">
                      <span className="text-slate-400">{name}</span>
                      <span className="text-slate-300 font-mono">{version}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Terminal size={12} className="text-primary-400" />
                  命令行
                </h4>
                {report.reproducibilityInfo.commandLines.length > 0 ? (
                  <div className="space-y-2">
                    {report.reproducibilityInfo.commandLines.map((cmd, i) => (
                      <div key={i} className="relative">
                        <code className="block p-3 bg-slate-950/50 rounded-lg text-xs text-slate-300 font-mono pr-8">
                          {cmd}
                        </code>
                        <button
                          className="absolute top-1 right-1 p-1 hover:bg-slate-800 rounded"
                          onClick={() => copyToClipboard(cmd, `cmd-${i}`)}
                        >
                          {copiedField === `cmd-${i}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-slate-500" />}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-600">暂无命令行记录</p>
                )}
              </div>

              <div>
                <h4 className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Hash size={12} className="text-primary-400" />
                  输入文件哈希
                </h4>
                {Object.keys(report.reproducibilityInfo.inputFileHashes).length > 0 ? (
                  <div className="p-3 bg-slate-950/50 rounded-lg space-y-2">
                    {Object.entries(report.reproducibilityInfo.inputFileHashes).map(([file, hash]) => (
                      <div key={file} className="text-xs">
                        <p className="text-slate-400 mb-1">{file}</p>
                        <div className="flex items-center gap-2">
                          <code className="text-emerald-400 font-mono text-xs flex-1 truncate">{hash}</code>
                          <button
                            onClick={() => copyToClipboard(hash, `hash-${file}`)}
                            className="flex-shrink-0"
                          >
                            {copiedField === `hash-${file}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-slate-500" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-600">暂无文件哈希记录</p>
                )}
              </div>

              <div>
                <h4 className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <FileJson size={12} className="text-primary-400" />
                  完整参数
                </h4>
                <div className="relative">
                  <pre className="p-3 bg-slate-950/50 rounded-lg text-xs text-slate-300 font-mono max-h-40 overflow-y-auto pr-8">
                    {JSON.stringify(report.reproducibilityInfo.parameters, null, 2)}
                  </pre>
                  <button
                    className="absolute top-1 right-1 p-1 hover:bg-slate-800 rounded"
                    onClick={() => copyToClipboard(JSON.stringify(report.reproducibilityInfo.parameters, null, 2), 'params')}
                  >
                    {copiedField === 'params' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-slate-500" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {analysis && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-white mb-4">分析信息</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">分析名称</span>
                  <span className="text-slate-300">{analysis.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">状态</span>
                  <StatusBadge status={analysis.status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">版本</span>
                  <span className="text-slate-300">v{analysis.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">样本数</span>
                  <span className="text-slate-300">{analysis.sampleIds.length} 个</span>
                </div>
                {analysis.resultSummary && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">检出变异</span>
                    <span className="text-slate-300">{analysis.resultSummary.totalVariants.toLocaleString()} 个</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">创建时间</span>
                  <span className="text-slate-300">{formatDate(analysis.createdAt)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface GenerateReportModalProps {
  analyses: AnalysisRecord[];
  getProjectName: (id: string) => string;
  selectedAnalysisId: string;
  setSelectedAnalysisId: (id: string) => void;
  onGenerate: () => void;
  onClose: () => void;
  loading: boolean;
}

function GenerateReportModal({
  analyses, getProjectName, selectedAnalysisId, setSelectedAnalysisId,
  onGenerate, onClose, loading
}: GenerateReportModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg overflow-hidden">
        <div className="p-5 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">生成分析报告</h2>
          <button
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            onClick={onClose}
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        <div className="p-5">
          <div className="mb-6">
            <label className="block text-sm text-slate-400 mb-2">选择分析 *</label>
            <select
              className="select-field w-full"
              value={selectedAnalysisId}
              onChange={(e) => setSelectedAnalysisId(e.target.value)}
            >
              <option value="">请选择已完成的分析</option>
              {analyses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} - {getProjectName(a.projectId)}
                </option>
              ))}
            </select>
            {analyses.length === 0 && (
              <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                <AlertCircle size={12} />
                暂无已完成的分析，请先运行分析
              </p>
            )}
          </div>

          <div className="card p-4 bg-slate-900/50 mb-6">
            <h4 className="text-sm font-medium text-white mb-2">报告包含内容</h4>
            <ul className="text-sm text-slate-400 space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-500" />
                分析概述与样本信息
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-500" />
                完整的分析参数快照
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-500" />
                所有软件版本信息
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-500" />
                命令行执行记录
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-500" />
                输入文件哈希校验
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-500" />
                结果统计与可视化
              </li>
            </ul>
          </div>

          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={onClose}>
              取消
            </button>
            <button
              className="btn-primary flex items-center gap-2"
              onClick={onGenerate}
              disabled={loading || !selectedAnalysisId}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <FileText size={16} />
                  生成报告
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
