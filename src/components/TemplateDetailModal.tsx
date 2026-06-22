import { X, Heart, Share2, Play, Clock, Cpu, HardDrive, Star, Users, Tag, User, Calendar, ArrowRight, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import type { WorkflowTemplate } from '@shared/types';
import { TEMPLATE_CATEGORY_LABELS } from '@shared/types';
import { ALIGNMENT_TOOLS } from '@shared/toolConfigs';

interface TemplateDetailModalProps {
  template: WorkflowTemplate & { isFavorited?: boolean };
  isOpen: boolean;
  onClose: () => void;
  onFavorite: (templateId: string) => void;
  onShare: (template: WorkflowTemplate) => void;
  onUse: (template: WorkflowTemplate) => void;
}

const difficultyColors = {
  beginner: 'bg-emerald-500/20 text-emerald-400',
  intermediate: 'bg-amber-500/20 text-amber-400',
  advanced: 'bg-rose-500/20 text-rose-400',
};

const difficultyLabels = {
  beginner: '入门',
  intermediate: '中级',
  advanced: '高级',
};

const categoryColors: Record<string, string> = {
  variant_calling: 'from-blue-500 to-blue-600',
  alignment: 'from-emerald-500 to-emerald-600',
  assembly: 'from-purple-500 to-purple-600',
  annotation: 'from-orange-500 to-orange-600',
  rna_seq: 'from-pink-500 to-pink-600',
  chip_seq: 'from-cyan-500 to-cyan-600',
  methylation: 'from-indigo-500 to-indigo-600',
  metagenomics: 'from-teal-500 to-teal-600',
  single_cell: 'from-rose-500 to-rose-600',
  custom: 'from-slate-500 to-slate-600',
};

export default function TemplateDetailModal({
  template,
  isOpen,
  onClose,
  onFavorite,
  onShare,
  onUse,
}: TemplateDetailModalProps) {
  if (!isOpen || !template) return null;

  const toolNodes = template.graph.nodes.filter(n => n.type === 'tool');
  const inputNode = template.graph.nodes.find(n => n.type === 'input');
  const outputNode = template.graph.nodes.find(n => n.type === 'output');
  const categoryColor = categoryColors[template.category] || categoryColors.custom;

  const getToolName = (toolId?: string) => {
    if (!toolId) return '';
    return ALIGNMENT_TOOLS.find(t => t.id === toolId)?.name || toolId;
  };

  const sortedNodes = [...toolNodes].sort((a, b) => a.position.x - b.position.x);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className={`h-2 bg-gradient-to-r ${categoryColor}`} />
        
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className={`badge bg-gradient-to-r ${categoryColor} text-white text-xs`}>
                  {TEMPLATE_CATEGORY_LABELS[template.category] || template.category}
                </span>
                <span className={`badge ${difficultyColors[template.difficulty]} text-xs`}>
                  {difficultyLabels[template.difficulty]}
                </span>
                {template.isBuiltIn && (
                  <span className="badge bg-primary-500/20 text-primary-400 text-xs">
                    官方模板
                  </span>
                )}
                {template.isPublic && (
                  <span className="badge bg-emerald-500/20 text-emerald-400 text-xs">
                    公开
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{template.name}</h2>
              <p className="text-slate-400">{template.description}</p>
            </div>
            <button
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              onClick={onClose}
            >
              <X size={20} className="text-slate-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="card p-4 bg-slate-800/50">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Users size={14} />
                <span className="text-xs">使用次数</span>
              </div>
              <p className="text-xl font-bold text-white">{template.usageCount.toLocaleString()}</p>
            </div>
            <div className="card p-4 bg-slate-800/50">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Star size={14} />
                <span className="text-xs">收藏数</span>
              </div>
              <p className="text-xl font-bold text-white">{template.favoriteCount.toLocaleString()}</p>
            </div>
            <div className="card p-4 bg-slate-800/50">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Share2 size={14} />
                <span className="text-xs">分享数</span>
              </div>
              <p className="text-xl font-bold text-white">{template.shareCount.toLocaleString()}</p>
            </div>
            <div className="card p-4 bg-slate-800/50">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Calendar size={14} />
                <span className="text-xs">更新时间</span>
              </div>
              <p className="text-sm font-semibold text-white">
                {new Date(template.updatedAt).toLocaleDateString('zh-CN')}
              </p>
            </div>
          </div>

          <div className="card p-5 bg-slate-800/50">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ArrowRight size={20} className="text-primary-400" />
              分析流程
            </h3>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {inputNode && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="px-4 py-2 bg-slate-700 rounded-lg text-white text-sm font-medium">
                    {inputNode.label}
                  </div>
                  <ArrowRight size={16} className="text-slate-500 flex-shrink-0" />
                </div>
              )}
              {sortedNodes.map((node, idx) => (
                <div key={node.id} className="flex items-center gap-2 flex-shrink-0">
                  <div className="px-4 py-2 bg-gradient-to-r from-primary-500/20 to-primary-600/20 border border-primary-500/30 rounded-lg text-white text-sm font-medium">
                    {getToolName(node.toolId)}
                  </div>
                  {idx < sortedNodes.length - 1 && (
                    <ArrowRight size={16} className="text-slate-500 flex-shrink-0" />
                  )}
                </div>
              ))}
              {outputNode && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <ArrowRight size={16} className="text-slate-500 flex-shrink-0" />
                  <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-white text-sm font-medium">
                    {outputNode.label}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="card p-5 bg-slate-800/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Info size={20} className="text-primary-400" />
                资源要求
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock size={16} />
                    <span>预估运行时间</span>
                  </div>
                  <span className="text-white font-medium">{template.estimatedRuntime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Cpu size={16} />
                    <span>最小 CPU 核心</span>
                  </div>
                  <span className="text-white font-medium">{template.requirements.minCores} 核</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <HardDrive size={16} />
                    <span>最小内存</span>
                  </div>
                  <span className="text-white font-medium">{template.requirements.minRAM}</span>
                </div>
                {template.requirements.referenceGenome && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Tag size={16} />
                      <span>参考基因组</span>
                    </div>
                    <span className="text-white font-medium">{template.requirements.referenceGenome}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="card p-5 bg-slate-800/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Tag size={20} className="text-primary-400" />
                模板标签
              </h3>
              <div className="flex flex-wrap gap-2">
                {template.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 bg-slate-700/50 text-slate-300 rounded-lg text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {Object.keys(template.parameters).length > 0 && (
            <div className="card p-5 bg-slate-800/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Info size={20} className="text-primary-400" />
                默认参数配置
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(template.parameters).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <span className="text-slate-400 text-sm">{key}</span>
                    <span className="text-white font-mono text-sm">
                      {typeof value === 'boolean' ? (value ? '是' : '否') : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card p-5 bg-slate-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold">
                  {template.author.charAt(0)}
                </div>
                <div>
                  <p className="text-white font-medium">{template.author}</p>
                  <p className="text-xs text-slate-500">
                    版本 {template.version} · 创建于 {new Date(template.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <CheckCircle size={14} className="text-emerald-400" />
                <span>经过验证</span>
              </div>
            </div>
          </div>

          {template.difficulty === 'advanced' && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <AlertTriangle className="text-amber-400 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <p className="text-amber-300 font-medium">高级难度提示</p>
                <p className="text-sm text-amber-400/80 mt-1">
                  此模板涉及复杂的分析流程，建议具备相关领域经验的用户使用。使用前请仔细阅读各步骤参数说明。
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-700 bg-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">
              <User size={14} className="inline mr-1" />
              模板作者: {template.author}
            </div>
            <div className="flex items-center gap-3">
              <button
                className={`btn-secondary flex items-center gap-2 ${
                  template.isFavorited
                    ? 'bg-rose-500/20 border-rose-500/30 text-rose-400 hover:bg-rose-500/30'
                    : ''
                }`}
                onClick={() => onFavorite(template.id)}
              >
                <Heart size={16} fill={template.isFavorited ? 'currentColor' : 'none'} />
                {template.isFavorited ? '已收藏' : '收藏模板'}
              </button>
              <button
                className="btn-secondary flex items-center gap-2"
                onClick={() => onShare(template)}
              >
                <Share2 size={16} />
                分享模板
              </button>
              <button
                className="btn-primary flex items-center gap-2"
                onClick={() => onUse(template)}
              >
                <Play size={16} />
                使用此模板
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
