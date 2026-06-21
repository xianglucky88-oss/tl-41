import { ALIGNMENT_TOOLS } from '@shared/toolConfigs';
import type { AlignmentTool, WorkflowNodeType } from '@shared/types';
import {
  Dna, Play, Zap, GitBranch, Merge, ArrowRight,
} from 'lucide-react';

interface ToolPaletteItem {
  type: WorkflowNodeType;
  toolId?: AlignmentTool;
  label: string;
  description?: string;
  icon: React.ReactNode;
  category: string;
  color: string;
}

const structuralNodes: ToolPaletteItem[] = [
  {
    type: 'input',
    label: '输入样本',
    description: '分析流程的数据起点',
    icon: <Dna size={18} />,
    category: '结构节点',
    color: 'emerald',
  },
  {
    type: 'output',
    label: '输出结果',
    description: '分析流程的结果输出',
    icon: <Play size={18} />,
    category: '结构节点',
    color: 'blue',
  },
  {
    type: 'branch',
    label: '条件分支',
    description: '根据条件分流数据',
    icon: <GitBranch size={18} />,
    category: '结构节点',
    color: 'amber',
  },
  {
    type: 'merge',
    label: '数据合并',
    description: '合并多路输入数据',
    icon: <Merge size={18} />,
    category: '结构节点',
    color: 'purple',
  },
];

const getColorClasses = (color: string) => {
  const colorMap: Record<string, { bg: string; border: string; text: string; hover: string }> = {
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      hover: 'hover:border-emerald-500/40 hover:bg-emerald-500/20',
    },
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-400',
      hover: 'hover:border-blue-500/40 hover:bg-blue-500/20',
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      hover: 'hover:border-amber-500/40 hover:bg-amber-500/20',
    },
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      text: 'text-purple-400',
      hover: 'hover:border-purple-500/40 hover:bg-purple-500/20',
    },
    primary: {
      bg: 'bg-primary-500/10',
      border: 'border-primary-500/20',
      text: 'text-primary-400',
      hover: 'hover:border-primary-500/40 hover:bg-primary-500/20',
    },
  };
  return colorMap[color] || colorMap.primary;
};

interface ToolPaletteProps {
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export default function ToolPalette({ onDragStart, onDragEnd }: ToolPaletteProps) {
  const handleDragStart = (e: React.DragEvent, type: WorkflowNodeType, toolId?: AlignmentTool) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type, toolId }));
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart?.();
  };

  const handleDragEnd = () => {
    onDragEnd?.();
  };

  const toolItems: ToolPaletteItem[] = ALIGNMENT_TOOLS.map(tool => ({
    type: 'tool' as WorkflowNodeType,
    toolId: tool.id,
    label: tool.name,
    description: tool.description,
    icon: <Zap size={18} />,
    category: tool.category === 'alignment' ? '比对工具' : tool.category,
    color: 'primary',
  }));

  const categories = [
    { key: '结构节点', title: '结构节点', items: structuralNodes },
    { key: '比对工具', title: '比对工具', items: toolItems.filter(i => i.category === '比对工具') },
  ];

  return (
    <div className="space-y-4">
      {categories.map(category => (
        <div key={category.key}>
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 px-1">
            {category.title}
          </h3>
          <div className="space-y-2">
            {category.items.map((item, idx) => {
              const colors = getColorClasses(item.color);
              return (
                <div
                  key={`${item.type}-${item.toolId || idx}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.type, item.toolId)}
                  onDragEnd={handleDragEnd}
                  className={`p-3 rounded-xl border ${colors.bg} ${colors.border} ${colors.text}
                             cursor-grab active:cursor-grabbing
                             hover:shadow-md transition-all duration-200 ${colors.hover}
                             select-none`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${colors.bg}`}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.label}</p>
                      {item.description && (
                        <p className="text-xs text-slate-500 truncate">{item.description}</p>
                      )}
                    </div>
                    <ArrowRight size={14} className="text-slate-600 flex-shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="pt-2 border-t border-slate-800">
        <p className="text-xs text-slate-600 px-1">
          提示：拖拽节点到画布中创建
        </p>
      </div>
    </div>
  );
}
