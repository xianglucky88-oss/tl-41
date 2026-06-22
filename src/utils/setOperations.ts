import type { ComparisonResult } from '@/pages/VariantComparison';

export interface SubsetInfo {
  id: string;
  sampleIds: string[];
  sampleNames: string[];
  mask: string;
  count: number;
  results: ComparisonResult[];
  isUnique: boolean;
  isShared: boolean;
}

const sampleNameMap = new Map<string, string>();

export function setSampleNameResolver(fn: (id: string) => string) {
  (sampleNameMap as unknown as { fn: (id: string) => string }).fn = fn;
}

function resolveName(id: string): string {
  const m = sampleNameMap as unknown as { fn?: (id: string) => string };
  return m.fn ? m.fn(id) : id;
}

function combinations<T>(arr: T[]): T[][] {
  const result: T[][] = [];
  const n = arr.length;
  for (let mask = 1; mask < (1 << n); mask++) {
    const combo: T[] = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) combo.push(arr[i]);
    }
    result.push(combo);
  }
  return result;
}

function maskToString(mask: number, n: number): string {
  return mask.toString(2).padStart(n, '0');
}

export function computeSubsets(
  results: ComparisonResult[],
  selectedSampleIds: string[]
): SubsetInfo[] {
  const n = selectedSampleIds.length;
  const idToIndex = new Map(selectedSampleIds.map((id, i) => [id, i]));

  const subsetMap = new Map<string, SubsetInfo>();

  for (let mask = 1; mask < (1 << n); mask++) {
    const sampleIds: string[] = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) sampleIds.push(selectedSampleIds[i]);
    }
    const id = sampleIds.join('|');
    subsetMap.set(id, {
      id,
      sampleIds,
      sampleNames: sampleIds.map(resolveName),
      mask: maskToString(mask, n),
      count: 0,
      results: [],
      isUnique: sampleIds.length === 1,
      isShared: sampleIds.length === n,
    });
  }

  results.forEach((r) => {
    let mask = 0;
    r.sharedBy.forEach((sid: string) => {
      const idx = idToIndex.get(sid);
      if (idx !== undefined) mask |= 1 << idx;
    });
    if (mask === 0) return;
    const sampleIds: string[] = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) sampleIds.push(selectedSampleIds[i]);
    }
    const id = sampleIds.join('|');
    const info = subsetMap.get(id);
    if (info) {
      info.count++;
      info.results.push(r);
    }
  });

  return Array.from(subsetMap.values()).sort((a, b) => {
    if (a.sampleIds.length !== b.sampleIds.length) return a.sampleIds.length - b.sampleIds.length;
    return b.count - a.count;
  });
}

export const VENN_COLORS = [
  { fill: 'rgba(59, 130, 246, 0.35)', stroke: 'rgb(96, 165, 250)', text: 'rgb(191, 219, 254)' },
  { fill: 'rgba(236, 72, 153, 0.35)', stroke: 'rgb(244, 114, 182)', text: 'rgb(251, 207, 232)' },
  { fill: 'rgba(34, 197, 94, 0.35)', stroke: 'rgb(74, 222, 128)', text: 'rgb(187, 247, 208)' },
  { fill: 'rgba(249, 115, 22, 0.35)', stroke: 'rgb(251, 146, 60)', text: 'rgb(254, 215, 170)' },
  { fill: 'rgba(168, 85, 247, 0.35)', stroke: 'rgb(192, 132, 252)', text: 'rgb(233, 213, 255)' },
];

export { combinations };
