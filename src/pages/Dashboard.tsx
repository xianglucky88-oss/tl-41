import { useEffect, useState } from 'react';
import { FlaskConical, TestTube, Workflow, GitCompare, TrendingUp, Activity, AlertTriangle, ChevronRight, Zap } from 'lucide-react';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import StatusBadge from '@/components/StatusBadge';
import { Link } from 'react-router-dom';

interface Stats {
  projects: { total: number; active: number; completed: number };
  samples: { total: number; byProject: { projectId: string; projectName: string; count: number }[] };
  analyses: { total: number; completed: number; running: number; pending: number; failed: number };
  variants: { total: number; pathogenic: number; snp: number; indel: number };
}

export default function Dashboard() {
  const { projects, analyses, samples, variants } = useAnalysisStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats/overview');
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        setStats({
          projects: { total: 4, active: 3, completed: 1 },
          samples: { total: samples.length, byProject: [] },
          analyses: { total: analyses.length, completed: 3, running: 1, pending: 1, failed: 0 },
          variants: { total: variants.length, pathogenic: 12, snp: 60, indel: 20 },
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [analyses.length, samples.length, variants.length]);

  const statCards = stats ? [
    {
      title: '项目总数',
      value: stats.projects.total,
      subtitle: `${stats.projects.active} 个进行中`,
      icon: FlaskConical,
      color: 'from-primary-500 to-primary-600',
      bgColor: 'bg-primary-500/10',
      link: '/projects',
    },
    {
      title: '样本总数',
      value: stats.samples.total,
      subtitle: '累计处理样本',
      icon: TestTube,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      link: '/samples',
    },
    {
      title: '分析任务',
      value: stats.analyses.total,
      subtitle: `${stats.analyses.running} 个运行中`,
      icon: Workflow,
      color: 'from-accent-500 to-accent-600',
      bgColor: 'bg-accent-500/10',
      link: '/history',
    },
    {
      title: '变异位点',
      value: stats.variants.total,
      subtitle: `${stats.variants.pathogenic} 个致病性`,
      icon: GitCompare,
      color: 'from-rose-500 to-rose-600',
      bgColor: 'bg-rose-500/10',
      link: '/variants',
    },
  ] : [];

  const recentAnalyses = analyses.slice(0, 5);
  const activeProjects = projects.filter(p => p.status === 'active').slice(0, 4);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card p-6">
              <div className="skeleton h-6 w-24 rounded mb-4" />
              <div className="skeleton h-10 w-20 rounded mb-2" />
              <div className="skeleton h-4 w-32 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">基因组分析工作台</h1>
          <p className="text-slate-400">欢迎回来，这里是您的实验室数据分析概览</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Zap size={18} />
          新建分析
        </button>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link key={idx} to={card.link} className="card p-6 card-hover group">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center`}>
                  <Icon className={`bg-gradient-to-br ${card.color} bg-clip-text text-transparent`} size={24} />
                </div>
                <TrendingUp className="text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{card.value}</h3>
              <p className="text-sm text-slate-400">{card.title}</p>
              <p className="text-xs text-slate-500 mt-1">{card.subtitle}</p>
            </Link>
          );
        })}
      </div>

      {stats && stats.analyses.running > 0 && (
        <div className="card p-4 border-blue-500/30 bg-blue-500/5">
          <div className="flex items-center gap-3">
            <Activity className="text-blue-400 animate-pulse" size={20} />
            <span className="text-blue-300">当前有 <strong>{stats.analyses.running}</strong> 个分析任务正在运行</span>
            <Link to="/history" className="ml-auto text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
              查看详情 <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title mb-0">
              <Activity size={24} className="text-primary-500" />
              最近分析
            </h2>
            <Link to="/history" className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1">
              查看全部 <ChevronRight size={16} />
            </Link>
          </div>

          <div className="space-y-3">
            {recentAnalyses.map((analysis) => (
              <Link
                key={analysis.id}
                to={`/workbench?analysis=${analysis.id}`}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-800/50 transition-colors"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  analysis.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                  analysis.status === 'running' ? 'bg-blue-500/10 text-blue-400' :
                  analysis.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-red-500/10 text-red-400'
                }`}>
                  <Workflow size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{analysis.name}</p>
                  <p className="text-sm text-slate-400 truncate">{analysis.description}</p>
                </div>
                <div className="text-right">
                  <StatusBadge status={analysis.status} />
                  <p className="text-xs text-slate-500 mt-1">
                    v{analysis.version} · {new Date(analysis.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title mb-0">
              <FlaskConical size={24} className="text-primary-500" />
              进行中的项目
            </h2>
          </div>

          <div className="space-y-3">
            {activeProjects.map((project) => (
              <Link
                key={project.id}
                to={`/projects?project=${project.id}`}
                className="p-4 rounded-xl hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-white">{project.name}</p>
                  <span className="text-xs text-slate-400">{project.organism}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>{project.sampleCount} 样本</span>
                  <span>{project.analysisCount} 分析</span>
                </div>
                <div className="mt-3 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
                    style={{ width: `${Math.min(95, 30 + Math.random() * 50)}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="section-title">
              <GitCompare size={24} className="text-primary-500" />
              变异类型分布
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-400">{stats.variants.snp}</p>
                <p className="text-sm text-slate-400">SNP 变异</p>
                <div className="mt-3 h-2 bg-slate-700 rounded-full">
                  <div
                    className="h-full bg-blue-400 rounded-full"
                    style={{ width: `${(stats.variants.snp / stats.variants.total) * 100}%` }}
                  />
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-amber-400">{stats.variants.indel}</p>
                <p className="text-sm text-slate-400">Indel 变异</p>
                <div className="mt-3 h-2 bg-slate-700 rounded-full">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${(stats.variants.indel / stats.variants.total) * 100}%` }}
                  />
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-rose-400">{stats.variants.pathogenic}</p>
                <p className="text-sm text-slate-400">致病性</p>
                <div className="mt-3 h-2 bg-slate-700 rounded-full">
                  <div
                    className="h-full bg-rose-400 rounded-full"
                    style={{ width: `${(stats.variants.pathogenic / stats.variants.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="section-title">
              <AlertTriangle size={24} className="text-primary-500" />
              快速操作
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Link to="/workbench" className="p-4 rounded-xl bg-gradient-to-br from-primary-600/20 to-primary-700/20 border border-primary-500/30 hover:border-primary-400/50 transition-colors">
                <Workflow className="text-primary-400 mb-3" size={28} />
                <p className="font-medium text-white">启动新分析</p>
                <p className="text-sm text-slate-400 mt-1">配置比对工具和参数</p>
              </Link>
              <Link to="/variants" className="p-4 rounded-xl bg-gradient-to-br from-accent-600/20 to-accent-700/20 border border-accent-500/30 hover:border-accent-400/50 transition-colors">
                <GitCompare className="text-accent-400 mb-3" size={28} />
                <p className="font-medium text-white">变异比对</p>
                <p className="text-sm text-slate-400 mt-1">跨样本横向比较</p>
              </Link>
              <Link to="/samples" className="p-4 rounded-xl bg-gradient-to-br from-blue-600/20 to-blue-700/20 border border-blue-500/30 hover:border-blue-400/50 transition-colors">
                <TestTube className="text-blue-400 mb-3" size={28} />
                <p className="font-medium text-white">浏览样本</p>
                <p className="text-sm text-slate-400 mt-1">查看样品详情</p>
              </Link>
              <Link to="/reports" className="p-4 rounded-xl bg-gradient-to-br from-emerald-600/20 to-emerald-700/20 border border-emerald-500/30 hover:border-emerald-400/50 transition-colors">
                <AlertTriangle className="text-emerald-400 mb-3" size={28} />
                <p className="font-medium text-white">生成报告</p>
                <p className="text-sm text-slate-400 mt-1">可重现分析流程</p>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
