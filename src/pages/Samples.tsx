import { useState } from 'react';
import {
  TestTube, Search, Filter, Eye, Edit, Trash2, ChevronDown, ChevronUp,
  Plus, Download, Upload, X, Save, FileText, Play, Zap
} from 'lucide-react';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import DnaSequenceViewer from '@/components/DnaSequenceViewer';
import type { Sample } from '@shared/types';

export default function Samples() {
  const {
    samples, batches, projects,
    selectedSampleIds, setSelectedSampleIds,
    createSample, updateSample, deleteSample,
    loading
  } = useAnalysisStore();
  const [searchText, setSearchText] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [expandedSample, setExpandedSample] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBatchAnalyzeModal, setShowBatchAnalyzeModal] = useState(false);
  const [detailSample, setDetailSample] = useState<Sample | null>(null);
  const [editingSample, setEditingSample] = useState<Sample | null>(null);
  const [newSampleForm, setNewSampleForm] = useState({
    name: '',
    projectId: '',
    batchId: '',
    description: '',
    organism: 'Homo sapiens',
    sequenceType: 'dna' as 'dna' | 'rna' | 'protein',
  });

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

  const handleCreateSample = async () => {
    if (!newSampleForm.name.trim()) {
      alert('请输入样本名称');
      return;
    }
    if (!newSampleForm.projectId) {
      alert('请选择所属项目');
      return;
    }
    await createSample(newSampleForm);
    setShowCreateModal(false);
    setNewSampleForm({ name: '', projectId: '', batchId: '', description: '', organism: 'Homo sapiens', sequenceType: 'dna' });
    alert('样本创建成功！');
  };

  const handleExport = () => {
    const csvContent = 'data:text/csv;charset=utf-8,'
      + encodeURIComponent(filteredSamples.map(s => `${s.name},${s.organism},${s.sequenceType},${getProjectName(s.projectId)},${getBatchName(s.batchId)},${s.sequence.length},${s.createdAt}`).join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `samples_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert(`已导出 ${filteredSamples.length} 个样本`);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.tsv,.fasta,.fastq';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        alert(`已选择文件: ${file.name}\n此功能将上传并解析样本文件`);
      }
    };
    input.click();
  };

  const handleViewDetail = (sample: Sample) => {
    setDetailSample(sample);
    setShowDetailModal(true);
  };

  const handleEditSample = (sample: Sample) => {
    setEditingSample(sample);
    setNewSampleForm({
      name: sample.name,
      projectId: sample.projectId,
      batchId: sample.batchId || '',
      description: sample.description || '',
      organism: sample.organism,
      sequenceType: sample.sequenceType,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingSample) return;
    if (!newSampleForm.name.trim()) {
      alert('请输入样本名称');
      return;
    }
    await updateSample(editingSample.id, {
      name: newSampleForm.name,
      description: newSampleForm.description,
      organism: newSampleForm.organism,
      sequenceType: newSampleForm.sequenceType,
      projectId: newSampleForm.projectId,
      batchId: newSampleForm.batchId || undefined,
    });
    setShowEditModal(false);
    setEditingSample(null);
    setNewSampleForm({ name: '', projectId: '', batchId: '', description: '', organism: 'Homo sapiens', sequenceType: 'dna' });
    alert('样本更新成功！');
  };

  const handleDeleteSample = async (sample: Sample) => {
    if (!confirm(`确定要删除样本 "${sample.name}" 吗？`)) {
      return;
    }
    await deleteSample(sample.id);
    if (detailSample?.id === sample.id) {
      setShowDetailModal(false);
      setDetailSample(null);
    }
    alert(`样本 "${sample.name}" 已删除`);
  };

  const handleBatchAnalyze = () => {
    if (selectedSampleIds.length === 0) {
      alert('请先选择要分析的样本');
      return;
    }
    setShowBatchAnalyzeModal(true);
  };

  const startBatchAnalyze = async () => {
    if (selectedSampleIds.length === 0) return;
    setShowBatchAnalyzeModal(false);
    alert(`已开始对 ${selectedSampleIds.length} 个样本进行批量分析`);
  };

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
                className="text-sm text-white bg-primary-600 hover:bg-primary-500 px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
                onClick={handleBatchAnalyze}
              >
                <Zap size={14} />
                批量分析
              </button>
            </div>
          )}
          <button className="btn-secondary flex items-center gap-2" onClick={handleImport}>
            <Upload size={16} />
            导入样本
          </button>
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreateModal(true)}>
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
          <button className="btn-secondary flex items-center gap-2" onClick={handleExport}>
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
              onViewDetail={handleViewDetail}
              onEdit={handleEditSample}
              onDelete={handleDeleteSample}
              projectName={getProjectName(sample.projectId)}
              batchName={getBatchName(sample.batchId)}
            />
          ))}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">新建样本</h2>
              <button
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                onClick={() => setShowCreateModal(false)}
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">样本名称 *</label>
                  <input
                    type="text"
                    className="input-field w-full"
                    placeholder="例如 sample_010"
                    value={newSampleForm.name}
                    onChange={(e) => setNewSampleForm({ ...newSampleForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">所属项目 *</label>
                  <select
                    className="select-field w-full"
                    value={newSampleForm.projectId}
                    onChange={(e) => setNewSampleForm({ ...newSampleForm, projectId: e.target.value })}
                  >
                    <option value="">请选择项目</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">所属批次</label>
                <select
                  className="select-field w-full"
                  value={newSampleForm.batchId}
                  onChange={(e) => setNewSampleForm({ ...newSampleForm, batchId: e.target.value })}
                >
                  <option value="">请选择批次（可选）</option>
                  {batches
                    .filter(b => !newSampleForm.projectId || b.projectId === newSampleForm.projectId)
                    .map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">物种</label>
                  <input
                    type="text"
                    className="input-field w-full"
                    placeholder="例如 Homo sapiens"
                    value={newSampleForm.organism}
                    onChange={(e) => setNewSampleForm({ ...newSampleForm, organism: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">序列类型</label>
                  <select
                    className="select-field w-full"
                    value={newSampleForm.sequenceType}
                    onChange={(e) => setNewSampleForm({ ...newSampleForm, sequenceType: e.target.value as 'dna' | 'rna' | 'protein' })}
                  >
                    <option value="dna">DNA</option>
                    <option value="rna">RNA</option>
                    <option value="protein">Protein</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">样本描述</label>
                <textarea
                  className="input-field w-full min-h-[80px] resize-none"
                  placeholder="描述样本来源、处理方式等..."
                  value={newSampleForm.description}
                  onChange={(e) => setNewSampleForm({ ...newSampleForm, description: e.target.value })}
                />
              </div>
            </div>
            <div className="p-5 border-t border-slate-700 flex justify-end gap-3">
              <button
                className="btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                取消
              </button>
              <button
                className="btn-primary flex items-center gap-2"
                onClick={handleCreateSample}
                disabled={loading}
              >
                <Save size={16} />
                创建样本
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingSample && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">编辑样本</h2>
              <button
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                onClick={() => setShowEditModal(false)}
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">样本名称 *</label>
                  <input
                    type="text"
                    className="input-field w-full"
                    placeholder="例如 sample_010"
                    value={newSampleForm.name}
                    onChange={(e) => setNewSampleForm({ ...newSampleForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">所属项目 *</label>
                  <select
                    className="select-field w-full"
                    value={newSampleForm.projectId}
                    onChange={(e) => setNewSampleForm({ ...newSampleForm, projectId: e.target.value })}
                  >
                    <option value="">请选择项目</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">所属批次</label>
                <select
                  className="select-field w-full"
                  value={newSampleForm.batchId}
                  onChange={(e) => setNewSampleForm({ ...newSampleForm, batchId: e.target.value })}
                >
                  <option value="">请选择批次（可选）</option>
                  {batches
                    .filter(b => !newSampleForm.projectId || b.projectId === newSampleForm.projectId)
                    .map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">物种</label>
                  <input
                    type="text"
                    className="input-field w-full"
                    placeholder="例如 Homo sapiens"
                    value={newSampleForm.organism}
                    onChange={(e) => setNewSampleForm({ ...newSampleForm, organism: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">序列类型</label>
                  <select
                    className="select-field w-full"
                    value={newSampleForm.sequenceType}
                    onChange={(e) => setNewSampleForm({ ...newSampleForm, sequenceType: e.target.value as 'dna' | 'rna' | 'protein' })}
                  >
                    <option value="dna">DNA</option>
                    <option value="rna">RNA</option>
                    <option value="protein">Protein</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">样本描述</label>
                <textarea
                  className="input-field w-full min-h-[80px] resize-none"
                  placeholder="描述样本来源、处理方式等..."
                  value={newSampleForm.description}
                  onChange={(e) => setNewSampleForm({ ...newSampleForm, description: e.target.value })}
                />
              </div>
            </div>
            <div className="p-5 border-t border-slate-700 flex justify-end gap-3">
              <button
                className="btn-secondary"
                onClick={() => setShowEditModal(false)}
              >
                取消
              </button>
              <button
                className="btn-primary flex items-center gap-2"
                onClick={handleSaveEdit}
                disabled={loading}
              >
                <Save size={16} />
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}

      {showBatchAnalyzeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">批量分析</h2>
              <button
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                onClick={() => setShowBatchAnalyzeModal(false)}
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/30">
                <p className="text-sm text-primary-400">
                  已选择 <span className="font-bold">{selectedSampleIds.length}</span> 个样本进行批量分析
                </p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">分析工具</label>
                <select className="select-field w-full" defaultValue="bwa">
                  <option value="bwa">BWA - Burrows-Wheeler Aligner</option>
                  <option value="blast">BLAST - 基础局部比对搜索工具</option>
                  <option value="bowtie2">Bowtie 2 - 快速短序列比对</option>
                  <option value="minimap2">Minimap2 - 长序列比对</option>
                  <option value="mafft">MAFFT - 多序列比对</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">线程数</label>
                  <select className="select-field w-full" defaultValue="4">
                    <option value="2">2 线程</option>
                    <option value="4">4 线程</option>
                    <option value="8">8 线程</option>
                    <option value="16">16 线程</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">输出格式</label>
                  <select className="select-field w-full" defaultValue="bam">
                    <option value="sam">SAM</option>
                    <option value="bam">BAM</option>
                    <option value="cram">CRAM</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">分析名称</label>
                <input
                  type="text"
                  className="input-field w-full"
                  placeholder="批量分析 - 样本组A"
                  defaultValue={`批量分析_${new Date().toLocaleDateString('zh-CN')}`}
                />
              </div>
            </div>
            <div className="p-5 border-t border-slate-700 flex justify-end gap-3">
              <button
                className="btn-secondary"
                onClick={() => setShowBatchAnalyzeModal(false)}
              >
                取消
              </button>
              <button
                className="btn-primary flex items-center gap-2"
                onClick={startBatchAnalyze}
              >
                <Play size={16} />
                开始分析
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && detailSample && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
                  <TestTube className="text-blue-400" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white font-mono">{detailSample.name}</h2>
                  <p className="text-sm text-slate-400">{detailSample.organism} · {detailSample.sequenceType.toUpperCase()}</p>
                </div>
              </div>
              <button
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                onClick={() => setShowDetailModal(false)}
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-700/30">
                  <p className="text-xs text-slate-500 mb-1">样本ID</p>
                  <p className="text-white font-mono text-sm">{detailSample.id}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-700/30">
                  <p className="text-xs text-slate-500 mb-1">创建时间</p>
                  <p className="text-white text-sm">{new Date(detailSample.createdAt).toLocaleString('zh-CN')}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-700/30">
                  <p className="text-xs text-slate-500 mb-1">所属项目</p>
                  <p className="text-white text-sm">{getProjectName(detailSample.projectId)}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-700/30">
                  <p className="text-xs text-slate-500 mb-1">所属批次</p>
                  <p className="text-white text-sm">{getBatchName(detailSample.batchId)}</p>
                </div>
              </div>

              {detailSample.description && (
                <div className="p-4 rounded-xl bg-slate-700/30">
                  <p className="text-xs text-slate-500 mb-2">样本描述</p>
                  <p className="text-slate-300 text-sm">{detailSample.description}</p>
                </div>
              )}

              <div className="p-4 rounded-xl bg-slate-700/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-500">元数据</p>
                </div>
                <div className="space-y-2">
                  {Object.entries(detailSample.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-slate-400">{key}</span>
                      <span className="text-white">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-700/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-500">序列信息</p>
                  <span className="text-xs text-slate-400">{detailSample.sequence.length} bp</span>
                </div>
                <div className="bg-slate-800 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <pre className="text-xs text-slate-400 font-mono break-all whitespace-pre-wrap">
                    {detailSample.sequence.slice(0, 1000)}...
                  </pre>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-slate-700 flex justify-end gap-3">
              <button
                className="btn-secondary flex items-center gap-2"
                onClick={() => setShowDetailModal(false)}
              >
                关闭
              </button>
              <button
                className="btn-primary flex items-center gap-2"
                onClick={() => {
                  const csvContent = `data:text/csv;charset=utf-8,${encodeURIComponent(JSON.stringify(detailSample, null, 2))}`;
                  const link = document.createElement('a');
                  link.setAttribute('href', csvContent);
                  link.setAttribute('download', `${detailSample.name}_details.json`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                <FileText size={16} />
                导出详情
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SampleRowProps {
  sample: Sample;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
  onViewDetail: (sample: Sample) => void;
  onEdit: (sample: Sample) => void;
  onDelete: (sample: Sample) => void;
  projectName: string;
  batchName: string;
}

function SampleRow({ sample, isSelected, isExpanded, onSelect, onToggleExpand, onViewDetail, onEdit, onDelete, projectName, batchName }: SampleRowProps) {
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
          <button
            className="p-2 text-slate-400 hover:text-primary-400 transition-colors"
            title="查看样本详情"
            onClick={() => onViewDetail(sample)}
          >
            <Eye size={18} />
          </button>
          <button
            className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
            title="编辑样本"
            onClick={() => onEdit(sample)}
          >
            <Edit size={18} />
          </button>
          <button
            className="p-2 text-slate-400 hover:text-red-400 transition-colors"
            title="删除样本"
            onClick={() => onDelete(sample)}
          >
            <Trash2 size={18} />
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
                <button
                  className="w-full btn-secondary text-sm"
                  onClick={() => onViewDetail(sample)}
                >
                  查看详细信息
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
