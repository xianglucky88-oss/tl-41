import { useState, useRef, useCallback, useEffect } from 'react';
import { WorkflowNode, WorkflowEdge, WorkflowGraph, WorkflowNodeType, AlignmentTool } from '@shared/types';
import { ALIGNMENT_TOOLS } from '@shared/toolConfigs';
import DAGNode, { NODE_WIDTH, calculateNodeHeight, getPortY } from './DAGNode';
import { ZoomIn, ZoomOut, Maximize2, Trash2 } from 'lucide-react';

interface DAGCanvasProps {
  graph: WorkflowGraph;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onUpdateNode: (nodeId: string, updates: Partial<WorkflowNode>) => void;
  onAddNode: (node: WorkflowNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onAddEdge: (edge: WorkflowEdge) => void;
  onDeleteEdge: (edgeId: string) => void;
  onUpdateGraph: (graph: WorkflowGraph) => void;
}

const GRID_SIZE = 20;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;

function generateId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function createNode(
  type: WorkflowNodeType,
  position: { x: number; y: number },
  toolId?: AlignmentTool
): WorkflowNode {
  const id = generateId('node');
  const toolConfig = toolId ? ALIGNMENT_TOOLS.find(t => t.id === toolId) : null;

  let inputPorts: { id: string; label?: string }[] = [];
  let outputPorts: { id: string; label?: string }[] = [];
  let label = '';
  let parameters: Record<string, string | number | boolean> | undefined;
  let branchConditions: string[] | undefined;

  switch (type) {
    case 'input':
      label = '输入样本';
      outputPorts = [{ id: 'out-1', label: '数据' }];
      break;
    case 'output':
      label = '输出结果';
      inputPorts = [{ id: 'in-1', label: '结果' }];
      break;
    case 'tool':
      label = toolConfig?.name || '分析工具';
      inputPorts = [{ id: 'in-1', label: '输入' }];
      outputPorts = [{ id: 'out-1', label: '输出' }];
      if (toolConfig) {
        parameters = {};
        toolConfig.parameters.forEach(p => {
          parameters![p.name] = p.defaultValue;
        });
      }
      break;
    case 'branch':
      label = '条件分支';
      inputPorts = [{ id: 'in-1', label: '输入' }];
      branchConditions = ['条件 A', '条件 B'];
      outputPorts = [
        { id: 'out-1', label: '分支 1' },
        { id: 'out-2', label: '分支 2' },
      ];
      break;
    case 'merge':
      label = '数据合并';
      inputPorts = [
        { id: 'in-1', label: '输入 1' },
        { id: 'in-2', label: '输入 2' },
      ];
      outputPorts = [{ id: 'out-1', label: '输出' }];
      break;
  }

  return {
    id,
    type,
    label,
    position,
    toolId,
    parameters,
    branchConditions,
    inputPorts,
    outputPorts,
  };
}

function getBezierPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number
): string {
  const dx = Math.abs(targetX - sourceX);
  const controlOffset = Math.max(50, dx * 0.5);
  return `M ${sourceX} ${sourceY} C ${sourceX + controlOffset} ${sourceY}, ${targetX - controlOffset} ${targetY}, ${targetX} ${targetY}`;
}

export default function DAGCanvas({
  graph,
  selectedNodeId,
  onSelectNode,
  onUpdateNode,
  onAddNode,
  onDeleteNode,
  onAddEdge,
  onDeleteEdge,
}: DAGCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    nodeId: string | null;
    offset: { x: number; y: number };
  }>({
    isDragging: false,
    nodeId: null,
    offset: { x: 0, y: 0 },
  });

  const [connectionState, setConnectionState] = useState<{
    isConnecting: boolean;
    sourceNodeId: string | null;
    sourcePortId: string | null;
    isOutput: boolean;
    mousePosition: { x: number; y: number };
  }>({
    isConnecting: false,
    sourceNodeId: null,
    sourcePortId: null,
    isOutput: true,
    mousePosition: { x: 0, y: 0 },
  });

  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (screenX - rect.left - pan.x) / zoom,
      y: (screenY - rect.top - pan.y) / zoom,
    };
  }, [pan, zoom]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('dag-canvas-bg')) {
      if (e.button === 1 || e.shiftKey) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      } else {
        onSelectNode(null);
        setSelectedEdgeId(null);
      }
    }
  }, [pan, onSelectNode]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (dragState.isDragging && dragState.nodeId) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      const newX = Math.round((canvasPos.x - dragState.offset.x) / GRID_SIZE) * GRID_SIZE;
      const newY = Math.round((canvasPos.y - dragState.offset.y) / GRID_SIZE) * GRID_SIZE;
      onUpdateNode(dragState.nodeId, { position: { x: newX, y: newY } });
    }

    if (connectionState.isConnecting) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      setConnectionState(prev => ({
        ...prev,
        mousePosition: canvasPos,
      }));
    }
  }, [isPanning, panStart, dragState, connectionState, screenToCanvas, onUpdateNode]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
    setDragState({ isDragging: false, nodeId: null, offset: { x: 0, y: 0 } });
    if (connectionState.isConnecting) {
      setConnectionState({
        isConnecting: false,
        sourceNodeId: null,
        sourcePortId: null,
        isOutput: true,
        mousePosition: { x: 0, y: 0 },
      });
    }
  }, [connectionState.isConnecting]);

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (e.button !== 0) return;
    const node = graph.nodes.find(n => n.id === nodeId);
    if (!node) return;

    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    setDragState({
      isDragging: true,
      nodeId,
      offset: {
        x: canvasPos.x - node.position.x,
        y: canvasPos.y - node.position.y,
      },
    });
    onSelectNode(nodeId);
    setSelectedEdgeId(null);
  }, [graph.nodes, screenToCanvas, onSelectNode]);

  const handlePortMouseDown = useCallback((
    e: React.MouseEvent,
    nodeId: string,
    portId: string,
    isOutput: boolean
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    const node = graph.nodes.find(n => n.id === nodeId);
    if (!node) return;

    const ports = isOutput ? node.outputPorts : node.inputPorts;
    const portIndex = ports.findIndex(p => p.id === portId);
    const nodeHeight = calculateNodeHeight(node);
    const portY = getPortY(portIndex, ports.length, nodeHeight);

    const startX = isOutput ? node.position.x + NODE_WIDTH : node.position.x;
    const startY = node.position.y + portY;

    setConnectionState({
      isConnecting: true,
      sourceNodeId: nodeId,
      sourcePortId: portId,
      isOutput,
      mousePosition: { x: startX, y: startY },
    });
  }, [graph.nodes]);

  const handlePortMouseUp = useCallback((
    e: React.MouseEvent,
    nodeId: string,
    portId: string,
    isOutput: boolean
  ) => {
    if (!connectionState.isConnecting) return;
    if (connectionState.sourceNodeId === nodeId) return;

    const sourceIsOutput = connectionState.isOutput;
    const targetIsOutput = isOutput;

    if (sourceIsOutput === targetIsOutput) return;

    const sourceNodeId = sourceIsOutput ? connectionState.sourceNodeId : nodeId;
    const sourcePortId = sourceIsOutput ? connectionState.sourcePortId : portId;
    const targetNodeId = sourceIsOutput ? nodeId : connectionState.sourceNodeId;
    const targetPortId = sourceIsOutput ? portId : connectionState.sourcePortId;

    if (!sourceNodeId || !sourcePortId || !targetNodeId || !targetPortId) return;

    const exists = graph.edges.some(
      edge =>
        edge.source === sourceNodeId &&
        edge.target === targetNodeId &&
        edge.sourcePort === sourcePortId &&
        edge.targetPort === targetPortId
    );

    if (!exists) {
      const newEdge: WorkflowEdge = {
        id: generateId('edge'),
        source: sourceNodeId,
        target: targetNodeId,
        sourcePort: sourcePortId,
        targetPort: targetPortId,
      };
      onAddEdge(newEdge);
    }

    setConnectionState({
      isConnecting: false,
      sourceNodeId: null,
      sourcePortId: null,
      isOutput: true,
      mousePosition: { x: 0, y: 0 },
    });
  }, [connectionState, graph.edges, onAddEdge]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();

    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + delta));

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scale = newZoom / zoom;
    const newPanX = mouseX - (mouseX - pan.x) * scale;
    const newPanY = mouseY - (mouseY - pan.y) * scale;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, [zoom, pan]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;

    try {
      const { type, toolId } = JSON.parse(data);
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      const snappedX = Math.round(canvasPos.x / GRID_SIZE) * GRID_SIZE;
      const snappedY = Math.round(canvasPos.y / GRID_SIZE) * GRID_SIZE;

      const newNode = createNode(type, { x: snappedX, y: snappedY }, toolId);
      onAddNode(newNode);
    } catch {
      // ignore
    }
  }, [screenToCanvas, onAddNode]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleZoomIn = () => {
    setZoom(z => Math.min(MAX_ZOOM, z + 0.1));
  };

  const handleZoomOut = () => {
    setZoom(z => Math.max(MIN_ZOOM, z - 0.1));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && document.activeElement?.tagName !== 'INPUT') {
      if (selectedNodeId) {
        onDeleteNode(selectedNodeId);
        onSelectNode(null);
      }
      if (selectedEdgeId) {
        onDeleteEdge(selectedEdgeId);
        setSelectedEdgeId(null);
      }
    }
  }, [selectedNodeId, selectedEdgeId, onDeleteNode, onDeleteEdge, onSelectNode]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const getEdgePath = (edge: WorkflowEdge) => {
    const sourceNode = graph.nodes.find(n => n.id === edge.source);
    const targetNode = graph.nodes.find(n => n.id === edge.target);
    if (!sourceNode || !targetNode) return '';

    const sourcePortIndex = sourceNode.outputPorts.findIndex(p => p.id === edge.sourcePort);
    const targetPortIndex = targetNode.inputPorts.findIndex(p => p.id === edge.targetPort);

    const sourceHeight = calculateNodeHeight(sourceNode);
    const targetHeight = calculateNodeHeight(targetNode);

    const sourceY = sourceNode.position.y + getPortY(sourcePortIndex, sourceNode.outputPorts.length, sourceHeight);
    const targetY = targetNode.position.y + getPortY(targetPortIndex, targetNode.inputPorts.length, targetHeight);

    const sourceX = sourceNode.position.x + NODE_WIDTH;
    const targetX = targetNode.position.x;

    return getBezierPath(sourceX, sourceY, targetX, targetY);
  };

  const getTempEdgePath = () => {
    if (!connectionState.isConnecting || !connectionState.sourceNodeId) return '';

    const sourceNode = graph.nodes.find(n => n.id === connectionState.sourceNodeId);
    if (!sourceNode) return '';

    const ports = connectionState.isOutput ? sourceNode.outputPorts : sourceNode.inputPorts;
    const portIndex = ports.findIndex(p => p.id === connectionState.sourcePortId);
    const nodeHeight = calculateNodeHeight(sourceNode);
    const portY = getPortY(portIndex, ports.length, nodeHeight);

    const sourceX = connectionState.isOutput
      ? sourceNode.position.x + NODE_WIDTH
      : sourceNode.position.x;
    const sourceY = sourceNode.position.y + portY;

    const { x: targetX, y: targetY } = connectionState.mousePosition;

    if (connectionState.isOutput) {
      return getBezierPath(sourceX, sourceY, targetX, targetY);
    } else {
      return getBezierPath(targetX, targetY, sourceX, sourceY);
    }
  };

  const handleEdgeClick = (edgeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEdgeId(edgeId);
    onSelectNode(null);
  };

  const handleAddBranchOutput = (nodeId: string) => {
    const node = graph.nodes.find(n => n.id === nodeId);
    if (!node || node.type !== 'branch') return;

    const newIndex = node.outputPorts.length + 1;
    const newPort = { id: `out-${newIndex}`, label: `分支 ${newIndex}` };
    const newConditions = [...(node.branchConditions || []), `条件 ${newIndex}`];

    onUpdateNode(nodeId, {
      outputPorts: [...node.outputPorts, newPort],
      branchConditions: newConditions,
    });
  };

  const handleAddMergeInput = (nodeId: string) => {
    const node = graph.nodes.find(n => n.id === nodeId);
    if (!node || node.type !== 'merge') return;

    const newIndex = node.inputPorts.length + 1;
    const newPort = { id: `in-${newIndex}`, label: `输入 ${newIndex}` };

    onUpdateNode(nodeId, {
      inputPorts: [...node.inputPorts, newPort],
    });
  };

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full overflow-hidden bg-slate-950/50 rounded-xl"
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseUp}
      onWheel={handleWheel}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div
        className="dag-canvas-bg absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(51, 65, 85, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(51, 65, 85, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: `${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
            </marker>
            <marker
              id="arrowhead-selected"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#14b8a6" />
            </marker>
            <marker
              id="arrowhead-hover"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
            </marker>
          </defs>

          {graph.edges.map(edge => (
            <path
              key={edge.id}
              d={getEdgePath(edge)}
              stroke={selectedEdgeId === edge.id ? '#14b8a6' : '#475569'}
              strokeWidth={selectedEdgeId === edge.id ? 3 : 2}
              fill="none"
              markerEnd={selectedEdgeId === edge.id ? 'url(#arrowhead-selected)' : 'url(#arrowhead)'}
              className="pointer-events-auto cursor-pointer transition-all duration-150 hover:stroke-slate-400"
              onClick={(e) => handleEdgeClick(edge.id, e)}
            />
          ))}

          {connectionState.isConnecting && (
            <path
              d={getTempEdgePath()}
              stroke="#14b8a6"
              strokeWidth={2}
              strokeDasharray="5,5"
              fill="none"
              className="animate-pulse"
            />
          )}
        </svg>

        {graph.nodes.map(node => (
          <DAGNode
            key={node.id}
            node={node}
            isSelected={selectedNodeId === node.id}
            onMouseDown={handleNodeMouseDown}
            onPortMouseDown={handlePortMouseDown}
            onPortMouseUp={handlePortMouseUp}
            onClick={onSelectNode}
          />
        ))}
      </div>

      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        <div className="flex items-center bg-slate-900/80 backdrop-blur-sm rounded-lg border border-slate-700">
          <button
            className="p-2 text-slate-400 hover:text-white transition-colors"
            onClick={handleZoomOut}
            title="缩小"
          >
            <ZoomOut size={16} />
          </button>
          <span className="px-2 text-xs text-slate-400 min-w-[48px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            className="p-2 text-slate-400 hover:text-white transition-colors"
            onClick={handleZoomIn}
            title="放大"
          >
            <ZoomIn size={16} />
          </button>
        </div>
        <button
          className="p-2 bg-slate-900/80 backdrop-blur-sm rounded-lg border border-slate-700 text-slate-400 hover:text-white transition-colors"
          onClick={handleResetView}
          title="重置视图"
        >
          <Maximize2 size={16} />
        </button>
      </div>

      <div className="absolute top-4 left-4 text-xs text-slate-500">
        <p>节点: {graph.nodes.length} | 连线: {graph.edges.length}</p>
        <p className="mt-1">拖拽节点移动 · 拖拽端口连线 · Shift+拖拽平移 · Ctrl+滚轮缩放</p>
      </div>

      {selectedNodeId && (
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg border border-red-500/30 text-red-400 hover:text-red-300 transition-colors"
            onClick={() => { onDeleteNode(selectedNodeId); onSelectNode(null); }}
            title="删除节点"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export { createNode, generateId };
