import { useState, useEffect, useMemo } from 'react';
import { Search, Heart, Star, Clock, TrendingUp, Grid, List, Filter, SlidersHorizontal } from 'lucide-react';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import TemplateCard from '@/components/TemplateCard';
import TemplateDetailModal from '@/components/TemplateDetailModal';
import ShareTemplateModal from '@/components/ShareTemplateModal';
import type { WorkflowTemplate, TemplateCategory } from '@shared/types';
import { TEMPLATE_CATEGORY_LABELS } from '@shared/types';
import { useNavigate } from 'react-router-dom';

type TabType = 'all' | 'builtIn' | 'my' | 'favorites' | 'popular';
type SortType = 'popular' | 'latest' | 'usage' | 'name';

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

export default function WorkflowTemplates() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortType>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    template: (WorkflowTemplate & { isFavorited?: boolean }) | null;
  }>({ isOpen: false, template: null });

  const [shareModal, setShareModal] = useState<{
    isOpen: boolean;
    template: WorkflowTemplate | null;
  }>({ isOpen: false, template: null });

  const {
    templates,
    favoriteTemplates,
    popularTemplates,
    templateCategories,
    fetchTemplates,
    fetchTemplateCategories,
    fetchFavorites,
    fetchPopularTemplates,
    toggleFavorite,
    shareTemplate,
    useTemplate,
  } = useAnalysisStore();

  const favoriteIds = useMemo(() => 
    favoriteTemplates.map(t => t.id),
    [favoriteTemplates]
  );

  useEffect(() => {
    fetchTemplates();
    fetchTemplateCategories();
    fetchFavorites();
    fetchPopularTemplates();
  }, []);

  const templatesWithFavorite = useMemo(() => {
    let source: WorkflowTemplate[] = [];
    
    switch (activeTab) {
      case 'builtIn':
        source = templates.filter(t => t.isBuiltIn);
        break;
      case 'my':
        source = templates.filter(t => !t.isBuiltIn && t.authorId === 'user_001');
        break;
      case 'favorites':
        source = favoriteTemplates;
        break;
      case 'popular':
        source = popularTemplates;
        break;
      default:
        source = templates;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      source = source.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (selectedCategory !== 'all') {
      source = source.filter(t => t.category === selectedCategory);
    }

    if (selectedDifficulty !== 'all') {
      source = source.filter(t => t.difficulty === selectedDifficulty);
    }

    switch (sortBy) {
      case 'latest':
        source = [...source].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case 'usage':
        source = [...source].sort((a, b) => b.usageCount - a.usageCount);
        break;
      case 'name':
        source = [...source].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
        break;
      default:
        source = [...source].sort((a, b) => (b.favoriteCount + b.usageCount) - (a.favoriteCount + a.usageCount));
    }

    return source.map(t => ({
      ...t,
      isFavorited: favoriteIds.includes(t.id),
    }));
  }, [templates, favoriteTemplates, popularTemplates, activeTab, searchQuery, selectedCategory, sortBy, selectedDifficulty, favoriteIds]);

  const handleFavorite = async (templateId: string) => {
    await toggleFavorite(templateId);
    if (activeTab === 'favorites') {
      await fetchFavorites();
    }
  };

  const handleShare = (template: WorkflowTemplate) => {
    setShareModal({ isOpen: true, template });
  };

  const handleView = (template: WorkflowTemplate & { isFavorited?: boolean }) => {
    setDetailModal({ isOpen: true, template });
  };

  const handleUse = async (template: WorkflowTemplate) => {
    const result = await useTemplate(template.id);
    if (result) {
      navigate('/analysis/workbench');
    }
  };

  const tabs = [
    { id: 'all', label: '全部模板', icon: Grid, count: templates.length },
    { id: 'builtIn', label: '官方模板', icon: Star, count: templates.filter(t => t.isBuiltIn).length },
    { id: 'my', label: '我的模板', icon: Clock, count: templates.filter(t => !t.isBuiltIn && t.authorId === 'user_001').length },
    { id: 'favorites', label: '我的收藏', icon: Heart, count: favoriteTemplates.length },
    { id: 'popular', label: '热门排行', icon: TrendingUp, count: popularTemplates.length },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-[1600px] mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">分析流程模板</h1>
          <p className="text-slate-400">
            选择或创建生物信息学分析流程模板，快速开始您的数据分析
          </p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
                onClick={() => setActiveTab(tab.id as TabType)}
              >
                <tab.icon size={16} />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-white/20' : 'bg-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="搜索模板名称、描述或标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-80 bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
              />
            </div>
            <button
              className={`p-2.5 rounded-xl border transition-all ${
                showFilters
                  ? 'bg-primary-500/20 border-primary-500/30 text-primary-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
              onClick={() => setShowFilters(!showFilters)}
              title="筛选"
            >
              <Filter size={18} />
            </button>
            <button
              className={`p-2.5 rounded-xl border transition-all ${
                viewMode === 'grid'
                  ? 'bg-primary-500/20 border-primary-500/30 text-primary-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
              onClick={() => setViewMode('grid')}
              title="网格视图"
            >
              <Grid size={18} />
            </button>
            <button
              className={`p-2.5 rounded-xl border transition-all ${
                viewMode === 'list'
                  ? 'bg-primary-500/20 border-primary-500/30 text-primary-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
              onClick={() => setViewMode('list')}
              title="列表视图"
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mb-6 p-5 bg-slate-800/50 rounded-2xl border border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal size={18} className="text-primary-400" />
              <span className="text-white font-medium">筛选条件</span>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-sm text-slate-400 mb-2">分类</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      selectedCategory === 'all'
                        ? 'bg-primary-500 text-white'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                    onClick={() => setSelectedCategory('all')}
                  >
                    全部
                  </button>
                  {templateCategories.map((cat) => {
                    const categoryColor = categoryColors[cat.id] || categoryColors.custom;
                    return (
                      <button
                        key={cat.id}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          selectedCategory === cat.id
                            ? `bg-gradient-to-r ${categoryColor} text-white`
                            : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`}
                        onClick={() => setSelectedCategory(cat.id as TemplateCategory)}
                      >
                        {cat.name} ({cat.count})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">难度</label>
                <div className="flex gap-2">
                  {[
                    { id: 'all', label: '全部' },
                    { id: 'beginner', label: '入门' },
                    { id: 'intermediate', label: '中级' },
                    { id: 'advanced', label: '高级' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        selectedDifficulty === d.id
                          ? 'bg-primary-500 text-white'
                          : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`}
                      onClick={() => setSelectedDifficulty(d.id)}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">排序</label>
                <div className="flex gap-2">
                  {[
                    { id: 'popular', label: '综合热度' },
                    { id: 'latest', label: '最新更新' },
                    { id: 'usage', label: '使用次数' },
                    { id: 'name', label: '名称排序' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        sortBy === s.id
                          ? 'bg-primary-500 text-white'
                          : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`}
                      onClick={() => setSortBy(s.id as SortType)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'all' && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-primary-400" />
              热门分类
            </h2>
            <div className="grid grid-cols-5 gap-4">
              {templateCategories.slice(0, 5).map((cat) => {
                const categoryColor = categoryColors[cat.id] || categoryColors.custom;
                return (
                  <button
                    key={cat.id}
                    className={`p-5 rounded-2xl bg-gradient-to-br ${categoryColor} text-white text-left transition-transform hover:scale-[1.02]`}
                    onClick={() => {
                      setActiveTab('all');
                      setSelectedCategory(cat.id as TemplateCategory);
                    }}
                  >
                    <p className="text-lg font-bold">{cat.name}</p>
                    <p className="text-sm opacity-80 mt-1">{cat.count} 个模板</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'popular' && popularTemplates.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-amber-400" />
              热门模板 TOP 5
            </h2>
            <div className="grid grid-cols-5 gap-4">
              {popularTemplates.slice(0, 5).map((template, idx) => {
                const categoryColor = categoryColors[template.category] || categoryColors.custom;
                return (
                  <button
                    key={template.id}
                    className="p-5 rounded-2xl bg-slate-800 border border-slate-700 hover:border-slate-600 text-left transition-all group"
                    onClick={() => handleView({ ...template, isFavorited: favoriteIds.includes(template.id) })}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className={`text-2xl font-bold bg-gradient-to-r ${categoryColor} bg-clip-text text-transparent`}>
                        #{idx + 1}
                      </span>
                      <span className="text-xs text-slate-500">
                        {template.usageCount.toLocaleString()} 使用
                      </span>
                    </div>
                    <p className="text-white font-medium group-hover:text-primary-400 transition-colors line-clamp-2">
                      {template.name}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            {activeTab === 'all' && '全部模板'}
            {activeTab === 'builtIn' && '官方模板'}
            {activeTab === 'my' && '我的模板'}
            {activeTab === 'favorites' && '我的收藏'}
            {activeTab === 'popular' && '热门排行'}
            <span className="text-sm font-normal text-slate-500 ml-2">
              共 {templatesWithFavorite.length} 个结果
            </span>
          </h2>

          {templatesWithFavorite.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Search size={32} className="text-slate-600" />
              </div>
              <p className="text-slate-400 mb-2">没有找到匹配的模板</p>
              <p className="text-sm text-slate-500">
                尝试调整筛选条件或搜索关键词
              </p>
            </div>
          ) : (
            <div className={`grid gap-5 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1'
            }`}>
              {templatesWithFavorite.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onFavorite={handleFavorite}
                  onShare={handleShare}
                  onUse={handleUse}
                  onView={handleView}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {detailModal.template && (
        <TemplateDetailModal
          template={detailModal.template}
          isOpen={detailModal.isOpen}
          onClose={() => setDetailModal({ isOpen: false, template: null })}
          onFavorite={handleFavorite}
          onShare={(template) => {
            setDetailModal({ isOpen: false, template: null });
            handleShare(template);
          }}
          onUse={handleUse}
        />
      )}

      <ShareTemplateModal
        template={shareModal.template}
        isOpen={shareModal.isOpen}
        onClose={() => setShareModal({ isOpen: false, template: null })}
        onShare={shareTemplate}
      />
    </div>
  );
}
