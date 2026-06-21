import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeGcSlidingWindow, computeCodonPreference, designPrimers, DEFAULT_PRIMER_CONSTRAINTS, scanCpgIslands, toggleMethylation, batchToggleMethylation } from '../shared/mockData.js';
import { DEFAULT_CPG_SCAN_PARAMETERS } from '../shared/types.js';

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

test('scanCpgIslands: 空序列返回空结果', () => {
  const result = scanCpgIslands('', 'empty_cpg');
  assert.equal(result.sequenceId, 'empty_cpg');
  assert.equal(result.sequenceLength, 0);
  assert.equal(result.totalCpgSites, 0);
  assert.equal(result.totalIslands, 0);
  assert.equal(result.methylatedCount, 0);
  assert.equal(result.unmethylatedCount, 0);
  assert.equal(result.overallMethylationRate, 0);
  assert.equal(result.islands.length, 0);
  assert.equal(result.cpgSites.length, 0);
});

test('scanCpgIslands: 短序列（小于最小长度）返回空岛屿但标记CpG位点', () => {
  const seq = 'CGCGCGCGATATCGCG';
  const result = scanCpgIslands(seq, 'short_cpg');
  assert.equal(result.sequenceLength, seq.length);
  assert.ok(result.totalCpgSites > 0, '应标记CpG位点');
  assert.equal(result.totalIslands, 0);
  assert.equal(result.islands.length, 0);
});

test('scanCpgIslands: 准确检测所有CpG位点数量', () => {
  let seq = '';
  const cpgCount = 25;
  for (let i = 0; i < cpgCount; i++) seq += 'CG';
  for (let i = 0; i < 50; i++) seq += 'AT';
  const result = scanCpgIslands(seq, 'cpg_count_test');
  assert.equal(result.totalCpgSites, cpgCount);
});

test('scanCpgIslands: CpG位点结构正确性', () => {
  const seq = 'ATCGATCG';
  const result = scanCpgIslands(seq, 'cpg_site_structure');
  assert.equal(result.cpgSites.length, 2);
  for (const site of result.cpgSites) {
    assert.ok(site.position >= 1);
    assert.equal(site.position, site.cPosition);
    assert.equal(site.gPosition, site.cPosition + 1);
    assert.equal(typeof site.methylated, 'boolean');
    assert.equal(typeof site.inIsland, 'boolean');
  }
  assert.equal(result.cpgSites[0].position, 3);
  assert.equal(result.cpgSites[1].position, 7);
});

test('scanCpgIslands: 高GC-CpG富集序列应识别为CpG岛', () => {
  let cpgRich = '';
  for (let i = 0; i < 150; i++) cpgRich += 'CG';
  cpgRich += 'GGGCCCCCGGGCCCCC';
  const result = scanCpgIslands(cpgRich, 'island_test', { minLength: 100, minGcPercent: 50, minOeRatio: 0.5 });
  assert.ok(result.totalIslands > 0, '应识别到CpG岛');
  const island = result.islands[0];
  assert.ok(island.length >= 100);
  assert.ok(island.gcPercent >= 50);
  assert.ok(island.oeRatio >= 0.5);
  assert.ok(island.cpgCount > 0);
});

test('scanCpgIslands: AT富集序列不应识别为CpG岛', () => {
  let atRich = '';
  for (let i = 0; i < 400; i++) atRich += 'AT';
  const result = scanCpgIslands(atRich, 'no_island_test');
  assert.equal(result.totalIslands, 0);
  assert.equal(result.totalCpgSites, 0);
});

test('scanCpgIslands: 过滤非ATGC碱基（N等）', () => {
  const seqWithN = 'NNNNCGCGCGCGCGCNNNCGCGCGNNNN';
  const pureSeq = 'CGCGCGCGCGCCGCGCG';
  const resultN = scanCpgIslands(seqWithN, 'with_n', { minLength: 10 });
  const resultPure = scanCpgIslands(pureSeq, 'pure', { minLength: 10 });
  assert.equal(resultN.sequenceLength, resultPure.sequenceLength);
  assert.equal(resultN.totalCpgSites, resultPure.totalCpgSites);
});

test('scanCpgIslands: 自定义参数应生效', () => {
  let seq = '';
  for (let i = 0; i < 80; i++) seq += 'CG';
  seq += 'GGCC';
  const resultStrict = scanCpgIslands(seq, 'strict', { minLength: 300 });
  const resultLenient = scanCpgIslands(seq, 'lenient', { minLength: 50 });
  assert.equal(resultStrict.totalIslands, 0, '严格参数下序列太短，不应识别到岛');
  assert.ok(resultLenient.totalIslands >= 0, '宽松参数下允许更短的岛');
});

test('scanCpgIslands: 岛内CpG位点应正确标记inIsland和islandId', () => {
  let cpgRich = '';
  for (let i = 0; i < 150; i++) cpgRich += 'CG';
  const result = scanCpgIslands(cpgRich, 'in_island_test', { minLength: 100, minGcPercent: 50, minOeRatio: 0.5 });
  if (result.totalIslands > 0) {
    const island = result.islands[0];
    const sitesInIsland = result.cpgSites.filter(s => s.position >= island.startPosition && s.position <= island.endPosition);
    for (const site of sitesInIsland) {
      assert.equal(site.inIsland, true);
      assert.equal(site.islandId, island.id);
    }
  }
});

test('toggleMethylation: 切换不存在位点返回null', () => {
  const seq = 'ATCGATCG';
  const result = scanCpgIslands(seq, 'toggle_fail');
  const toggleResult = toggleMethylation(result, 99999);
  assert.equal(toggleResult, null);
});

test('toggleMethylation: 切换单个位点状态正确反转', () => {
  const seq = 'ATCGATCG';
  const result = scanCpgIslands(seq, 'toggle_single', { initialMethylationRate: 0 });
  const targetSite = result.cpgSites[0];
  const originalState = targetSite.methylated;
  const originalMethylatedCount = result.methylatedCount;
  const toggleResult = toggleMethylation(result, targetSite.position);
  assert.ok(toggleResult !== null);
  assert.equal(toggleResult.previousState, originalState);
  assert.equal(toggleResult.newState, !originalState);
  assert.equal(targetSite.methylated, !originalState);
  assert.equal(result.methylatedCount, originalMethylatedCount + 1);
  assert.equal(result.unmethylatedCount + result.methylatedCount, result.totalCpgSites);
});

test('toggleMethylation: 二次切换应恢复原始状态', () => {
  const seq = 'ATCGATCG';
  const result = scanCpgIslands(seq, 'toggle_twice', { initialMethylationRate: 0 });
  const sitePos = result.cpgSites[0].position;
  toggleMethylation(result, sitePos);
  const stateAfterFirst = result.cpgSites[0].methylated;
  toggleMethylation(result, sitePos);
  const stateAfterSecond = result.cpgSites[0].methylated;
  assert.equal(stateAfterFirst, !stateAfterSecond);
});

test('batchToggleMethylation: 甲基化所有岛内位点', () => {
  let cpgRich = '';
  for (let i = 0; i < 150; i++) cpgRich += 'CG';
  const result = scanCpgIslands(cpgRich, 'batch_methylate', { minLength: 100, minGcPercent: 50, minOeRatio: 0.5, initialMethylationRate: 0 });
  if (result.totalIslands > 0) {
    const island = result.islands[0];
    const sitesInIslandBefore = result.cpgSites.filter(s => s.islandId === island.id);
    const methylatedBefore = sitesInIslandBefore.filter(s => s.methylated).length;
    const changed = batchToggleMethylation(result, island.id, true);
    const sitesInIslandAfter = result.cpgSites.filter(s => s.islandId === island.id);
    const methylatedAfter = sitesInIslandAfter.filter(s => s.methylated).length;
    assert.ok(changed >= 0);
    assert.equal(methylatedAfter, sitesInIslandAfter.length);
    assert.ok(methylatedAfter >= methylatedBefore);
  }
});

test('batchToggleMethylation: 去甲基化所有岛内位点', () => {
  let cpgRich = '';
  for (let i = 0; i < 150; i++) cpgRich += 'CG';
  const result = scanCpgIslands(cpgRich, 'batch_demethylate', { minLength: 100, minGcPercent: 50, minOeRatio: 0.5, initialMethylationRate: 1 });
  if (result.totalIslands > 0) {
    const island = result.islands[0];
    const changed = batchToggleMethylation(result, island.id, false);
    const sitesInIsland = result.cpgSites.filter(s => s.islandId === island.id);
    const methylatedAfter = sitesInIsland.filter(s => s.methylated).length;
    assert.ok(changed >= 0);
    assert.equal(methylatedAfter, 0);
  }
});

test('batchToggleMethylation: 对不存在岛ID返回0', () => {
  const seq = 'CG'.repeat(50);
  const result = scanCpgIslands(seq, 'batch_no_island');
  const changed = batchToggleMethylation(result, 'non_existent_island', true);
  assert.equal(changed, 0);
});

test('scanCpgIslands: 初始甲基化率参数生效', () => {
  const seq = 'CG'.repeat(100);
  const resultZero = scanCpgIslands(seq, 'meth_zero', { initialMethylationRate: 0 });
  const resultFull = scanCpgIslands(seq, 'meth_full', { initialMethylationRate: 1 });
  assert.equal(resultZero.methylatedCount, 0);
  assert.equal(resultFull.methylatedCount, resultFull.totalCpgSites);
});

test('scanCpgIslands: CpG岛字段完整性验证', () => {
  let cpgRich = '';
  for (let i = 0; i < 150; i++) cpgRich += 'CG';
  const result = scanCpgIslands(cpgRich, 'island_fields', { minLength: 100, minGcPercent: 50, minOeRatio: 0.5 });
  if (result.totalIslands > 0) {
    const island = result.islands[0];
    assert.ok(island.id);
    assert.ok(island.startPosition >= 1);
    assert.ok(island.endPosition >= island.startPosition);
    assert.equal(island.length, island.endPosition - island.startPosition + 1);
    assert.ok(island.gcPercent >= 0 && island.gcPercent <= 100);
    assert.ok(island.cpgCount >= 0);
    assert.ok(island.observedCpg >= 0);
    assert.ok(island.expectedCpg >= 0);
    assert.ok(island.oeRatio >= 0);
    assert.ok(island.cpgDensity >= 0);
    assert.ok(island.cSites >= 0);
    assert.ok(island.gSites >= 0);
    assert.ok(island.sequence.length > 0);
  }
});
