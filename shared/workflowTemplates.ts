import type { WorkflowTemplate, WorkflowGraph, WorkflowNode, WorkflowEdge, AlignmentTool } from './types.js';

function createTemplateNode(
  id: string,
  type: 'input' | 'tool' | 'output' | 'branch' | 'merge',
  position: { x: number; y: number },
  toolId?: AlignmentTool,
  label?: string
): WorkflowNode {
  const toolConfig = toolId ? { id: toolId } : {};
  const params: Record<string, string | number | boolean> = {};
  
  if (toolId === 'blastn') {
    Object.assign(params, {
      database: 'nt',
      evalue: 1e-5,
      word_size: 11,
      gapopen: 5,
      gapextend: 2,
      strand: 'both',
      output_format: 'tabular',
    });
  } else if (toolId === 'blastp') {
    Object.assign(params, {
      database: 'nr',
      evalue: 1e-5,
      word_size: 3,
      matrix: 'BLOSUM62',
      gapopen: 11,
      gapextend: 1,
    });
  } else if (toolId === 'clustalw') {
    Object.assign(params, {
      type: 'dna',
      matrix: 'BLOSUM',
      gapopen: 10,
      gapextend: 0.2,
      endgaps: false,
      iteration: 'none',
    });
  } else if (toolId === 'mafft') {
    Object.assign(params, {
      algorithm: 'auto',
      gapopen: 1.53,
      gapextend: 0.123,
      maxiterate: 1000,
      adjustdirection: false,
    });
  } else if (toolId === 'muscle') {
    Object.assign(params, {
      mode: 'align',
      gapopen: -2.9,
      gapextend: 0,
      maxiters: 16,
      diags: true,
    });
  } else if (toolId === 'bowtie2') {
    Object.assign(params, {
      mode: 'end-to-end',
      sensitive: 'sensitive',
      score_min: 'L,-0.6,-0.6',
      n: 0,
      l: 22,
    });
  } else if (toolId === 'bwa') {
    Object.assign(params, {
      algorithm: 'mem',
      t: 4,
      m: 19,
      T: 30,
      R: '@RG\\tID:foo\\tSM:bar',
    });
  } else if (toolId === 'minimap2') {
    Object.assign(params, {
      preset: 'map-ont',
      t: 4,
      k: 15,
      w: 10,
      N: 50,
    });
  }

  let inputPorts: { id: string; label?: string }[] = [];
  let outputPorts: { id: string; label?: string }[] = [];
  let nodeLabel = label || '';

  switch (type) {
    case 'input':
      nodeLabel = label || '输入样本';
      outputPorts = [{ id: 'out-1', label: '数据' }];
      break;
    case 'output':
      nodeLabel = label || '输出结果';
      inputPorts = [{ id: 'in-1', label: '结果' }];
      break;
    case 'tool':
      nodeLabel = label || '分析工具';
      inputPorts = [{ id: 'in-1', label: '输入' }];
      outputPorts = [{ id: 'out-1', label: '输出' }];
      break;
    case 'branch':
      nodeLabel = label || '条件分支';
      inputPorts = [{ id: 'in-1', label: '输入' }];
      outputPorts = [{ id: 'out-1', label: '分支1' }, { id: 'out-2', label: '分支2' }];
      break;
    case 'merge':
      nodeLabel = label || '数据合并';
      inputPorts = [{ id: 'in-1', label: '输入1' }, { id: 'in-2', label: '输入2' }];
      outputPorts = [{ id: 'out-1', label: '输出' }];
      break;
  }

  return {
    id,
    type,
    label: nodeLabel,
    position,
    ...toolConfig,
    parameters: Object.keys(params).length > 0 ? params : undefined,
    inputPorts,
    outputPorts,
  };
}

function createEdge(id: string, source: string, target: string, sourcePort: string, targetPort: string): WorkflowEdge {
  return { id, source, target, sourcePort, targetPort };
}

function createSimpleGraph(toolIds: AlignmentTool[], startX = 60, startY = 200): WorkflowGraph {
  const nodes: WorkflowNode[] = [];
  const edges: WorkflowEdge[] = [];
  const spacing = 280;

  nodes.push(createTemplateNode('node_input', 'input', { x: startX, y: startY }, undefined, '输入样本'));

  toolIds.forEach((toolId, idx) => {
    const nodeId = `node_tool_${idx}`;
    nodes.push(createTemplateNode(
      nodeId,
      'tool',
      { x: startX + spacing * (idx + 1), y: startY },
      toolId
    ));
    edges.push(createEdge(
      `edge_${idx}`,
      idx === 0 ? 'node_input' : `node_tool_${idx - 1}`,
      nodeId,
      idx === 0 ? 'out-1' : 'out-1',
      'in-1'
    ));
  });

  nodes.push(createTemplateNode(
    'node_output',
    'output',
    { x: startX + spacing * (toolIds.length + 1), y: startY },
    undefined,
    '输出结果'
  ));
  edges.push(createEdge(
    `edge_final`,
    `node_tool_${toolIds.length - 1}`,
    'node_output',
    'out-1',
    'in-1'
  ));

  return { nodes, edges };
}

export const BUILT_IN_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'template_001',
    name: '全基因组重测序变异检测',
    description: '标准全基因组重测序分析流程，包括序列比对、去重、碱基质量重校准和变异检测。适用于人类及其他模式生物的全基因组变异分析。',
    category: 'variant_calling',
    tags: ['WGS', 'SNP', 'INDEL', '变异检测', '人类基因组'],
    isBuiltIn: true,
    isPublic: true,
    author: 'GenomeLab Team',
    authorId: 'system',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    usageCount: 15234,
    favoriteCount: 3241,
    shareCount: 856,
    graph: createSimpleGraph(['bwa', 'bwa', 'blastn']),
    parameters: {
      reference_genome: 'hg38',
      min_coverage: 30,
      call_snp: true,
      call_indel: true,
    },
    estimatedRuntime: '8-12小时',
    difficulty: 'advanced',
    version: '4.2.0',
    requirements: {
      minRAM: '32GB',
      minCores: 8,
      referenceGenome: 'GRCh38/hg38',
    },
  },
  {
    id: 'template_002',
    name: '外显子组测序变异检测',
    description: '针对外显子捕获区域的高深度测序分析流程，专注于编码区域的精准变异检测。',
    category: 'variant_calling',
    tags: ['WES', '外显子组', '临床诊断'],
    isBuiltIn: true,
    isPublic: true,
    author: 'GenomeLab Team',
    authorId: 'system',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    usageCount: 28451,
    favoriteCount: 5672,
    shareCount: 1203,
    graph: createSimpleGraph(['bwa', 'blastn']),
    parameters: {
      reference_genome: 'hg38',
      min_coverage: 100,
      target_bed: 'exome_target.bed',
    },
    estimatedRuntime: '3-6小时',
    difficulty: 'intermediate',
    version: '3.1.0',
    requirements: {
      minRAM: '16GB',
      minCores: 4,
      referenceGenome: 'GRCh38/hg38',
    },
  },
  {
    id: 'template_003',
    name: '靶向测序基因panel分析',
    description: '针对定制化基因panel的靶向测序数据分析，适用于临床基因检测。',
    category: 'variant_calling',
    tags: ['Panel', '靶向测序', '精准医疗'],
    isBuiltIn: true,
    isPublic: true,
    author: 'GenomeLab Team',
    authorId: 'system',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    usageCount: 8932,
    favoriteCount: 2103,
    shareCount: 421,
    graph: createSimpleGraph(['bwa']),
    parameters: {
      min_coverage: 500,
      min_base_quality: 30,
    },
    estimatedRuntime: '1-2小时',
    difficulty: 'intermediate',
    version: '2.5.0',
    requirements: {
      minRAM: '8GB',
      minCores: 4,
      referenceGenome: 'GRCh37/hg19',
    },
  },
  {
    id: 'template_004',
    name: '转录组差异表达分析',
    description: '标准RNA-seq数据分析流程，包括质量控制、比对、基因定量和差异表达分析。',
    category: 'rna_seq',
    tags: ['RNA-seq', '差异表达', '基因表达'],
    isBuiltIn: true,
    isPublic: true,
    author: 'GenomeLab Team',
    authorId: 'system',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    usageCount: 32156,
    favoriteCount: 7823,
    shareCount: 2156,
    graph: createSimpleGraph(['bowtie2', 'blastn']),
    parameters: {
      library_type: 'paired_end',
      strand_specific: false,
      min_counts: 10,
    },
    estimatedRuntime: '4-8小时',
    difficulty: 'intermediate',
    version: '2.8.0',
    requirements: {
      minRAM: '16GB',
      minCores: 8,
      referenceGenome: 'GRCh38',
    },
  },
  {
    id: 'template_005',
    name: '单细胞RNA-seq分析',
    description: '单细胞转录组数据分析，包括细胞过滤、标准化、聚类和细胞类型鉴定。',
    category: 'single_cell',
    tags: ['scRNA-seq', '单细胞', '细胞聚类'],
    isBuiltIn: true,
    isPublic: true,
    author: 'GenomeLab Team',
    authorId: 'system',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    usageCount: 5621,
    favoriteCount: 1892,
    shareCount: 567,
    graph: createSimpleGraph(['minimap2']),
    parameters: {
      expected_cells: 5000,
      min_genes: 200,
      max_mt_percent: 20,
    },
    estimatedRuntime: '12-24小时',
    difficulty: 'advanced',
    version: '1.5.0',
    requirements: {
      minRAM: '64GB',
      minCores: 16,
    },
  },
  {
    id: 'template_006',
    name: '宏基因组物种分类分析',
    description: '宏基因组测序数据分析，包括物种注释、丰度分析和功能注释。',
    category: 'metagenomics',
    tags: ['宏基因组', '微生物组', '物种分类'],
    isBuiltIn: true,
    isPublic: true,
    author: 'GenomeLab Team',
    authorId: 'system',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    usageCount: 7823,
    favoriteCount: 2341,
    shareCount: 678,
    graph: createSimpleGraph(['blastn', 'blastp']),
    parameters: {
      database: 'ncbi_nr',
      min_identity: 97,
      min_coverage: 80,
    },
    estimatedRuntime: '24-48小时',
    difficulty: 'advanced',
    version: '3.2.0',
    requirements: {
      minRAM: '128GB',
      minCores: 32,
    },
  },
  {
    id: 'template_007',
    name: 'ChIP-seq转录因子结合分析',
    description: 'ChIP-seq数据分析流程，用于识别转录因子结合位点或组蛋白修饰区域。',
    category: 'chip_seq',
    tags: ['ChIP-seq', '转录因子', '表观遗传'],
    isBuiltIn: true,
    isPublic: true,
    author: 'GenomeLab Team',
    authorId: 'system',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    usageCount: 4521,
    favoriteCount: 1234,
    shareCount: 345,
    graph: createSimpleGraph(['bowtie2']),
    parameters: {
      factor_type: 'histone',
      q_value: 0.01,
      fold_enrichment: 10,
    },
    estimatedRuntime: '6-12小时',
    difficulty: 'advanced',
    version: '2.3.0',
    requirements: {
      minRAM: '32GB',
      minCores: 8,
      referenceGenome: 'hg38',
    },
  },
  {
    id: 'template_008',
    name: 'ATAC-seq染色质开放区域分析',
    description: 'ATAC-seq数据分析，用于鉴定染色质开放区域和转录因子结合足迹。',
    category: 'chip_seq',
    tags: ['ATAC-seq', '染色质开放', '调控元件'],
    isBuiltIn: true,
    isPublic: true,
    author: 'GenomeLab Team',
    authorId: 'system',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    usageCount: 3892,
    favoriteCount: 987,
    shareCount: 289,
    graph: createSimpleGraph(['bowtie2', 'bwa']),
    parameters: {
      insert_size: 38,
      q_value: 0.05,
    },
    estimatedRuntime: '4-8小时',
    difficulty: 'advanced',
    version: '1.8.0',
    requirements: {
      minRAM: '16GB',
      minCores: 8,
      referenceGenome: 'hg38',
    },
  },
  {
    id: 'template_009',
    name: '全基因组亚硫酸氢盐测序甲基化分析',
    description: 'WGBS数据分析，用于全基因组范围的DNA甲基化位点鉴定和差异甲基化区域分析。',
    category: 'methylation',
    tags: ['WGBS', '甲基化', '表观遗传'],
    isBuiltIn: true,
    isPublic: true,
    author: 'GenomeLab Team',
    authorId: 'system',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    usageCount: 2341,
    favoriteCount: 654,
    shareCount: 189,
    graph: createSimpleGraph(['bwa']),
    parameters: {
      min_coverage: 10,
      min_quality: 20,
    },
    estimatedRuntime: '18-36小时',
    difficulty: 'advanced',
    version: '2.1.0',
    requirements: {
      minRAM: '64GB',
      minCores: 16,
      referenceGenome: 'hg38',
    },
  },
  {
    id: 'template_010',
    name: '简化甲基化测序分析',
    description: 'RRBS（Reduced Representation Bisulfite Sequencing）数据分析，专注于CpG富集区域的甲基化分析。',
    category: 'methylation',
    tags: ['RRBS', '甲基化', 'CpG岛'],
    isBuiltIn: true,
    isPublic: true,
    author: 'GenomeLab Team',
    authorId: 'system',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    usageCount: 1892,
    favoriteCount: 523,
    shareCount: 145,
    graph: createSimpleGraph(['bwa']),
    parameters: {
      min_coverage: 5,
      cpg_only: true,
    },
    estimatedRuntime: '6-12小时',
    difficulty: 'intermediate',
    version: '1.6.0',
    requirements: {
      minRAM: '16GB',
      minCores: 8,
      referenceGenome: 'hg38',
    },
  },
  {
    id: 'template_011',
    name: '细菌基因组从头组装',
    description: '细菌全基因组从头组装流程，适合细菌基因组的完整组装和注释。',
    category: 'assembly',
    tags: ['细菌基因组', '从头组装', '微生物'],
    isBuiltIn: true,
    isPublic: true,
    author: 'GenomeLab Team',
    authorId: 'system',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    usageCount: 5678,
    favoriteCount: 1567,
    shareCount: 456,
    graph: createSimpleGraph(['minimap2']),
    parameters: {
      genome_size: '5M',
      expected_coverage: 100,
    },
    estimatedRuntime: '4-8小时',
    difficulty: 'intermediate',
    version: '3.0.0',
    requirements: {
      minRAM: '16GB',
      minCores: 8,
    },
  },
  {
    id: 'template_012',
    name: '真菌基因组组装与注释',
    description: '真菌基因组的从头组装和结构基因预测、功能注释。',
    category: 'assembly',
    tags: ['真菌基因组', '基因预测'],
    isBuiltIn: true,
    isPublic: true,
    author: 'GenomeLab Team',
    authorId: 'system',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    usageCount: 2345,
    favoriteCount: 678,
    shareCount: 198,
    graph: createSimpleGraph(['minimap2', 'blastp']),
    parameters: {
      genome_size: '30M',
      repeat_masking: true,
    },
    estimatedRuntime: '12-24小时',
    difficulty: 'advanced',
    version: '2.2.0',
    requirements: {
      minRAM: '32GB',
      minCores: 16,
    },
  },
  {
    id: 'template_013',
    name: '动植物基因组组装',
    description: '复杂真核生物基因组的混合组装策略，结合短读长和长读长测序数据。',
    category: 'assembly',
    tags: ['基因组组装', '动植物', '长读长'],
    isBuiltIn: true,
    isPublic: true,
    author: 'GenomeLab Team',
    authorId: 'system',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    usageCount: 1234,
    favoriteCount: 345,
    shareCount: 98,
    graph: createSimpleGraph(['minimap2', 'bwa']),
    parameters: {
      ploidy: 2,
      heterozygosity: 0.01,
    },
    estimatedRuntime: '48-72小时',
    difficulty: 'advanced',
    version: '1.3.0',
    requirements: {
      minRAM: '256GB',
      minCores: 32,
    },
  },
  {
    id: 'template_014',
    name: '宏基因组组装分箱',
    description: '宏基因组测序数据的组装和分箱分析，获得高质量微生物基因组草图。',
    category: 'metagenomics',
    tags: ['宏基因组', '分箱', 'MAG'],
    isBuiltIn: true,
    isPublic: true,
    author: 'GenomeLab Team',
    authorId: 'system',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    usageCount: 3456,
    favoriteCount: 890,
    shareCount: 267,
    graph: createSimpleGraph(['minimap2', 'blastn']),
    parameters: {
      min_contig_length: 2000,
      min_completeness: 70,
    },
    estimatedRuntime: '24-48小时',
    difficulty: 'advanced',
    version: '2.0.0',
    requirements: {
      minRAM: '128GB',
      minCores: 32,
    },
  },
  {
    id: 'template_015',
    name: '多序列比对进化分析',
    description: '多序列比对和系统发育树构建，用于进化关系分析。',
    category: 'alignment',
    tags: ['多序列比对', '进化树', '系统发育'],
    isBuiltIn: true,
    isPublic: true,
    author: 'GenomeLab Team',
    authorId: 'system',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    usageCount: 12456,
    favoriteCount: 4567,
    shareCount: 1456,
    graph: createSimpleGraph(['mafft', 'clustalw']),
    parameters: {
      tree_method: 'ML',
      bootstrap: 1000,
      model: 'GTR+G',
    },
    estimatedRuntime: '1-4小时',
    difficulty: 'beginner',
    version: '3.5.0',
    requirements: {
      minRAM: '8GB',
      minCores: 4,
    },
  },
  {
    id: 'template_016',
    name: '蛋白质同源搜索与功能注释',
    description: '蛋白质序列的同源性搜索和功能域鉴定，包括GO、KEGG等数据库注释。',
    category: 'annotation',
    tags: ['蛋白质注释', '同源搜索', '功能预测'],
    isBuiltIn: true,
    isPublic: true,
    author: 'GenomeLab Team',
    authorId: 'system',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    usageCount: 8765,
    favoriteCount: 2345,
    shareCount: 789,
    graph: createSimpleGraph(['blastp', 'blastp']),
    parameters: {
      evalue: 1e-10,
      min_identity: 30,
    },
    estimatedRuntime: '2-6小时',
    difficulty: 'intermediate',
    version: '2.7.0',
    requirements: {
      minRAM: '16GB',
      minCores: 8,
    },
  },
  {
    id: 'template_017',
    name: 'BLAST序列比对分析',
    description: '基础BLAST序列比对分析流程，支持核酸和蛋白质序列比对。',
    category: 'alignment',
    tags: ['BLAST', '序列比对', '同源性分析'],
    isBuiltIn: true,
    isPublic: true,
    author: 'GenomeLab Team',
    authorId: 'system',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    usageCount: 45678,
    favoriteCount: 12345,
    shareCount: 4567,
    graph: createSimpleGraph(['blastn']),
    parameters: {
      database: 'nt',
      evalue: 1e-5,
      max_target_seqs: 500,
    },
    estimatedRuntime: '30分钟-2小时',
    difficulty: 'beginner',
    version: '5.0.0',
    requirements: {
      minRAM: '4GB',
      minCores: 2,
    },
  },
  {
    id: 'template_018',
    name: '长读长转录组分析',
    description: '基于Nanopore或PacBio的全长转录组测序数据分析。',
    category: 'rna_seq',
    tags: ['长读长', '全长转录本', '异构体'],
    isBuiltIn: true,
    isPublic: true,
    author: 'GenomeLab Team',
    authorId: 'system',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    usageCount: 2134,
    favoriteCount: 678,
    shareCount: 189,
    graph: createSimpleGraph(['minimap2']),
    parameters: {
      min_accuracy: 0.9,
      min_isoform_coverage: 3,
    },
    estimatedRuntime: '8-16小时',
    difficulty: 'advanced',
    version: '1.2.0',
    requirements: {
      minRAM: '32GB',
      minCores: 16,
      referenceGenome: 'hg38',
    },
  },
  {
    id: 'template_019',
    name: '基因融合检测',
    description: '从RNA-seq数据中检测基因融合事件，适用于癌症基因组研究。',
    category: 'rna_seq',
    tags: ['基因融合', '癌症基因组', '易位'],
    isBuiltIn: true,
    isPublic: true,
    author: 'GenomeLab Team',
    authorId: 'system',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    usageCount: 1567,
    favoriteCount: 432,
    shareCount: 123,
    graph: createSimpleGraph(['bowtie2', 'bwa']),
    parameters: {
      min_supporting_reads: 10,
      min_junction_reads: 5,
    },
    estimatedRuntime: '6-12小时',
    difficulty: 'advanced',
    version: '1.4.0',
    requirements: {
      minRAM: '32GB',
      minCores: 8,
      referenceGenome: 'hg38',
    },
  },
  {
    id: 'template_020',
    name: '小RNA测序分析',
    description: '小RNA（miRNA、siRNA等）测序数据分析，包括已知miRNA鉴定和新miRNA预测。',
    category: 'rna_seq',
    tags: ['small RNA', 'miRNA', '基因调控'],
    isBuiltIn: true,
    isPublic: true,
    author: 'GenomeLab Team',
    authorId: 'system',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    usageCount: 3456,
    favoriteCount: 987,
    shareCount: 289,
    graph: createSimpleGraph(['bowtie2', 'blastn']),
    parameters: {
      min_length: 18,
      max_length: 35,
    },
    estimatedRuntime: '3-6小时',
    difficulty: 'intermediate',
    version: '2.1.0',
    requirements: {
      minRAM: '8GB',
      minCores: 4,
      referenceGenome: 'hg38',
    },
  },
  {
    id: 'template_021',
    name: '单细胞ATAC-seq分析',
    description: '单细胞染色质开放区域分析，揭示细胞异质性的染色质调控景观。',
    category: 'single_cell',
    tags: ['scATAC-seq', '单细胞', '调控网络'],
    isBuiltIn: true,
    isPublic: true,
    author: 'GenomeLab Team',
    authorId: 'system',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    usageCount: 1876,
    favoriteCount: 543,
    shareCount: 165,
    graph: createSimpleGraph(['bowtie2']),
    parameters: {
      expected_cells: 5000,
      min_fragments: 1000,
      tss_enrichment: 5,
    },
    estimatedRuntime: '12-24小时',
    difficulty: 'advanced',
    version: '1.1.0',
    requirements: {
      minRAM: '64GB',
      minCores: 16,
      referenceGenome: 'hg38',
    },
  },
  {
    id: 'template_022',
    name: 'CRISPR筛选数据分析',
    description: 'CRISPR功能基因组筛选数据的分析流程，包括sgRNA定量和必需基因鉴定。',
    category: 'variant_calling',
    tags: ['CRISPR', '功能基因组', '筛选'],
    isBuiltIn: true,
    isPublic: true,
    author: 'GenomeLab Team',
    authorId: 'system',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    usageCount: 987,
    favoriteCount: 321,
    shareCount: 89,
    graph: createSimpleGraph(['bowtie2']),
    parameters: {
      library_type: 'GeCKOv2',
      min_count: 50,
    },
    estimatedRuntime: '2-4小时',
    difficulty: 'intermediate',
    version: '1.0.0',
    requirements: {
      minRAM: '16GB',
      minCores: 8,
    },
  },
  {
    id: 'template_023',
    name: '宏基因组抗性基因分析',
    description: '宏基因组数据中的抗生素抗性基因分析和风险评估。',
    category: 'metagenomics',
    tags: ['耐药基因', 'ARGs', '公共卫生'],
    isBuiltIn: true,
    isPublic: true,
    author: 'GenomeLab Team',
    authorId: 'system',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    usageCount: 2345,
    favoriteCount: 678,
    shareCount: 189,
    graph: createSimpleGraph(['blastn']),
    parameters: {
      database: 'CARD',
      min_identity: 80,
    },
    estimatedRuntime: '6-12小时',
    difficulty: 'intermediate',
    version: '1.7.0',
    requirements: {
      minRAM: '16GB',
      minCores: 8,
    },
  },
  {
    id: 'template_024',
    name: '病毒基因组检测与组装',
    description: '从宏基因组或临床样本中检测病毒序列并进行基因组组装。',
    category: 'metagenomics',
    tags: ['病毒检测', '病毒组装', '病原体'],
    isBuiltIn: true,
    isPublic: true,
    author: 'GenomeLab Team',
    authorId: 'system',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    usageCount: 3456,
    favoriteCount: 987,
    shareCount: 289,
    graph: createSimpleGraph(['blastn', 'minimap2']),
    parameters: {
      min_coverage: 10,
      min_length: 500,
    },
    estimatedRuntime: '12-24小时',
    difficulty: 'advanced',
    version: '2.0.0',
    requirements: {
      minRAM: '32GB',
      minCores: 16,
    },
  },
  {
    id: 'template_025',
    name: '临床外显子组诊断分析',
    description: '符合临床诊断标准的外显子组数据分析，包括变异注释和致病性评估。',
    category: 'variant_calling',
    tags: ['临床诊断', 'ACMG标准', '变异解读'],
    isBuiltIn: true,
    isPublic: true,
    author: 'GenomeLab Team',
    authorId: 'system',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    usageCount: 1567,
    favoriteCount: 432,
    shareCount: 123,
    graph: createSimpleGraph(['bwa', 'blastn']),
    parameters: {
      acmg_standard: true,
      population_frequency: 0.01,
    },
    estimatedRuntime: '8-12小时',
    difficulty: 'advanced',
    version: '1.8.0',
    requirements: {
      minRAM: '32GB',
      minCores: 8,
      referenceGenome: 'GRCh37',
    },
  },
];

export const getTemplateById = (id: string): WorkflowTemplate | undefined => {
  return BUILT_IN_TEMPLATES.find(t => t.id === id);
};

export const getTemplatesByCategory = (category: string): WorkflowTemplate[] => {
  return BUILT_IN_TEMPLATES.filter(t => t.category === category);
};

export const searchTemplates = (keyword: string): WorkflowTemplate[] => {
  const lower = keyword.toLowerCase();
  return BUILT_IN_TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(lower) ||
    t.description.toLowerCase().includes(lower) ||
    t.tags.some(tag => tag.toLowerCase().includes(lower))
  );
};
