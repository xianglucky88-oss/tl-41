import { Heart, Share2, Play, Clock, Cpu, HardDrive, Star, Users } from 'lucide-react';
import type { WorkflowTemplate } from '@shared/types';
import { TEMPLATE_CATEGORY_LABELS } from '@shared/types';

interface TemplateCardProps {
  template: WorkflowTemplate & { isFavorited?: boolean };
  onFavorite: (templateId: string) => void;
  onShare: (template: WorkflowTemplate) => void;
  onUse: (template: WorkflowTemplate) => void;
  onView: (template: WorkflowTemplate) => void;
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

export default function TemplateCard({
  template,
  onFavorite,
  onShare,
  onUse,
  onView,
}: TemplateCardProps) {
  const toolNodes = template.graph.nodes.filter(n => n.type === 'tool');
  const categoryColor = categoryColors[template.category] || categoryColors.custom;

  return (
    <div className="card card-hover overflow-hidden group">
      <div className={`h-1.5 bg-gradient-to-r ${categoryColor}`} />
      
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`badge bg-gradient-to-r ${categoryColor} text-white text-xs`}>
                {TEMPLATE_CATEGORY_LABELS[template.category] || template.category}
              </span>
              <span className={`badge ${difficultyColors[template.difficulty]} text-xs`}>
                {difficultyLabels[template.difficulty]}
              </span>
              {template.isBuiltIn && (
                <span className="badge bg-primary-500/20 text-primary-400 text-xs">
                  官方
                </span>
              )}
            </div>
            <h3 
              className="text-lg font-semibold text-white truncate cursor-pointer hover:text-primary-400 transition-colors"
              onClick={() => onView(template)}
            >
              {template.name}
            </h3>
          </div>
        </div>

        <p className="text-sm text-slate-400 mb-4 line-clamp-2">
          {template.description}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {template.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 bg-slate-700/50 text-slate-400 rounded-full"
            >
              {tag}
            </span>
          ))}
          {template.tags.length > 4 && (
            <span className="text-xs px-2 py-0.5 bg-slate-700/50 text-slate-400 rounded-full">
              +{template.tags.length - 4}
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock size={14} />
            <span>{template.estimatedRuntime}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Cpu size={14} />
            <span>{template.requirements.minCores}核</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <HardDrive size={14} />
            <span>{template.requirements.minRAM}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
          <div className="flex items-center gap-1">
            <Users size={12} />
            <span>{template.usageCount.toLocaleString()} 使用</span>
          </div>
          <div className="flex items-center gap-1">
            <Star size={12} />
            <span>{template.favoriteCount.toLocaleString()} 收藏</span>
          </div>
          <div className="text-slate-600">
            {toolNodes.length} 步骤
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className={`flex-1 btn-primary text-sm flex items-center justify-center gap-1.5`}
            onClick={() => onUse(template)}
          >
            <Play size={14} />
            使用模板
          </button>
          <button
            className={`p-2.5 rounded-xl border transition-all ${
              template.isFavorited
                ? 'bg-rose-500/20 border-rose-500/30 text-rose-400'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
            onClick={() => onFavorite(template.id)}
            title={template.isFavorited ? '取消收藏' : '收藏模板'}
          >
            <Heart size={16} fill={template.isFavorited ? 'currentColor' : 'none'} />
          </button>
          <button
            className="p-2.5 rounded-xl border bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white transition-all"
            onClick={() => onShare(template)}
            title="分享模板"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
