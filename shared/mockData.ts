import type { Project, Batch, Sample, AnalysisRecord, Variant, AlignmentResult, AnalysisReport, BlastDotPlotData, BlastHSP, ClustalAlignmentData, ClustalAlignedSequence, ClustalColumnInfo, GcSlidingWindowResult, CodonPreferenceResult, CodonPositionBaseFrequency, RscuEntry, OrfPredictionResult, OrfRecord } from './types.js';

const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).substring(2, 10)}`;

const generateDnaSequence = (length: number): string => {
  const bases = ['A', 'T', 'G', 'C'];
  let seq = '';
  for (let i = 0; i < length; i++) {
    seq += bases[Math.floor(Math.random() * 4)];
  }
  return seq;
};

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj_001',
    name: '肺癌基因组变异研究',
    description: '针对非小细胞肺癌患者的全外显子测序分析，旨在识别新的驱动突变和治疗靶点',
    organism: 'Homo sapiens',
    batchCount: 3,
    sampleCount: 45,
    analysisCount: 12,
    createdAt: '2026-03-15T08:00:00Z',
    updatedAt: '2026-06-10T14:30:00Z',
    status: 'active',
    principalInvestigator: '张教授',
  },
  {
    id: 'proj_002',
    name: '微生物耐药基因监测',
    description: '临床分离菌株的耐药基因分析，监测耐药基因传播和演化',
    organism: 'Multiple pathogens',
    batchCount: 5,
    sampleCount: 78,
    analysisCount: 23,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-06-15T09:15:00Z',
    status: 'active',
    principalInvestigator: '李博士',
  },
  {
    id: 'proj_003',
    name: '植物抗逆性状GWAS分析',
    description: '拟南芥抗旱性状的全基因组关联分析',
    organism: 'Arabidopsis thaliana',
    batchCount: 2,
    sampleCount: 120,
    analysisCount: 8,
    createdAt: '2026-01-10T13:00:00Z',
    updatedAt: '2026-05-20T16:45:00Z',
    status: 'completed',
    principalInvestigator: '王研究员',
  },
  {
    id: 'proj_004',
    name: '遗传性疾病基因诊断',
    description: '罕见病患者的临床基因检测与诊断',
    organism: 'Homo sapiens',
    batchCount: 4,
    sampleCount: 32,
    analysisCount: 15,
    createdAt: '2026-04-01T09:00:00Z',
    updatedAt: '2026-06-18T11:00:00Z',
    status: 'active',
    principalInvestigator: '陈医生',
  },
];

export const MOCK_BATCHES: Batch[] = [
  {
    id: 'batch_001',
    name: '肺癌批次-2026A',
    projectId: 'proj_001',
    description: '第一批次肺癌样本，包含15例腺癌和15例鳞癌',
    sampleCount: 30,
    createdAt: '2026-03-20T10:00:00Z',
    createdBy: '李技术员',
    status: 'completed',
  },
  {
    id: 'batch_002',
    name: '肺癌批次-2026B',
    projectId: 'proj_001',
    description: '第二批次肺癌样本，含配对癌旁组织',
    sampleCount: 15,
    createdAt: '2026-05-10T14:00:00Z',
    createdBy: '李技术员',
    status: 'processing',
  },
  {
    id: 'batch_003',
    name: '耐药菌监测-临床批次1',
    projectId: 'proj_002',
    description: '三甲医院临床分离的革兰氏阴性菌',
    sampleCount: 25,
    createdAt: '2026-02-15T09:00:00Z',
    createdBy: '王实验员',
    status: 'completed',
  },
  {
    id: 'batch_004',
    name: '耐药菌监测-环境批次',
    projectId: 'proj_002',
    description: '医院环境监测样本',
    sampleCount: 20,
    createdAt: '2026-03-01T11:00:00Z',
    createdBy: '王实验员',
    status: 'completed',
  },
  {
    id: 'batch_005',
    name: '拟南芥干旱处理组',
    projectId: 'proj_003',
    description: '干旱处理7天后的拟南芥样本',
    sampleCount: 60,
    createdAt: '2026-01-20T08:00:00Z',
    createdBy: '赵同学',
    status: 'completed',
  },
  {
    id: 'batch_006',
    name: '罕见病诊断批次1',
    projectId: 'proj_004',
    description: '神经肌肉疾病疑似患者样本',
    sampleCount: 12,
    createdAt: '2026-04-10T10:30:00Z',
    createdBy: '刘技师',
    status: 'completed',
  },
  {
    id: 'batch_007',
    name: '罕见病诊断批次2',
    projectId: 'proj_004',
    description: '代谢疾病疑似患者样本',
    sampleCount: 10,
    createdAt: '2026-05-15T13:00:00Z',
    createdBy: '刘技师',
    status: 'processing',
  },
];

const sampleNames = [
  'LC-001-T', 'LC-001-N', 'LC-002-T', 'LC-002-N', 'LC-003-T',
  'LC-004-T', 'LC-005-T', 'LC-006-N', 'LC-007-T', 'LC-008-T',
  'EC-001', 'EC-002', 'KP-001', 'KP-002', 'PA-001',
  'AT-D-001', 'AT-D-002', 'AT-C-001', 'AT-C-002', 'AT-D-003',
  'RD-001', 'RD-002', 'MD-001', 'MD-002', 'CN-001',
];

export const MOCK_SAMPLES: Sample[] = sampleNames.map((name, idx) => {
  const batchMap: Record<string, string> = {
    'LC': 'batch_001', 'EC': 'batch_003', 'KP': 'batch_003',
    'PA': 'batch_003', 'AT': 'batch_005', 'RD': 'batch_006',
    'MD': 'batch_006', 'CN': 'batch_007',
  };
  const projectMap: Record<string, string> = {
    'LC': 'proj_001', 'EC': 'proj_002', 'KP': 'proj_002',
    'PA': 'proj_002', 'AT': 'proj_003', 'RD': 'proj_004',
    'MD': 'proj_004', 'CN': 'proj_004',
  };
  const prefix = name.split('-')[0];
  return {
    id: `sample_${String(idx + 1).padStart(3, '0')}`,
    name,
    batchId: batchMap[prefix] || 'batch_001',
    projectId: projectMap[prefix] || 'proj_001',
    description: `样本 ${name} - ${idx % 2 === 0 ? '实验组' : '对照组'}`,
    sequenceType: 'dna',
    sequence: generateDnaSequence(5000),
    organism: prefix === 'AT' ? 'Arabidopsis thaliana' : 'Homo sapiens',
    createdAt: `2026-${String(3 + idx % 4).padStart(2, '0')}-${String((idx % 28) + 1).padStart(2, '0')}T10:00:00Z`,
    metadata: {
      'sampleType': idx % 2 === 0 ? 'tumor' : 'normal',
      'extractionMethod': 'QIAamp DNA Mini Kit',
      'concentration': `${50 + Math.floor(Math.random() * 100)}ng/μL`,
      'volume': `${20 + Math.floor(Math.random() * 30)}μL`,
    },
  };
});

const chromosomes = ['chr1', 'chr2', 'chr3', 'chr7', 'chr11', 'chr17', 'chr19', 'chrX'];
const genes = ['EGFR', 'KRAS', 'BRAF', 'PIK3CA', 'TP53', 'BRCA1', 'BRCA2', 'ALK', 'ROS1', 'MET'];
const variantTypes: Array<'SNP' | 'INDEL' | 'INSERTION' | 'DELETION'> = ['SNP', 'SNP', 'SNP', 'INDEL', 'INSERTION', 'DELETION'];
const effects: Array<'synonymous' | 'missense' | 'nonsense' | 'frameshift' | 'intronic'> = ['missense', 'missense', 'missense', 'nonsense', 'frameshift', 'synonymous', 'intronic'];
const clinicalSigs: Array<'pathogenic' | 'likely_pathogenic' | 'uncertain' | 'likely_benign' | 'benign'> = ['pathogenic', 'likely_pathogenic', 'uncertain', 'likely_benign', 'benign'];

export const MOCK_VARIANTS: Variant[] = Array.from({ length: 80 }, (_, i) => {
  const sampleIdx = i % 20;
  const sampleId = `sample_${String(sampleIdx + 1).padStart(3, '0')}`;
  const analysisIdx = Math.floor(i / 10) + 1;
  const type = variantTypes[i % variantTypes.length];
  const isSnp = type === 'SNP';
  const bases = ['A', 'T', 'G', 'C'];
  const ref = bases[Math.floor(Math.random() * 4)];
  let alt = bases[Math.floor(Math.random() * 4)];
  while (alt === ref) alt = bases[Math.floor(Math.random() * 4)];

  return {
    id: `var_${String(i + 1).padStart(5, '0')}`,
    analysisId: `analysis_${String(analysisIdx).padStart(3, '0')}`,
    sampleId,
    chromosome: chromosomes[i % chromosomes.length],
    position: 1000000 + Math.floor(Math.random() * 100000000),
    ref: isSnp ? ref : ref + bases[Math.floor(Math.random() * 4)],
    alt: isSnp ? alt : alt + bases[Math.floor(Math.random() * 4)] + bases[Math.floor(Math.random() * 4)],
    type,
    quality: 50 + Math.floor(Math.random() * 950),
    depth: 20 + Math.floor(Math.random() * 200),
    alleleFrequency: 0.1 + Math.random() * 0.9,
    effect: effects[i % effects.length],
    gene: genes[i % genes.length],
    transcript: `NM_${String(100000 + Math.floor(Math.random() * 900000))}.${1 + Math.floor(Math.random() * 5)}`,
    proteinChange: `p.${['Ala', 'Arg', 'Asn', 'Asp'][Math.floor(Math.random() * 4)]}${100 + i}${['Val', 'Leu', 'Ile'][Math.floor(Math.random() * 3)]}`,
    clinicalSignificance: clinicalSigs[i % clinicalSigs.length],
    dbSnpId: Math.random() > 0.3 ? `rs${1000000 + Math.floor(Math.random() * 99000000)}` : undefined,
    cosmidId: Math.random() > 0.7 ? `COSM${10000 + Math.floor(Math.random() * 999999)}` : undefined,
    filters: i % 3 === 0 ? ['PASS'] : i % 3 === 1 ? ['LowQual'] : ['PASS', 'Somatic'],
    annotations: [
      {
        source: 'VEP',
        database: 'Ensembl',
        annotationId: `vep_${i}`,
        description: 'Variant Effect Predictor annotation',
        clinicalRelevance: Math.random() > 0.5 ? 'high' : 'moderate',
        references: ['PMID:28149667'],
      },
      ...(Math.random() > 0.5 ? [{
        source: 'ClinVar',
        database: 'NCBI',
        annotationId: `cv_${i}`,
        description: 'Clinical variation database annotation',
        clinicalRelevance: clinicalSigs[i % clinicalSigs.length],
        references: ['PMID:24234457'],
      }] : []),
    ],
  };
});

export const MOCK_ANALYSES: AnalysisRecord[] = [
  {
    id: 'analysis_001',
    name: '肺癌样本全外显子比对分析',
    projectId: 'proj_001',
    batchId: 'batch_001',
    sampleIds: ['sample_001', 'sample_002', 'sample_003', 'sample_004', 'sample_005'],
    description: '使用BWA-MEM进行全外显子测序数据比对',
    status: 'completed',
    createdAt: '2026-04-01T09:00:00Z',
    startedAt: '2026-04-01T09:05:00Z',
    completedAt: '2026-04-01T11:30:00Z',
    createdBy: '李技术员',
    version: 2,
    parentAnalysisId: undefined,
    currentStep: 3,
    steps: [
      {
        stepId: 'step_001',
        stepName: '质量控制',
        toolId: 'bwa',
        toolVersion: '0.7.17',
        parameters: { algorithm: 'mem', t: 4, m: 19, T: 30 },
        startTime: '2026-04-01T09:05:00Z',
        endTime: '2026-04-01T09:45:00Z',
        status: 'completed',
        inputFileIds: ['file_001', 'file_002'],
        outputFileIds: ['file_003'],
        log: '质量控制完成，共处理12.5M reads，Q30比例94.5%',
      },
      {
        stepId: 'step_002',
        stepName: '基因组比对',
        toolId: 'bwa',
        toolVersion: '0.7.17',
        parameters: { algorithm: 'mem', t: 8, m: 19, T: 30 },
        startTime: '2026-04-01T09:45:00Z',
        endTime: '2026-04-01T10:50:00Z',
        status: 'completed',
        inputFileIds: ['file_003'],
        outputFileIds: ['file_004', 'file_005'],
        log: '比对完成，98.7% reads成功比对到参考基因组',
      },
      {
        stepId: 'step_003',
        stepName: '变异检测',
        toolId: 'bwa',
        toolVersion: '0.7.17',
        parameters: { algorithm: 'mem', t: 4 },
        startTime: '2026-04-01T10:50:00Z',
        endTime: '2026-04-01T11:30:00Z',
        status: 'completed',
        inputFileIds: ['file_004'],
        outputFileIds: ['file_006'],
        log: '变异检测完成，共识别2,456个变异位点',
      },
    ],
    parametersSnapshot: {
      'bwa.algorithm': 'mem',
      'bwa.threads': 8,
      'bwa.minSeedLength': 19,
      'referenceGenome': 'GRCh38.p14',
    },
    resultSummary: {
      totalVariants: 2456,
      snpCount: 2100,
      indelCount: 356,
      pathogenicCount: 12,
      alignedReads: 12345678,
      alignmentRate: 98.7,
      meanQuality: 94.5,
    },
    versionHistory: [
      {
        version: 1,
        timestamp: '2026-04-01T09:00:00Z',
        changedBy: '李技术员',
        description: '初始版本：基础比对配置，4线程运行',
        steps: [
          {
            stepId: 'step_001', stepName: '质量控制', toolId: 'bwa', toolVersion: '0.7.17',
            parameters: { algorithm: 'mem', t: 4 }, startTime: '2026-04-01T09:05:00Z',
            endTime: '2026-04-01T09:45:00Z', status: 'completed',
            inputFileIds: ['file_001'], outputFileIds: ['file_002'], log: 'v1 QC'
          }
        ],
        parametersSnapshot: { 'bwa.algorithm': 'mem', 'bwa.threads': 4 },
        sampleIds: ['sample_001', 'sample_002', 'sample_003'],
      },
      {
        version: 2,
        timestamp: '2026-04-02T10:30:00Z',
        changedBy: '李技术员',
        description: '扩展样本数至5例，增加线程数至8，添加变异检测步骤',
        steps: [
          {
            stepId: 'step_001', stepName: '质量控制', toolId: 'bwa', toolVersion: '0.7.17',
            parameters: { algorithm: 'mem', t: 4, m: 19, T: 30 }, startTime: '2026-04-01T09:05:00Z',
            endTime: '2026-04-01T09:45:00Z', status: 'completed',
            inputFileIds: ['file_001', 'file_002'], outputFileIds: ['file_003'], log: '质量控制完成，共处理12.5M reads，Q30比例94.5%'
          },
          {
            stepId: 'step_002', stepName: '基因组比对', toolId: 'bwa', toolVersion: '0.7.17',
            parameters: { algorithm: 'mem', t: 8, m: 19, T: 30 }, startTime: '2026-04-01T09:45:00Z',
            endTime: '2026-04-01T10:50:00Z', status: 'completed',
            inputFileIds: ['file_003'], outputFileIds: ['file_004', 'file_005'], log: '比对完成，98.7% reads成功比对到参考基因组'
          },
          {
            stepId: 'step_003', stepName: '变异检测', toolId: 'bwa', toolVersion: '0.7.17',
            parameters: { algorithm: 'mem', t: 4 }, startTime: '2026-04-01T10:50:00Z',
            endTime: '2026-04-01T11:30:00Z', status: 'completed',
            inputFileIds: ['file_004'], outputFileIds: ['file_006'], log: '变异检测完成，共识别2,456个变异位点'
          }
        ],
        parametersSnapshot: { 'bwa.algorithm': 'mem', 'bwa.threads': 8, 'bwa.minSeedLength': 19, 'referenceGenome': 'GRCh38.p14' },
        sampleIds: ['sample_001', 'sample_002', 'sample_003', 'sample_004', 'sample_005'],
      }
    ],
  },
  {
    id: 'analysis_002',
    name: 'EGFR基因变异注释分析',
    projectId: 'proj_001',
    batchId: 'batch_001',
    sampleIds: ['sample_001', 'sample_003'],
    description: '针对EGFR基因的变异注释和临床解读',
    status: 'completed',
    createdAt: '2026-04-15T14:00:00Z',
    startedAt: '2026-04-15T14:05:00Z',
    completedAt: '2026-04-15T15:20:00Z',
    createdBy: '李技术员',
    version: 1,
    parentAnalysisId: 'analysis_001',
    currentStep: 2,
    steps: [
      {
        stepId: 'step_001',
        stepName: '变异筛选',
        toolId: 'blastn',
        toolVersion: '2.14.0',
        parameters: { database: 'nt', evalue: 1e-10 },
        startTime: '2026-04-15T14:05:00Z',
        endTime: '2026-04-15T14:30:00Z',
        status: 'completed',
        inputFileIds: ['file_006'],
        outputFileIds: ['file_007'],
        log: '筛选出EGFR基因区域变异共23个',
      },
      {
        stepId: 'step_002',
        stepName: '变异注释',
        toolId: 'blastn',
        toolVersion: '2.14.0',
        parameters: { database: 'refseq_genomic' },
        startTime: '2026-04-15T14:30:00Z',
        endTime: '2026-04-15T15:20:00Z',
        status: 'completed',
        inputFileIds: ['file_007'],
        outputFileIds: ['file_008'],
        log: '注释完成，发现3个致病性变异',
      },
    ],
    parametersSnapshot: {
      'targetGene': 'EGFR',
      'annotationSources': ['VEP', 'ClinVar', 'COSMIC'],
      'filterCriteria': 'QUAL > 20, DP > 10',
    },
    resultSummary: {
      totalVariants: 23,
      snpCount: 18,
      indelCount: 5,
      pathogenicCount: 3,
      alignedReads: 456789,
      alignmentRate: 99.2,
      meanQuality: 96.8,
    },
    versionHistory: [
      {
        version: 1,
        timestamp: '2026-04-15T14:00:00Z',
        changedBy: '李技术员',
        description: '初始版本：EGFR基因变异注释分析',
        steps: [],
        parametersSnapshot: {
          'targetGene': 'EGFR',
          'annotationSources': ['VEP', 'ClinVar', 'COSMIC'],
          'filterCriteria': 'QUAL > 20, DP > 10',
        },
        sampleIds: ['sample_001', 'sample_003'],
      }
    ],
  },
  {
    id: 'analysis_003',
    name: '耐药菌MLST分型分析',
    projectId: 'proj_002',
    batchId: 'batch_003',
    sampleIds: ['sample_010', 'sample_011', 'sample_012'],
    description: '多位点序列分型分析，确定菌株序列型',
    status: 'completed',
    createdAt: '2026-03-10T10:00:00Z',
    startedAt: '2026-03-10T10:05:00Z',
    completedAt: '2026-03-10T12:15:00Z',
    createdBy: '王实验员',
    version: 1,
    currentStep: 2,
    steps: [
      {
        stepId: 'step_001',
        stepName: '基因组组装',
        toolId: 'minimap2',
        toolVersion: '2.26',
        parameters: { preset: 'map-hifi', t: 8 },
        startTime: '2026-03-10T10:05:00Z',
        endTime: '2026-03-10T11:20:00Z',
        status: 'completed',
        inputFileIds: ['file_101', 'file_102'],
        outputFileIds: ['file_103'],
        log: '组装完成，N50=4.2Mbp',
      },
      {
        stepId: 'step_002',
        stepName: 'MLST分型',
        toolId: 'minimap2',
        toolVersion: '2.26',
        parameters: { preset: 'map-hifi' },
        startTime: '2026-03-10T11:20:00Z',
        endTime: '2026-03-10T12:15:00Z',
        status: 'completed',
        inputFileIds: ['file_103'],
        outputFileIds: ['file_104'],
        log: '分型完成，EC001为ST131，KP001为ST258',
      },
    ],
    parametersSnapshot: {
      'assembler': 'minimap2',
      'mlstScheme': 'EcMLST',
      'minCoverage': 10,
    },
    resultSummary: {
      totalVariants: 1567,
      snpCount: 1423,
      indelCount: 144,
      pathogenicCount: 0,
      alignedReads: 8765432,
      alignmentRate: 97.8,
      meanQuality: 93.2,
    },
    versionHistory: [
      {
        version: 1,
        timestamp: '2026-03-10T10:00:00Z',
        changedBy: '王实验员',
        description: '初始版本：耐药菌MLST分型分析',
        steps: [],
        parametersSnapshot: {
          'assembler': 'minimap2',
          'mlstScheme': 'EcMLST',
          'minCoverage': 10,
        },
        sampleIds: ['sample_010', 'sample_011', 'sample_012'],
      }
    ],
  },
  {
    id: 'analysis_004',
    name: '拟南芥GWAS分析',
    projectId: 'proj_003',
    batchId: 'batch_005',
    sampleIds: ['sample_015', 'sample_016', 'sample_017', 'sample_018'],
    description: '全基因组关联分析，定位抗旱相关位点',
    status: 'running',
    createdAt: '2026-06-18T08:00:00Z',
    startedAt: '2026-06-18T08:05:00Z',
    createdBy: '赵同学',
    version: 1,
    currentStep: 1,
    steps: [
      {
        stepId: 'step_001',
        stepName: 'SNP Calling',
        toolId: 'bwa',
        toolVersion: '0.7.17',
        parameters: { algorithm: 'mem', t: 16 },
        startTime: '2026-06-18T08:05:00Z',
        endTime: '',
        status: 'running',
        inputFileIds: ['file_201'],
        outputFileIds: [],
        log: '正在进行SNP检测，已处理60%样本...',
      },
    ],
    parametersSnapshot: {
      'genotypeCaller': 'GATK',
      'mafThreshold': 0.05,
      'imputation': true,
    },
    versionHistory: [
      {
        version: 1,
        timestamp: '2026-06-18T08:00:00Z',
        changedBy: '赵同学',
        description: '初始版本：拟南芥GWAS分析，正在运行',
        steps: [],
        parametersSnapshot: {
          'genotypeCaller': 'GATK',
          'mafThreshold': 0.05,
          'imputation': true,
        },
        sampleIds: ['sample_015', 'sample_016', 'sample_017', 'sample_018'],
      }
    ],
  },
  {
    id: 'analysis_005',
    name: '罕见病患者基因诊断',
    projectId: 'proj_004',
    batchId: 'batch_006',
    sampleIds: ['sample_021', 'sample_022'],
    description: '全外显子测序分析，寻找致病突变',
    status: 'pending',
    createdAt: '2026-06-18T10:00:00Z',
    createdBy: '刘技师',
    version: 1,
    currentStep: 0,
    steps: [],
    parametersSnapshot: {
      'panel': 'NeuroMuscular',
      'inheritanceMode': 'autosomal_recessive',
      'filterFrequency': 0.01,
    },
    versionHistory: [
      {
        version: 1,
        timestamp: '2026-06-18T10:00:00Z',
        changedBy: '刘技师',
        description: '初始版本：罕见病患者基因诊断，待开始',
        steps: [],
        parametersSnapshot: {
          'panel': 'NeuroMuscular',
          'inheritanceMode': 'autosomal_recessive',
          'filterFrequency': 0.01,
        },
        sampleIds: ['sample_021', 'sample_022'],
      }
    ],
  },
];

export const generateAlignmentResult = (queryId: string, subjectId: string): AlignmentResult => {
  const percentIdentity = 85 + Math.random() * 15;
  const alignmentLength = 200 + Math.floor(Math.random() * 800);
  const querySeq = generateDnaSequence(alignmentLength);
  const subjectSeq = querySeq.split('').map((base, i) => {
    if (Math.random() < (100 - percentIdentity) / 100) {
      const bases = ['A', 'T', 'G', 'C'];
      return bases[Math.floor(Math.random() * 4)];
    }
    return base;
  }).join('');
  const midline = querySeq.split('').map((base, i) => base === subjectSeq[i] ? '|' : (Math.random() > 0.5 ? '.' : ' ')).join('');

  return {
    queryId,
    subjectId,
    percentIdentity: Math.round(percentIdentity * 100) / 100,
    alignmentLength,
    mismatches: Math.floor(alignmentLength * (100 - percentIdentity) / 100),
    gapOpens: Math.floor(Math.random() * 5),
    queryStart: 1,
    queryEnd: alignmentLength,
    subjectStart: 1000 + Math.floor(Math.random() * 10000),
    subjectEnd: 1000 + Math.floor(Math.random() * 10000) + alignmentLength - 1,
    eValue: Math.pow(10, -(10 + Math.random() * 50)),
    bitScore: 100 + Math.random() * 400,
    querySequence: querySeq,
    subjectSequence: subjectSeq,
    midline,
  };
};

export const MOCK_REPORTS: AnalysisReport[] = [
  {
    id: 'report_001',
    analysisId: 'analysis_001',
    title: '肺癌样本全外显子测序分析报告',
    generatedAt: '2026-04-02T10:00:00Z',
    generatedBy: '李技术员',
    sections: [
      { id: 'sec1', title: '分析概述', type: 'text', content: '本报告对5例肺癌患者的全外显子测序数据进行了系统分析...' },
      { id: 'sec2', title: '样本信息', type: 'table', content: [{ sample: 'LC-001-T', type: '腺癌', reads: '2.5M', q30: '95.2%' }] },
      { id: 'sec3', title: '分析流程', type: 'code', content: 'bwa mem -t 8 ref.fa r1.fq r2.fq | samtools sort -o output.bam' },
      { id: 'sec4', title: '变异统计', type: 'chart', content: { snp: 2145, indel: 311, total: 2456 } },
    ],
    reproducibilityInfo: {
      softwareVersions: { 'bwa': '0.7.17', 'samtools': '1.18', 'gatk': '4.4.0' },
      parameters: { 'bwa.algorithm': 'mem', 'bwa.threads': 8 },
      commandLines: ['bwa mem -t 8 ref.fa r1.fq r2.fq > output.sam'],
      inputFileHashes: { 'sample_001.fq': 'a1b2c3d4e5f6...' },
    },
  },
  {
    id: 'report_002',
    analysisId: 'analysis_002',
    title: 'EGFR基因变异临床解读报告',
    generatedAt: '2026-04-16T14:00:00Z',
    generatedBy: '张教授',
    sections: [
      { id: 'sec1', title: '检测摘要', type: 'text', content: '在2例患者样本中检测到EGFR基因致病性变异...' },
      { id: 'sec2', title: '致病性变异列表', type: 'table', content: [{ gene: 'EGFR', change: 'p.L858R', significance: '致病性' }] },
    ],
    reproducibilityInfo: {
      softwareVersions: { 'vep': '110', 'clinvar': '202603' },
      parameters: { 'filter': 'QUAL > 20' },
      commandLines: ['vep -i input.vcf -o output.ann.vcf'],
      inputFileHashes: { 'input.vcf': 'e5f6a1b2c3d4...' },
    },
  },
];

export const generateBlastDotPlotData = (queryId: string, subjectId: string): BlastDotPlotData => {
  const queryLength = 1500 + Math.floor(Math.random() * 3500);
  const subjectLength = 2000 + Math.floor(Math.random() * 8000);
  const hspCount = 8 + Math.floor(Math.random() * 15);
  const hsps: BlastHSP[] = [];

  for (let i = 0; i < hspCount; i++) {
    const alignmentLength = 50 + Math.floor(Math.random() * 450);
    const queryStart = Math.floor(Math.random() * (queryLength - alignmentLength));
    const subjectStart = Math.floor(Math.random() * (subjectLength - alignmentLength));
    const percentIdentity = 70 + Math.random() * 30;
    const strand: 'plus' | 'minus' = Math.random() > 0.3 ? 'plus' : 'minus';

    hsps.push({
      queryStart: queryStart + 1,
      queryEnd: queryStart + alignmentLength,
      subjectStart: subjectStart + 1,
      subjectEnd: strand === 'plus' ? subjectStart + alignmentLength : subjectStart + alignmentLength,
      percentIdentity: Math.round(percentIdentity * 100) / 100,
      alignmentLength,
      bitScore: 40 + Math.random() * 460,
      eValue: Math.pow(10, -(5 + Math.random() * 55)),
      strand,
    });
  }

  return {
    queryId,
    queryLength,
    subjectId,
    subjectLength,
    hsps,
  };
};

const aminoAcids = ['A', 'R', 'N', 'D', 'C', 'Q', 'E', 'G', 'H', 'I', 'L', 'K', 'M', 'F', 'P', 'S', 'T', 'W', 'Y', 'V'];
const dnaBases = ['A', 'T', 'G', 'C'];

export const generateClustalAlignmentData = (
  sequenceCount: number = 6,
  alignmentLength: number = 300,
  sequenceType: 'dna' | 'protein' = 'dna'
): ClustalAlignmentData => {
  const alphabet = sequenceType === 'dna' ? dnaBases : aminoAcids;
  const charSet = [...alphabet, '-'];

  const generateConsensus = (): string => {
    let seq = '';
    for (let i = 0; i < alignmentLength; i++) {
      seq += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return seq;
  };

  const consensus = generateConsensus();

  const sequences: ClustalAlignedSequence[] = [];
  const sequenceNames = ['Human', 'Mouse', 'Rat', 'Chicken', 'Zebrafish', 'FruitFly', 'Worm', 'Yeast'];

  for (let i = 0; i < sequenceCount; i++) {
    let seq = '';
    const conservationRate = 0.6 + (sequenceCount - i) * 0.05;

    for (let j = 0; j < alignmentLength; j++) {
      if (Math.random() < conservationRate) {
        seq += consensus[j];
      } else if (Math.random() < 0.12) {
        seq += '-';
      } else {
        seq += alphabet[Math.floor(Math.random() * alphabet.length)];
      }
    }

    sequences.push({
      id: `seq_${i + 1}`,
      name: sequenceNames[i] || `Sequence_${i + 1}`,
      sequence: seq,
    });
  }

  const columns: ClustalColumnInfo[] = [];
  const conservationScores: number[] = [];

  for (let pos = 0; pos < alignmentLength; pos++) {
    const aminoAcids: Record<string, number> = {};
    let gapCount = 0;
    let maxCount = 0;
    let consensusChar = '';

    sequences.forEach(seq => {
      const char = seq.sequence[pos];
      if (char === '-') {
        gapCount++;
      } else {
        aminoAcids[char] = (aminoAcids[char] || 0) + 1;
        if (aminoAcids[char] > maxCount) {
          maxCount = aminoAcids[char];
          consensusChar = char;
        }
      }
    });

    const nonGapCount = sequenceCount - gapCount;
    const conservation = nonGapCount > 0 ? maxCount / sequenceCount : 0;
    conservationScores.push(conservation);

    columns.push({
      position: pos + 1,
      conservation,
      consensus: consensusChar || '-',
      aminoAcids,
      isGapColumn: gapCount === sequenceCount,
    });
  }

  return {
    sequences,
    alignmentLength,
    columns,
    consensusSequence: consensus,
    conservationScores,
  };
};

export const computeGcSlidingWindow = (
  sequence: string,
  sequenceId: string,
  windowSize: number = 100,
  stepSize: number = 10
): GcSlidingWindowResult => {
  const seq = sequence.toUpperCase().replace(/[^ATGC]/g, '');
  let totalGc = 0;
  for (let i = 0; i < seq.length; i++) {
    if (seq[i] === 'G' || seq[i] === 'C') totalGc++;
  }
  const overallGcPercent = seq.length > 0 ? (totalGc / seq.length) * 100 : 0;

  const dataPoints: GcSlidingWindowResult['dataPoints'] = [];
  for (let i = 0; i <= seq.length - windowSize; i += stepSize) {
    const window = seq.slice(i, i + windowSize);
    let gc = 0;
    for (let j = 0; j < window.length; j++) {
      if (window[j] === 'G' || window[j] === 'C') gc++;
    }
    dataPoints.push({
      position: i + 1,
      gcPercent: (gc / window.length) * 100,
    });
  }

  return {
    sequenceId,
    sequenceLength: seq.length,
    windowSize,
    stepSize,
    overallGcPercent,
    dataPoints,
  };
};

const CODON_TABLE: Record<string, string> = {
  TTT: 'Phe', TTC: 'Phe', TTA: 'Leu', TTG: 'Leu',
  CTT: 'Leu', CTC: 'Leu', CTA: 'Leu', CTG: 'Leu',
  ATT: 'Ile', ATC: 'Ile', ATA: 'Ile', ATG: 'Met',
  GTT: 'Val', GTC: 'Val', GTA: 'Val', GTG: 'Val',
  TCT: 'Ser', TCC: 'Ser', TCA: 'Ser', TCG: 'Ser',
  CCT: 'Pro', CCC: 'Pro', CCA: 'Pro', CCG: 'Pro',
  ACT: 'Thr', ACC: 'Thr', ACA: 'Thr', ACG: 'Thr',
  GCT: 'Ala', GCC: 'Ala', GCA: 'Ala', GCG: 'Ala',
  TAT: 'Tyr', TAC: 'Tyr', TAA: 'Stop', TAG: 'Stop',
  CAT: 'His', CAC: 'His', CAA: 'Gln', CAG: 'Gln',
  AAT: 'Asn', AAC: 'Asn', AAA: 'Lys', AAG: 'Lys',
  GAT: 'Asp', GAC: 'Asp', GAA: 'Glu', GAG: 'Glu',
  TGT: 'Cys', TGC: 'Cys', TGA: 'Stop', TGG: 'Trp',
  CGT: 'Arg', CGC: 'Arg', CGA: 'Arg', CGG: 'Arg',
  AGT: 'Ser', AGC: 'Ser', AGA: 'Arg', AGG: 'Arg',
  GGT: 'Gly', GGC: 'Gly', GGA: 'Gly', GGG: 'Gly',
};

const SYNONYMOUS_CODONS: Record<string, string[]> = {};
for (const [codon, aa] of Object.entries(CODON_TABLE)) {
  if (aa === 'Stop') continue;
  if (!SYNONYMOUS_CODONS[aa]) SYNONYMOUS_CODONS[aa] = [];
  SYNONYMOUS_CODONS[aa].push(codon);
}

export const computeCodonPreference = (
  sequence: string,
  sequenceId: string
): CodonPreferenceResult => {
  const seq = sequence.toUpperCase().replace(/[^ATGC]/g, '');

  const codonCounts: Record<string, number> = {};
  const positionCounts: [Record<string, number>, Record<string, number>, Record<string, number>] = [
    { A: 0, T: 0, G: 0, C: 0 },
    { A: 0, T: 0, G: 0, C: 0 },
    { A: 0, T: 0, G: 0, C: 0 },
  ];

  let codonCount = 0;
  for (let i = 0; i + 2 < seq.length; i += 3) {
    const codon = seq.slice(i, i + 3);
    if (codon.length < 3) break;
    codonCounts[codon] = (codonCounts[codon] || 0) + 1;
    codonCount++;

    for (let p = 0; p < 3; p++) {
      const base = codon[p];
      if (base in positionCounts[p]) {
        positionCounts[p][base]++;
      }
    }
  }

  const positionFrequencies: CodonPositionBaseFrequency[] = ([1, 2, 3] as const).map((pos, idx) => {
    const counts = positionCounts[idx];
    const total = counts.A + counts.T + counts.G + counts.C;
    return {
      position: pos,
      A: total > 0 ? counts.A / total : 0,
      T: total > 0 ? counts.T / total : 0,
      G: total > 0 ? counts.G / total : 0,
      C: total > 0 ? counts.C / total : 0,
      gcPercent: total > 0 ? ((counts.G + counts.C) / total) * 100 : 0,
    };
  });

  const rscuTable: RscuEntry[] = [];
  for (const [aa, codons] of Object.entries(SYNONYMOUS_CODONS)) {
    const n = codons.length;
    const totalForAa = codons.reduce((sum, c) => sum + (codonCounts[c] || 0), 0);
    const expected = totalForAa / n;

    for (const codon of codons) {
      const count = codonCounts[codon] || 0;
      const rscu = expected > 0 ? count / expected : 0;
      rscuTable.push({ codon, aminoAcid: aa, count, expected: Math.round(expected * 100) / 100, rscu: Math.round(rscu * 100) / 100 });
    }
  }

  rscuTable.sort((a, b) => a.aminoAcid.localeCompare(b.aminoAcid) || a.codon.localeCompare(b.codon));

  return {
    sequenceId,
    sequenceLength: seq.length,
    codonCount,
    positionFrequencies,
    rscuTable,
  };
};

const COMPLEMENT: Record<string, string> = { A: 'T', T: 'A', G: 'C', C: 'G' };

const reverseComplement = (seq: string): string => {
  return seq.split('').reverse().map(b => COMPLEMENT[b] || b).join('');
};

const CODON_TO_AA: Record<string, string> = {
  TTT: 'F', TTC: 'F', TTA: 'L', TTG: 'L',
  CTT: 'L', CTC: 'L', CTA: 'L', CTG: 'L',
  ATT: 'I', ATC: 'I', ATA: 'I', ATG: 'M',
  GTT: 'V', GTC: 'V', GTA: 'V', GTG: 'V',
  TCT: 'S', TCC: 'S', TCA: 'S', TCG: 'S',
  CCT: 'P', CCC: 'P', CCA: 'P', CCG: 'P',
  ACT: 'T', ACC: 'T', ACA: 'T', ACG: 'T',
  GCT: 'A', GCC: 'A', GCA: 'A', GCG: 'A',
  TAT: 'Y', TAC: 'Y', TAA: '*', TAG: '*',
  CAT: 'H', CAC: 'H', CAA: 'Q', CAG: 'Q',
  AAT: 'N', AAC: 'N', AAA: 'K', AAG: 'K',
  GAT: 'D', GAC: 'D', GAA: 'E', GAG: 'E',
  TGT: 'C', TGC: 'C', TGA: '*', TGG: 'W',
  CGT: 'R', CGC: 'R', CGA: 'R', CGG: 'R',
  AGT: 'S', AGC: 'S', AGA: 'R', AGG: 'R',
  GGT: 'G', GGC: 'G', GGA: 'G', GGG: 'G',
};

const START_CODONS = new Set(['ATG']);
const STOP_CODONS = new Set(['TAA', 'TAG', 'TGA']);

const translateSequence = (dna: string): string => {
  let protein = '';
  for (let i = 0; i + 2 < dna.length; i += 3) {
    const codon = dna.slice(i, i + 3);
    protein += CODON_TO_AA[codon] || 'X';
  }
  return protein;
};

const computeGcForSequence = (seq: string): number => {
  if (seq.length === 0) return 0;
  let gc = 0;
  for (let i = 0; i < seq.length; i++) {
    if (seq[i] === 'G' || seq[i] === 'C') gc++;
  }
  return (gc / seq.length) * 100;
};

const computeGcByPosition = (seq: string): { gc1: number; gc2: number; gc3: number } => {
  const counts = [0, 0, 0];
  const totals = [0, 0, 0];
  for (let i = 0; i < seq.length; i++) {
    const pos = i % 3;
    totals[pos]++;
    if (seq[i] === 'G' || seq[i] === 'C') counts[pos]++;
  }
  return {
    gc1: totals[0] > 0 ? (counts[0] / totals[0]) * 100 : 0,
    gc2: totals[1] > 0 ? (counts[1] / totals[1]) * 100 : 0,
    gc3: totals[2] > 0 ? (counts[2] / totals[2]) * 100 : 0,
  };
};

const scanFrameOrfs = (
  sequence: string,
  frameOffset: number,
  strand: '+' | '-',
  minOrfLength: number,
  sequenceLength: number
): OrfRecord[] => {
  const orfs: OrfRecord[] = [];
  let orfCounter = 0;
  let i = frameOffset;

  while (i + 2 < sequence.length) {
    const codon = sequence.slice(i, i + 3);
    if (!START_CODONS.has(codon)) {
      i += 3;
      continue;
    }

    const startPos = i;
    let endPos = -1;

    for (let j = i + 3; j + 2 < sequence.length; j += 3) {
      const c = sequence.slice(j, j + 3);
      if (STOP_CODONS.has(c)) {
        endPos = j + 2;
        break;
      }
    }

    if (endPos === -1) {
      i += 3;
      continue;
    }

    const orfNt = sequence.slice(startPos, endPos + 1);
    const orfLen = orfNt.length;

    if (orfLen >= minOrfLength) {
      orfCounter++;
      const protein = translateSequence(orfNt);
      const gc = computeGcForSequence(orfNt);
      const gcByPos = computeGcByPosition(orfNt);

      const actualStart = strand === '+'
        ? startPos + 1
        : sequenceLength - endPos;
      const actualEnd = strand === '+'
        ? endPos + 1
        : sequenceLength - startPos;

      orfs.push({
        id: `orf_${strand}${frameOffset}_${orfCounter}`,
        frame: frameOffset + 1,
        strand,
        startCodon: orfNt.slice(0, 3),
        stopCodon: orfNt.slice(orfLen - 3),
        startPosition: actualStart,
        endPosition: actualEnd,
        orfLength: orfLen,
        nucleotideSequence: orfLen > 300 ? orfNt.slice(0, 147) + '...' + orfNt.slice(orfLen - 150) : orfNt,
        proteinSequence: protein.slice(0, -1),
        proteinLength: protein.length - 1,
        gcPercent: Math.round(gc * 100) / 100,
        gc1Percent: Math.round(gcByPos.gc1 * 100) / 100,
        gc2Percent: Math.round(gcByPos.gc2 * 100) / 100,
        gc3Percent: Math.round(gcByPos.gc3 * 100) / 100,
      });
    }

    i = endPos + 1;
  }

  return orfs;
};

export const predictOrfs = (
  sequence: string,
  sequenceId: string,
  minOrfLength: number = 150
): OrfPredictionResult => {
  const seq = sequence.toUpperCase().replace(/[^ATGC]/g, '');
  const rcSeq = reverseComplement(seq);
  const allOrfs: OrfRecord[] = [];

  for (let frame = 0; frame < 3; frame++) {
    allOrfs.push(...scanFrameOrfs(seq, frame, '+', minOrfLength, seq.length));
  }
  for (let frame = 0; frame < 3; frame++) {
    allOrfs.push(...scanFrameOrfs(rcSeq, frame, '-', minOrfLength, seq.length));
  }

  allOrfs.sort((a, b) => b.orfLength - a.orfLength);

  const frameSummary = [];
  for (let frame = 0; frame < 3; frame++) {
    const fwd = allOrfs.filter(o => o.strand === '+' && o.frame === frame + 1);
    frameSummary.push({
      frame: frame + 1,
      strand: '+' as const,
      orfCount: fwd.length,
      longestOrf: fwd.length > 0 ? fwd.reduce((max, o) => Math.max(max, o.orfLength), 0) : 0,
    });
  }
  for (let frame = 0; frame < 3; frame++) {
    const rev = allOrfs.filter(o => o.strand === '-' && o.frame === frame + 1);
    frameSummary.push({
      frame: frame + 1,
      strand: '-' as const,
      orfCount: rev.length,
      longestOrf: rev.length > 0 ? rev.reduce((max, o) => Math.max(max, o.orfLength), 0) : 0,
    });
  }

  return {
    sequenceId,
    sequenceLength: seq.length,
    minOrfLength,
    totalOrfs: allOrfs.length,
    orfs: allOrfs,
    frameSummary,
  };
};
