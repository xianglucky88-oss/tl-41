import { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Info } from 'lucide-react';
import type { BlastDotPlotData, BlastHSP } from '@shared/types';

interface BlastDotPlotProps {
  data: BlastDotPlotData;
}

interface TooltipData {
  hsp: BlastHSP;
  x: number;
  y: number;
}

const CANVAS_PADDING_LEFT = 80;
const CANVAS_PADDING_RIGHT = 40;
const CANVAS_PADDING_TOP = 60;
const CANVAS_PADDING_BOTTOM = 100;

export default function BlastDotPlot({ data }: BlastDotPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  const getColorForIdentity = (percentIdentity: number, strand: 'plus' | 'minus') => {
    const t = Math.max(0, Math.min(1, (percentIdentity - 70) / 30));
    if (strand === 'plus') {
      const r = Math.round(34 + (16 - 34) * t);
      const g = Math.round(197 + (185 - 197) * t);
      const b = Math.round(94 + (236 - 94) * t);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      const r = Math.round(239 + (251 - 239) * t);
      const g = Math.round(68 + (191 - 68) * t);
      const b = Math.round(68 + (36 - 68) * t);
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(600, rect.width - 32),
          height: 500,
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;
    ctx.scale(dpr, dpr);

    const plotWidth = dimensions.width - CANVAS_PADDING_LEFT - CANVAS_PADDING_RIGHT;
    const plotHeight = dimensions.height - CANVAS_PADDING_TOP - CANVAS_PADDING_BOTTOM;

    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(CANVAS_PADDING_LEFT, CANVAS_PADDING_TOP, plotWidth, plotHeight);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    const gridLines = 10;
    for (let i = 0; i <= gridLines; i++) {
      const x = CANVAS_PADDING_LEFT + (plotWidth / gridLines) * i;
      const y = CANVAS_PADDING_TOP + (plotHeight / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(x, CANVAS_PADDING_TOP);
      ctx.lineTo(x, CANVAS_PADDING_TOP + plotHeight);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(CANVAS_PADDING_LEFT, y);
      ctx.lineTo(CANVAS_PADDING_LEFT + plotWidth, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(CANVAS_PADDING_LEFT, CANVAS_PADDING_TOP, plotWidth, plotHeight);

    ctx.fillStyle = '#64748b';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i <= gridLines; i++) {
      const x = CANVAS_PADDING_LEFT + (plotWidth / gridLines) * i;
      const value = Math.round((i / gridLines) * data.queryLength);
      ctx.fillText(value.toLocaleString(), x, CANVAS_PADDING_TOP + plotHeight + 18);
    }
    ctx.textAlign = 'right';
    for (let i = 0; i <= gridLines; i++) {
      const y = CANVAS_PADDING_TOP + (plotHeight / gridLines) * i;
      const value = Math.round((i / gridLines) * data.subjectLength);
      ctx.fillText(value.toLocaleString(), CANVAS_PADDING_LEFT - 8, y + 4);
    }

    data.hsps.forEach((hsp) => {
      const queryStartRatio = (hsp.queryStart - 1) / data.queryLength;
      const queryEndRatio = (hsp.queryEnd - 1) / data.queryLength;
      const subjectStartRatio = (hsp.subjectStart - 1) / data.subjectLength;
      const subjectEndRatio = (hsp.subjectEnd - 1) / data.subjectLength;

      const x1 = CANVAS_PADDING_LEFT + queryStartRatio * plotWidth * scale + offset.x;
      const x2 = CANVAS_PADDING_LEFT + queryEndRatio * plotWidth * scale + offset.x;
      let y1, y2;
      if (hsp.strand === 'plus') {
        y1 = CANVAS_PADDING_TOP + subjectStartRatio * plotHeight * scale + offset.y;
        y2 = CANVAS_PADDING_TOP + subjectEndRatio * plotHeight * scale + offset.y;
      } else {
        y1 = CANVAS_PADDING_TOP + subjectEndRatio * plotHeight * scale + offset.y;
        y2 = CANVAS_PADDING_TOP + subjectStartRatio * plotHeight * scale + offset.y;
      }

      if (
        Math.max(x1, x2) < CANVAS_PADDING_LEFT ||
        Math.min(x1, x2) > CANVAS_PADDING_LEFT + plotWidth ||
        Math.max(y1, y2) < CANVAS_PADDING_TOP ||
        Math.min(y1, y2) > CANVAS_PADDING_TOP + plotHeight
      ) {
        return;
      }

      ctx.strokeStyle = getColorForIdentity(hsp.percentIdentity, hsp.strand);
      ctx.lineWidth = Math.max(1.5, 3 * scale);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });
  }, [data, dimensions, scale, offset]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((prev) => Math.max(0.5, Math.min(8, prev * delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const plotWidth = dimensions.width - CANVAS_PADDING_LEFT - CANVAS_PADDING_RIGHT;
    const plotHeight = dimensions.height - CANVAS_PADDING_TOP - CANVAS_PADDING_BOTTOM;

    if (
      mouseX >= CANVAS_PADDING_LEFT &&
      mouseX <= CANVAS_PADDING_LEFT + plotWidth &&
      mouseY >= CANVAS_PADDING_TOP &&
      mouseY <= CANVAS_PADDING_TOP + plotHeight
    ) {
      let closestHSP: BlastHSP | null = null;
      let minDist = Infinity;

      data.hsps.forEach((hsp) => {
        const queryStartRatio = (hsp.queryStart - 1) / data.queryLength;
        const queryEndRatio = (hsp.queryEnd - 1) / data.queryLength;
        const subjectStartRatio = (hsp.subjectStart - 1) / data.subjectLength;
        const subjectEndRatio = (hsp.subjectEnd - 1) / data.subjectLength;

        const x1 = CANVAS_PADDING_LEFT + queryStartRatio * plotWidth * scale + offset.x;
        const x2 = CANVAS_PADDING_LEFT + queryEndRatio * plotWidth * scale + offset.x;
        let y1, y2;
        if (hsp.strand === 'plus') {
          y1 = CANVAS_PADDING_TOP + subjectStartRatio * plotHeight * scale + offset.y;
          y2 = CANVAS_PADDING_TOP + subjectEndRatio * plotHeight * scale + offset.y;
        } else {
          y1 = CANVAS_PADDING_TOP + subjectEndRatio * plotHeight * scale + offset.y;
          y2 = CANVAS_PADDING_TOP + subjectStartRatio * plotHeight * scale + offset.y;
        }

        const A = mouseX - x1;
        const B = mouseY - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = lenSq !== 0 ? dot / lenSq : -1;

        param = Math.max(0, Math.min(1, param));

        const xx = x1 + param * C;
        const yy = y1 + param * D;

        const dist = Math.sqrt((mouseX - xx) ** 2 + (mouseY - yy) ** 2);

        if (dist < minDist && dist < 10) {
          minDist = dist;
          closestHSP = hsp;
        }
      });

      if (closestHSP) {
        setTooltip({ hsp: closestHSP, x: mouseX, y: mouseY });
      } else {
        setTooltip(null);
      }
    } else {
      setTooltip(null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setTooltip(null);
  };

  const handleZoomIn = () => setScale((prev) => Math.min(8, prev * 1.3));
  const handleZoomOut = () => setScale((prev) => Math.max(0.5, prev / 1.3));
  const handleReset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">BLAST 点阵图</h3>
          <p className="text-xs text-slate-400">
            Query: <span className="text-primary-400">{data.queryId}</span> ({data.queryLength.toLocaleString()} bp) × Subject:{' '}
            <span className="text-accent-400">{data.subjectId}</span> ({data.subjectLength.toLocaleString()} bp)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary p-2" onClick={handleZoomOut}>
            <ZoomOut size={16} />
          </button>
          <span className="text-sm text-slate-300 w-16 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button className="btn-secondary p-2" onClick={handleZoomIn}>
            <ZoomIn size={16} />
          </button>
          <button className="btn-secondary p-2" onClick={handleReset}>
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div ref={containerRef} className="relative w-full">
        <canvas
          ref={canvasRef}
          className="rounded-xl border border-slate-800 cursor-crosshair"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />

        <div className="absolute left-2 top-20 w-12 flex flex-col items-center justify-start pointer-events-none">
          <span className="text-xs text-slate-400 rotate-[-90deg] whitespace-nowrap origin-center">
            Subject Position (bp)
          </span>
        </div>

        <div className="absolute bottom-16 left-20 right-16 text-center pointer-events-none">
          <span className="text-xs text-slate-400">Query Position (bp)</span>
        </div>

        {tooltip && (
          <div
            className="absolute z-50 px-3 py-2 text-sm bg-slate-800 text-white rounded-lg shadow-lg border border-slate-700 pointer-events-none"
            style={{
              left: Math.min(tooltip.x + 15, dimensions.width - 220),
              top: tooltip.y + 15,
            }}
          >
            <div className="space-y-1.5">
              <div className="font-mono text-xs text-slate-300">
                <span className="text-primary-400">{data.queryId}</span>
                : {tooltip.hsp.queryStart}-{tooltip.hsp.queryEnd}
              </div>
              <div className="font-mono text-xs text-slate-300">
                <span className="text-accent-400">{data.subjectId}</span>
                : {tooltip.hsp.subjectStart}-{tooltip.hsp.subjectEnd}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs pt-1 border-t border-slate-700">
                <span className="text-green-400">Identity: {tooltip.hsp.percentIdentity.toFixed(1)}%</span>
                <span className="text-blue-400">Length: {tooltip.hsp.alignmentLength}</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <span className="text-yellow-400">Bit: {tooltip.hsp.bitScore.toFixed(0)}</span>
                <span className="text-rose-400">E: {tooltip.hsp.eValue.toExponential(2)}</span>
                <span className={tooltip.hsp.strand === 'plus' ? 'text-teal-400' : 'text-orange-400'}>
                  Strand: {tooltip.hsp.strand}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-gradient-to-r from-teal-900 to-teal-400 rounded"></div>
          <span className="text-slate-400">正向链 (Plus)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-gradient-to-r from-rose-900 to-rose-400 rounded"></div>
          <span className="text-slate-400">反向链 (Minus)</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Info size={14} className="text-slate-500" />
          <span className="text-slate-500">滚轮缩放 · 拖拽平移 · 悬停查看</span>
        </div>
      </div>
    </div>
  );
}
