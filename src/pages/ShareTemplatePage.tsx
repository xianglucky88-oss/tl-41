import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LayoutTemplate, Clock, Cpu, HardDrive, Heart, Share2, Play, AlertTriangle, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import type { WorkflowTemplate } from '@shared/types';
import { TEMPLATE_CATEGORY_LABELS } from '@shared/types';
import { ALIGNMENT_TOOLS } from '@shared/toolConfigs';

export default function ShareTemplatePage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { useTemplate, toggleFavorite } = useAnalysisStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState<(WorkflowTemplate & { isFavorited?: boolean; permissions?: 'view' | 'view_copy' }) | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    if (code) {
      fetchSharedTemplate(code);
    }
  }, [code]);

  const fetchSharedTemplate = async (shareCode: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/share/${shareCode}`);
      const data = await res.json();
      if (data.success) {
        setTemplate({
          ...data.data.template,
          permissions: data.data.permissions,
        });
        setIsFavorited(false);
      } else {
        setError(data.message || '分享链接不存在或已失效');
      }
    } catch (err) {
      setError('加载失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async () => {
    if (!template) return;
    try {
      const result = await useTemplate(template.id);
      if (result) {
        navigate('/workbench');
      }
    } catch (err) {
      setError('使用模板失败，请重试');
    }
  };

  const handleFavorite = async () => {
    if (!template) return;
    try {
      const result = await toggleFavorite(template.id);
      setIsFavorited(result.isFavorited);
    } catch (err) {
      console.error('收藏失败:', err);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="mx-auto text-primary-500 animate-spin mb-4" />
          <p className="text-slate-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle size={40} className="text-rose-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">链接无效</h2>
          <p className="text-slate-400 mb-6">{error || '分享链接不存在或已失效'}</p>
          <button
            className="btn-primary flex items-center gap-2 mx-auto"
            onClick={() => navigate('/templates')}
          >
            <ArrowLeft size={16} />
            返回模板中心
          </button>
        </div>
      </div>
    );
  }

  const toolNodes = template.graph.nodes.filter(n => n.type === 'tool');
  const getToolName = (toolId?: string) => {
    if (!toolId) return '';
    return ALIGNMENT_TOOLS.find(t => t.id === toolId)?.name || toolId;
  };
  const sortedNodes = [...toolNodes].sort((a, b) => a.position.x - b.position.x);

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-4xl mx-auto p-6">
        <button
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} />
          返回
        </button>

        <div className="card p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="badge bg-primary-500/20 text-primary-400 text-xs">
                  {TEMPLATE_CATEGORY_LABELS[template.category as keyof typeof TEMPLATE_CATEGORY_LABELS] || template.category}
                </span>
                <span className={`badge ${difficultyColors[template.difficulty]} text-xs`}>
                  {difficultyLabels[template.difficulty]}
                </span>
                {template.isBuiltIn && (
                  <span className="badge bg-emerald-500/20 text-emerald-400 text-xs">
                    官方模板
                  </span>
                )}
                {template.permissions === 'view_copy' && (
                  <span className="badge bg-blue-500/20 text-blue-400 text-xs">
                    允许复制
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">{template.name}</h1>
              <p className="text-slate-400">{template.description}</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <LayoutTemplate size={32} className="text-white" />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-slate-800/50 rounded-xl text-center">
              <p className="text-2xl font-bold text-white">{template.usageCount.toLocaleString()}</p>
              <p className="text-xs text-slate-500">使用次数</p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-xl text-center">
              <p className="text-2xl font-bold text-white">{template.favoriteCount.toLocaleString()}</p>
              <p className="text-xs text-slate-500">收藏数</p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-xl text-center">
              <p className="text-2xl font-bold text-white">{template.shareCount.toLocaleString()}</p>
              <p className="text-xs text-slate-500">分享数</p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-xl text-center">
              <p className="text-2xl font-bold text-white">{toolNodes.length}</p>
              <p className="text-xs text-slate-500">分析步骤</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">分析流程</h3>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {sortedNodes.map((node, idx) => (
                <div key={node.id} className="flex items-center gap-2 flex-shrink-0">
                  <div className="px-4 py-2 bg-primary-500/10 border border-primary-500/30 rounded-lg text-white text-sm font-medium">
                    {getToolName(node.toolId)}
                  </div>
                  {idx < sortedNodes.length - 1 && (
                    <div className="w-6 h-0.5 bg-slate-700 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="p-5 bg-slate-800/50 rounded-xl">
              <h4 className="text-white font-medium mb-3">资源要求</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Clock size={14} /> 预估时间
                  </span>
                  <span className="text-white">{template.estimatedRuntime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Cpu size={14} /> CPU 核心
                  </span>
                  <span className="text-white">{template.requirements.minCores} 核</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-2">
                    <HardDrive size={14} /> 内存
                  </span>
                  <span className="text-white">{template.requirements.minRAM}</span>
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-800/50 rounded-xl">
              <h4 className="text-white font-medium mb-3">模板标签</h4>
              <div className="flex flex-wrap gap-2">
                {template.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-lg text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              className={`flex-1 btn-secondary flex items-center justify-center gap-2 ${
                isFavorited ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : ''
              }`}
              onClick={handleFavorite}
            >
              <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
              {isFavorited ? '已收藏' : '收藏模板'}
            </button>
            <button
              className="flex-1 btn-secondary flex items-center justify-center gap-2"
              onClick={() => navigator.share?.({ title: template.name, text: template.description, url: window.location.href })}
            >
              <Share2 size={18} />
              转发链接
            </button>
            {template.permissions === 'view_copy' && (
              <button
                className="flex-1 btn-primary flex items-center justify-center gap-2"
                onClick={handleUseTemplate}
              >
                <Play size={18} />
                使用此模板
              </button>
            )}
          </div>

          {template.permissions === 'view' && (
            <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <AlertTriangle className="text-amber-400 mt-0.5 flex-shrink-0" size={18} />
              <div>
                <p className="text-amber-300 font-medium">仅查看权限</p>
                <p className="text-sm text-amber-400/80 mt-1">
                  此分享链接仅允许查看模板详情，如需使用请联系分享者开启复制权限。
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="text-center text-sm text-slate-500">
          <p className="flex items-center justify-center gap-2">
            <CheckCircle size={14} className="text-emerald-400" />
            分享链接来自 GenomeLab 生物信息学分析平台
          </p>
        </div>
      </div>
    </div>
  );
}
