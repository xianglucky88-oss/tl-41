interface DnaSequenceViewerProps {
  sequence: string;
  showColors?: boolean;
  lineLength?: number;
  showPositions?: boolean;
}

export default function DnaSequenceViewer({
  sequence,
  showColors = true,
  lineLength = 100,
  showPositions = true,
}: DnaSequenceViewerProps) {
  const renderBase = (base: string) => {
    if (!showColors) return <span>{base}</span>;
    const baseClass = {
      A: 'dna-base-a',
      T: 'dna-base-t',
      G: 'dna-base-g',
      C: 'dna-base-c',
      N: 'dna-base-n',
    }[base.toUpperCase()] || 'text-slate-400';
    return <span className={baseClass}>{base}</span>;
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
    <div className="sequence-display bg-slate-950/50 rounded-xl p-4 overflow-x-auto border border-slate-800">
      {lines.map((line, idx) => (
        <div key={idx} className="flex whitespace-nowrap">
          {showPositions && (
            <span className="text-slate-500 w-24 flex-shrink-0 select-none">
              {line.start.toString().padStart(6, '0')}
            </span>
          )}
          <span className="flex-1">
            {line.sequence.split('').map((base, bi) => (
              <span key={bi}>{renderBase(base)}</span>
            ))}
          </span>
          {showPositions && (
            <span className="text-slate-500 w-24 text-right flex-shrink-0 select-none ml-4">
              {line.end.toString().padStart(6, '0')}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
