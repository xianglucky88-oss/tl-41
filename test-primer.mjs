import { designPrimers, DEFAULT_PRIMER_CONSTRAINTS } from './shared/mockData.js';

const bases = ['A', 'T', 'G', 'C'];
let seq = '';
for (let i = 0; i < 500; i++) {
  seq += bases[Math.floor(Math.random() * 4)];
}

console.log('序列长度:', seq.length);

const result = designPrimers(seq, 'test_sample', 1, 500, DEFAULT_PRIMER_CONSTRAINTS);

console.log('=== 结果统计 ===');
console.log('正向候选数:', result.forwardCandidates.length);
console.log('反向候选数:', result.reverseCandidates.length);
console.log('引物对数:', result.pairs.length);
console.log('检查正向引物数:', result.totalForwardChecked);
console.log('检查反向引物数:', result.totalReverseChecked);
console.log('评估引物对数:', result.totalPairsEvaluated);

if (result.pairs.length > 0) {
  console.log('\n=== 前3对引物 ===');
  result.pairs.slice(0, 3).forEach((p, i) => {
    console.log(`\n第 ${i+1} 对 (评分: ${p.penaltyScore})`);
    console.log(`  正向: ${p.forward.sequence} (Tm: ${p.forward.metrics.tm}, GC: ${p.forward.metrics.gcPercent}%)`);
    console.log(`  反向: ${p.reverse.sequence} (Tm: ${p.reverse.metrics.tm}, GC: ${p.reverse.metrics.gcPercent}%)`);
    console.log(`  产物大小: ${p.productSize} bp`);
    console.log(`  警告数: ${p.warnings.length}`);
  });
}
