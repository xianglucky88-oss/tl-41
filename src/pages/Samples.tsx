import { useState } from 'react';
import { TestTube, Search, Filter, Eye, ChevronDown, ChevronUp, Plus, Download, Upload } from 'lucide-react';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import DnaSequenceViewer from '@/components/DnaSequenceViewer';
import type { Sample } from '@shared/types';

export default function Samples() {
  const { samples, batches, projects, selectedSampleIds, setSelectedSampleIds } = useAnalysisStore();
  const [searchText, setSearchText] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [expandedSample, setExpandedSample] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filteredSamples = samples.filter(sample => {
    if (searchText && !sample.name.toLowerCase().includes(searchText.toLowerCase())) return false;
    if (selectedProject && sample.projectId !== selectedProject) return false;
    if (selectedBatch && sample.batchId !== selectedBatch) return false;
    return true;
  });

  const filteredBatches = selectedProject
    ? batches.filter(b => b.projectId === selectedProject)
    : batches;

  const toggleSampleSelection = (sampleId: string) => {
    setSelectedSampleIds(
      selectedSampleIds.includes(sampleId)
        ? selectedSampleIds.filter(id => id !== sampleId)
        : [...selectedSampleIds, sampleId]
    );
  };

  const selectAll = () => {
    if (selectedSampleIds.length === filteredSamples.length) {
      setSelectedSampleIds([]);
    } else {
      setSelectedSampleIds(filteredSamples.map(s => s.id));
    }
  };

  const getProjectName = (projectId: string) => projects.find(p => p.id === projectId)?.name || '-';
  const getBatchName = (batchId: string) => batches.find(b => b.id === batchId)?.name || '-';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">样本管理</h1>
          <p className="text-slate-400">浏览和管理所有实验样本数据</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedSampleIds.length > 0 && (
            <div className="flex items-center gap-2 bg-primary-500/10 border border-primary-500/30 rounded-xl px-4 py-2">
              <span className="text-sm text-primary-400">已选择 {selectedSampleIds.length} 个样本</span>
              <button
                className="text-sm text-white bg-primary-600 hover:bg-primary-500 px-3 py-1 rounded-lg transition-colors"
                onClick={() => alert(`对 ${selectedSampleIds.length} 个样本启动分析`)}
              >
                批量分析
              </button>
            </div>
          )}
          <button className="btn-secondary flex items-center gap-2">
            <Upload size={16} />
            导入样本
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            新建样本
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input
              type="text"
              placeholder="搜索样本名称..."
              className="w-full pl-12 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <button
            className={`btn-secondary flex items-center gap-2 ${showFilters ? 'ring-2 ring-primary-500/50' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            筛选
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button className="btn-secondary flex items-center gap-2">
            <Download size={16} />
            导出
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">所属项目</label>
              <select
                className="select-field"
                value={selectedProject}
                onChange={(e) => { setSelectedProject(e.target.value); setSelectedBatch(''); }}
              >
                <option value="">全部项目</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">所属批次</label>
              <select
                className="select-field"
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
              >
                <option value="">全部批次</option>
                {filteredBatches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">序列类型</label>
              <select className="select-field">
                <option value="">全部类型</option>
                <option value="dna">DNA</option>
                <option value="rna">RNA</option>
                <option value="protein">Protein</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <span className="text-sm text-slate-400">
            共 <span className="text-white font-medium">{filteredSamples.length}</span> 个样本
          </span>
          <button
            onClick={selectAll}
            className="text-sm text-primary-400 hover:text-primary-300"
          >
            {selectedSampleIds.length === filteredSamples.length ? '取消全选' : '全选'}
          </button>
        </div>
        <div className="divide-y divide-slate-800">
          {filteredSamples.map((sample) => (
            <SampleRow
              key={sample.id}
              sample={sample}
              isSelected={selectedSampleIds.includes(sample.id)}
              isExpanded={expandedSample === sample.id}
              onSelect={() => toggleSampleSelection(sample.id)}
              onToggleExpand={() => setExpandedSample(expandedSample === sample.id ? null : sample.id)}
              projectName={getProjectName(sample.projectId)}
              batchName={getBatchName(sample.batchId)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface SampleRowProps {
  sample: Sample;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
  projectName: string;
  batchName: string;
}

function SampleRow({ sample, isSelected, isExpanded, onSelect, onToggleExpand, projectName, batchName }: SampleRowProps) {
  return (
    <div className={`transition-colors ${isSelected ? 'bg-primary-500/5' : ''}`}>
      <div className="p-4 flex items-center gap-4 hover:bg-slate-800/30">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-primary-500 focus:ring-primary-500"
        />
        <div
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center cursor-pointer"
          onClick={onToggleExpand}
        >
          <TestTube className="text-blue-400" size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <span className="font-mono font-medium text-white">{sample.name}</span>
            <span className="badge bg-slate-700/50 text-slate-400 text-xs">
              {sample.sequenceType.toUpperCase()}
            </span>
            <span className="text-xs text-slate-500">{sample.organism}</span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
            <span>项目: {projectName}</span>
            <span>批次: {batchName}</span>
            <span>序列长度: {sample.sequence.length.toLocaleString()} bp</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            {new Date(sample.createdAt).toLocaleDateString('zh-CN')}
          </span>
          <button
            onClick={onToggleExpand}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          <button className="p-2 text-slate-400 hover:text-primary-400 transition-colors">
            <Eye size={18} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-800/50">
          <div className="pt-4 grid grid-cols-4 gap-6">
            <div className="col-span-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-slate-300">序列预览</h4>
                <span className="text-xs text-slate-500">
                  {sample.sequence.length} bp
                </span>
              </div>
              <DnaSequenceViewer sequence={sample.sequence.slice(0, 500)} lineLength={100} />
              <p className="text-xs text-slate-500 mt-2">... 显示前500bp，点击查看完整序列</p>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-2">元数据</h4>
                <div className="space-y-2 text-sm">
                  {Object.entries(sample.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-slate-500">{key}</span>
                      <span className="text-slate-300">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-slate-700">
                <button className="w-full btn-secondary text-sm">查看详细信息</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
