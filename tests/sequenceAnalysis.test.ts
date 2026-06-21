import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeGcSlidingWindow, computeCodonPreference, designPrimers, DEFAULT_PRIMER_CONSTRAINTS } from '../shared/mockData.js';

test('computeGcSlidingWindow: 空序列返回空数据点且整体GC为0', () => {
  const result = computeGcSlidingWindow('', 'empty', 100, 10);
  assert.equal(result.sequenceId, 'empty');
  assert.equal(result.sequenceLength, 0);
  assert.equal(result.overallGcPercent, 0);
  assert.equal(result.dataPoints.length, 0);
});

test('computeGcSlidingWindow: 序列长度小于窗口大小返回空数据点，但整体GC正确', () => {
  const seq = 'GCGCAT';
  const result = computeGcSlidingWindow(seq, 'short', 100, 10);
  assert.equal(result.sequenceLength, 6);
  assert.equal(result.overallGcPercent, (4 / 6) * 100);
  assert.equal(result.dataPoints.length, 0);
});

test('computeGcSlidingWindow: 100% GC 序列所有窗口 GC% 应为 100', () => {
  const seq = 'GCGCGCGCGCGCGCGC';
  const result = computeGcSlidingWindow(seq, 'all_gc', 4, 2);
  assert.equal(result.overallGcPercent, 100);
  assert.ok(result.dataPoints.length > 0);
  for (const pt of result.dataPoints) {
    assert.equal(pt.gcPercent, 100);
  }
});

test('computeGcSlidingWindow: 0% GC 序列所有窗口 GC% 应为 0', () => {
  const seq = 'ATATATATATATATAT';
  const result = computeGcSlidingWindow(seq, 'no_gc', 4, 2);
  assert.equal(result.overallGcPercent, 0);
  assert.ok(result.dataPoints.length > 0);
  for (const pt of result.dataPoints) {
    assert.equal(pt.gcPercent, 0);
  }
});

test('computeGcSlidingWindow: 步长应覆盖正确的起始位置', () => {
  const seq = 'GCGCGCGCGCGCGCGCGCGC';
  const windowSize = 5;
  const stepSize = 3;
  const result = computeGcSlidingWindow(seq, 'step', windowSize, stepSize);
  assert.equal(result.dataPoints[0].position, 1);
  for (let i = 1; i < result.dataPoints.length; i++) {
    assert.equal(result.dataPoints[i].position - result.dataPoints[i - 1].position, stepSize);
  }
});

test('computeGcSlidingWindow: 过滤非ATGC碱基（N等）', () => {
  const seq = 'NNNNGGGGNNNNCCCC';
  const result = computeGcSlidingWindow(seq, 'filtered', 8, 2);
  assert.equal(result.sequenceLength, 8);
  assert.equal(result.overallGcPercent, 100);
});

test('computeGcSlidingWindow: 混合序列的精确GC计算', () => {
  const seq = 'GGGGCCCCAAAATTTT';
  const result = computeGcSlidingWindow(seq, 'mixed', 16, 1);
  assert.equal(result.sequenceLength, 16);
  assert.equal(result.overallGcPercent, 50);
  assert.equal(result.dataPoints.length, 1);
  assert.equal(result.dataPoints[0].position, 1);
  assert.equal(result.dataPoints[0].gcPercent, 50);
});

test('computeGcSlidingWindow: 最后一个窗口位置不超出序列', () => {
  const seq = 'A'.repeat(100);
  const windowSize = 20;
  const stepSize = 10;
  const result = computeGcSlidingWindow(seq, 'boundary', windowSize, stepSize);
  const last = result.dataPoints[result.dataPoints.length - 1];
  assert.ok(last.position + windowSize - 1 <= 100);
});

test('computeCodonPreference: 空序列结果', () => {
  const result = computeCodonPreference('', 'empty_codon');
  assert.equal(result.codonCount, 0);
  assert.equal(result.sequenceLength, 0);
  for (const freq of result.positionFrequencies) {
    assert.equal(freq.gcPercent, 0);
    assert.equal(freq.A, 0);
    assert.equal(freq.T, 0);
    assert.equal(freq.G, 0);
    assert.equal(freq.C, 0);
  }
  for (const entry of result.rscuTable) {
    assert.equal(entry.count, 0);
    assert.equal(entry.rscu, 0);
  }
});

test('computeCodonPreference: 不足3bp序列不产生密码子', () => {
  const result = computeCodonPreference('AT', 'short_codon');
  assert.equal(result.codonCount, 0);
  assert.equal(result.sequenceLength, 2);
});

test('computeCodonPreference: 精确位置碱基频率', () => {
  const seq = 'AAA';
  const result = computeCodonPreference(seq, 'pos_test');
  assert.equal(result.codonCount, 1);
  assert.equal(result.positionFrequencies[0].position, 1);
  assert.equal(result.positionFrequencies[0].A, 1);
  assert.equal(result.positionFrequencies[1].position, 2);
  assert.equal(result.positionFrequencies[1].A, 1);
  assert.equal(result.positionFrequencies[2].position, 3);
  assert.equal(result.positionFrequencies[2].A, 1);
});

test('computeCodonPreference: RSCU 对称性验证 - 所有密码子等概率时RSCU应接近1', () => {
  const aminoAcids: Record<string, string[]> = {
    Phe: ['TTT', 'TTC'],
    Tyr: ['TAT', 'TAC'],
    His: ['CAT', 'CAC'],
    Asn: ['AAT', 'AAC'],
    Asp: ['GAT', 'GAC'],
    Cys: ['TGT', 'TGC'],
  };
  let seq = '';
  for (const codons of Object.values(aminoAcids)) {
    for (const c of codons) seq += c.repeat(5);
  }
  const result = computeCodonPreference(seq, 'rscu_sym');
  for (const [aa, codons] of Object.entries(aminoAcids)) {
    for (const c of codons) {
      const entry = result.rscuTable.find(e => e.codon === c);
      assert.ok(entry, `缺失密码子 ${c}`);
      assert.equal(entry.aminoAcid, aa);
      assert.equal(entry.count, 5);
      assert.equal(entry.rscu, 1);
    }
  }
});

test('computeCodonPreference: 过滤非ATGC碱基', () => {
  const seq = 'NNNAAANNN';
  const result = computeCodonPreference(seq, 'filter_bases');
  assert.equal(result.sequenceLength, 3);
  assert.equal(result.codonCount, 1);
});

test('computeCodonPreference: position 字段类型为 1|2|3', () => {
  const result = computeCodonPreference('ATGATGATG', 'pos_type');
  assert.equal(result.positionFrequencies.length, 3);
  assert.deepEqual(
    result.positionFrequencies.map(f => f.position).sort(),
    [1, 2, 3]
  );
});

test('designPrimers: 500bp 区域应能生成多个候选引物对', () => {
  const bases = ['A', 'T', 'G', 'C'];
  let seq = '';
  for (let i = 0; i < 500; i++) seq += bases[Math.floor(i % 4)];
  const result = designPrimers(seq, 'test_500', 1, 500, DEFAULT_PRIMER_CONSTRAINTS);
  assert.ok(result.totalForwardChecked > 0, '应检查过正向引物');
  assert.ok(result.totalReverseChecked > 0, '应检查过反向引物');
  assert.ok(result.forwardCandidates.length > 0, '应有正向候选引物');
  assert.ok(result.reverseCandidates.length > 0, '应有反向候选引物');
  assert.ok(result.pairs.length > 0, '应生成引物对');
  assert.ok(result.pairs.length <= 20, '最多返回20对');
  for (const pair of result.pairs) {
    assert.ok(pair.productSize >= DEFAULT_PRIMER_CONSTRAINTS.productMinSize, `产物大小 ${pair.productSize} 不应小于最小值`);
    assert.ok(pair.productSize <= DEFAULT_PRIMER_CONSTRAINTS.productMaxSize, `产物大小 ${pair.productSize} 不应大于最大值`);
  }
});

test('designPrimers: 短区域（150bp）可能候选少但不应报错', () => {
  const bases = ['A', 'T', 'G', 'C'];
  let seq = '';
  for (let i = 0; i < 200; i++) seq += bases[Math.floor(i % 4)];
  const result = designPrimers(seq, 'short_region', 1, 150, DEFAULT_PRIMER_CONSTRAINTS);
  assert.ok(result.totalForwardChecked > 0);
  assert.ok(result.totalReverseChecked >= 0);
});

test('designPrimers: 极短区域（50bp）应返回空结果但不崩溃', () => {
  const seq = 'ATGC'.repeat(13);
  const result = designPrimers(seq, 'very_short', 1, 50, DEFAULT_PRIMER_CONSTRAINTS);
  assert.equal(result.forwardCandidates.length, 0);
  assert.equal(result.reverseCandidates.length, 0);
  assert.equal(result.pairs.length, 0);
});
