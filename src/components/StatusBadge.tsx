import type { AnalysisStatus } from '@shared/types';

interface StatusBadgeProps {
  status: AnalysisStatus | string;
  showDot?: boolean;
}

export default function StatusBadge({ status, showDot = true }: StatusBadgeProps) {
  const statusConfig: Record<string, { class: string; label: string }> = {
    completed: { class: 'status-completed', label: '已完成' },
    running: { class: 'status-running', label: '运行中' },
    pending: { class: 'status-pending', label: '等待中' },
    failed: { class: 'status-failed', label: '失败' },
    active: { class: 'bg-primary-500/20 text-primary-400 border-primary-500/30', label: '进行中' },
    archived: { class: 'bg-slate-500/20 text-slate-400 border-slate-500/30', label: '已归档' },
    processing: { class: 'status-running', label: '处理中' },
  };

  const config = statusConfig[status] || { class: 'bg-slate-500/20 text-slate-400', label: status };

  return (
    <span className={`badge ${config.class}`}>
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
            status === 'running' || status === 'processing' ? 'bg-blue-400 animate-pulse' :
            status === 'completed' ? 'bg-emerald-400' :
            status === 'pending' ? 'bg-amber-400' :
            status === 'failed' ? 'bg-red-400' : 'bg-slate-400'
          }`}
        />
      )}
      {config.label}
    </span>
  );
}
