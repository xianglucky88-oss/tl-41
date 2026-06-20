import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FlaskConical, TestTube, Workflow, BarChart3, History, GitCompare, FileText, Search, Bell, User, Dna, BookOpen, Scissors } from 'lucide-react';
import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/projects', label: '项目管理', icon: FlaskConical },
  { path: '/samples', label: '样本管理', icon: TestTube },
  { path: '/workbench', label: '分析工作台', icon: Workflow },
  { path: '/visualizer', label: '比对可视化', icon: BarChart3 },
  { path: '/gc-codon', label: 'GC/密码子分析', icon: Dna },
  { path: '/orf-predictor', label: 'ORF预测', icon: BookOpen },
  { path: '/restriction-enzyme', label: '限制酶酶切', icon: Scissors },
  { path: '/history', label: '分析历史', icon: History },
  { path: '/variants', label: '变异比对', icon: GitCompare },
  { path: '/reports', label: '报告中心', icon: FileText },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">GenomeLab</h1>
              <p className="text-xs text-slate-500">DNA序列分析工作台</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center">
                <User size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">研究员</p>
                <p className="text-xs text-slate-400">researcher@lab.edu</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between px-6">
          <div className="flex-1 max-w-xl relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input
              type="text"
              placeholder="搜索项目、样本、变异..."
              className="w-full pl-12 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="h-8 w-px bg-slate-700" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">2026-06-18</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
