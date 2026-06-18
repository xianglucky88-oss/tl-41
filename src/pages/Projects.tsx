import { useState } from 'react';
import { FlaskConical, Plus, ChevronRight, Calendar, User, Beaker, TestTube, Workflow, Eye, Edit, Trash2, Filter } from 'lucide-react';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import StatusBadge from '@/components/StatusBadge';
import type { Project, Batch } from '@shared/types';

type TabType = 'projects' | 'batches';

export default function Projects() {
  const { projects, batches, samples, setCurrentProject } = useAnalysisStore();
  const [activeTab, setActiveTab] = useState<TabType>('projects');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const getProjectBatches = (projectId: string) => batches.filter(b => b.projectId === projectId);
  const getProjectSamples = (projectId: string) => samples.filter(s => s.projectId === projectId);

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setCurrentProject(project);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">项目与批次管理</h1>
          <p className="text-slate-400">管理您的研究项目、实验批次和样本数据</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowCreateModal(true)}>
          <Plus size={18} />
          新建项目
        </button>
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
          <button className="btn-secondary flex items-center gap-2">
            <Filter size={16} />
            筛选
          </button>
        </div>
      </div>

      {activeTab === 'projects' ? (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            {projects.map((project) => (
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
                    <button className="p-2 text-slate-400 hover:text-primary-400 transition-colors">
                      <Eye size={16} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-blue-400 transition-colors">
                      <Edit size={16} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-red-400 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <button className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300">
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
                      <button className="text-primary-400 hover:text-primary-300 text-sm">查看</button>
                      <button className="text-slate-400 hover:text-white text-sm">编辑</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
          </div>
      )}
    </div>
  );
}
