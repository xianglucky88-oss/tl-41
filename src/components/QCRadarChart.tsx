import { useMemo } from 'react';
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import type { SequencingQCMetrics } from '@shared/types';

export interface QCRadarDataPoint {
  subject: string;
  [key: string]: number | string;
}

export interface SampleRadarDataSet {
  sampleId: string;
  sampleName: string;
  color: string;
  metrics: SequencingQCMetrics;
}

const DEFAULT_COLORS = [
  '#6366f1',
  '#22d3ee',
  '#f59e0b',
  '#10b981',
  '#f43f5e',
  '#a855f7',
  '#14b8a6',
  '#f97316',
];

const normalizeMetrics = (metrics: SequencingQCMetrics): Record<string, number> => {
  const normalizeGc = (gc: number): number => {
    const ideal = 50;
    const deviation = Math.abs(gc - ideal);
    const maxDeviation = 30;
    return Math.max(0, Math.min(100, 100 - (deviation / maxDeviation) * 100));
  };

  const reverseScore = (value: number, maxValue: number): number => {
    return Math.max(0, Math.min(100, 100 - (value / maxValue) * 100));
  };

  return {
    Q20: metrics.q20Bases,
    Q30: metrics.q30Bases,
    'GC适宜度': normalizeGc(metrics.gcContent),
    '低接头': reverseScore(metrics.adapterRate, 5),
    '低重复': reverseScore(metrics.duplicationRate, 25),
    比对率: metrics.mappingRate,
    覆盖度: metrics.coverageBreadth,
    低污染: reverseScore(metrics.contaminationRate, 5),
  };
};

export interface QCRadarChartProps {
  samples: SampleRadarDataSet[];
  height?: number;
  showLegend?: boolean;
  showDataTable?: boolean;
}

export default function QCRadarChart({
  samples,
  height = 400,
  showLegend = true,
  showDataTable = false,
}: QCRadarChartProps) {
  const subjects = ['Q20', 'Q30', 'GC适宜度', '低接头', '低重复', '比对率', '覆盖度', '低污染'];

  const radarData: QCRadarDataPoint[] = useMemo(() => {
    return subjects.map((subject) => {
      const point: QCRadarDataPoint = { subject };
      samples.forEach((sample) => {
        const normalized = normalizeMetrics(sample.metrics);
        point[sample.sampleName] = normalized[subject] ?? 0;
      });
      return point;
    });
  }, [samples, subjects]);

  if (samples.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-slate-700 text-slate-500 text-sm"
        style={{ height }}
      >
        请选择样本以显示 QC 雷达图
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsRadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={{ stroke: '#475569' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#f1f5f9',
              }}
              labelStyle={{ color: '#f8fafc', fontWeight: 600 }}
              formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
            />
            {showLegend && samples.length > 1 && (
              <Legend
                wrapperStyle={{ paddingTop: '12px' }}
                iconType="circle"
              />
            )}
            {samples.map((sample, idx) => (
              <Radar
                key={sample.sampleId}
                name={sample.sampleName}
                dataKey={sample.sampleName}
                stroke={sample.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
                fill={sample.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
                fillOpacity={Math.max(0.1, 0.5 - idx * 0.08)}
                strokeWidth={2}
              />
            ))}
          </RechartsRadarChart>
        </ResponsiveContainer>
      </div>

      {showDataTable && (
        <div className="overflow-x-auto rounded-xl border border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/50">
                <th className="px-4 py-3 text-left text-slate-400 font-medium">指标</th>
                {samples.map((sample) => (
                  <th
                    key={sample.sampleId}
                    className="px-4 py-3 text-right font-medium"
                    style={{ color: sample.color }}
                  >
                    {sample.sampleName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              <tr>
                <td className="px-4 py-2.5 text-slate-300">Q20 碱基比例</td>
                {samples.map((s) => (
                  <td key={s.sampleId} className="px-4 py-2.5 text-right text-slate-200">
                    {s.metrics.q20Bases.toFixed(2)}%
                  </td>
                ))}
              </tr>
              <tr className="bg-slate-800/30">
                <td className="px-4 py-2.5 text-slate-300">Q30 碱基比例</td>
                {samples.map((s) => (
                  <td key={s.sampleId} className="px-4 py-2.5 text-right text-slate-200">
                    {s.metrics.q30Bases.toFixed(2)}%
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-slate-300">GC 含量</td>
                {samples.map((s) => (
                  <td key={s.sampleId} className="px-4 py-2.5 text-right text-slate-200">
                    {s.metrics.gcContent.toFixed(2)}%
                  </td>
                ))}
              </tr>
              <tr className="bg-slate-800/30">
                <td className="px-4 py-2.5 text-slate-300">接头比例</td>
                {samples.map((s) => (
                  <td key={s.sampleId} className="px-4 py-2.5 text-right text-slate-200">
                    {s.metrics.adapterRate.toFixed(2)}%
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-slate-300">重复序列比例</td>
                {samples.map((s) => (
                  <td key={s.sampleId} className="px-4 py-2.5 text-right text-slate-200">
                    {s.metrics.duplicationRate.toFixed(2)}%
                  </td>
                ))}
              </tr>
              <tr className="bg-slate-800/30">
                <td className="px-4 py-2.5 text-slate-300">污染率</td>
                {samples.map((s) => (
                  <td key={s.sampleId} className="px-4 py-2.5 text-right text-slate-200">
                    {s.metrics.contaminationRate.toFixed(2)}%
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-slate-300">总 reads 数</td>
                {samples.map((s) => (
                  <td key={s.sampleId} className="px-4 py-2.5 text-right text-slate-200 font-mono">
                    {(s.metrics.totalReads / 1000000).toFixed(2)}M
                  </td>
                ))}
              </tr>
              <tr className="bg-slate-800/30">
                <td className="px-4 py-2.5 text-slate-300">比对率</td>
                {samples.map((s) => (
                  <td key={s.sampleId} className="px-4 py-2.5 text-right text-slate-200">
                    {s.metrics.mappingRate.toFixed(2)}%
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-slate-300">平均测序深度</td>
                {samples.map((s) => (
                  <td key={s.sampleId} className="px-4 py-2.5 text-right text-slate-200">
                    {s.metrics.coverageDepth.toFixed(1)}×
                  </td>
                ))}
              </tr>
              <tr className="bg-slate-800/30">
                <td className="px-4 py-2.5 text-slate-300">基因组覆盖度</td>
                {samples.map((s) => (
                  <td key={s.sampleId} className="px-4 py-2.5 text-right text-slate-200">
                    {s.metrics.coverageBreadth.toFixed(1)}%
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-slate-300">插入片段大小</td>
                {samples.map((s) => (
                  <td key={s.sampleId} className="px-4 py-2.5 text-right text-slate-200">
                    {s.metrics.insertSizeMean} bp
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
