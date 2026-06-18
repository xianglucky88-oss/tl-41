import type { AlignmentToolConfig } from './types.js';

export const ALIGNMENT_TOOLS: AlignmentToolConfig[] = [
  {
    id: 'blastn',
    name: 'BLASTN',
    description: '核苷酸序列比对工具，用于搜索核苷酸数据库',
    category: 'alignment',
    version: '2.14.0',
    parameters: [
      { name: 'database', type: 'select', label: '数据库', defaultValue: 'nt', options: ['nt', 'refseq_rna', 'refseq_genomic', 'env_nt'], description: '选择比对数据库' },
      { name: 'evalue', type: 'number', label: 'E值阈值', defaultValue: 1e-5, description: '期望阈值，值越小越严格' },
      { name: 'word_size', type: 'number', label: '字长', defaultValue: 11, options: [7, 11, 15, 20], description: '初始匹配字长' },
      { name: 'gapopen', type: 'number', label: '空位开放罚分', defaultValue: 5, description: '打开空位的罚分' },
      { name: 'gapextend', type: 'number', label: '空位延伸罚分', defaultValue: 2, description: '延伸空位的罚分' },
      { name: 'strand', type: 'select', label: '链方向', defaultValue: 'both', options: ['both', 'plus', 'minus'], description: '搜索的链方向' },
      { name: 'output_format', type: 'select', label: '输出格式', defaultValue: 'tabular', options: ['tabular', 'xml', 'json', 'pairwise'], description: '结果输出格式' },
    ],
  },
  {
    id: 'blastp',
    name: 'BLASTP',
    description: '蛋白质序列比对工具，用于搜索蛋白质数据库',
    category: 'alignment',
    version: '2.14.0',
    parameters: [
      { name: 'database', type: 'select', label: '数据库', defaultValue: 'nr', options: ['nr', 'refseq_protein', 'swissprot', 'pdb'], description: '选择比对数据库' },
      { name: 'evalue', type: 'number', label: 'E值阈值', defaultValue: 1e-5, description: '期望阈值' },
      { name: 'word_size', type: 'number', label: '字长', defaultValue: 3, options: [2, 3, 4, 6], description: '初始匹配字长' },
      { name: 'matrix', type: 'select', label: '评分矩阵', defaultValue: 'BLOSUM62', options: ['BLOSUM45', 'BLOSUM62', 'BLOSUM80', 'PAM30', 'PAM70'], description: '氨基酸替换评分矩阵' },
      { name: 'gapopen', type: 'number', label: '空位开放罚分', defaultValue: 11, description: '打开空位的罚分' },
      { name: 'gapextend', type: 'number', label: '空位延伸罚分', defaultValue: 1, description: '延伸空位的罚分' },
    ],
  },
  {
    id: 'clustalw',
    name: 'ClustalW',
    description: '多序列比对工具，用于进化分析和保守区识别',
    category: 'alignment',
    version: '2.1',
    parameters: [
      { name: 'type', type: 'select', label: '序列类型', defaultValue: 'dna', options: ['dna', 'protein'], description: '输入序列类型' },
      { name: 'matrix', type: 'select', label: '评分矩阵', defaultValue: 'BLOSUM', options: ['BLOSUM', 'PAM', 'GONNET', 'ID'], description: '比对评分矩阵' },
      { name: 'gapopen', type: 'number', label: '空位开放罚分', defaultValue: 10, description: '打开空位的罚分' },
      { name: 'gapextend', type: 'number', label: '空位延伸罚分', defaultValue: 0.2, description: '延伸空位的罚分' },
      { name: 'endgaps', type: 'boolean', label: '末端空位罚分', defaultValue: false, description: '是否对末端空位进行罚分' },
      { name: 'iteration', type: 'select', label: '迭代次数', defaultValue: 'none', options: ['none', '1', '2', '3'], description: '迭代比对次数' },
    ],
  },
  {
    id: 'mafft',
    name: 'MAFFT',
    description: '快速多序列比对工具，适合大数据集',
    category: 'alignment',
    version: '7.505',
    parameters: [
      { name: 'algorithm', type: 'select', label: '算法', defaultValue: 'auto', options: ['auto', 'fft-ns-1', 'fft-ns-2', 'l-ins-i', 'e-ins-i', 'g-ins-i'], description: '比对算法选择' },
      { name: 'gapopen', type: 'number', label: '空位开放罚分', defaultValue: 1.53, description: '打开空位的罚分' },
      { name: 'gapextend', type: 'number', label: '空位延伸罚分', defaultValue: 0.123, description: '延伸空位的罚分' },
      { name: 'maxiterate', type: 'number', label: '最大迭代次数', defaultValue: 1000, description: '迭代比对的最大次数' },
      { name: 'adjustdirection', type: 'boolean', label: '方向校正', defaultValue: false, description: '自动校正序列方向' },
    ],
  },
  {
    id: 'muscle',
    name: 'MUSCLE',
    description: '高精度多序列比对工具，平衡速度和准确性',
    category: 'alignment',
    version: '5.1',
    parameters: [
      { name: 'mode', type: 'select', label: '运行模式', defaultValue: 'align', options: ['align', 'super5', 'refine', 'perturb'], description: 'MUSCLE运行模式' },
      { name: 'gapopen', type: 'number', label: '空位开放罚分', defaultValue: -2.9, description: '打开空位的罚分' },
      { name: 'gapextend', type: 'number', label: '空位延伸罚分', defaultValue: 0, description: '延伸空位的罚分' },
      { name: 'maxiters', type: 'number', label: '最大迭代次数', defaultValue: 16, description: '最大迭代次数' },
      { name: 'diags', type: 'boolean', label: '对角优化', defaultValue: true, description: '使用对角优化加速' },
    ],
  },
  {
    id: 'bowtie2',
    name: 'Bowtie2',
    description: '快速短读段比对工具，适合NGS数据',
    category: 'alignment',
    version: '2.5.1',
    parameters: [
      { name: 'mode', type: 'select', label: '比对模式', defaultValue: 'end-to-end', options: ['end-to-end', 'local'], description: '比对模式' },
      { name: 'sensitive', type: 'select', label: '敏感度', defaultValue: 'sensitive', options: ['very-fast', 'fast', 'sensitive', 'very-sensitive'], description: '速度-敏感度权衡' },
      { name: 'score_min', type: 'string', label: '最小得分', defaultValue: 'L,-0.6,-0.6', description: '最小比对得分函数' },
      { name: 'n', type: 'number', label: '最大错配数', defaultValue: 0, description: '种子区最大错配数' },
      { name: 'l', type: 'number', label: '种子长度', defaultValue: 22, description: '种子区长度' },
    ],
  },
  {
    id: 'bwa',
    name: 'BWA',
    description: 'Burrows-Wheeler比对工具，适合基因组重测序',
    category: 'alignment',
    version: '0.7.17',
    parameters: [
      { name: 'algorithm', type: 'select', label: '算法', defaultValue: 'mem', options: ['mem', 'aln', 'bwasw'], description: 'BWA算法选择' },
      { name: 't', type: 'number', label: '线程数', defaultValue: 4, description: '并行线程数' },
      { name: 'm', type: 'number', label: '最小种子长度', defaultValue: 19, description: 'MEM算法最小种子长度' },
      { name: 'T', type: 'number', label: '得分阈值', defaultValue: 30, description: '最小输出得分阈值' },
      { name: 'R', type: 'string', label: '读组信息', defaultValue: '@RG\\tID:foo\\tSM:bar', description: 'SAM读组标头' },
    ],
  },
  {
    id: 'minimap2',
    name: 'Minimap2',
    description: '快速长读段比对工具，适合PacBio/Nanopore数据',
    category: 'alignment',
    version: '2.26',
    parameters: [
      { name: 'preset', type: 'select', label: '预设模式', defaultValue: 'map-ont', options: ['map-ont', 'map-pb', 'map-hifi', 'asm5', 'asm10', 'sr'], description: '测序技术预设' },
      { name: 't', type: 'number', label: '线程数', defaultValue: 4, description: '并行线程数' },
      { name: 'k', type: 'number', label: 'k-mer长度', defaultValue: 15, description: '种子k-mer长度' },
      { name: 'w', type: 'number', label: '窗口大小', defaultValue: 10, description: '最小化窗口大小' },
      { name: 'N', type: 'number', label: '保留候选数', defaultValue: 50, description: '每个read保留的候选比对数' },
    ],
  },
];

export const getToolConfig = (toolId: string): AlignmentToolConfig | undefined => {
  return ALIGNMENT_TOOLS.find(t => t.id === toolId);
};
