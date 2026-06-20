import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Info } from 'lucide-react';
import type { ClustalAlignmentData, ClustalColumnInfo } from '@shared/types';

interface ClustalLogoViewerProps {
  data: ClustalAlignmentData;
  sequenceType?: 'dna' | 'protein';
}

interface TooltipData {
  column: ClustalColumnInfo;
  x: number;
  y: number;
}

const DNA_COLORS: Record<string, string> = {
  A: '#22c55e',
  T: '#ef4444',
  G: '#eab308',
  C: '#3b82f6',
  '-': '#64748b',
};

const PROPERTY_COLORS: Record<string, string> = {
  hydrophobic: '#f97316',
  polar: '#22d3ee',
  positive: '#3b82f6',
  negative: '#ef4444',
  special: '#a855f7',
  other: '#64748b',
};

const AMINO_ACID_PROPERTIES: Record<string, keyof typeof PROPERTY_COLORS> = {
  A: 'hydrophobic', V: 'hydrophobic', L: 'hydrophobic', I: 'hydrophobic',
  M: 'hydrophobic', F: 'hydrophobic', W: 'hydrophobic', P: 'hydrophobic',
  S: 'polar', T: 'polar', C: 'polar', N: 'polar', Q: 'polar', Y: 'polar',
  K: 'positive', R: 'positive', H: 'positive',
  D: 'negative', E: 'negative',
  G: 'special', '-': 'other',
};

const getAminoAcidColor = (char: string): string => {
  const prop = AMINO_ACID_PROPERTIES[char.toUpperCase()];
  return PROPERTY_COLORS[prop] || PROPERTY_COLORS.other;
};

const getCharColor = (char: string, sequenceType: 'dna' | 'protein'): string => {
  if (sequenceType === 'dna') {
    return DNA_COLORS[char.toUpperCase()] || DNA_COLORS['-'];
  }
  return getAminoAcidColor(char);
};

const LOGO_HEIGHT = 120;
const CONSERVATION_HEIGHT = 60;
const SEQUENCE_ROW_HEIGHT = 28;
const PADDING_LEFT = 140;
const PADDING_RIGHT = 30;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 60;

export default function ClustalLogoViewer({ data, sequenceType = 'dna' }: ClustalLogoViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [charWidth, setCharWidth] = useState(14);
  const [viewportStart, setViewportStart] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartViewport, setDragStartViewport] = useState(0);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 500 });

  const totalHeight = useMemo(() => {
    return (
      PADDING_TOP +
      LOGO_HEIGHT +
      CONSERVATION_HEIGHT +
      data.sequences.length * SEQUENCE_ROW_HEIGHT +
      PADDING_BOTTOM
    );
  }, [data.sequences.length]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(600, rect.width - 32),
          height: totalHeight,
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [totalHeight]);

  const visibleChars = useMemo(() => {
    return Math.floor((dimensions.width - PADDING_LEFT - PADDING_RIGHT) / charWidth);
  }, [dimensions.width, charWidth]);

  const viewportEnd = Math.min(viewportStart + visibleChars, data.alignmentLength);

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

    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    let yOffset = PADDING_TOP;

    ctx.fillStyle = '#64748b';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Sequence Logo', PADDING_LEFT - 10, yOffset + LOGO_HEIGHT / 2);

    const plotWidth = visibleChars * charWidth;
    const logoAreaStartX = PADDING_LEFT;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(logoAreaStartX, yOffset, plotWidth, LOGO_HEIGHT);

    for (let i = 0; i < visibleChars && viewportStart + i < data.alignmentLength; i++) {
      const colIndex = viewportStart + i;
      const column = data.columns[colIndex];
      if (!column || column.isGapColumn) continue;

      const x = logoAreaStartX + i * charWidth;
      const totalCount = Object.values(column.aminoAcids).reduce((a, b) => a + b, 0);
      if (totalCount === 0) continue;

      const sortedChars = Object.entries(column.aminoAcids).sort((a, b) => a[1] - b[1]);
      let stackY = yOffset + LOGO_HEIGHT;

      sortedChars.forEach(([char, count]) => {
        const freq = count / totalCount;
        const charHeight = LOGO_HEIGHT * freq * column.conservation;
        if (charHeight < 2) return;

        ctx.fillStyle = getCharColor(char, sequenceType);
        ctx.font = `bold ${Math.min(charWidth - 1, charHeight * 0.9).toFixed(0)}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        const scale = charHeight / (Math.min(charWidth - 1, charHeight * 0.9));
        ctx.save();
        ctx.translate(x + charWidth / 2, stackY);
        ctx.scale(1, scale);
        ctx.fillText(char.toUpperCase(), 0, 0);
        ctx.restore();

        stackY -= charHeight;
      });
    }

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(logoAreaStartX, yOffset, plotWidth, LOGO_HEIGHT);

    yOffset += LOGO_HEIGHT + 10;

    ctx.fillStyle = '#64748b';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Conservation', PADDING_LEFT - 10, yOffset + CONSERVATION_HEIGHT / 2);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(logoAreaStartX, yOffset, plotWidth, CONSERVATION_HEIGHT);

    for (let i = 0; i < visibleChars && viewportStart + i < data.alignmentLength; i++) {
      const colIndex = viewportStart + i;
      const conservation = data.conservationScores[colIndex] || 0;
      const x = logoAreaStartX + i * charWidth;
      const barHeight = CONSERVATION_HEIGHT * conservation;

      let color;
      if (conservation >= 0.9) color = '#22c55e';
      else if (conservation >= 0.7) color = '#84cc16';
      else if (conservation >= 0.5) color = '#eab308';
      else if (conservation >= 0.3) color = '#f97316';
      else color = '#64748b';

      ctx.fillStyle = color;
      ctx.fillRect(x + 1, yOffset + CONSERVATION_HEIGHT - barHeight, charWidth - 2, barHeight);
    }

    ctx.strokeStyle = '#334155';
    ctx.strokeRect(logoAreaStartX, yOffset, plotWidth, CONSERVATION_HEIGHT);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('0%', logoAreaStartX + 3, yOffset + CONSERVATION_HEIGHT - 3);
    ctx.textAlign = 'right';
    ctx.fillText('100%', logoAreaStartX + plotWidth - 3, yOffset + 11);

    yOffset += CONSERVATION_HEIGHT + 15;

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('Consensus', PADDING_LEFT - 10, yOffset + SEQUENCE_ROW_HEIGHT / 2);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(logoAreaStartX, yOffset, plotWidth, SEQUENCE_ROW_HEIGHT);

    ctx.font = `bold ${Math.min(charWidth - 2, 16)}px monospace`;
    ctx.textAlign = 'center';
    for (let i = 0; i < visibleChars && viewportStart + i < data.alignmentLength; i++) {
      const colIndex = viewportStart + i;
      const char = data.consensusSequence[colIndex] || '-';
      const x = logoAreaStartX + i * charWidth;
      const conservation = data.conservationScores[colIndex] || 0;

      if (conservation > 0.6) {
        ctx.fillStyle = getCharColor(char, sequenceType);
      } else {
        ctx.fillStyle = '#475569';
      }
      ctx.fillText(char.toUpperCase(), x + charWidth / 2, yOffset + SEQUENCE_ROW_HEIGHT / 2);
    }

    ctx.strokeStyle = '#334155';
    ctx.strokeRect(logoAreaStartX, yOffset, plotWidth, SEQUENCE_ROW_HEIGHT);

    yOffset += SEQUENCE_ROW_HEIGHT + 5;

    ctx.font = `${Math.min(charWidth - 2, 14)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    data.sequences.forEach((seq, seqIdx) => {
      const rowY = yOffset + seqIdx * SEQUENCE_ROW_HEIGHT;

      ctx.fillStyle = '#64748b';
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(seq.name, PADDING_LEFT - 10, rowY + SEQUENCE_ROW_HEIGHT / 2);

      ctx.fillStyle = seqIdx % 2 === 0 ? '#0f172a' : '#0c1322';
      ctx.fillRect(logoAreaStartX, rowY, plotWidth, SEQUENCE_ROW_HEIGHT);

      ctx.font = `${Math.min(charWidth - 2, 14)}px monospace`;
      ctx.textAlign = 'center';
      for (let i = 0; i < visibleChars && viewportStart + i < data.alignmentLength; i++) {
        const colIndex = viewportStart + i;
        const char = seq.sequence[colIndex] || '-';
        const x = logoAreaStartX + i * charWidth;
        const isConsensus = char === data.consensusSequence[colIndex] && char !== '-';

        if (isConsensus) {
          ctx.fillStyle = getCharColor(char, sequenceType);
        } else if (char === '-') {
          ctx.fillStyle = '#334155';
        } else {
          ctx.fillStyle = '#94a3b8';
        }
        ctx.fillText(char.toUpperCase(), x + charWidth / 2, rowY + SEQUENCE_ROW_HEIGHT / 2);
      }

      ctx.strokeStyle = '#1e293b';
      ctx.strokeRect(logoAreaStartX, rowY, plotWidth, SEQUENCE_ROW_HEIGHT);
    });

    yOffset += data.sequences.length * SEQUENCE_ROW_HEIGHT + 20;

    ctx.fillStyle = '#64748b';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    const tickStep = Math.max(1, Math.floor(visibleChars / 10));
    for (let i = 0; i < visibleChars; i += tickStep) {
      if (viewportStart + i >= data.alignmentLength) break;
      const x = logoAreaStartX + i * charWidth + charWidth / 2;
      ctx.fillText(String(viewportStart + i + 1), x, yOffset);
    }

    ctx.fillStyle = '#475569';
    ctx.fillText('Position', logoAreaStartX + plotWidth / 2, yOffset + 20);
  }, [data, dimensions, charWidth, viewportStart, visibleChars, sequenceType]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setCharWidth((prev) => Math.max(4, Math.min(40, prev * delta)));
    } else {
      const scrollDelta = e.deltaY > 0 ? Math.ceil(visibleChars * 0.1) : -Math.ceil(visibleChars * 0.1);
      setViewportStart((prev) => Math.max(0, Math.min(data.alignmentLength - visibleChars, prev + scrollDelta)));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStartX(e.clientX);
      setDragStartViewport(viewportStart);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStartX;
      const charDelta = -Math.round(deltaX / charWidth);
      setViewportStart(Math.max(0, Math.min(data.alignmentLength - visibleChars, dragStartViewport + charDelta)));
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const plotX = mouseX - PADDING_LEFT;
    if (plotX >= 0 && plotX < visibleChars * charWidth) {
      const colIndex = viewportStart + Math.floor(plotX / charWidth);
      if (colIndex >= 0 && colIndex < data.alignmentLength) {
        const column = data.columns[colIndex];
        if (column) {
          setTooltip({ column, x: mouseX, y: mouseY });
          return;
        }
      }
    }
    setTooltip(null);
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => {
    setIsDragging(false);
    setTooltip(null);
  };

  const handleZoomIn = () => setCharWidth((prev) => Math.min(40, prev * 1.3));
  const handleZoomOut = () => setCharWidth((prev) => Math.max(4, prev / 1.3));
  const handleReset = () => {
    setCharWidth(14);
    setViewportStart(0);
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">ClustalW 一致性序列标识图</h3>
          <p className="text-xs text-slate-400">
            {data.sequences.length} 条序列 × {data.alignmentLength} 个位点 ·{' '}
            显示 {viewportStart + 1}-{Math.min(viewportStart + visibleChars, data.alignmentLength)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary p-2" onClick={handleZoomOut}>
            <ZoomOut size={16} />
          </button>
          <span className="text-sm text-slate-300 w-16 text-center">
            {Math.round((charWidth / 14) * 100)}%
          </span>
          <button className="btn-secondary p-2" onClick={handleZoomIn}>
            <ZoomIn size={16} />
          </button>
          <button className="btn-secondary p-2" onClick={handleReset}>
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div ref={containerRef} className="relative w-full overflow-x-auto">
        <canvas
          ref={canvasRef}
          className="rounded-xl border border-slate-800 cursor-crosshair select-none"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />

        {tooltip && (
          <div
            className="absolute z-50 px-3 py-2 text-sm bg-slate-800 text-white rounded-lg shadow-lg border border-slate-700 pointer-events-none"
            style={{
              left: Math.min(tooltip.x + 15, dimensions.width - 260),
              top: tooltip.y + 15,
              minWidth: 200,
            }}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                <span className="text-xs text-slate-400">Position</span>
                <span className="font-mono font-bold text-primary-400">{tooltip.column.position}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Consensus</span>
                <span
                  className="font-mono font-bold text-lg"
                  style={{ color: getCharColor(tooltip.column.consensus, sequenceType) }}
                >
                  {tooltip.column.consensus.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Conservation</span>
                <span className="font-bold text-green-400">
                  {(tooltip.column.conservation * 100).toFixed(0)}%
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-1">Frequency:</span>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(tooltip.column.aminoAcids)
                    .sort((a, b) => b[1] - a[1])
                    .map(([char, count]) => (
                      <span
                        key={char}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono"
                        style={{
                          backgroundColor: `${getCharColor(char, sequenceType)}20`,
                          color: getCharColor(char, sequenceType),
                        }}
                      >
                        {char.toUpperCase()}: {count}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
        {sequenceType === 'dna' ? (
          <>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-green-500 inline-block"></span>
              <span className="text-slate-400">A 腺嘌呤</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-red-500 inline-block"></span>
              <span className="text-slate-400">T 胸腺嘧啶</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-yellow-500 inline-block"></span>
              <span className="text-slate-400">G 鸟嘌呤</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-blue-500 inline-block"></span>
              <span className="text-slate-400">C 胞嘧啶</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-orange-500 inline-block"></span>
              <span className="text-slate-400">疏水</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-cyan-400 inline-block"></span>
              <span className="text-slate-400">极性</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-blue-500 inline-block"></span>
              <span className="text-slate-400">正电</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-red-500 inline-block"></span>
              <span className="text-slate-400">负电</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-purple-500 inline-block"></span>
              <span className="text-slate-400">特殊</span>
            </div>
          </>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <Info size={14} className="text-slate-500" />
          <span className="text-slate-500">滚轮水平滚动 · Ctrl+滚轮缩放 · 拖拽平移 · 悬停查看</span>
        </div>
      </div>
    </div>
  );
}
