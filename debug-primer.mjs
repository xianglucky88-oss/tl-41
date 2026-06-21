import { designPrimers, DEFAULT_PRIMER_CONSTRAINTS, computePrimerMetrics } from '../shared/mockData.js';

const bases = ['A', 'T', 'G', 'C'];
let seq = '';
for (let i = 0; i < 500; i++) seq += bases[Math.floor(i % 4)];

console.log('序列前 50bp:', seq.slice(0, 50));
console.log('序列 GC 含量:', (seq.match(/[GC]/g)?.length || 0) / seq.length * 100, '%');

const result = designPrimers(seq, 'debug', 1, 500, DEFAULT_PRIMER_CONSTRAINTS);

console.log('\n=== 统计 ===');
console.log('totalForwardChecked:', result.totalForwardChecked);
console.log('totalReverseChecked:', result.totalReverseChecked);
console.log('forwardCandidates:', result.forwardCandidates.length);
console.log('reverseCandidates:', result.reverseCandidates.length);
console.log('totalPairsEvaluated:', result.totalPairsEvaluated);
console.log('pairs:', result.pairs.length);

console.log('\n=== 前 5 个正向候选 ===');
result.forwardCandidates.slice(0, 5).forEach((p, i) => {
  console.log(`  ${i+1}. ${p.sequence} | Tm: ${p.metrics.tm} | GC: ${p.metrics.gcPercent}% | dimer: ${p.metrics.dimerDeltaG} | hairpin: ${p.metrics.hairpinDeltaG} | homo: ${p.metrics.homopolymerMax} | startsAT: ${p.metrics.startsWithAT} | gcClamp: ${p.metrics.hasGcClamp}`);
});

console.log('\n=== 验证默认约束 ===');
console.log('DEFAULT_PRIMER_CONSTRAINTS:', JSON.stringify(DEFAULT_PRIMER_CONSTRAINTS, null, 2));

// 手动测试几个引物
console.log('\n=== 手动测试引物 ===');
const testSeqs = [
  'ATGCATGCATGCATGCATGC',
  'GCATGCATGCATGCATGCAT',
  'CATGCATGCATGCATGCATG',
  'TGCATGCATGCATGCATGCA',
  'GCGCGCGCGCGCGCGCGCGC',
  'ATATATATATATATATATAT',
];

for (const s of testSeqs) {
  const m = computePrimerMetrics(s);
  console.log(`\n  ${s}`);
  console.log(`    Tm: ${m.tm}, GC: ${m.gcPercent}%, dimerΔG: ${m.dimerDeltaG}, hairpinΔG: ${m.hairpinDeltaG}, homo: ${m.homopolymerMax}, startsAT: ${m.startsWithAT}, gcClamp: ${m.hasGcClamp}`);
}
