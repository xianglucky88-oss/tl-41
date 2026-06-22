import { Plus, Minus, GitCompare, FlaskConical } from 'lucide-react';
import type { VersionDiffResult, StepDiffItem, ParameterDiffItem, SampleDiffItem, DiffChangeType } from '@/utils/diffUtils';
import type { AnalysisVersionHistory } from '@shared/types';

interface VersionDiffViewProps {
  diff: VersionDiffResult;
  oldVersion: AnalysisVersionHistory;
  newVersion: AnalysisVersionHistory;
}

export default function VersionDiffView({ diff, oldVersion, newVersion }: VersionDiffViewProps) {
  return (
    <div className="space-y-6">
      <DiffSummary diff={diff} oldVersion={oldVersion} newVersion={newVersion} />
      <StepDiffSection steps={diff.steps} />
      <ParameterDiffSection parameters={diff.globalParameters} title="全局参数变化" />
      <SampleDiffSection samples={diff.samples} />
    </div>
  );
}

function DiffSummary({
  diff, oldVersion, newVersion
}: { diff: VersionDiffResult; oldVersion: AnalysisVersionHistory; newVersion: AnalysisVersionHistory }) {
  const { summary } = diff;
  const totalChanges = summary.stepsAdded + summary.stepsRemoved + summary.stepsModified +
    summary.paramsChanged + summary.samplesAdded + summary.samplesRemoved;

  return (
    <div className="card p-5 bg-slate-800/50">
      <div className="flex items-center gap-3 mb-4">
        <GitCompare size={20} className="text-primary-400" />
        <h3 className="font-semibold text-white">版本对比概览</h3>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
          <p className="text-xs text-rose-400 mb-1">旧版本</p>
          <p className="text-lg font-bold text-white">v{oldVersion.version}</p>
          <p className="text-xs text-slate-500 mt-1">{oldVersion.description}</p>
        </div>
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
          <p className="text-xs text-emerald-400 mb-1">新版本</p>
          <p className="text-lg font-bold text-white">v{newVersion.version}</p>
          <p className="text-xs text-slate-500 mt-1">{newVersion.description}</p>
        </div>
      </div>
      {totalChanges > 0 ? (
        <div className="flex flex-wrap gap-2">
          {summary.stepsAdded > 0 && (
            <span className="badge bg-emerald-500/20 text-emerald-400">
              <Plus size={12} className="inline mr-1" />
              {summary.stepsAdded} 个新增步骤
            </span>
          )}
          {summary.stepsRemoved > 0 && (
            <span className="badge bg-rose-500/20 text-rose-400">
              <Minus size={12} className="inline mr-1" />
              {summary.stepsRemoved} 个删除步骤
            </span>
          )}
          {summary.stepsModified > 0 && (
            <span className="badge bg-amber-500/20 text-amber-400">
              {summary.stepsModified} 个修改步骤
            </span>
          )}
          {summary.paramsChanged > 0 && (
            <span className="badge bg-blue-500/20 text-blue-400">
              {summary.paramsChanged} 项参数变化
            </span>
          )}
          {summary.samplesAdded > 0 && (
            <span className="badge bg-emerald-500/20 text-emerald-400">
              <FlaskConical size={12} className="inline mr-1" />
              +{summary.samplesAdded} 样本
            </span>
          )}
          {summary.samplesRemoved > 0 && (
            <span className="badge bg-rose-500/20 text-rose-400">
              <FlaskConical size={12} className="inline mr-1" />
              -{summary.samplesRemoved} 样本
            </span>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-500">两个版本完全相同，无差异</p>
      )}
    </div>
  );
}

function StepDiffSection({ steps }: { steps: StepDiffItem[] }) {
  if (steps.length === 0) return null;

  return (
    <div className="card p-5 bg-slate-800/50">
      <h3 className="font-semibold text-white mb-4">分析步骤变化</h3>
      <div className="space-y-4">
        {steps.map((step) => (
          <StepDiffCard key={step.stepId} step={step} />
        ))}
      </div>
    </div>
  );
}

function StepDiffCard({ step }: { step: StepDiffItem }) {
  const config = getDiffConfig(step.type);

  return (
    <div className={`border rounded-xl overflow-hidden ${config.borderClass}`}>
      <div className={`px-4 py-3 ${config.headerBgClass} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <config.icon size={16} className={config.iconClass} />
          <span className="font-medium text-white">
            {step.newStep?.stepName || step.oldStep?.stepName || step.stepId}
          </span>
          <span className="text-xs text-slate-500">
            {step.newStep?.toolId || step.oldStep?.toolId}
          </span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded ${config.badgeClass}`}>
          {config.label}
        </span>
      </div>

      {step.type === 'added' && step.newStep && (
        <div className="bg-emerald-950/30 px-4 py-3">
          <StepParameterList params={step.parameterDiffs} type="added" />
        </div>
      )}

      {step.type === 'removed' && step.oldStep && (
        <div className="bg-rose-950/30 px-4 py-3">
          <StepParameterList params={step.parameterDiffs} type="removed" />
        </div>
      )}

      {step.type === 'modified' && (
        <div className="grid grid-cols-2 divide-x divide-slate-700/50">
          <div className="bg-rose-950/20 px-4 py-3">
            <p className="text-xs text-rose-400 mb-2 font-medium">旧值</p>
            <StepParameterList params={step.parameterDiffs} type="removed" showOnlyChanged />
          </div>
          <div className="bg-emerald-950/20 px-4 py-3">
            <p className="text-xs text-emerald-400 mb-2 font-medium">新值</p>
            <StepParameterList params={step.parameterDiffs} type="added" showOnlyChanged />
          </div>
        </div>
      )}

      {step.type === 'unchanged' && (
        <div className="px-4 py-2 text-xs text-slate-500">
          此步骤无变化
        </div>
      )}
    </div>
  );
}

function StepParameterList({
  params, type, showOnlyChanged = false
}: { params: ParameterDiffItem[]; type: DiffChangeType; showOnlyChanged?: boolean }) {
  const filteredParams = showOnlyChanged
    ? params.filter(p => p.type !== 'unchanged')
    : params;

  if (filteredParams.length === 0) {
    return <p className="text-xs text-slate-500">无参数</p>;
  }

  return (
    <div className="space-y-1">
      {filteredParams.map((param) => {
        const value = type === 'added' ? param.newValue : param.oldValue;
        const isChanged = param.type !== 'unchanged';
        return (
          <div
            key={param.key}
            className={`text-xs font-mono flex items-start gap-2 ${
              isChanged
                ? type === 'added'
                  ? 'text-emerald-300'
                  : 'text-rose-300'
                : 'text-slate-400'
            }`}
          >
            {isChanged && (
              <span className="flex-shrink-0 w-4 text-center">
                {type === 'added' ? '+' : '-'}
              </span>
            )}
            {!isChanged && <span className="flex-shrink-0 w-4" />}
            <span className="text-slate-500">{param.key}:</span>
            <span>{String(value)}</span>
          </div>
        );
      })}
    </div>
  );
}

function ParameterDiffSection({
  parameters, title
}: { parameters: ParameterDiffItem[]; title: string }) {
  const changedParams = parameters.filter(p => p.type !== 'unchanged');

  if (changedParams.length === 0) {
    return (
      <div className="card p-5 bg-slate-800/50">
        <h3 className="font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-500">无参数变化</p>
      </div>
    );
  }

  return (
    <div className="card p-5 bg-slate-800/50">
      <h3 className="font-semibold text-white mb-4">{title}</h3>
      <div className="overflow-hidden border border-slate-700 rounded-xl">
        <div className="grid grid-cols-2 text-xs bg-slate-700/50">
          <div className="px-4 py-2 text-rose-400 font-medium">旧值</div>
          <div className="px-4 py-2 text-emerald-400 font-medium">新值</div>
        </div>
        <div className="divide-y divide-slate-700/50">
          {changedParams.map((param) => (
            <ParameterDiffRow key={param.key} param={param} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ParameterDiffRow({ param }: { param: ParameterDiffItem }) {
  return (
    <div className="grid grid-cols-2">
      <div className={`px-4 py-2 font-mono text-xs ${
        param.type === 'removed' || param.type === 'modified'
          ? 'bg-rose-950/30 text-rose-300'
          : 'bg-slate-800/30 text-slate-500'
      }`}>
        {param.oldValue !== undefined ? (
          <><span className="text-slate-500">{param.key}:</span> {String(param.oldValue)}</>
        ) : (
          <span className="text-slate-600 italic">未设置</span>
        )}
      </div>
      <div className={`px-4 py-2 font-mono text-xs ${
        param.type === 'added' || param.type === 'modified'
          ? 'bg-emerald-950/30 text-emerald-300'
          : 'bg-slate-800/30 text-slate-500'
      }`}>
        {param.newValue !== undefined ? (
          <><span className="text-slate-500">{param.key}:</span> {String(param.newValue)}</>
        ) : (
          <span className="text-slate-600 italic">已删除</span>
        )}
      </div>
    </div>
  );
}

function SampleDiffSection({ samples }: { samples: SampleDiffItem[] }) {
  const hasChanges = samples.some(s => s.type !== 'unchanged');
  const addedSamples = samples.filter(s => s.type === 'added');
  const removedSamples = samples.filter(s => s.type === 'removed');
  const unchangedSamples = samples.filter(s => s.type === 'unchanged');

  return (
    <div className="card p-5 bg-slate-800/50">
      <h3 className="font-semibold text-white mb-4">样本变化</h3>
      {hasChanges ? (
        <div className="grid grid-cols-2 gap-4">
          {removedSamples.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-rose-400 font-medium">移除的样本</p>
              <div className="space-y-1">
                {removedSamples.map((s) => (
                  <div
                    key={s.sampleId}
                    className="flex items-center gap-2 px-3 py-2 bg-rose-950/30 rounded-lg text-sm text-rose-300"
                  >
                    <Minus size={14} />
                    <FlaskConical size={14} />
                    <span>{s.sampleName || s.sampleId}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {addedSamples.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-emerald-400 font-medium">新增的样本</p>
              <div className="space-y-1">
                {addedSamples.map((s) => (
                  <div
                    key={s.sampleId}
                    className="flex items-center gap-2 px-3 py-2 bg-emerald-950/30 rounded-lg text-sm text-emerald-300"
                  >
                    <Plus size={14} />
                    <FlaskConical size={14} />
                    <span>{s.sampleName || s.sampleId}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-500">无样本变化</p>
      )}
      {unchangedSamples.length > 0 && hasChanges && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <p className="text-xs text-slate-500 mb-2">
            未变更样本 ({unchangedSamples.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {unchangedSamples.map((s) => (
              <span
                key={s.sampleId}
                className="text-xs px-2 py-1 bg-slate-700/30 rounded text-slate-400"
              >
                {s.sampleName || s.sampleId}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getDiffConfig(type: DiffChangeType) {
  const configs: Record<DiffChangeType, {
    icon: typeof Plus;
    label: string;
    borderClass: string;
    headerBgClass: string;
    iconClass: string;
    badgeClass: string;
  }> = {
    added: {
      icon: Plus,
      label: '新增',
      borderClass: 'border-emerald-500/30',
      headerBgClass: 'bg-emerald-950/30',
      iconClass: 'text-emerald-400',
      badgeClass: 'bg-emerald-500/20 text-emerald-400',
    },
    removed: {
      icon: Minus,
      label: '删除',
      borderClass: 'border-rose-500/30',
      headerBgClass: 'bg-rose-950/30',
      iconClass: 'text-rose-400',
      badgeClass: 'bg-rose-500/20 text-rose-400',
    },
    modified: {
      icon: GitCompare,
      label: '修改',
      borderClass: 'border-amber-500/30',
      headerBgClass: 'bg-amber-950/30',
      iconClass: 'text-amber-400',
      badgeClass: 'bg-amber-500/20 text-amber-400',
    },
    unchanged: {
      icon: GitCompare,
      label: '未变',
      borderClass: 'border-slate-700',
      headerBgClass: 'bg-slate-800/30',
      iconClass: 'text-slate-500',
      badgeClass: 'bg-slate-700/50 text-slate-400',
    },
  };
  return configs[type];
}
