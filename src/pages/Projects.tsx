import { useState } from 'react';
import { FlaskConical, Plus, ChevronRight, Calendar, User, Beaker, TestTube, Workflow, Eye, Edit, Trash2, Filter, X, Save } from 'lucide-react';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import StatusBadge from '@/components/StatusBadge';
import type { Project, Batch } from '@shared/types';

type TabType = 'projects' | 'batches';

export default function Projects() {
  const {
    projects, batches, samples,
    setCurrentProject, createProject, updateProject, deleteProject,
    loading
  } = useAnalysisStore();
  const [activeTab, setActiveTab] = useState<TabType>('projects');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newProjectForm, setNewProjectForm] = useState({
    name: '',
    description: '',
    organism: 'Homo sapiens',
    principalInvestigator: ''
  });
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPI, setFilterPI] = useState('');
  const [filterOrganism, setFilterOrganism] = useState('');

  const getProjectBatches = (projectId: string) => batches.filter(b => b.projectId === projectId);
  const getProjectSamples = (projectId: string) => samples.filter(s => s.projectId === projectId);

  const filteredProjects = projects.filter(p => {
    if (filterStatus && p.status !== filterStatus) return false;
    if (filterPI && p.principalInvestigator !== filterPI) return false;
    if (filterOrganism && p.organism !== filterOrganism) return false;
    return true;
  });

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setCurrentProject(project);
  };

  const handleCreateProject = async () => {
    if (!newProjectForm.name.trim()) {
      alert('请输入项目名称');
      return;
    }
    await createProject(newProjectForm);
    setShowCreateModal(false);
    setNewProjectForm({ name: '', description: '', organism: 'Homo sapiens', principalInvestigator: '' });
    alert('项目创建成功！');
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setNewProjectForm({
      name: project.name,
      description: project.description,
      organism: project.organism,
      principalInvestigator: project.principalInvestigator,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingProject) return;
    if (!newProjectForm.name.trim()) {
      alert('请输入项目名称');
      return;
    }
    await updateProject(editingProject.id, newProjectForm);
    setShowEditModal(false);
    setEditingProject(null);
    setNewProjectForm({ name: '', description: '', organism: 'Homo sapiens', principalInvestigator: '' });
    alert('项目更新成功！');
  };

  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`确定要删除项目 "${project.name}" 吗？\n删除后将同时移除相关的批次、样本和分析记录。`)) {
      return;
    }
    await deleteProject(project.id);
    if (selectedProject?.id === project.id) {
      setSelectedProject(null);
      setCurrentProject(null);
    }
    alert(`项目 "${project.name}" 已删除`);
  };

  const applyFilters = () => {
    setShowFilterModal(false);
  };

  const resetFilters = () => {
    setFilterStatus('');
    setFilterPI('');
    setFilterOrganism('');
    setShowFilterModal(false);
  };

  const handleExport = () => {
    const csvContent = 'data:text/csv;charset=utf-8,'
      + encodeURIComponent(projects.map(p => `${p.name},${p.organism},${p.principalInvestigator},${p.status},${p.createdAt}`).join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `projects_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert('项目数据已导出');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">项目与批次管理</h1>
          <p className="text-slate-400">管理您的研究项目、实验批次和样本数据</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary flex items-center gap-2" onClick={handleExport}>
            导出
          </button>
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} />
            新建项目
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
            activeTab === 'projects'
              ? 'bg-primary-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('projects')}
        >
          <div className="flex items-center gap-2">
            <FlaskConical size={18} />
            项目列表
          </div>
        </button>
        <button
          className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
            activeTab === 'batches'
              ? 'bg-primary-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('batches')}
        >
          <div className="flex items-center gap-2">
            <Beaker size={18} />
            批次列表
          </div>
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button className="btn-secondary flex items-center gap-2" onClick={() => setShowFilterModal(true)}>
            <Filter size={16} />
            筛选
          </button>
        </div>
      </div>

      {activeTab === 'projects' ? (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className={`card p-5 card-hover cursor-pointer ${
                  selectedProject?.id === project.id
                    ? 'border-primary-500/50 ring-1 ring-primary-500/30'
                    : ''
                }`}
                onClick={() => handleProjectClick(project)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                      <FlaskConical className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                      <p className="text-sm text-slate-400">{project.organism}</p>
                    </div>
                  </div>
                  <StatusBadge status={project.status} />
                </div>

                <p className="text-sm text-slate-300 mb-4 line-clamp-2">{project.description}</p>

                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                  <p className="text-2xl font-bold text-primary-400">{project.batchCount}</p>
                  <p className="text-xs text-slate-400">批次</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">{project.sampleCount}</p>
                  <p className="text-xs text-slate-400">样本</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-accent-400">{project.analysisCount}</p>
                  <p className="text-xs text-slate-400">分析</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Calendar size={14} />
                    {new Date(project.createdAt).toLocaleDateString('zh-CN')}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    <User size={14} />
                    {project.principalInvestigator}
                  </div>
                </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
                  <div className="flex items-center gap-2">
                    <button
                      className="p-2 text-slate-400 hover:text-primary-400 transition-colors"
                      title="查看项目"
                      onClick={(e) => { e.stopPropagation(); handleProjectClick(project); }}
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
                      title="编辑项目"
                      onClick={(e) => { e.stopPropagation(); handleEditProject(project); }}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                      title="删除项目"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <button
                    className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300"
                    onClick={(e) => { e.stopPropagation(); handleProjectClick(project); }}
                  >
                    查看详情 <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            {selectedProject ? (
              <>
                <div className="card p-5">
                  <h2 className="text-lg font-semibold text-white mb-4">{selectedProject.name}</h2>
                  <p className="text-sm text-slate-400 mb-6">{selectedProject.description}</p>

                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">负责人</span>
                      <span className="text-white">{selectedProject.principalInvestigator}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">物种</span>
                      <span className="text-white">{selectedProject.organism}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">创建时间</span>
                      <span className="text-white">
                        {new Date(selectedProject.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">更新时间</span>
                      <span className="text-white">
                        {new Date(selectedProject.updatedAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card p-5">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Beaker size={20} className="text-primary-400" />
                    相关批次
                  </h3>
                  <div className="space-y-3">
                    {getProjectBatches(selectedProject.id).map((batch) => (
                    <div key={batch.id} className="p-3 rounded-xl bg-slate-800/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white text-sm">{batch.name}</span>
                        <StatusBadge status={batch.status} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{batch.sampleCount} 样本</span>
                        <span>{new Date(batch.createdAt).toLocaleDateString('zh-CN')}</span>
                      </div>
                    </div>
                    ))}
                  </div>
                </div>

                <div className="card p-5">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <TestTube size={20} className="text-blue-400" />
                    样本预览
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {getProjectSamples(selectedProject.id).slice(0, 10).map((sample) => (
                      <div key={sample.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-slate-300">{sample.name}</span>
                          <span className="text-xs text-slate-500">{sample.organism}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="card p-8 text-center">
                <FlaskConical className="mx-auto text-slate-600 mb-4" size={48} />
                <p className="text-slate-500">选择一个项目查看详情</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
              <th>批次名称</th>
              <th>所属项目</th>
              <th>样本数量</th>
              <th>创建人</th>
              <th>创建时间</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
            </thead>
            <tbody>
              {batches.map((batch) => {
              const project = projects.find(p => p.id === batch.projectId);
              return (
                <tr key={batch.id}>
                  <td className="font-medium text-white">{batch.name}</td>
                  <td className="text-slate-400">{project?.name || '-'}</td>
                  <td className="text-slate-300">{batch.sampleCount}</td>
                  <td className="text-slate-300">{batch.createdBy}</td>
                  <td className="text-slate-400">
                    {new Date(batch.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td><StatusBadge status={batch.status} /></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        className="text-primary-400 hover:text-primary-300 text-sm"
                        onClick={() => alert(`查看批次: ${batch.name}`)}
                      >
                        查看
                      </button>
                      <button
                        className="text-slate-400 hover:text-white text-sm"
                        onClick={() => alert(`编辑批次: ${batch.name}`)}
                      >
                        编辑
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
          </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">新建研究项目</h2>
              <button
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                onClick={() => setShowCreateModal(false)}
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">项目名称 *</label>
                <input
                  type="text"
                  className="input-field w-full"
                  placeholder="请输入项目名称"
                  value={newProjectForm.name}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">项目描述</label>
                <textarea
                  className="input-field w-full min-h-[80px] resize-none"
                  placeholder="请输入项目描述"
                  value={newProjectForm.description}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">研究物种</label>
                  <input
                    type="text"
                    className="input-field w-full"
                    placeholder="例如 Homo sapiens"
                    value={newProjectForm.organism}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, organism: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">项目负责人</label>
                  <input
                    type="text"
                    className="input-field w-full"
                    placeholder="请输入负责人姓名"
                    value={newProjectForm.principalInvestigator}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, principalInvestigator: e.target.value })}
                  />
                </div>
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
                onClick={handleCreateProject}
                disabled={loading}
              >
                <Save size={16} />
                创建项目
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingProject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">编辑项目</h2>
              <button
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                onClick={() => setShowEditModal(false)}
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">项目名称 *</label>
                <input
                  type="text"
                  className="input-field w-full"
                  placeholder="请输入项目名称"
                  value={newProjectForm.name}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">项目描述</label>
                <textarea
                  className="input-field w-full min-h-[80px] resize-none"
                  placeholder="请输入项目描述"
                  value={newProjectForm.description}
                  onChange={(e) => setNewProjectForm({ ...newProjectForm, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">研究物种</label>
                  <input
                    type="text"
                    className="input-field w-full"
                    placeholder="例如 Homo sapiens"
                    value={newProjectForm.organism}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, organism: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">项目负责人</label>
                  <input
                    type="text"
                    className="input-field w-full"
                    placeholder="请输入负责人姓名"
                    value={newProjectForm.principalInvestigator}
                    onChange={(e) => setNewProjectForm({ ...newProjectForm, principalInvestigator: e.target.value })}
                  />
                </div>
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

      {showFilterModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">筛选条件</h2>
              <button
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                onClick={() => setShowFilterModal(false)}
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">项目状态</label>
                <select
                  className="select-field w-full"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">全部状态</option>
                  <option value="active">进行中</option>
                  <option value="completed">已完成</option>
                  <option value="archived">已归档</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">负责人</label>
                <select
                  className="select-field w-full"
                  value={filterPI}
                  onChange={(e) => setFilterPI(e.target.value)}
                >
                  <option value="">全部负责人</option>
                  {[...new Set(projects.map(p => p.principalInvestigator))].map(pi => (
                    <option key={pi} value={pi}>{pi}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">研究物种</label>
                <select
                  className="select-field w-full"
                  value={filterOrganism}
                  onChange={(e) => setFilterOrganism(e.target.value)}
                >
                  <option value="">全部物种</option>
                  {[...new Set(projects.map(p => p.organism))].map(org => (
                    <option key={org} value={org}>{org}</option>
                  ))}
                </select>
              </div>
              {(filterStatus || filterPI || filterOrganism) && (
                <div className="text-sm text-slate-400 pt-2 border-t border-slate-700">
                  筛选结果：共 {filteredProjects.length} 个项目
                </div>
              )}
            </div>
            <div className="p-5 border-t border-slate-700 flex justify-end gap-3">
              <button
                className="btn-secondary"
                onClick={resetFilters}
              >
                重置
              </button>
              <button
                className="btn-primary"
                onClick={applyFilters}
              >
                应用筛选
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
