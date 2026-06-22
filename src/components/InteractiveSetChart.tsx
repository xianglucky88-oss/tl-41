import { useMemo } from 'react';
import type { SubsetInfo } from '@/utils/setOperations';
import { VENN_COLORS } from '@/utils/setOperations';

export interface InteractiveSetChartProps {
  sampleIds: string[];
  sampleNames: string[];
  subsets: SubsetInfo[];
  selectedSubsetId: string | null;
  onSelectSubset: (id: string | null) => void;
  totalCount: number;
  sharedCount: number;
  uniqueCount: number;
  pathogenicCount: number;
}

type RegionClickHandler = (subsetId: string | null) => void;

export default function InteractiveSetChart(props: InteractiveSetChartProps) {
  const { sampleIds, sampleNames, subsets, selectedSubsetId, onSelectSubset } = props;
  const n = sampleIds.length;

  const getSubset = (mask: string): SubsetInfo | undefined => {
    if (n === 2) {
      const ids: string[] = [];
      for (let i = 0; i < 2; i++) {
        if (mask[i] === '1') ids.push(sampleIds[i]);
      }
      return subsets.find((s) => s.id === ids.join('|'));
    }
    if (n === 3) {
      const ids: string[] = [];
      for (let i = 0; i < 3; i++) {
        if (mask[i] === '1') ids.push(sampleIds[i]);
      }
      return subsets.find((s) => s.id === ids.join('|'));
    }
    return undefined;
  };

  if (n < 2) {
    return <EmptyView />;
  }

  if (n === 2) {
    return <VennDiagram2 samples={sampleNames} getSubset={getSubset} selected={selectedSubsetId} onSelect={onSelectSubset} {...props} />;
  }

  if (n === 3) {
    return <VennDiagram3 samples={sampleNames} getSubset={getSubset} selected={selectedSubsetId} onSelect={onSelectSubset} {...props} />;
  }

  return <UpSetPlot {...props} />;
}

function EmptyView() {
  return (
    <div className="card p-8 text-center">
      <p className="text-slate-400">请选择至少2个样本</p>
    </div>
  );
}

interface VennCommonProps {
  samples: string[];
  getSubset: (mask: string) => SubsetInfo | undefined;
  selected: string | null;
  onSelect: RegionClickHandler;
}

function VennDiagram2({ samples, getSubset, selected, onSelect, totalCount, sharedCount, uniqueCount, pathogenicCount }: VennCommonProps & InteractiveSetChartProps) {
  const reg01 = getSubset('01');
  const reg10 = getSubset('10');
  const reg11 = getSubset('11');

  if (!reg01 || !reg10 || !reg11) return null;

  const c0 = VENN_COLORS[0];
  const c1 = VENN_COLORS[1];

  const isSelected = (id: string | null) => selected === id;
  const hasSelection = selected !== null;

  const regionOpacity = (id: string) => {
    if (!hasSelection) return 1;
    return isSelected(id) ? 1 : 0.25;
  };

  const textOpacity = (id: string) => {
    if (!hasSelection) return 1;
    return isSelected(id) ? 1 : 0.3;
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">集合重叠分析</h2>
        <SummaryBadge selected={selected} onClear={() => onSelect(null)} />
      </div>

      <div className="flex items-center gap-6">
        <svg viewBox="0 0 500 320" className="w-full max-w-xl flex-1">
          <defs>
            <clipPath id="clip-left-2"><circle cx="200" cy="160" r="110" /></clipPath>
          </defs>

          <circle
            cx="200" cy="160" r="110"
            fill={c0.fill}
            stroke={c0.stroke} strokeWidth="2"
            style={{
              opacity: hasSelection ? (isSelected(reg01.id) ? 1 : 0.4) : 1,
              filter: isSelected(reg01.id) ? `drop-shadow(0 0 10px ${c0.stroke})` : undefined
            }}
            className="cursor-pointer transition-all duration-200"
            onClick={() => onSelect(isSelected(reg01.id) ? null : reg01.id)}
          />
          <circle
            cx="300" cy="160" r="110"
            fill={c1.fill}
            stroke={c1.stroke} strokeWidth="2"
            style={{
              opacity: hasSelection ? (isSelected(reg10.id) ? 1 : 0.4) : 1,
              filter: isSelected(reg10.id) ? `drop-shadow(0 0 10px ${c1.stroke})` : undefined
            }}
            className="cursor-pointer transition-all duration-200"
            onClick={() => onSelect(isSelected(reg10.id) ? null : reg10.id)}
          />

          <g clipPath="url(#clip-left-2)">
            <circle
              cx="300" cy="160" r="110"
              fill="rgba(168, 85, 247, 0.55)"
              style={{
                opacity: regionOpacity(reg11.id),
                filter: isSelected(reg11.id) ? 'drop-shadow(0 0 14px rgba(168,85,247,0.8))' : undefined
              }}
              className="cursor-pointer transition-all duration-200"
              onClick={() => onSelect(isSelected(reg11.id) ? null : reg11.id)}
            />
          </g>

          <text
            x="140" y="160"
            textAnchor="middle"
            fontSize="28"
            fontWeight="bold"
            fill="white"
            style={{ opacity: textOpacity(reg01.id), pointerEvents: 'auto', cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); onSelect(isSelected(reg01.id) ? null : reg01.id); }}
          >
            {reg01.count}
          </text>
          <text
            x="360" y="160"
            textAnchor="middle"
            fontSize="28"
            fontWeight="bold"
            fill="white"
            style={{ opacity: textOpacity(reg10.id), pointerEvents: 'auto', cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); onSelect(isSelected(reg10.id) ? null : reg10.id); }}
          >
            {reg10.count}
          </text>
          <text
            x="250" y="165"
            textAnchor="middle"
            fontSize="26"
            fontWeight="bold"
            fill="white"
            style={{ opacity: textOpacity(reg11.id), pointerEvents: 'auto', cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); onSelect(isSelected(reg11.id) ? null : reg11.id); }}
          >
            {reg11.count}
          </text>

          <text x="120" y="60" textAnchor="middle" fontSize="13" fill={c0.text} fontWeight="600">
            {samples[0]}
          </text>
          <text x="380" y="60" textAnchor="middle" fontSize="13" fill={c1.text} fontWeight="600">
            {samples[1]}
          </text>
          <text x="120" y="78" textAnchor="middle" fontSize="11" fill="rgb(148, 163, 184)">
            特有
          </text>
          <text x="380" y="78" textAnchor="middle" fontSize="11" fill="rgb(148, 163, 184)">
            特有
          </text>

          <text x="250" y="270" textAnchor="middle" fontSize="13" fill="rgb(191, 219, 254)" fontWeight="600">
            共有变异
          </text>
          <text x="250" y="288" textAnchor="middle" fontSize="11" fill="rgb(148, 163, 184)">
            点击任意区域筛选表格，再次点击取消
          </text>
        </svg>

        <div className="flex flex-col gap-3 min-w-[180px]">
          <StatCard label="总变异" value={totalCount} color="text-white" onClick={() => onSelect(null)} selected={selected === null} />
          <StatCard label="共有变异" value={sharedCount} color="text-primary-400" onClick={() => onSelect(isSelected(reg11.id) ? null : reg11.id)} selected={isSelected(reg11.id)} />
          <StatCard label="特有变异" value={uniqueCount} color="text-accent-400" sublabel={`${reg01.count} + ${reg10.count}`} />
          <StatCard label="致病性" value={pathogenicCount} color="text-red-400" />
        </div>
      </div>
    </div>
  );
}

function VennDiagram3({ samples, getSubset, selected, onSelect, totalCount, sharedCount, uniqueCount, pathogenicCount }: VennCommonProps & InteractiveSetChartProps) {
  const reg001 = getSubset('001');
  const reg010 = getSubset('010');
  const reg011 = getSubset('011');
  const reg100 = getSubset('100');
  const reg101 = getSubset('101');
  const reg110 = getSubset('110');
  const reg111 = getSubset('111');

  if (!reg001 || !reg010 || !reg011 || !reg100 || !reg101 || !reg110 || !reg111) return null;

  const c0 = VENN_COLORS[0];
  const c1 = VENN_COLORS[1];
  const c2 = VENN_COLORS[2];

  const circles = [
    { cx: 200, cy: 200, r: 105, color: c0, subset: reg001 },
    { cx: 300, cy: 200, r: 105, color: c1, subset: reg010 },
    { cx: 250, cy: 115, r: 105, color: c2, subset: reg100 },
  ];

  const hasSelection = selected !== null;
  const isSel = (id: string | null) => selected === id;

  const regionOpacity = (id: string) => hasSelection ? (isSel(id) ? 1 : 0.25) : 1;
  const textOpacity = (id: string) => hasSelection ? (isSel(id) ? 1 : 0.35) : 1;

  const handleRegionClick = (id: string) => onSelect(isSel(id) ? null : id);

  const glowFilter = (id: string, stroke: string) => isSel(id) ? `drop-shadow(0 0 10px ${stroke})` : undefined;

  const stopText = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    handleRegionClick(id);
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">集合重叠分析</h2>
        <SummaryBadge selected={selected} onClear={() => onSelect(null)} />
      </div>

      <div className="flex items-start gap-6">
        <svg viewBox="0 0 500 370" className="w-full max-w-xl flex-1">
          <defs>
            <clipPath id="v3-c0"><circle cx={circles[0].cx} cy={circles[0].cy} r={circles[0].r} /></clipPath>
            <clipPath id="v3-c1"><circle cx={circles[1].cx} cy={circles[1].cy} r={circles[1].r} /></clipPath>
            <clipPath id="v3-c2"><circle cx={circles[2].cx} cy={circles[2].cy} r={circles[2].r} /></clipPath>
            <clipPath id="v3-c0c1"><circle cx={circles[0].cx} cy={circles[0].cy} r={circles[0].r} /></clipPath>
          </defs>

          <circle cx={circles[0].cx} cy={circles[0].cy} r={circles[0].r}
            fill={c0.fill} stroke={c0.stroke} strokeWidth="2"
            style={{ opacity: regionOpacity(reg001.id), filter: glowFilter(reg001.id, c0.stroke) }}
            className="cursor-pointer transition-all duration-200"
            onClick={() => handleRegionClick(reg001.id)} />

          <circle cx={circles[1].cx} cy={circles[1].cy} r={circles[1].r}
            fill={c1.fill} stroke={c1.stroke} strokeWidth="2"
            style={{ opacity: regionOpacity(reg010.id), filter: glowFilter(reg010.id, c1.stroke) }}
            className="cursor-pointer transition-all duration-200"
            onClick={() => handleRegionClick(reg010.id)} />

          <circle cx={circles[2].cx} cy={circles[2].cy} r={circles[2].r}
            fill={c2.fill} stroke={c2.stroke} strokeWidth="2"
            style={{ opacity: regionOpacity(reg100.id), filter: glowFilter(reg100.id, c2.stroke) }}
            className="cursor-pointer transition-all duration-200"
            onClick={() => handleRegionClick(reg100.id)} />

          <g clipPath="url(#v3-c0)">
            <circle cx={circles[1].cx} cy={circles[1].cy} r={circles[1].r}
              fill="rgba(139, 92, 246, 0.5)"
              style={{ opacity: regionOpacity(reg011.id), filter: glowFilter(reg011.id, 'rgb(167, 139, 250)') }}
              className="cursor-pointer transition-all duration-200"
              onClick={() => handleRegionClick(reg011.id)} />
          </g>
          <g clipPath="url(#v3-c0)">
            <circle cx={circles[2].cx} cy={circles[2].cy} r={circles[2].r}
              fill="rgba(234, 179, 8, 0.55)"
              style={{ opacity: regionOpacity(reg101.id), filter: glowFilter(reg101.id, 'rgb(250, 204, 21)') }}
              className="cursor-pointer transition-all duration-200"
              onClick={() => handleRegionClick(reg101.id)} />
          </g>
          <g clipPath="url(#v3-c1)">
            <circle cx={circles[2].cx} cy={circles[2].cy} r={circles[2].r}
              fill="rgba(16, 185, 129, 0.55)"
              style={{ opacity: regionOpacity(reg110.id), filter: glowFilter(reg110.id, 'rgb(52, 211, 153)') }}
              className="cursor-pointer transition-all duration-200"
              onClick={() => handleRegionClick(reg110.id)} />
          </g>

          <g clipPath="url(#v3-c0)">
            <g clipPath="url(#v3-c1)">
              <circle cx={circles[2].cx} cy={circles[2].cy} r={circles[2].r}
                fill="rgba(251, 146, 60, 0.7)"
                style={{ opacity: regionOpacity(reg111.id), filter: glowFilter(reg111.id, 'rgb(251, 146, 60)') }}
                className="cursor-pointer transition-all duration-200"
                onClick={() => handleRegionClick(reg111.id)} />
            </g>
          </g>

          <text x="130" y="240" fontSize="20" fontWeight="bold" fill="white" textAnchor="middle"
            style={{ opacity: textOpacity(reg001.id), cursor: 'pointer' }}
            onClick={(e) => stopText(e, reg001.id)}>{reg001.count}</text>
          <text x="370" y="240" fontSize="20" fontWeight="bold" fill="white" textAnchor="middle"
            style={{ opacity: textOpacity(reg010.id), cursor: 'pointer' }}
            onClick={(e) => stopText(e, reg010.id)}>{reg010.count}</text>
          <text x="250" y="68" fontSize="20" fontWeight="bold" fill="white" textAnchor="middle"
            style={{ opacity: textOpacity(reg100.id), cursor: 'pointer' }}
            onClick={(e) => stopText(e, reg100.id)}>{reg100.count}</text>

          <text x="250" y="185" fontSize="18" fontWeight="bold" fill="white" textAnchor="middle"
            style={{ opacity: textOpacity(reg111.id), cursor: 'pointer' }}
            onClick={(e) => stopText(e, reg111.id)}>{reg111.count}</text>
          <text x="185" y="160" fontSize="15" fontWeight="bold" fill="white" textAnchor="middle"
            style={{ opacity: textOpacity(reg101.id), cursor: 'pointer' }}
            onClick={(e) => stopText(e, reg101.id)}>{reg101.count}</text>
          <text x="315" y="160" fontSize="15" fontWeight="bold" fill="white" textAnchor="middle"
            style={{ opacity: textOpacity(reg110.id), cursor: 'pointer' }}
            onClick={(e) => stopText(e, reg110.id)}>{reg110.count}</text>
          <text x="250" y="265" fontSize="15" fontWeight="bold" fill="white" textAnchor="middle"
            style={{ opacity: textOpacity(reg011.id), cursor: 'pointer' }}
            onClick={(e) => stopText(e, reg011.id)}>{reg011.count}</text>

          <text x="110" y="110" fontSize="12" fill={c0.text} fontWeight="600" textAnchor="middle">{samples[0]}</text>
          <text x="390" y="110" fontSize="12" fill={c1.text} fontWeight="600" textAnchor="middle">{samples[1]}</text>
          <text x="250" y="340" fontSize="12" fill={c2.text} fontWeight="600" textAnchor="middle">{samples[2]}</text>

          <text x="250" y="360" fontSize="11" fill="rgb(148, 163, 184)" textAnchor="middle">
            点击任意区域筛选 · 中心=全部共有
          </text>
        </svg>

        <div className="flex flex-col gap-3 min-w-[180px]">
          <StatCard label="总变异" value={totalCount} color="text-white" onClick={() => onSelect(null)} selected={selected === null} />
          <StatCard label="全部共有" value={sharedCount} color="text-primary-400"
            onClick={() => handleRegionClick(reg111.id)} selected={isSel(reg111.id)} />
          <StatCard label="特有变异" value={uniqueCount} color="text-accent-400"
            sublabel={`${reg001.count}+${reg010.count}+${reg100.count}`} />
          <StatCard label="致病性" value={pathogenicCount} color="text-red-400" />
        </div>
      </div>
    </div>
  );
}

function UpSetPlot({ sampleIds, sampleNames, subsets, selectedSubsetId, onSelectSubset, totalCount, sharedCount, uniqueCount, pathogenicCount }: InteractiveSetChartProps) {
  const n = sampleIds.length;

  const sortedSubsets = useMemo(() => {
    return [...subsets].sort((a, b) => b.count - a.count).slice(0, Math.min(20, subsets.length));
  }, [subsets]);

  const maxCount = Math.max(...sortedSubsets.map((s) => s.count), 1);
  const hasSelection = selectedSubsetId !== null;

  const perSampleTotals = useMemo(() => {
    return sampleIds.map((sid) => subsets.find((s) => s.sampleIds.length === 1 && s.sampleIds[0] === sid)?.count ?? 0);
  }, [sampleIds, subsets]);

  const maxTotal = Math.max(...perSampleTotals, 1);

  const rowHeight = 36;
  const matrixLeft = 230;
  const barWidth = 22;
  const setLabelW = 120;
  const colSpacing = 16;
  const plotWidth = sortedSubsets.length * (barWidth + colSpacing);
  const totalHeight = (n) * rowHeight + 40;
  const barChartH = 140;
  const sideBarMaxW = 90;

  const svgW = Math.max(700, matrixLeft + plotWidth + 80);

  const allSharedId = useMemo(() => {
    const all = subsets.find((s) => s.sampleIds.length === n);
    return all?.id ?? null;
  }, [subsets, n]);

  const handleColClick = (id: string) => {
    onSelectSubset(selectedSubsetId === id ? null : id);
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">集合重叠分析 (UpSet)</h2>
          <p className="text-xs text-slate-500 mt-1">{n} 个样本 · 显示 Top {sortedSubsets.length} 个最大重叠组合</p>
        </div>
        <SummaryBadge selected={selectedSubsetId} onClear={() => onSelectSubset(null)} />
      </div>

      <div className="flex items-start gap-4">
        <div className="flex-1 overflow-x-auto">
          <svg viewBox={`0 0 ${svgW} ${totalHeight + barChartH + 30}`} className="min-w-full" style={{ minWidth: svgW }}>
            <line x1={matrixLeft} y1={barChartH - 20} x2={matrixLeft + plotWidth} y2={barChartH - 20}
              stroke="rgb(71, 85, 105)" strokeWidth="1" />

            {sortedSubsets.map((subset, colIdx) => {
              const x = matrixLeft + colIdx * (barWidth + colSpacing);
              const barH = (subset.count / maxCount) * (barChartH - 40);
              const isSel = selectedSubsetId === subset.id;
              const dim = hasSelection && !isSel;

              return (
                <g key={subset.id}
                  style={{ opacity: dim ? 0.3 : 1 }}
                  onClick={() => handleColClick(subset.id)}
                  className="cursor-pointer transition-opacity duration-200"
                >
                  <rect
                    x={x}
                    y={barChartH - 20 - barH}
                    width={barWidth}
                    height={barH}
                    rx={4}
                    fill={isSel ? 'rgb(96, 165, 250)' : 'rgba(96, 165, 250, 0.7)'}
                    stroke={isSel ? 'rgb(147, 197, 253)' : 'rgba(147, 197, 253, 0.5)'}
                    strokeWidth={isSel ? 2 : 1}
                    style={{ filter: isSel ? 'drop-shadow(0 0 6px rgba(96,165,250,0.6))' : undefined }}
                  />
                  <text x={x + barWidth / 2} y={barChartH - 20 - barH - 8} fontSize="12"
                    fontWeight="bold" fill="white" textAnchor="middle">
                    {subset.count}
                  </text>
                </g>
              );
            })}

            {sampleIds.map((sid, rowIdx) => {
              const y = barChartH + 20 + rowIdx * rowHeight + 12;
              const totalForSample = perSampleTotals[rowIdx];
              const sideBarW = (totalForSample / maxTotal) * sideBarMaxW;
              const color = VENN_COLORS[rowIdx % VENN_COLORS.length];
              return (
                <g key={sid}>
                  <rect
                    x={setLabelW - sideBarW - 10}
                    y={y - 11}
                    width={sideBarW}
                    height={22}
                    rx={4}
                    fill={color.fill}
                    stroke={color.stroke}
                    strokeWidth={1}
                  />
                  <text x={setLabelW - 12} y={y + 4}
                    fontSize="11"
                    fill={color.text}
                    fontWeight="600"
                    textAnchor="end">
                    {sampleNames[rowIdx]}
                  </text>
                  <text x={setLabelW - sideBarW - 14} y={y + 4}
                    fontSize="10"
                    fill="rgb(148, 163, 184)"
                    textAnchor="end">
                    {totalForSample}
                  </text>
                </g>
              );
            })}

            {sortedSubsets.map((subset, colIdx) => {
              const x = matrixLeft + colIdx * (barWidth + colSpacing) + barWidth / 2;
              const isSel = selectedSubsetId === subset.id;
              const dim = hasSelection && !isSel;

              const rowsWith: number[] = [];
              subset.sampleIds.forEach((sid) => {
                const idx = sampleIds.indexOf(sid);
                if (idx >= 0) rowsWith.push(idx);
              });
              const minR = Math.min(...rowsWith);
              const maxR = Math.max(...rowsWith);

              const y1 = barChartH + 20 + minR * rowHeight + 12;
              const y2 = barChartH + 20 + maxR * rowHeight + 12;

              return (
                <g key={`conn-${subset.id}`}
                  style={{ opacity: dim ? 0.25 : 1 }}
                  onClick={() => handleColClick(subset.id)}
                  className="cursor-pointer transition-opacity duration-200"
                >
                  {subset.sampleIds.length > 1 && (
                    <line
                      x1={x} y1={y1}
                      x2={x} y2={y2}
                      stroke={isSel ? 'rgb(147, 197, 253)' : 'rgba(148, 163, 184, 0.7)'}
                      strokeWidth={isSel ? 3 : 2}
                    />
                  )}
                  {sampleIds.map((sid, rowIdx) => {
                    const cy = barChartH + 20 + rowIdx * rowHeight + 12;
                    const active = subset.sampleIds.includes(sid);
                    const color = VENN_COLORS[rowIdx % VENN_COLORS.length];
                    return (
                      <circle
                        key={`${sid}-${colIdx}`}
                        cx={x}
                        cy={cy}
                        r={9}
                        fill={active ? color.stroke : 'rgb(51, 65, 85)'}
                        stroke={active ? (isSel ? 'white' : color.stroke) : 'rgb(71, 85, 105)'}
                        strokeWidth={isSel && active ? 2.5 : 1.5}
                        style={{
                          filter: isSel && active ? `drop-shadow(0 0 6px ${color.stroke})` : undefined
                        }}
                      />
                    );
                  })}
                </g>
              );
            })}

            <text x={matrixLeft / 2} y={20}
              fontSize="12" fill="rgb(148, 163, 184)" textAnchor="middle" fontWeight="600">
              集合大小
            </text>
            <text x={matrixLeft / 2} y={barChartH / 2}
              fontSize="11" fill="rgb(148, 163, 184)"
              transform={`rotate(-90 ${matrixLeft / 2} ${barChartH / 2})`} textAnchor="middle">
              变异数量
            </text>

            <line x1={setLabelW} y1={barChartH} x2={setLabelW} y2={barChartH + totalHeight}
              stroke="rgb(71, 85, 105)" strokeWidth="1" />

            <text x={matrixLeft + plotWidth / 2} y={totalHeight + barChartH + 20}
              fontSize="11" fill="rgb(148, 163, 184)" textAnchor="middle">
              点击列筛选表格 · 圆点连线表示共有组合
            </text>
          </svg>
        </div>

        <div className="flex flex-col gap-3 min-w-[160px] shrink-0">
          <StatCard label="总变异" value={totalCount} color="text-white"
            onClick={() => onSelectSubset(null)} selected={selectedSubsetId === null} />
          <StatCard label="全部共有" value={sharedCount} color="text-primary-400"
            onClick={() => {
              if (allSharedId) handleColClick(allSharedId);
            }} selected={allSharedId === selectedSubsetId} />
          <StatCard label="特有变异" value={uniqueCount} color="text-accent-400" />
          <StatCard label="致病性" value={pathogenicCount} color="text-red-400" />
        </div>
      </div>
    </div>
  );
}

function SummaryBadge({ selected, onClear }: { selected: string | null; onClear: () => void }) {
  if (!selected) return null;
  return (
    <button
      onClick={onClear}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/20 border border-primary-500/40 text-primary-300 text-xs hover:bg-primary-500/30 transition-colors"
    >
      <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
      已应用筛选
      <span className="text-slate-400">·</span>
      <span>清除</span>
    </button>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  color: string;
  onClick?: () => void;
  selected?: boolean;
  sublabel?: string;
}

function StatCard({ label, value, color, onClick, selected, sublabel }: StatCardProps) {
  const clickable = !!onClick;
  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-xl border transition-all duration-200
        ${selected
          ? 'bg-primary-500/15 border-primary-500/50 ring-2 ring-primary-500/40'
          : 'bg-slate-800/50 border-slate-700/50'}
        ${clickable ? 'cursor-pointer hover:bg-slate-800 hover:border-slate-600' : ''}
      `}
    >
      <p className={`text-2xl font-bold ${color} leading-none`}>{value}</p>
      <div className="flex items-baseline gap-1 mt-1">
        <p className="text-xs text-slate-400">{label}</p>
        {sublabel && <p className="text-[10px] text-slate-500">({sublabel})</p>}
      </div>
    </div>
  );
}
