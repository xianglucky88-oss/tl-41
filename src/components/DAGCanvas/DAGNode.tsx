import { memo } from 'react';
import { WorkflowNode, WorkflowNodePort } from '@shared/types';
import { ALIGNMENT_TOOLS } from '@shared/toolConfigs';
import {
  Play, GitBranch, Merge, ArrowRight, Dna, Zap,
} from 'lucide-react';

interface DAGNodeProps {
  node: WorkflowNode;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onPortMouseDown: (e: React.MouseEvent, nodeId: string, portId: string, isOutput: boolean) => void;
  onPortMouseUp: (e: React.MouseEvent, nodeId: string, portId: string, isOutput: boolean) => void;
  onClick: (nodeId: string) => void;
}

const NODE_WIDTH = 200;
const NODE_HEADER_HEIGHT = 40;
const PORT_SPACING = 24;
const PORT_PADDING = 12;

function getNodeIcon(type: WorkflowNode['type'], toolId?: string) {
  switch (type) {
    case 'input':
      return <Dna size={16} />;
    case 'output':
      return <Play size={16} />;
    case 'branch':
      return <GitBranch size={16} />;
    case 'merge':
      return <Merge size={16} />;
    case 'tool':
      return <Zap size={16} />;
    default:
      return null;
  }
}

function getNodeColor(type: WorkflowNode['type']) {
  switch (type) {
    case 'input':
      return { bg: 'from-emerald-600 to-emerald-700', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20' };
    case 'output':
      return { bg: 'from-blue-600 to-blue-700', border: 'border-blue-500/30', glow: 'shadow-blue-500/20' };
    case 'branch':
      return { bg: 'from-amber-600 to-amber-700', border: 'border-amber-500/30', glow: 'shadow-amber-500/20' };
    case 'merge':
      return { bg: 'from-purple-600 to-purple-700', border: 'border-purple-500/30', glow: 'shadow-purple-500/20' };
    case 'tool':
    default:
      return { bg: 'from-primary-600 to-primary-700', border: 'border-primary-500/30', glow: 'shadow-primary-500/20' };
  }
}

function calculateNodeHeight(node: WorkflowNode) {
  const maxPorts = Math.max(node.inputPorts.length, node.outputPorts.length, 1);
  return NODE_HEADER_HEIGHT + PORT_PADDING * 2 + Math.max(0, (maxPorts - 1)) * PORT_SPACING + 8;
}

function getPortY(index: number, total: number, nodeHeight: number) {
  if (total === 0) return nodeHeight / 2;
  if (total === 1) return nodeHeight / 2;
  const startY = NODE_HEADER_HEIGHT + PORT_PADDING;
  return startY + index * PORT_SPACING;
}

const DAGNode = memo(function DAGNode({
  node,
  isSelected,
  onMouseDown,
  onPortMouseDown,
  onPortMouseUp,
  onClick,
}: DAGNodeProps) {
  const colors = getNodeColor(node.type);
  const nodeHeight = calculateNodeHeight(node);
  const toolConfig = node.toolId ? ALIGNMENT_TOOLS.find(t => t.id === node.toolId) : null;

  return (
    <div
      className={`absolute select-none transition-shadow duration-200 ${
        isSelected ? `shadow-lg ${colors.glow}` : ''
      }`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: NODE_WIDTH,
        height: nodeHeight,
      }}
      onMouseDown={(e) => onMouseDown(e, node.id)}
      onClick={(e) => { e.stopPropagation(); onClick(node.id); }}
    >
      <div
        className={`w-full h-full rounded-xl bg-slate-900/90 backdrop-blur-sm border ${
          isSelected ? `${colors.border} ring-2 ring-primary-500/30` : 'border-slate-700/50'
        } overflow-hidden transition-all duration-200 hover:border-slate-600`}
      >
        <div
          className={`h-10 px-3 flex items-center gap-2 bg-gradient-to-r ${colors.bg} text-white`}
        >
          {getNodeIcon(node.type, node.toolId)}
          <span className="text-sm font-medium truncate flex-1">{node.label}</span>
        </div>

        <div className="relative px-3 py-2">
          {node.type === 'tool' && toolConfig && (
            <p className="text-xs text-slate-500 truncate">
              v{toolConfig.version} · {toolConfig.category}
            </p>
          )}
          {node.type === 'branch' && (
            <p className="text-xs text-slate-500">
              {node.branchConditions?.length || 2} 个分支
            </p>
          )}
          {node.type === 'merge' && (
            <p className="text-xs text-slate-500">
              {node.inputPorts.length} 路合并
            </p>
          )}
        </div>

        {node.inputPorts.map((port, idx) => (
          <div
            key={`in-${port.id}`}
            className="absolute flex items-center group"
            style={{
              left: -8,
              top: getPortY(idx, node.inputPorts.length, nodeHeight),
              transform: 'translateY(-50%)',
            }}
          >
            <div
              className="w-4 h-4 rounded-full bg-slate-800 border-2 border-slate-600 cursor-crosshair
                         hover:border-primary-400 hover:bg-primary-500/20 transition-all duration-150
                         group-hover:scale-125"
              onMouseDown={(e) => { e.stopPropagation(); onPortMouseDown(e, node.id, port.id, false); }}
              onMouseUp={(e) => { e.stopPropagation(); onPortMouseUp(e, node.id, port.id, false); }}
              title={port.label || '输入端口'}
            />
            {port.label && (
              <span className="ml-2 text-xs text-slate-500 hidden group-hover:block whitespace-nowrap">
                {port.label}
              </span>
            )}
          </div>
        ))}

        {node.outputPorts.map((port, idx) => (
          <div
            key={`out-${port.id}`}
            className="absolute flex items-center justify-end group"
            style={{
              right: -8,
              top: getPortY(idx, node.outputPorts.length, nodeHeight),
              transform: 'translateY(-50%)',
            }}
          >
            {port.label && (
              <span className="mr-2 text-xs text-slate-500 hidden group-hover:block whitespace-nowrap">
                {port.label}
              </span>
            )}
            <div
              className="w-4 h-4 rounded-full bg-slate-800 border-2 border-primary-500 cursor-crosshair
                         hover:border-primary-300 hover:bg-primary-500/40 transition-all duration-150
                         group-hover:scale-125"
              onMouseDown={(e) => { e.stopPropagation(); onPortMouseDown(e, node.id, port.id, true); }}
              onMouseUp={(e) => { e.stopPropagation(); onPortMouseUp(e, node.id, port.id, true); }}
              title={port.label || '输出端口'}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

export default DAGNode;
export { NODE_WIDTH, NODE_HEADER_HEIGHT, calculateNodeHeight, getPortY };
