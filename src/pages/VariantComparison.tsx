import { useState, useEffect } from 'react';
import {
  GitCompare, Filter, Search, Eye, Download, Plus, AlertTriangle,
  ChevronDown, ChevronRight, Database, BookOpen, Info, X
} from 'lucide-react';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import type { Variant, VariantType, VariantEffect } from '@shared/types';

interface ComparisonResult {
  key: string;
  variant: Variant;
  sharedBy: string[];
  sampleCount: number;
  isShared: boolean;
  isUnique: boolean;
}

const variantTypeColors: Record<VariantType, string> = {
  SNP: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  INDEL: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  INSERTION: 'bg-green-500/20 text-green-400 border-green-500/30',
  DELETION: 'bg-red-500/20 text-red-400 border-red-500/30',
  CNV: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  TRANSLOCATION: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
};

const effectColors: Record<VariantEffect, string> = {
  synonymous: 'bg-slate-500/20 text-slate-400',
  missense: 'bg-amber-500/20 text-amber-400',
  nonsense: 'bg-red-500/20 text-red-400',
  frameshift: 'bg-rose-500/20 text-rose-400',
  splice_site: 'bg-orange-500/20 text-orange-400',
  intronic: 'bg-blue-500/20 text-blue-400',
  intergenic: 'bg-slate-500/20 text-slate-400',
};

const clinicalSigColors: Record<string, string> = {
  pathogenic: 'bg-red-500/20 text-red-400',
  likely_pathogenic: 'bg-orange-500/20 text-orange-400',
  uncertain: 'bg-amber-500/20 text-amber-400',
  likely_benign: 'bg-blue-500/20 text-blue-400',
  benign: 'bg-green-500/20 text-green-400',
};

export default function VariantComparison() {
  const { samples, variants, selectedSampleIds, setSelectedSampleIds, projects, batches } = useAnalysisStore();
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterEffect, setFilterEffect] = useState<string>('');
  const [filterClinical, setFilterClinical] = useState<string>('');
  const [showSharedOnly, setShowSharedOnly] = useState(false);
  const [showUniqueOnly, setShowUniqueOnly] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([]);
  const [loading, setLoading] = useState(false);

  const availableSamples = selectedBatchId
    ? samples.filter(s => s.batchId === selectedBatchId)
    : selectedProjectId
    ? samples.filter(s => s.projectId === selectedProjectId)
    : samples;

  const filteredBatches = selectedProjectId
    ? batches.filter(b => b.projectId === selectedProjectId)
    : batches;

  useEffect(() => {
    if (selectedSampleIds.length < 2) {
      setComparisonResults([]);
      return;
    }

    setLoading(true);
    const fetchComparison = async () => {
      try {
        const params = new URLSearchParams();
        selectedSampleIds.forEach(id => params.append('sampleIds', id));
        const res = await fetch(`/api/variants/compare?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setComparisonResults(data.data.items);
        }
      } catch (error) {
        const variantMap = new Map<string, { variant: Variant; samples: string[] }>();

        selectedSampleIds.forEach(sampleId => {
          const sampleVariants = variants.filter(v => v.sampleId === sampleId);
          sampleVariants.forEach(v => {
            const key = `${v.chromosome}-${v.position}-${v.ref}-${v.alt}`;
            const existing = variantMap.get(key);
            if (existing) {
              existing.samples.push(sampleId);
            } else {
              variantMap.set(key, { variant: v, samples: [sampleId] });
            }
          });
        });

        const results: ComparisonResult[] = Array.from(variantMap.entries()).map(([key, data]) => ({
          key,
          variant: data.variant,
          sharedBy: data.samples,
          sampleCount: data.samples.length,
          isShared: data.samples.length === selectedSampleIds.length,
          isUnique: data.samples.length === 1,
        }));
        setComparisonResults(results);
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [selectedSampleIds, variants]);

  const filteredResults = comparisonResults.filter(result => {
    const v = result.variant;
    if (searchText) {
      const search = searchText.toLowerCase();
      if (!v.gene?.toLowerCase().includes(search) &&
          !v.chromosome.toLowerCase().includes(search) &&
          !String(v.position).includes(search) &&
          !v.proteinChange?.toLowerCase().includes(search)) {
        return false;
      }
    }
    if (filterType && v.type !== filterType) return false;
    if (filterEffect && v.effect !== filterEffect) return false;
    if (filterClinical && v.clinicalSignificance !== filterClinical) return false;
    if (showSharedOnly && !result.isShared) return false;
    if (showUniqueOnly && !result.isUnique) return false;
    return true;
  });

  const getSampleName = (sampleId: string) => samples.find(s => s.id === sampleId)?.name || sampleId;

  const stats = {
    total: comparisonResults.length,
    shared: comparisonResults.filter(r => r.isShared).length,
    unique: comparisonResults.filter(r => r.isUnique).length,
    pathogenic: comparisonResults.filter(r => r.variant.clinicalSignificance === 'pathogenic').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">变异位点横向比对</h1>
          <p className="text-slate-400">跨样本比较变异位点，识别共有和特有变异</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary flex items-center gap-2">
            <Download size={16} />
            导出结果
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-white">{stats.total}</p>
          <p className="text-sm text-slate-400">总变异位点</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-primary-400">{stats.shared}</p>
          <p className="text-sm text-slate-400">共有变异</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-accent-400">{stats.unique}</p>
          <p className="text-sm text-slate-400">特有变异</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-red-400">{stats.pathogenic}</p>
          <p className="text-sm text-slate-400">致病性</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3 space-y-6">
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-white mb-4">选择样本 <span className="text-sm font-normal text-slate-400">(至少2个)</span></h2>

            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">项目</label>
                <select
                  className="select-field text-sm"
                  value={selectedProjectId}
                  onChange={(e) => { setSelectedProjectId(e.target.value); setSelectedBatchId(''); setSelectedSampleIds([]); }}
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
                  className="select-field text-sm"
                  value={selectedBatchId}
                  onChange={(e) => { setSelectedBatchId(e.target.value); setSelectedSampleIds([]); }}
                >
                  <option value="">全部批次</option>
                  {filteredBatches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {availableSamples.slice(0, 20).map((sample) => (
                <label
                  key={sample.id}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
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
                    <p className="text-xs text-slate-500">{variants.filter(v => v.sampleId === sample.id).length} 变异</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-white mb-4">已选样本</h3>
            {selectedSampleIds.length === 0 ? (
              <p className="text-sm text-slate-500">请至少选择2个样本进行比较</p>
            ) : (
              <div className="space-y-2">
                {selectedSampleIds.map(id => (
                  <div key={id} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg">
                    <span className="text-sm text-white flex-1">{getSampleName(id)}</span>
                    <button
                      onClick={() => setSelectedSampleIds(selectedSampleIds.filter(s => s !== id))}
                      className="p-1 text-slate-500 hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="col-span-9 space-y-6">
          <div className="card p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  placeholder="搜索基因、位置、蛋白变化..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
              <button
                className={`btn-secondary text-sm flex items-center gap-2 ${showFilters ? 'ring-2 ring-primary-500/50' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={14} />
                筛选
                {showFilters ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showSharedOnly}
                    onChange={(e) => { setShowSharedOnly(e.target.checked); if (e.target.checked) setShowUniqueOnly(false); }}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-primary-500"
                  />
                  <span className="text-slate-400">仅共有</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showUniqueOnly}
                    onChange={(e) => { setShowUniqueOnly(e.target.checked); if (e.target.checked) setShowSharedOnly(false); }}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-accent-500"
                  />
                  <span className="text-slate-400">仅特有</span>
                </label>
              </div>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-2">变异类型</label>
                  <select
                    className="select-field text-sm"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="">全部类型</option>
                    <option value="SNP">SNP</option>
                    <option value="INDEL">INDEL</option>
                    <option value="INSERTION">插入</option>
                    <option value="DELETION">缺失</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">变异影响</label>
                  <select
                    className="select-field text-sm"
                    value={filterEffect}
                    onChange={(e) => setFilterEffect(e.target.value)}
                  >
                    <option value="">全部影响</option>
                    <option value="missense">错义突变</option>
                    <option value="nonsense">无义突变</option>
                    <option value="frameshift">移码突变</option>
                    <option value="synonymous">同义突变</option>
                    <option value="splice_site">剪接位点</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">临床意义</label>
                  <select
                    className="select-field text-sm"
                    value={filterClinical}
                    onChange={(e) => setFilterClinical(e.target.value)}
                  >
                    <option value="">全部</option>
                    <option value="pathogenic">致病性</option>
                    <option value="likely_pathogenic">可能致病性</option>
                    <option value="uncertain">意义未明</option>
                    <option value="likely_benign">可能良性</option>
                    <option value="benign">良性</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {selectedSampleIds.length < 2 ? (
            <div className="card p-16 text-center">
              <GitCompare className="mx-auto text-slate-600 mb-4" size={64} />
              <p className="text-lg text-slate-400 mb-2">请选择至少2个样本进行比较</p>
              <p className="text-sm text-slate-500">从左侧列表选择样本，系统将自动比对它们的变异位点</p>
            </div>
          ) : loading ? (
            <div className="card p-16 text-center">
              <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-400">正在进行变异位点比对...</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  找到 <span className="text-white font-medium">{filteredResults.length}</span> 个变异位点
                </span>
              </div>
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="data-table">
                  <thead className="sticky top-0">
                    <tr>
                      <th className="w-16">
                        <span className="flex items-center gap-1">
                          <AlertTriangle size={14} className="text-red-400" />
                        </span>
                      </th>
                      <th>基因</th>
                      <th>位置</th>
                      <th>变化</th>
                      <th>类型</th>
                      <th>影响</th>
                      <th>蛋白改变</th>
                      <th>质量</th>
                      <th>深度</th>
                      <th>AF</th>
                      <th>共享样本</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((result) => (
                      <tr
                        key={result.key}
                        className={`cursor-pointer ${result.isShared ? 'bg-primary-500/5' : result.isUnique ? 'bg-accent-500/5' : ''}`}
                        onClick={() => setSelectedVariant(result.variant)}
                      >
                        <td>
                          {result.variant.clinicalSignificance === 'pathogenic' && (
                            <AlertTriangle size={16} className="text-red-400" />
                          )}
                        </td>
                        <td className="font-mono text-sm text-white">{result.variant.gene || '-'}</td>
                        <td className="text-sm text-slate-300">
                          {result.variant.chromosome}:{result.variant.position.toLocaleString()}
                        </td>
                        <td className="font-mono text-xs">
                          <span className="text-green-400">{result.variant.ref}</span>
                          <span className="text-slate-500 mx-1">→</span>
                          <span className="text-red-400">{result.variant.alt}</span>
                        </td>
                        <td>
                          <span className={`badge text-xs ${variantTypeColors[result.variant.type]}`}>
                            {result.variant.type}
                          </span>
                        </td>
                        <td>
                          <span className={`badge text-xs ${effectColors[result.variant.effect]}`}>
                            {result.variant.effect}
                          </span>
                        </td>
                        <td className="text-xs text-slate-300 font-mono">{result.variant.proteinChange || '-'}</td>
                        <td className="text-sm text-slate-300">{result.variant.quality.toFixed(0)}</td>
                        <td className="text-sm text-slate-300">{result.variant.depth}</td>
                        <td className="text-sm text-slate-300">{(result.variant.alleleFrequency * 100).toFixed(1)}%</td>
                        <td>
                          <div className="flex items-center gap-1">
                            {result.isShared ? (
                              <span className="badge bg-primary-500/20 text-primary-400 text-xs">全部共有</span>
                            ) : result.isUnique ? (
                              <span className="badge bg-accent-500/20 text-accent-400 text-xs">特有</span>
                            ) : (
                              <span className="text-xs text-slate-400">{result.sampleCount}/{selectedSampleIds.length}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <button
                            className="p-1.5 text-slate-400 hover:text-primary-400 transition-colors"
                            onClick={(e) => { e.stopPropagation(); setSelectedVariant(result.variant); }}
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedVariant && (
        <VariantDetailModal
          variant={selectedVariant}
          onClose={() => setSelectedVariant(null)}
          sampleNames={selectedVariant.sampleId ? [getSampleName(selectedVariant.sampleId)] : []}
        />
      )}
    </div>
  );
}

interface VariantDetailModalProps {
  variant: Variant;
  onClose: () => void;
  sampleNames: string[];
}

function VariantDetailModal({ variant, onClose, sampleNames }: VariantDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-8">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">变异位点详情</h2>
            <p className="text-sm text-slate-400 mt-1">
              {variant.chromosome}:{variant.position.toLocaleString()} {variant.ref} → {variant.alt}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="card p-4">
              <p className="text-xs text-slate-500 mb-1">基因</p>
              <p className="text-lg font-semibold text-white font-mono">{variant.gene || '-'}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-slate-500 mb-1">转录本</p>
              <p className="text-sm font-mono text-white truncate">{variant.transcript || '-'}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-slate-500 mb-1">蛋白改变</p>
              <p className="text-lg font-semibold text-white font-mono">{variant.proteinChange || '-'}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="card p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">变异类型</p>
              <span className={`badge ${variantTypeColors[variant.type]}`}>{variant.type}</span>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">功能影响</p>
              <span className={`badge ${effectColors[variant.effect]}`}>{variant.effect}</span>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">临床意义</p>
              {variant.clinicalSignificance ? (
                <span className={`badge ${clinicalSigColors[variant.clinicalSignificance]}`}>
                  {variant.clinicalSignificance.replace('_', ' ')}
                </span>
              ) : (
                <span className="text-slate-500">-</span>
              )}
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">质量</p>
              <p className="text-xl font-bold text-white">{variant.quality.toFixed(0)}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4">
              <p className="text-xs text-slate-500 mb-1">测序深度</p>
              <p className="text-lg font-semibold text-white">{variant.depth}x</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-slate-500 mb-1">等位基因频率</p>
              <p className="text-lg font-semibold text-white">{(variant.alleleFrequency * 100).toFixed(2)}%</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-slate-500 mb-1">过滤状态</p>
              <div className="flex items-center gap-1 flex-wrap">
                {variant.filters.map((f, i) => (
                  <span key={i} className={`badge text-xs ${f === 'PASS' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {(variant.dbSnpId || variant.cosmidId) && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Database size={16} className="text-primary-400" />
                数据库注释
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {variant.dbSnpId && (
                  <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Database size={20} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">dbSNP</p>
                      <p className="font-mono text-white">{variant.dbSnpId}</p>
                    </div>
                  </div>
                )}
                {variant.cosmidId && (
                  <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                      <Database size={20} className="text-rose-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">COSMIC</p>
                      <p className="font-mono text-white">{variant.cosmidId}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {variant.annotations.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <BookOpen size={16} className="text-primary-400" />
                详细注释
              </h3>
              <div className="space-y-3">
                {variant.annotations.map((ann, i) => (
                  <div key={i} className="p-4 bg-slate-800/50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{ann.source}</span>
                        <span className="badge bg-slate-700 text-slate-400 text-xs">{ann.database}</span>
                      </div>
                      {ann.clinicalRelevance && (
                        <span className={`badge text-xs ${
                          ann.clinicalRelevance === 'high' ? 'bg-red-500/20 text-red-400' :
                          ann.clinicalRelevance === 'moderate' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-slate-600/20 text-slate-400'
                        }`}>
                          {ann.clinicalRelevance}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-300">{ann.description}</p>
                    {ann.references && ann.references.length > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <Info size={12} className="text-slate-500" />
                        <span className="text-xs text-slate-500">参考文献: {ann.references.join(', ')}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-700 flex items-center justify-end gap-3">
          <button className="btn-secondary" onClick={onClose}>关闭</button>
          <button className="btn-primary flex items-center gap-2">
            <Download size={16} />
            导出详情
          </button>
        </div>
      </div>
    </div>
  );
}
