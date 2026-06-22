import { useState, useMemo } from 'react';
import type { Variant, VariantType } from '@shared/types';

const variantTypeColors: Record<VariantType, string> = {
  SNP: '#3b82f6',
  INDEL: '#f59e0b',
  INSERTION: '#10b981',
  DELETION: '#ef4444',
  CNV: '#a855f7',
  TRANSLOCATION: '#ec4899',
};

const variantTypeLabels: Record<VariantType, string> = {
  SNP: 'SNP',
  INDEL: 'INDEL',
  INSERTION: '插入',
  DELETION: '缺失',
  CNV: 'CNV',
  TRANSLOCATION: '易位',
};

interface ChromosomeBand {
  name: string;
  start: number;
  end: number;
  stain: 'gneg' | 'gpos25' | 'gpos50' | 'gpos75' | 'gpos100' | 'acen' | 'stalk' | 'gvar';
}

interface ChromosomeSpec {
  name: string;
  length: number;
  centromere: number;
  bands: ChromosomeBand[];
}

const stainColors: Record<string, string> = {
  gneg: '#e2e8f0',
  gpos25: '#cbd5e1',
  gpos50: '#94a3b8',
  gpos75: '#64748b',
  gpos100: '#334155',
  acen: '#991b1b',
  stalk: '#475569',
  gvar: '#334155',
};

const generateChromosomeBands = (name: string, length: number, centromere: number): ChromosomeBand[] => {
  const bands: ChromosomeBand[] = [];
  const pArmLength = centromere;
  const qArmLength = length - centromere;

  const pBandCount = Math.max(3, Math.floor(pArmLength / (length * 0.08)));
  for (let i = 0; i < pBandCount; i++) {
    const start = Math.floor((i / pBandCount) * pArmLength);
    const end = Math.floor(((i + 1) / pBandCount) * pArmLength);
    const stains: ChromosomeBand['stain'][] = ['gneg', 'gpos50', 'gpos25', 'gpos75', 'gneg', 'gpos100'];
    bands.push({
      name: `p${pBandCount - i}`,
      start,
      end,
      stain: stains[i % stains.length],
    });
  }

  bands.push({
    name: 'cen',
    start: centromere - Math.floor(length * 0.015),
    end: centromere + Math.floor(length * 0.015),
    stain: 'acen',
  });

  const qBandCount = Math.max(4, Math.floor(qArmLength / (length * 0.07)));
  for (let i = 0; i < qBandCount; i++) {
    const start = centromere + Math.floor((i / qBandCount) * qArmLength);
    const end = centromere + Math.floor(((i + 1) / qBandCount) * qArmLength);
    const stains: ChromosomeBand['stain'][] = ['gneg', 'gpos100', 'gpos25', 'gneg', 'gpos75', 'gpos50', 'gneg'];
    bands.push({
      name: `q${i + 1}`,
      start,
      end,
      stain: stains[i % stains.length],
    });
  }

  return bands;
};

const CHROMOSOMES: ChromosomeSpec[] = [
  { name: 'chr1', length: 249250621, centromere: 125000000 },
  { name: 'chr2', length: 243199373, centromere: 93300000 },
  { name: 'chr3', length: 198022430, centromere: 91000000 },
  { name: 'chr4', length: 191154276, centromere: 50000000 },
  { name: 'chr5', length: 180915260, centromere: 48000000 },
  { name: 'chr6', length: 171115067, centromere: 61000000 },
  { name: 'chr7', length: 159138663, centromere: 59900000 },
  { name: 'chr8', length: 146364022, centromere: 45600000 },
  { name: 'chr9', length: 141213431, centromere: 49000000 },
  { name: 'chr10', length: 135534747, centromere: 40200000 },
  { name: 'chr11', length: 135006516, centromere: 53700000 },
  { name: 'chr12', length: 133851895, centromere: 35800000 },
  { name: 'chr13', length: 114364328, centromere: 17900000 },
  { name: 'chr14', length: 107043718, centromere: 17600000 },
  { name: 'chr15', length: 102531392, centromere: 19000000 },
  { name: 'chr16', length: 90354753, centromere: 36600000 },
  { name: 'chr17', length: 81195210, centromere: 24000000 },
  { name: 'chr18', length: 78077248, centromere: 17200000 },
  { name: 'chr19', length: 59128983, centromere: 26500000 },
  { name: 'chr20', length: 63025520, centromere: 27500000 },
  { name: 'chr21', length: 48129895, centromere: 13200000 },
  { name: 'chr22', length: 51304566, centromere: 14700000 },
  { name: 'chrX', length: 155270560, centromere: 60600000 },
].map((c) => ({ ...c, bands: generateChromosomeBands(c.name, c.length, c.centromere) }));

export interface VariantWithSample extends Variant {
  sampleName?: string;
}

export interface ChromosomeKaryotypeProps {
  variants: VariantWithSample[];
  height?: number;
  onVariantClick?: (variant: VariantWithSample) => void;
  selectedVariantId?: string | null;
}

interface HoveredVariant {
  variant: VariantWithSample;
  x: number;
  y: number;
}

export default function ChromosomeKaryotype({
  variants,
  height = 520,
  onVariantClick,
  selectedVariantId,
}: ChromosomeKaryotypeProps) {
  const [hoveredVariant, setHoveredVariant] = useState<HoveredVariant | null>(null);
  const [hoveredChromosome, setHoveredChromosome] = useState<string | null>(null);

  const padding = { top: 30, right: 40, bottom: 40, left: 60 };
  const chromosomeGap = 42;
  const chromosomeWidth = 28;
  const columns = 6;

  const innerHeight = height - padding.top - padding.bottom;
  const rows = Math.ceil(CHROMOSOMES.length / columns);
  const rowHeight = innerHeight / rows;
  const maxChrHeight = rowHeight - chromosomeGap * 0.6;

  const maxLength = Math.max(...CHROMOSOMES.map((c) => c.length));

  const variantsByChromosome = useMemo(() => {
    const map = new Map<string, VariantWithSample[]>();
    variants.forEach((v) => {
      if (!map.has(v.chromosome)) map.set(v.chromosome, []);
      map.get(v.chromosome)!.push(v);
    });
    return map;
  }, [variants]);

  const columnWidth = useMemo(() => {
    const totalColumns = Math.min(columns, CHROMOSOMES.length);
    return `calc((100% - ${padding.left + padding.right}px) / ${totalColumns})`;
  }, []);

  const renderChromosome = (chr: ChromosomeSpec, colIndex: number, rowIndex: number) => {
    const chrHeight = Math.max(80, (chr.length / maxLength) * maxChrHeight);
    const xOffset = padding.left + colIndex * chromosomeGap * 2.5 + chromosomeGap * 0.3;
    const yOffset = padding.top + rowIndex * rowHeight + (rowHeight - chrHeight) / 2;

    const chrVariants = variantsByChromosome.get(chr.name) || [];

    const scaleY = (pos: number) => yOffset + (pos / chr.length) * chrHeight;

    const variantPoints = chrVariants.map((v, i) => {
      const cy = scaleY(v.position);
      const isSelected = selectedVariantId === v.id;
      const angle = (i % 5 - 2) * 15;
      const distance = 18 + (i % 3) * 6;
      const cx = xOffset + chromosomeWidth / 2 + Math.sin((angle * Math.PI) / 180) * distance;

      return (
        <g
          key={v.id}
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onVariantClick?.(v);
          }}
          onMouseEnter={(e) => {
            const svg = (e.currentTarget.ownerSVGElement as SVGSVGElement)?.getBoundingClientRect();
            setHoveredVariant({
              variant: v,
              x: (svg ? e.clientX - svg.left : e.clientX),
              y: (svg ? e.clientY - svg.top : e.clientY),
            });
          }}
          onMouseMove={(e) => {
            const svg = (e.currentTarget.ownerSVGElement as SVGSVGElement)?.getBoundingClientRect();
            setHoveredVariant({
              variant: v,
              x: (svg ? e.clientX - svg.left : e.clientX),
              y: (svg ? e.clientY - svg.top : e.clientY),
            });
          }}
          onMouseLeave={() => setHoveredVariant(null)}
        >
          <line
            x1={xOffset + chromosomeWidth / 2}
            y1={cy}
            x2={cx}
            y2={cy}
            stroke={variantTypeColors[v.type]}
            strokeWidth={isSelected ? 2 : 1}
            strokeOpacity={isSelected ? 0.9 : 0.5}
          />
          <circle
            cx={cx}
            cy={cy}
            r={isSelected ? 6 : 4.5}
            fill={variantTypeColors[v.type]}
            stroke={isSelected ? '#ffffff' : 'none'}
            strokeWidth={isSelected ? 2 : 0}
            opacity={isSelected ? 1 : 0.85}
          />
          {isSelected && (
            <circle
              cx={cx}
              cy={cy}
              r={9}
              fill="none"
              stroke={variantTypeColors[v.type]}
              strokeWidth={1.5}
              strokeDasharray="2 2"
              opacity={0.6}
            />
          )}
        </g>
      );
    });

    return (
      <g
        key={chr.name}
        onMouseEnter={() => setHoveredChromosome(chr.name)}
        onMouseLeave={() => setHoveredChromosome(null)}
      >
        <text
          x={xOffset + chromosomeWidth / 2}
          y={yOffset - 8}
          textAnchor="middle"
          fontSize={12}
          fontWeight={600}
          fill={hoveredChromosome === chr.name ? '#e2e8f0' : '#94a3b8'}
          style={{ transition: 'fill 0.2s' }}
        >
          {chr.name.replace('chr', '')}
        </text>

        {chr.bands.map((band, i) => {
          const bandY = yOffset + (band.start / chr.length) * chrHeight;
          const bandHeight = Math.max(1, ((band.end - band.start) / chr.length) * chrHeight);
          const isCentromere = band.stain === 'acen';

          if (isCentromere) {
            return (
              <g key={i}>
                <path
                  d={`
                    M ${xOffset + 1} ${bandY}
                    Q ${xOffset + chromosomeWidth / 2} ${bandY - bandHeight}
                      ${xOffset + chromosomeWidth - 1} ${bandY}
                    Q ${xOffset + chromosomeWidth / 2} ${bandY + bandHeight * 1.5}
                      ${xOffset + 1} ${bandY}
                    Z
                  `}
                  fill={stainColors.acen}
                />
              </g>
            );
          }

          const rx = chromosomeWidth / 2 - 0.5;
          const isTop = i === 0;
          const isBottom = i === chr.bands.length - 1;

          return (
            <rect
              key={i}
              x={xOffset + 0.5}
              y={bandY}
              width={chromosomeWidth - 1}
              height={bandHeight}
              fill={stainColors[band.stain] || stainColors.gneg}
              rx={isTop || isBottom ? rx : 0}
              ry={isTop || isBottom ? rx : 0}
            />
          );
        })}

        <rect
          x={xOffset}
          y={yOffset}
          width={chromosomeWidth}
          height={chrHeight}
          fill="none"
          stroke={hoveredChromosome === chr.name ? '#6366f1' : '#475569'}
          strokeWidth={hoveredChromosome === chr.name ? 1.5 : 0.5}
          rx={chromosomeWidth / 2}
          ry={chromosomeWidth / 2}
          style={{ transition: 'stroke 0.2s' }}
        />

        <text
          x={xOffset + chromosomeWidth / 2}
          y={yOffset + chrHeight + 16}
          textAnchor="middle"
          fontSize={10}
          fill="#64748b"
        >
          {chrVariants.length > 0 && `${chrVariants.length}`}
        </text>

        {variantPoints}
      </g>
    );
  };

  const stats = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    variants.forEach((v) => {
      typeCounts[v.type] = (typeCounts[v.type] || 0) + 1;
    });
    return typeCounts;
  }, [variants]);

  return (
    <div className="relative w-full">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${padding.left + columns * chromosomeGap * 2.5 + padding.right} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {CHROMOSOMES.map((chr, idx) => {
          const colIndex = idx % columns;
          const rowIndex = Math.floor(idx / columns);
          return renderChromosome(chr, colIndex, rowIndex);
        })}
      </svg>

      <div className="mt-2 flex items-center justify-center gap-x-6 gap-y-2 flex-wrap px-4">
        {(Object.keys(variantTypeColors) as VariantType[]).map((type) => (
          <div key={type} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: variantTypeColors[type] }}
            />
            <span className="text-xs text-slate-400">
              {variantTypeLabels[type]}
              {stats[type] !== undefined && (
                <span className="text-slate-500 ml-1">({stats[type]})</span>
              )}
            </span>
          </div>
        ))}
      </div>

      {hoveredVariant && (
        <div
          className="absolute z-50 pointer-events-none"
          style={{
            left: Math.min(hoveredVariant.x + 14, window.innerWidth - 280),
            top: Math.max(hoveredVariant.y - 10, 0),
          }}
        >
          <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-xl shadow-2xl p-3.5 min-w-[240px] max-w-[280px]">
            <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-slate-700">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: variantTypeColors[hoveredVariant.variant.type] }}
              />
              <span className="text-sm font-semibold text-white font-mono truncate">
                {hoveredVariant.variant.chromosome}:{hoveredVariant.variant.position.toLocaleString()}
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              {hoveredVariant.variant.gene && (
                <div className="flex justify-between gap-3">
                  <span className="text-slate-400 flex-shrink-0">基因</span>
                  <span className="text-white font-mono truncate">{hoveredVariant.variant.gene}</span>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <span className="text-slate-400 flex-shrink-0">变化</span>
                <span className="font-mono">
                  <span className="text-green-400">{hoveredVariant.variant.ref}</span>
                  <span className="text-slate-500 mx-0.5">→</span>
                  <span className="text-red-400">{hoveredVariant.variant.alt}</span>
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400 flex-shrink-0">类型</span>
                <span
                  className="px-1.5 py-0.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor: `${variantTypeColors[hoveredVariant.variant.type]}20`,
                    color: variantTypeColors[hoveredVariant.variant.type],
                  }}
                >
                  {variantTypeLabels[hoveredVariant.variant.type]}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400 flex-shrink-0">影响</span>
                <span className="text-slate-200">{hoveredVariant.variant.effect}</span>
              </div>
              {hoveredVariant.variant.proteinChange && (
                <div className="flex justify-between gap-3">
                  <span className="text-slate-400 flex-shrink-0">蛋白改变</span>
                  <span className="text-white font-mono truncate">{hoveredVariant.variant.proteinChange}</span>
                </div>
              )}
              {hoveredVariant.variant.clinicalSignificance && (
                <div className="flex justify-between gap-3">
                  <span className="text-slate-400 flex-shrink-0">临床意义</span>
                  <span className="text-slate-200">{hoveredVariant.variant.clinicalSignificance.replace('_', ' ')}</span>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <span className="text-slate-400 flex-shrink-0">AF</span>
                <span className="text-slate-200">{(hoveredVariant.variant.alleleFrequency * 100).toFixed(1)}%</span>
              </div>
              {hoveredVariant.variant.sampleName && (
                <div className="flex justify-between gap-3">
                  <span className="text-slate-400 flex-shrink-0">样本</span>
                  <span className="text-slate-200 truncate">{hoveredVariant.variant.sampleName}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
