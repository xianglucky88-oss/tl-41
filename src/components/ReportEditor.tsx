import { useState, useRef } from 'react';
import {
  GripVertical, Trash2, Plus, ChevronLeft, Save, X,
  FileText, Table as TableIcon, BarChart3, Code as CodeIcon,
  Image as ImageIcon, Quote as QuoteIcon, Check, Copy,
  Pencil, MoveUp, MoveDown, ColumnsPlusRight, Rows3Plus, Minus
} from 'lucide-react';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import type { AnalysisReport, ReportSection, ReportSectionType } from '@shared/types';
import RichTextEditor from './RichTextEditor';

interface ReportEditorProps {
  report: AnalysisReport;
  onClose: () => void;
}

const SECTION_TYPE_CONFIG: Record<ReportSectionType, {
  label: string;
  icon: typeof FileText;
  color: string;
  description: string;
}> = {
  text: { label: '文本', icon: FileText, color: 'from-blue-500 to-blue-600', description: '富文本段落内容' },
  table: { label: '表格', icon: TableIcon, color: 'from-emerald-500 to-emerald-600', description: '结构化数据表格' },
  chart: { label: '图表', icon: BarChart3, color: 'from-purple-500 to-purple-600', description: '数据可视化图表' },
  code: { label: '代码', icon: CodeIcon, color: 'from-amber-500 to-amber-600', description: '代码片段' },
  image: { label: '图片', icon: ImageIcon, color: 'from-pink-500 to-pink-600', description: '图片与说明' },
  quote: { label: '引用', icon: QuoteIcon, color: 'from-cyan-500 to-cyan-600', description: '引用内容块' },
};

export default function ReportEditor({ report, onClose }: ReportEditorProps) {
  const {
    updateReportTitle, updateReportSection, reorderReportSections,
    addReportSection, deleteReportSection, loading
  } = useAnalysisStore();

  const [localSections, setLocalSections] = useState<ReportSection[]>(report.sections);
  const [localTitle, setLocalTitle] = useState(report.title);
  const [editingTitle, setEditingTitle] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showAddMenu, setShowAddMenu] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const syncSection = (index: number, data: Partial<ReportSection>) => {
    setLocalSections(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...data };
      return next;
    });
    setHasChanges(true);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const newSections = [...localSections];
    const [removed] = newSections.splice(draggedIndex, 1);
    newSections.splice(targetIndex, 0, removed);
    setLocalSections(newSections);
    setDraggedIndex(null);
    setDragOverIndex(null);
    setHasChanges(true);
    await reorderReportSections(report.id, draggedIndex, targetIndex);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleAddSection = async (type: ReportSectionType, insertIndex?: number) => {
    setShowAddMenu(null);
    await addReportSection(report.id, type, insertIndex);
    setHasChanges(true);
    setTimeout(() => {
      setLocalSections(useAnalysisStore.getState().reports.find(r => r.id === report.id)?.sections || localSections);
    }, 150);
  };

  const handleDeleteSection = async (sectionId: string, index: number) => {
    if (!confirm('确定要删除该章节吗？此操作不可撤销。')) return;
    setLocalSections(prev => prev.filter((_, i) => i !== index));
    setHasChanges(true);
    await deleteReportSection(report.id, sectionId);
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= localSections.length) return;
    const newSections = [...localSections];
    const [removed] = newSections.splice(index, 1);
    newSections.splice(targetIndex, 0, removed);
    setLocalSections(newSections);
    setHasChanges(true);
    reorderReportSections(report.id, index, targetIndex);
  };

  const handleSave = async () => {
    if (localTitle !== report.title) {
      await updateReportTitle(report.id, localTitle);
    }
    for (let i = 0; i < localSections.length; i++) {
      const original = report.sections.find(s => s.id === localSections[i].id);
      if (JSON.stringify(original) !== JSON.stringify(localSections[i])) {
        await updateReportSection(report.id, localSections[i].id, {
          title: localSections[i].title,
          content: localSections[i].content,
        });
      }
    }
    setHasChanges(false);
    alert('报告已保存！');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 z-50 flex flex-col animate-fade-in">
      <div className="border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between p-4 px-6">
          <div className="flex items-center gap-4">
            <button
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
              onClick={onClose}
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    className="text-xl font-bold bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-primary-500 w-[500px]"
                    value={localTitle}
                    onChange={(e) => { setLocalTitle(e.target.value); setHasChanges(true); }}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setEditingTitle(false);
                      if (e.key === 'Escape') { setLocalTitle(report.title); setEditingTitle(false); }
                    }}
                  />
                  <button
                    className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400"
                    onClick={() => setEditingTitle(false)}
                  >
                    <Check size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setEditingTitle(true)}>
                  <h1 className="text-xl font-bold text-white">{localTitle}</h1>
                  <Pencil size={16} className="text-slate-500 group-hover:text-primary-400 transition-colors" />
                </div>
              )}
              <p className="text-sm text-slate-500 mt-1">
                共 {localSections.length} 个章节 · 拖拽调整顺序
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <span className="text-sm text-amber-400 flex items-center gap-1">
                <Save size={14} />
                有未保存的更改
              </span>
            )}
            <button className="btn-secondary flex items-center gap-2" onClick={onClose}>
              <X size={16} />
              关闭
            </button>
            <button
              className="btn-primary flex items-center gap-2"
              onClick={handleSave}
              disabled={loading}
            >
              <Save size={16} />
              保存报告
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6 pb-32">
          {localSections.map((section, index) => (
            <div
              key={section.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`card transition-all duration-200 ${
                draggedIndex === index ? 'opacity-50 scale-[0.98] ring-2 ring-primary-500' : ''
              } ${
                dragOverIndex === index && draggedIndex !== index
                  ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-slate-950 border-primary-500/50'
                  : ''
              }`}
            >
              <div className="flex items-start gap-3 p-4 border-b border-slate-700/50">
                <div
                  className="flex flex-col items-center gap-1 pt-1 cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 transition-colors"
                  title="拖拽调整顺序"
                >
                  <GripVertical size={18} />
                  <div className="flex flex-col gap-0.5">
                    <button
                      className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-slate-300 disabled:opacity-30"
                      onClick={() => handleMoveSection(index, 'up')}
                      disabled={index === 0}
                      title="上移"
                    >
                      <MoveUp size={14} />
                    </button>
                    <button
                      className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-slate-300 disabled:opacity-30"
                      onClick={() => handleMoveSection(index, 'down')}
                      disabled={index === localSections.length - 1}
                      title="下移"
                    >
                      <MoveDown size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${SECTION_TYPE_CONFIG[section.type].color} flex items-center justify-center`}>
                      {(() => { const Icon = SECTION_TYPE_CONFIG[section.type].icon; return <Icon size={16} className="text-white" />; })()}
                    </div>
                    <input
                      className="flex-1 bg-transparent text-lg font-semibold text-white focus:outline-none focus:bg-slate-800/50 rounded px-2 py-0.5 -mx-2"
                      value={section.title}
                      onChange={(e) => syncSection(index, { title: e.target.value })}
                      placeholder="章节标题"
                    />
                  </div>
                  <span className="text-xs text-slate-500 ml-10">
                    类型: {SECTION_TYPE_CONFIG[section.type].label} · {SECTION_TYPE_CONFIG[section.type].description}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-amber-400 transition-colors"
                    onClick={() => handleDeleteSection(section.id, index)}
                    title="删除章节"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="p-5">
                <SectionEditor
                  section={section}
                  onChange={(data) => syncSection(index, data)}
                />
              </div>

              {dragOverIndex === index && draggedIndex !== null && draggedIndex !== index && (
                <div className="absolute -top-1 left-0 right-0 h-1 bg-primary-500 rounded-t-xl" />
              )}
            </div>
          ))}

          <div className="relative">
            <button
              className="w-full card border-2 border-dashed border-slate-600 hover:border-primary-500/50 hover:bg-slate-800/30 p-8 text-slate-500 hover:text-primary-400 transition-all flex flex-col items-center gap-2 group"
              onClick={() => setShowAddMenu(showAddMenu === -1 ? null : -1)}
            >
              <Plus size={24} />
              <span className="text-sm font-medium">点击添加新章节</span>
              <span className="text-xs">支持文本 / 表格 / 图表 / 代码 / 图片 / 引用</span>
            </button>
            {showAddMenu === -1 && (
              <AddSectionMenu
                onSelect={(type) => handleAddSection(type)}
                onClose={() => setShowAddMenu(null)}
                position="bottom-full"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface SectionEditorProps {
  section: ReportSection;
  onChange: (data: Partial<ReportSection>) => void;
}

function SectionEditor({ section, onChange }: SectionEditorProps) {
  switch (section.type) {
    case 'text':
      return <TextSectionEditor content={section.content as string} onChange={onChange} />;
    case 'table':
      return <TableSectionEditor content={section.content as Record<string, unknown>[]} onChange={onChange} />;
    case 'chart':
      return <ChartSectionEditor content={section.content as Record<string, number>} onChange={onChange} />;
    case 'code':
      return <CodeSectionEditor content={section.content as string} onChange={onChange} />;
    case 'image':
      return <ImageSectionEditor content={section.content as { url: string; alt: string; caption: string }} onChange={onChange} />;
    case 'quote':
      return <QuoteSectionEditor content={section.content as string} onChange={onChange} />;
    default:
      return <p className="text-slate-500">未知章节类型</p>;
  }
}

function TextSectionEditor({ content, onChange }: { content: string; onChange: (d: Partial<ReportSection>) => void }) {
  const htmlContent = content && !content.startsWith('<')
    ? `<p>${content.replace(/\n/g, '</p><p>')}</p>`
    : (content || '');
  return (
    <RichTextEditor
      value={htmlContent}
      onChange={(v) => onChange({ content: v })}
      placeholder="开始编辑文本内容...支持粗体、斜体、标题、列表、引用等格式"
    />
  );
}

function TableSectionEditor({ content, onChange }: { content: Record<string, unknown>[]; onChange: (d: Partial<ReportSection>) => void }) {
  const rows = Array.isArray(content) ? content : [];
  const headers = rows.length > 0 ? Object.keys(rows[0]) : ['列1', '列2', '列3'];
  const [copied, setCopied] = useState(false);

  const updateCell = (rowIdx: number, header: string, value: string) => {
    const newRows = rows.map((row, i) =>
      i === rowIdx ? { ...row, [header]: value } : row
    );
    onChange({ content: newRows });
  };

  const addRow = () => {
    const newRow: Record<string, unknown> = {};
    headers.forEach(h => newRow[h] = '');
    onChange({ content: [...rows, newRow] });
  };

  const deleteRow = (idx: number) => {
    if (rows.length <= 1) {
      alert('至少需要保留一行数据');
      return;
    }
    onChange({ content: rows.filter((_, i) => i !== idx) });
  };

  const addColumn = () => {
    const colName = prompt('输入新列名称:', `列${headers.length + 1}`);
    if (!colName) return;
    const newRows = rows.map(row => ({ ...row, [colName]: '' }));
    onChange({ content: newRows });
  };

  const deleteColumn = (header: string) => {
    if (headers.length <= 1) {
      alert('至少需要保留一列');
      return;
    }
    if (!confirm(`确定删除列 "${header}" 吗？`)) return;
    const newRows = rows.map(row => {
      const { [header]: _, ...rest } = row;
      return rest;
    });
    onChange({ content: newRows });
  };

  const copyAsMarkdown = () => {
    const headerRow = headers.join(' | ');
    const separator = headers.map(() => '---').join(' | ');
    const dataRows = rows.map(row => headers.map(h => String(row[h])).join(' | ')).join('\n');
    const md = `${headerRow}\n${separator}\n${dataRows}`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          className="btn-secondary text-xs flex items-center gap-1 py-1.5"
          onClick={addRow}
        >
          <Rows3Plus size={14} /> 新增行
        </button>
        <button
          className="btn-secondary text-xs flex items-center gap-1 py-1.5"
          onClick={addColumn}
        >
          <ColumnsPlusRight size={14} /> 新增列
        </button>
        <button
          className="btn-secondary text-xs flex items-center gap-1 py-1.5"
          onClick={copyAsMarkdown}
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          {copied ? '已复制' : '复制Markdown'}
        </button>
      </div>
      <div className="overflow-x-auto border border-slate-700 rounded-xl">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800/50">
              <th className="p-2 text-left text-xs text-slate-500 w-10">#</th>
              {headers.map(h => (
                <th key={h} className="p-2 text-left min-w-[140px]">
                  <div className="flex items-center gap-1 group">
                    <input
                      className="flex-1 bg-transparent text-sm font-semibold text-white focus:outline-none focus:bg-slate-700/50 rounded px-2 py-1"
                      value={h}
                      onChange={(e) => {
                        const newName = e.target.value;
                        if (newName && newName !== h) {
                          const newRows = rows.map(row => {
                            const updated: Record<string, unknown> = {};
                            Object.keys(row).forEach(k => {
                              updated[k === h ? newName : k] = row[k];
                            });
                            return updated;
                          });
                          onChange({ content: newRows });
                        }
                      }}
                    />
                    <button
                      className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400 transition-all"
                      onClick={() => deleteColumn(h)}
                      title="删除列"
                    >
                      <Minus size={14} />
                    </button>
                  </div>
                </th>
              ))}
              <th className="p-2 text-left text-xs text-slate-500 w-16">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-t border-slate-700/50 hover:bg-slate-800/20">
                <td className="p-2 text-xs text-slate-500">{rowIdx + 1}</td>
                {headers.map(h => (
                  <td key={h} className="p-1">
                    <input
                      className="w-full bg-transparent text-sm text-slate-200 focus:outline-none focus:bg-slate-700/30 rounded px-2 py-1.5"
                      value={String(row[h] ?? '')}
                      onChange={(e) => updateCell(rowIdx, h, e.target.value)}
                      placeholder="输入内容..."
                    />
                  </td>
                ))}
                <td className="p-2">
                  <button
                    className="p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400 transition-colors"
                    onClick={() => deleteRow(rowIdx)}
                    title="删除行"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChartSectionEditor({ content, onChange }: { content: Record<string, number>; onChange: (d: Partial<ReportSection>) => void }) {
  const data = content || { '类别A': 30, '类别B': 50, '类别C': 20 };
  const entries = Object.entries(data);
  const maxValue = Math.max(...entries.map(([, v]) => v), 1);

  const updateEntry = (oldKey: string, newKey: string, newValue: number) => {
    const newData: Record<string, number> = {};
    Object.entries(data).forEach(([k, v]) => {
      if (k === oldKey) {
        newData[newKey || oldKey] = newValue;
      } else {
        newData[k] = v;
      }
    });
    onChange({ content: newData });
  };

  const addEntry = () => {
    const newKey = `类别${String.fromCharCode(65 + entries.length) || 'D'}`;
    onChange({ content: { ...data, [newKey]: 50 } });
  };

  const deleteEntry = (key: string) => {
    if (entries.length <= 2) {
      alert('至少需要保留两个数据项');
      return;
    }
    const newData: Record<string, number> = {};
    Object.entries(data).forEach(([k, v]) => {
      if (k !== key) newData[k] = v;
    });
    onChange({ content: newData });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-end gap-4 h-56 p-5 bg-slate-900/50 rounded-xl border border-slate-700/50">
        {entries.map(([key, value]) => (
          <div key={key} className="flex-1 flex flex-col items-center gap-2">
            <span className="text-sm font-semibold text-white">{value.toLocaleString()}</span>
            <div className="w-full flex-1 flex items-end">
              <div
                className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-lg transition-all duration-300 shadow-lg shadow-primary-500/20"
                style={{ height: `${Math.max(5, (value / maxValue) * 100)}%` }}
              />
            </div>
            <span className="text-xs text-slate-400 text-center truncate w-full">{key}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400 font-medium">数据项编辑</span>
          <button className="btn-secondary text-xs py-1 px-3 flex items-center gap-1" onClick={addEntry}>
            <Plus size={12} /> 新增数据
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {entries.map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg group">
              <input
                className="flex-1 bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-primary-500"
                value={key}
                onChange={(e) => updateEntry(key, e.target.value, value)}
                placeholder="类别名称"
              />
              <input
                type="number"
                className="w-24 bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-primary-500"
                value={value}
                onChange={(e) => updateEntry(key, key, Number(e.target.value) || 0)}
              />
              <button
                className="p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400 transition-colors opacity-50 group-hover:opacity-100"
                onClick={() => deleteEntry(key)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CodeSectionEditor({ content, onChange }: { content: string; onChange: (d: Partial<ReportSection>) => void }) {
  const [copied, setCopied] = useState(false);
  const [language, setLanguage] = useState('javascript');

  const copyCode = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <select
          className="select-field text-sm py-1.5 w-40"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="json">JSON</option>
          <option value="bash">Bash</option>
          <option value="sql">SQL</option>
          <option value="r">R</option>
          <option value="plaintext">纯文本</option>
        </select>
        <button
          className="btn-secondary text-xs py-1.5 flex items-center gap-1"
          onClick={copyCode}
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          {copied ? '已复制' : '复制代码'}
        </button>
      </div>
      <textarea
        className="w-full min-h-[200px] max-h-[400px] bg-slate-950 border border-slate-700 rounded-xl p-4 text-sm font-mono text-slate-300 focus:outline-none focus:border-primary-500 resize-y leading-relaxed"
        value={content || ''}
        onChange={(e) => onChange({ content: e.target.value })}
        placeholder="在此处粘贴或编辑代码..."
        spellCheck={false}
      />
    </div>
  );
}

function ImageSectionEditor({ content, onChange }: { content: { url: string; alt: string; caption: string }; onChange: (d: Partial<ReportSection>) => void }) {
  const data = content || { url: '', alt: '', caption: '' };
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        onChange({ content: { ...data, url: ev.target?.result as string } });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-slate-600 rounded-xl overflow-hidden bg-slate-900/30">
        {data.url ? (
          <div className="relative">
            <img
              src={data.url}
              alt={data.alt}
              className="w-full max-h-[400px] object-contain"
            />
            <button
              className="absolute top-3 right-3 p-2 bg-slate-900/80 hover:bg-slate-900 rounded-lg text-slate-300 hover:text-white transition-colors"
              onClick={() => onChange({ content: { ...data, url: '' } })}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div
            className="p-12 text-center cursor-pointer hover:bg-slate-800/30 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon size={48} className="mx-auto text-slate-500 mb-3" />
            <p className="text-slate-400 mb-2">点击或拖拽上传图片</p>
            <p className="text-xs text-slate-600">支持 JPG / PNG / GIF / WebP 格式</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-slate-400 mb-1">图片URL（可选）</label>
          <input
            type="url"
            className="input-field text-sm"
            value={data.url?.startsWith('data:') ? '' : (data.url || '')}
            onChange={(e) => onChange({ content: { ...data, url: e.target.value } })}
            placeholder="https://example.com/image.png"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">图片描述（Alt）</label>
          <input
            type="text"
            className="input-field text-sm"
            value={data.alt || ''}
            onChange={(e) => onChange({ content: { ...data, alt: e.target.value } })}
            placeholder="图片的无障碍描述文本"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">图片说明（Caption）</label>
          <input
            type="text"
            className="input-field text-sm"
            value={data.caption || ''}
            onChange={(e) => onChange({ content: { ...data, caption: e.target.value } })}
            placeholder="显示在图片下方的说明文字"
          />
        </div>
      </div>
    </div>
  );
}

function QuoteSectionEditor({ content, onChange }: { content: string; onChange: (d: Partial<ReportSection>) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
        <QuoteIcon size={14} />
        <span>引用内容支持多行文本，将以引用块样式展示</span>
      </div>
      <div className="relative">
        <textarea
          className="w-full min-h-[120px] max-h-[300px] bg-slate-900/50 border-l-4 border-primary-500 rounded-r-xl p-4 pl-5 text-slate-300 focus:outline-none focus:border-primary-400 resize-y leading-relaxed italic"
          value={content || ''}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="输入引用内容..."
        />
      </div>
      <div className="ml-4 border-l-4 border-primary-500/30 pl-5 py-3 italic text-slate-400 rounded-r-lg bg-slate-800/20">
        {content || '预览效果将在此显示...'}
      </div>
    </div>
  );
}

interface AddSectionMenuProps {
  onSelect: (type: ReportSectionType) => void;
  onClose: () => void;
  position: string;
}

function AddSectionMenu({ onSelect, onClose, position }: AddSectionMenuProps) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className={`absolute z-20 left-1/2 -translate-x-1/2 ${position} mb-2 w-full max-w-2xl`}>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-700/50">
            <p className="text-sm font-medium text-white mb-1">选择章节类型</p>
            <p className="text-xs text-slate-500">点击添加对应类型的章节</p>
          </div>
          <div className="grid grid-cols-3 gap-2 p-3">
            {(Object.keys(SECTION_TYPE_CONFIG) as ReportSectionType[]).map(type => {
              const cfg = SECTION_TYPE_CONFIG[type];
              const Icon = cfg.icon;
              return (
                <button
                  key={type}
                  className="p-4 hover:bg-slate-700/50 rounded-xl transition-all text-left group"
                  onClick={() => onSelect(type)}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cfg.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <p className="text-sm font-semibold text-white mb-1">{cfg.label}章节</p>
                  <p className="text-xs text-slate-500">{cfg.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
