import { useState, useRef, useCallback, useEffect } from 'react';
import type { Primer } from '@shared/types';

interface HighlightRegion {
  start: number;
  end: number;
  color: string;
  label?: string;
}

interface SelectableSequenceViewerProps {
  sequence: string;
  showColors?: boolean;
  lineLength?: number;
  showPositions?: boolean;
  selectionStart?: number;
  selectionEnd?: number;
  onSelectionChange?: (start: number, end: number) => void;
  highlights?: HighlightRegion[];
  primers?: { forward?: Primer[]; reverse?: Primer[] };
  selectedPair?: { forward?: Primer; reverse?: Primer };
}

const BASE_CLASS: Record<string, string> = {
  A: 'dna-base-a',
  T: 'dna-base-t',
  G: 'dna-base-g',
  C: 'dna-base-c',
  N: 'dna-base-n',
};

export default function SelectableSequenceViewer({
  sequence,
  showColors = true,
  lineLength = 100,
  showPositions = true,
  selectionStart,
  selectionEnd,
  onSelectionChange,
  highlights = [],
  primers,
  selectedPair,
}: SelectableSequenceViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [localSelection, setLocalSelection] = useState<{ start: number; end: number } | null>(
    selectionStart != null && selectionEnd != null ? { start: selectionStart, end: selectionEnd } : null
  );

  useEffect(() => {
    if (selectionStart != null && selectionEnd != null) {
      setLocalSelection({ start: selectionStart, end: selectionEnd });
    }
  }, [selectionStart, selectionEnd]);

  const getPositionFromEvent = useCallback((clientX: number, clientY: number): number | null => {
    const container = containerRef.current;
    if (!container) return null;

    const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    if (!el) return null;

    const posAttr = el.getAttribute('data-pos');
    if (posAttr) {
      return parseInt(posAttr, 10);
    }

    const parent = el.closest('[data-pos]') as HTMLElement | null;
    if (parent) {
      return parseInt(parent.getAttribute('data-pos') || '0', 10);
    }

    return null;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!onSelectionChange) return;
    const pos = getPositionFromEvent(e.clientX, e.clientY);
    if (pos == null) return;
    setIsDragging(true);
    setDragStart(pos);
    setLocalSelection({ start: pos, end: pos });
  }, [onSelectionChange, getPositionFromEvent]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || dragStart == null) return;
    const pos = getPositionFromEvent(e.clientX, e.clientY);
    if (pos == null) return;
    const start = Math.min(dragStart, pos);
    const end = Math.max(dragStart, pos);
    setLocalSelection({ start, end });
  }, [isDragging, dragStart, getPositionFromEvent]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && localSelection && onSelectionChange) {
      onSelectionChange(localSelection.start, localSelection.end);
    }
    setIsDragging(false);
    setDragStart(null);
  }, [isDragging, localSelection, onSelectionChange]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging && localSelection && onSelectionChange) {
        onSelectionChange(localSelection.start, localSelection.end);
      }
      setIsDragging(false);
      setDragStart(null);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, localSelection, onSelectionChange]);

  const isInSelection = (pos: number): boolean => {
    if (!localSelection) return false;
    return pos >= localSelection.start && pos <= localSelection.end;
  };

  const getHighlightForPos = (pos: number): HighlightRegion | null => {
    for (const h of highlights) {
      if (pos >= h.start && pos <= h.end) return h;
    }
    return null;
  };

  const getPrimerForPos = (pos: number): { primer: Primer; isSelected: boolean } | null => {
    if (!primers) return null;
    if (selectedPair?.forward) {
      const p = selectedPair.forward;
      if (pos >= p.start && pos <= p.end) return { primer: p, isSelected: true };
    }
    if (selectedPair?.reverse) {
      const p = selectedPair.reverse;
      if (pos >= p.start && pos <= p.end) return { primer: p, isSelected: true };
    }
    if (primers.forward) {
      for (const p of primers.forward.slice(0, 3)) {
        if (pos >= p.start && pos <= p.end) return { primer: p, isSelected: false };
      }
    }
    if (primers.reverse) {
      for (const p of primers.reverse.slice(0, 3)) {
        if (pos >= p.start && pos <= p.end) return { primer: p, isSelected: false };
      }
    }
    return null;
  };

  const lines = [];
  for (let i = 0; i < sequence.length; i += lineLength) {
    const line = sequence.slice(i, i + lineLength);
    lines.push({
      start: i + 1,
      end: Math.min(i + lineLength, sequence.length),
      sequence: line,
    });
  }

  return (
    <div
      ref={containerRef}
      className={`sequence-display bg-slate-950/50 rounded-xl p-4 overflow-x-auto border border-slate-800 ${onSelectionChange ? 'cursor-crosshair select-none' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {lines.map((line, lineIdx) => (
        <div key={lineIdx} className="flex whitespace-nowrap">
          {showPositions && (
            <span className="text-slate-500 w-24 flex-shrink-0 select-none">
              {line.start.toString().padStart(6, '0')}
            </span>
          )}
          <span className="flex-1">
            {line.sequence.split('').map((base, bi) => {
              const pos = line.start + bi;
              const inSel = isInSelection(pos);
              const highlight = getHighlightForPos(pos);
              const primerInfo = getPrimerForPos(pos);
              const baseClass = showColors ? (BASE_CLASS[base.toUpperCase()] || 'text-slate-400') : 'text-slate-300';

              let bgStyle = '';
              if (primerInfo?.isSelected) {
                bgStyle = primerInfo.primer.direction === 'forward'
                  ? 'bg-emerald-500/40'
                  : 'bg-rose-500/40';
              } else if (primerInfo) {
                bgStyle = primerInfo.primer.direction === 'forward'
                  ? 'bg-emerald-500/20'
                  : 'bg-rose-500/20';
              } else if (inSel) {
                bgStyle = 'bg-primary-500/30';
              } else if (highlight) {
                bgStyle = highlight.color;
              }

              return (
                <span
                  key={bi}
                  data-pos={pos}
                  className={`${baseClass} ${bgStyle} transition-colors duration-75`}
                >
                  {base}
                </span>
              );
            })}
          </span>
          {showPositions && (
            <span className="text-slate-500 w-24 text-right flex-shrink-0 select-none ml-4">
              {line.end.toString().padStart(6, '0')}
            </span>
          )}
        </div>
      ))}

      {localSelection && (
        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-4 text-sm">
          <span className="text-slate-500">选中区域:</span>
          <span className="font-mono text-primary-400 font-bold">
            {localSelection.start.toLocaleString()} - {localSelection.end.toLocaleString()}
          </span>
          <span className="text-slate-500">
            ({(localSelection.end - localSelection.start + 1).toLocaleString()} bp)
          </span>
        </div>
      )}
    </div>
  );
}
