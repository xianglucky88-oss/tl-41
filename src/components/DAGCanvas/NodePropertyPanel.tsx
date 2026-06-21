import { useState } from 'react';
import type { WorkflowNode } from '@shared/types';
import { ALIGNMENT_TOOLS } from '@shared/toolConfigs';
import {
  Settings, X, Zap, GitBranch, Merge, Dna, Play,
  Plus, Trash2, Copy,
} from 'lucide-react';

interface NodePropertyPanelProps {
  node: WorkflowNode | null;
  onUpdateNode: (nodeId: string, updates: Partial<WorkflowNode>) => void;
  onDeleteNode: (nodeId: string) => void;
  onClose: () => void;
}

export default function NodePropertyPanel({
  node,
  onUpdateNode,
  onDeleteNode,
  onClose,
}: NodePropertyPanelProps) {
  const [activeTab, setActiveTab] = useState<'params' | 'advanced'>('params');

  if (!node) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <Settings size={32} className="mb-3 opacity-50" />
        <p className="text-sm">选择一个节点查看属性</p>
      </div>
    );
  }

  const toolConfig = node.toolId ? ALIGNMENT_TOOLS.find(t => t.id === node.toolId) : null;

  const getNodeIcon = () => {
    switch (node.type) {
      case 'input': return <Dna size={20} className="text-emerald-400" />;
      case 'output': return <Play size={20} className="text-blue-400" />;
      case 'branch': return <GitBranch size={20} className="text-amber-400" />;
      case 'merge': return <Merge size={20} className="text-purple-400" />;
      case 'tool': return <Zap size={20} className="text-primary-400" />;
      default: return null;
    }
  };

  const handleParameterChange = (paramName: string, value: string | number | boolean) => {
    if (!node.parameters) return;
    onUpdateNode(node.id, {
      parameters: { ...node.parameters, [paramName]: value },
    });
  };

  const handleLabelChange = (label: string) => {
    onUpdateNode(node.id, { label });
  };

  const handleBranchConditionChange = (index: number, value: string) => {
    if (!node.branchConditions) return;
    const newConditions = [...node.branchConditions];
    newConditions[index] = value;
    onUpdateNode(node.id, { branchConditions: newConditions });

    const newOutputPorts = [...node.outputPorts];
    if (newOutputPorts[index]) {
      newOutputPorts[index] = { ...newOutputPorts[index], label: value };
      onUpdateNode(node.id, { outputPorts: newOutputPorts });
    }
  };

  const handleAddBranch = () => {
    const newIndex = (node.branchConditions?.length || 0) + 1;
    const newCondition = `条件 ${newIndex}`;
    const newPort = { id: `out-${newIndex}`, label: newCondition };

    onUpdateNode(node.id, {
      branchConditions: [...(node.branchConditions || []), newCondition],
      outputPorts: [...node.outputPorts, newPort],
    });
  };

  const handleRemoveBranch = (index: number) => {
    if (!node.branchConditions || node.branchConditions.length <= 2) return;

    const newConditions = node.branchConditions.filter((_, i) => i !== index);
    const newOutputPorts = node.outputPorts.filter((_, i) => i !== index);

    const renamedPorts = newOutputPorts.map((port, i) => ({
      ...port,
      id: `out-${i + 1}`,
      label: newConditions[i] || `分支 ${i + 1}`,
    }));

    onUpdateNode(node.id, {
      branchConditions: newConditions,
      outputPorts: renamedPorts,
    });
  };

  const handleAddMergeInput = () => {
    const newIndex = node.inputPorts.length + 1;
    const newPort = { id: `in-${newIndex}`, label: `输入 ${newIndex}` };
    onUpdateNode(node.id, {
      inputPorts: [...node.inputPorts, newPort],
    });
  };

  const handleRemoveMergeInput = (index: number) => {
    if (node.inputPorts.length <= 2) return;

    const newInputPorts = node.inputPorts.filter((_, i) => i !== index);
    const renamedPorts = newInputPorts.map((port, i) => ({
      ...port,
      id: `in-${i + 1}`,
      label: `输入 ${i + 1}`,
    }));

    onUpdateNode(node.id, {
      inputPorts: renamedPorts,
    });
  };

  const handleInputPortLabelChange = (index: number, label: string) => {
    const newPorts = [...node.inputPorts];
    if (newPorts[index]) {
      newPorts[index] = { ...newPorts[index], label };
      onUpdateNode(node.id, { inputPorts: newPorts });
    }
  };

  const getTypeLabel = () => {
    const labels: Record<string, string> = {
      input: '输入节点',
      output: '输出节点',
      tool: '工具节点',
      branch: '分支节点',
      merge: '合并节点',
    };
    return labels[node.type] || node.type;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {getNodeIcon()}
          <div>
            <h3 className="font-medium text-white text-sm">{getTypeLabel()}</h3>
            <p className="text-xs text-slate-500">
              {node.inputPorts.length} 输入 · {node.outputPorts.length} 输出
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">节点名称</label>
          <input
            type="text"
            value={node.label}
            onChange={(e) => handleLabelChange(e.target.value)}
            className="input-field text-sm py-2"
          />
        </div>

        {node.type === 'tool' && toolConfig && (
          <>
            <div className="flex items-center gap-2 text-xs border-b border-slate-800 pb-2">
              <span
                className={`px-2 py-0.5 rounded-full ${
                  activeTab === 'params'
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-slate-500 cursor-pointer hover:text-slate-300'
                }`}
                onClick={() => setActiveTab('params')}
              >
                参数配置
              </span>
              <span
                className={`px-2 py-0.5 rounded-full ${
                  activeTab === 'advanced'
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-slate-500 cursor-pointer hover:text-slate-300'
                }`}
                onClick={() => setActiveTab('advanced')}
              >
                高级
              </span>
            </div>

            {activeTab === 'params' && (
              <div className="space-y-3">
                {toolConfig.parameters.map((param) => (
                  <div key={param.name}>
                    <label className="block text-xs text-slate-400 mb-1.5">
                      {param.label}
                      <span className="text-slate-600 ml-1">({param.description})</span>
                    </label>
                    {param.type === 'select' ? (
                      <select
                        className="select-field text-sm py-2"
                        value={String(node.parameters?.[param.name] ?? param.defaultValue)}
                        onChange={(e) => handleParameterChange(param.name, e.target.value)}
                      >
                        {param.options?.map(opt => (
                          <option key={String(opt)} value={String(opt)}>{opt}</option>
                        ))}
                      </select>
                    ) : param.type === 'boolean' ? (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(node.parameters?.[param.name] ?? param.defaultValue)}
                          onChange={(e) => handleParameterChange(param.name, e.target.checked)}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-primary-500"
                        />
                        <span className="text-sm text-slate-300">
                          {node.parameters?.[param.name] ? '已启用' : '已禁用'}
                        </span>
                      </label>
                    ) : (
                      <input
                        type={param.type === 'number' ? 'number' : 'text'}
                        className="input-field text-sm py-2"
                        value={String(node.parameters?.[param.name] ?? param.defaultValue)}
                        onChange={(e) => handleParameterChange(
                          param.name,
                          param.type === 'number' ? Number(e.target.value) : e.target.value
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                  <h4 className="text-xs font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <Copy size={12} className="text-primary-400" />
                    命令行预览
                  </h4>
                  <code className="text-xs text-slate-500 font-mono break-all">
                    {toolConfig.id} {Object.entries(node.parameters || {}).map(([k, v]) =>
                      typeof v === 'boolean' ? (v ? `--${k}` : '') : `--${k} ${v}`
                    ).filter(Boolean).join(' ')}
                  </code>
                </div>
                <div className="text-xs text-slate-500">
                  <p>工具版本: v{toolConfig.version}</p>
                  <p className="mt-1">工具分类: {toolConfig.category}</p>
                </div>
              </div>
            )}
          </>
        )}

        {node.type === 'branch' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-400">分支条件</label>
              <button
                onClick={handleAddBranch}
                className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors"
              >
                <Plus size={12} />
                添加分支
              </button>
            </div>
            <div className="space-y-2">
              {node.branchConditions?.map((condition, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-14 flex-shrink-0">分支 {idx + 1}</span>
                  <input
                    type="text"
                    value={condition}
                    onChange={(e) => handleBranchConditionChange(idx, e.target.value)}
                    className="input-field text-sm py-1.5 flex-1"
                  />
                  {node.branchConditions && node.branchConditions.length > 2 && (
                    <button
                      onClick={() => handleRemoveBranch(idx)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-600">
              最少 2 个分支，每个分支对应一个输出端口
            </p>
          </div>
        )}

        {node.type === 'merge' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-400">输入端口</label>
              <button
                onClick={handleAddMergeInput}
                className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors"
              >
                <Plus size={12} />
                添加输入
              </button>
            </div>
            <div className="space-y-2">
              {node.inputPorts.map((port, idx) => (
                <div key={port.id} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-14 flex-shrink-0">输入 {idx + 1}</span>
                  <input
                    type="text"
                    value={port.label || ''}
                    onChange={(e) => handleInputPortLabelChange(idx, e.target.value)}
                    className="input-field text-sm py-1.5 flex-1"
                    placeholder="端口名称"
                  />
                  {node.inputPorts.length > 2 && (
                    <button
                      onClick={() => handleRemoveMergeInput(idx)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-600">
              最少 2 路输入，支持多路数据合并
            </p>
          </div>
        )}

        {node.type === 'input' && (
          <div className="space-y-3">
            <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <p className="text-xs text-emerald-400">
                数据起点节点，分析样本从此节点进入工作流
              </p>
            </div>
            <div className="text-xs text-slate-500 space-y-1">
              <p>输出端口: {node.outputPorts.length}</p>
            </div>
          </div>
        )}

        {node.type === 'output' && (
          <div className="space-y-3">
            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <p className="text-xs text-blue-400">
                数据终点节点，分析结果从此节点输出
              </p>
            </div>
            <div className="text-xs text-slate-500 space-y-1">
              <p>输入端口: {node.inputPorts.length}</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => { onDeleteNode(node.id); onClose(); }}
          className="w-full py-2 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 size={14} />
          删除节点
        </button>
      </div>
    </div>
  );
}
