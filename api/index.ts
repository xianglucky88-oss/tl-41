import express from 'express';
import cors from 'cors';
import type {
  Project, Batch, Sample, AnalysisRecord, Variant,
  AlignmentResult, AnalysisReport, AlignmentTool,
  ApiResponse, PaginatedResponse, PaginationParams
} from '../shared/types.js';
import { MOCK_PROJECTS, MOCK_BATCHES, MOCK_SAMPLES, MOCK_ANALYSES, MOCK_VARIANTS, MOCK_REPORTS, generateAlignmentResult } from '../shared/mockData.js';
import { ALIGNMENT_TOOLS } from '../shared/toolConfigs.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const successResponse = <T>(data: T, message?: string): ApiResponse<T> => ({
  data,
  success: true,
  message,
  timestamp: new Date().toISOString(),
});

const errorResponse = (message: string): ApiResponse<null> => ({
  data: null,
  success: false,
  message,
  timestamp: new Date().toISOString(),
});

const paginate = <T>(items: T[], params: PaginationParams): PaginatedResponse<T> => {
  const { page, pageSize, sortBy, sortOrder } = params;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  let sortedItems = [...items];
  if (sortBy) {
    sortedItems.sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortBy];
      const bVal = (b as Record<string, unknown>)[sortBy];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return 0;
    });
  }

  return {
    items: sortedItems.slice(start, end),
    total: items.length,
    page,
    pageSize,
    totalPages: Math.ceil(items.length / pageSize),
  };
};

app.get('/api/health', (req, res) => {
  res.json(successResponse({ status: 'ok', uptime: process.uptime() }));
});

app.get('/api/projects', (req, res) => {
  const { page = 1, pageSize = 10, sortBy = 'createdAt', sortOrder = 'desc', search } = req.query;
  let projects = [...MOCK_PROJECTS];

  if (search) {
    const searchLower = String(search).toLowerCase();
    projects = projects.filter(p =>
      p.name.toLowerCase().includes(searchLower) ||
      p.description.toLowerCase().includes(searchLower)
    );
  }

  const result = paginate(projects, {
    page: Number(page),
    pageSize: Number(pageSize),
    sortBy: String(sortBy),
    sortOrder: sortOrder as 'asc' | 'desc',
  });

  res.json(successResponse(result));
});

app.get('/api/projects/:id', (req, res) => {
  const project = MOCK_PROJECTS.find((p: Project) => p.id === req.params.id);
  if (!project) {
    return res.status(404).json(errorResponse('项目不存在'));
  }
  res.json(successResponse(project));
});

app.post('/api/projects', (req, res) => {
  const newProject: Project = {
    ...req.body,
    id: `proj_${String(MOCK_PROJECTS.length + 1).padStart(3, '0')}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    batchCount: 0,
    sampleCount: 0,
    analysisCount: 0,
    status: 'active',
  };
  MOCK_PROJECTS.push(newProject);
  res.status(201).json(successResponse(newProject, '项目创建成功'));
});

app.get('/api/batches', (req, res) => {
  const { projectId, page = 1, pageSize = 10 } = req.query;
  let batches = [...MOCK_BATCHES];

  if (projectId) {
    batches = batches.filter(b => b.projectId === projectId);
  }

  const result = paginate(batches, { page: Number(page), pageSize: Number(pageSize) });
  res.json(successResponse(result));
});

app.get('/api/batches/:id', (req, res) => {
  const batch = MOCK_BATCHES.find((b: Batch) => b.id === req.params.id);
  if (!batch) {
    return res.status(404).json(errorResponse('批次不存在'));
  }
  res.json(successResponse(batch));
});

app.get('/api/samples', (req, res) => {
  const { batchId, projectId, page = 1, pageSize = 20, search } = req.query;
  let samples = [...MOCK_SAMPLES];

  if (batchId) samples = samples.filter(s => s.batchId === batchId);
  if (projectId) samples = samples.filter(s => s.projectId === projectId);
  if (search) {
    const searchLower = String(search).toLowerCase();
    samples = samples.filter(s => s.name.toLowerCase().includes(searchLower));
  }

  const result = paginate(samples, { page: Number(page), pageSize: Number(pageSize) });
  res.json(successResponse(result));
});

app.get('/api/samples/:id', (req, res) => {
  const sample = MOCK_SAMPLES.find((s: Sample) => s.id === req.params.id);
  if (!sample) {
    return res.status(404).json(errorResponse('样本不存在'));
  }
  res.json(successResponse(sample));
});

app.get('/api/analyses', (req, res) => {
  const { projectId, batchId, status, page = 1, pageSize = 10 } = req.query;
  let analyses = [...MOCK_ANALYSES];

  if (projectId) analyses = analyses.filter(a => a.projectId === projectId);
  if (batchId) analyses = analyses.filter(a => a.batchId === batchId);
  if (status) analyses = analyses.filter(a => a.status === status);

  const result = paginate(analyses, { page: Number(page), pageSize: Number(pageSize) });
  res.json(successResponse(result));
});

app.get('/api/analyses/:id', (req, res) => {
  const analysis = MOCK_ANALYSES.find((a: AnalysisRecord) => a.id === req.params.id);
  if (!analysis) {
    return res.status(404).json(errorResponse('分析记录不存在'));
  }
  res.json(successResponse(analysis));
});

app.post('/api/analyses', (req, res) => {
  const newAnalysis: AnalysisRecord = {
    ...req.body,
    id: `analysis_${String(MOCK_ANALYSES.length + 1).padStart(3, '0')}`,
    createdAt: new Date().toISOString(),
    status: 'pending',
    version: 1,
    currentStep: 0,
    createdBy: 'current_user',
    steps: [],
    parametersSnapshot: req.body.parametersSnapshot || {},
  };
  MOCK_ANALYSES.push(newAnalysis);
  res.status(201).json(successResponse(newAnalysis, '分析任务创建成功'));
});

app.put('/api/analyses/:id', (req, res) => {
  const idx = MOCK_ANALYSES.findIndex((a: AnalysisRecord) => a.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json(errorResponse('分析记录不存在'));
  }
  MOCK_ANALYSES[idx] = {
    ...MOCK_ANALYSES[idx],
    ...req.body,
    version: MOCK_ANALYSES[idx].version + 1,
  };
  res.json(successResponse(MOCK_ANALYSES[idx], '分析记录已更新'));
});

app.get('/api/variants', (req, res) => {
  const { analysisId, sampleId, chromosome, type, effect, clinicalSignificance, page = 1, pageSize = 50 } = req.query;
  let variants = [...MOCK_VARIANTS];

  if (analysisId) variants = variants.filter(v => v.analysisId === analysisId);
  if (sampleId) variants = variants.filter(v => v.sampleId === sampleId);
  if (chromosome) variants = variants.filter(v => v.chromosome === chromosome);
  if (type) variants = variants.filter(v => v.type === type);
  if (effect) variants = variants.filter(v => v.effect === effect);
  if (clinicalSignificance) variants = variants.filter(v => v.clinicalSignificance === clinicalSignificance);

  const result = paginate(variants, { page: Number(page), pageSize: Number(pageSize) });
  res.json(successResponse(result));
});

app.get('/api/variants/compare', (req, res) => {
  const { sampleIds } = req.query;
  if (!sampleIds) {
    return res.status(400).json(errorResponse('请提供至少两个样本ID'));
  }

  const ids = Array.isArray(sampleIds) ? sampleIds : [sampleIds];
  if (ids.length < 2) {
    return res.status(400).json(errorResponse('请提供至少两个样本ID'));
  }

  const variantMap = new Map<string, { variant: Variant; samples: string[] }>();

  ids.forEach(sampleId => {
    const sampleIdStr = String(sampleId);
    const sampleVariants = MOCK_VARIANTS.filter((v: Variant) => v.sampleId === sampleIdStr);
    sampleVariants.forEach((v: Variant) => {
      const key = `${v.chromosome}-${v.position}-${v.ref}-${v.alt}`;
      const existing = variantMap.get(key);
      if (existing) {
        existing.samples.push(sampleIdStr);
      } else {
        variantMap.set(key, { variant: v, samples: [sampleIdStr] });
      }
    });
  });

  const comparisonResult = Array.from(variantMap.entries()).map(([key, data]) => ({
    key,
    variant: data.variant,
    sharedBy: data.samples,
    sampleCount: data.samples.length,
    isShared: data.samples.length === ids.length,
    isUnique: data.samples.length === 1,
  }));

  const result = paginate(comparisonResult, { page: 1, pageSize: 100 });
  res.json(successResponse(result));
});

app.get('/api/variants/:id', (req, res) => {
  const variant = MOCK_VARIANTS.find((v: Variant) => v.id === req.params.id);
  if (!variant) {
    return res.status(404).json(errorResponse('变异位点不存在'));
  }
  res.json(successResponse(variant));
});

app.get('/api/tools', (req, res) => {
  res.json(successResponse(ALIGNMENT_TOOLS));
});

app.get('/api/tools/:id', (req, res) => {
  const tool = ALIGNMENT_TOOLS.find((t) => t.id === req.params.id);
  if (!tool) {
    return res.status(404).json(errorResponse('工具不存在'));
  }
  res.json(successResponse(tool));
});

app.post('/api/align', async (req, res) => {
  const { toolId, parameters, sampleIds } = req.body;

  if (!toolId || !sampleIds || sampleIds.length === 0) {
    return res.status(400).json(errorResponse('参数不完整'));
  }

  await new Promise(r => setTimeout(r, 1500));

  const results: AlignmentResult[] = sampleIds.flatMap((sampleId: string) =>
    Array.from({ length: 3 }, (_, i) =>
      generateAlignmentResult(sampleId, `subject_${i + 1}`)
    )
  );

  res.json(successResponse(results, '比对完成'));
});

app.get('/api/reports', (req, res) => {
  const { analysisId, page = 1, pageSize = 10 } = req.query;
  let reports = [...MOCK_REPORTS];

  if (analysisId) reports = reports.filter(r => r.analysisId === analysisId);

  const result = paginate(reports, { page: Number(page), pageSize: Number(pageSize) });
  res.json(successResponse(result));
});

app.get('/api/reports/:id', (req, res) => {
  const report = MOCK_REPORTS.find((r: AnalysisReport) => r.id === req.params.id);
  if (!report) {
    return res.status(404).json(errorResponse('报告不存在'));
  }
  res.json(successResponse(report));
});

app.post('/api/reports', (req, res) => {
  const { analysisId } = req.body;
  const analysis = MOCK_ANALYSES.find((a: AnalysisRecord) => a.id === analysisId);

  if (!analysis) {
    return res.status(404).json(errorResponse('分析记录不存在'));
  }

  const commandLines = analysis.steps.map(step => {
    const tool = ALIGNMENT_TOOLS.find(t => t.id === step.toolId);
    const params = Object.entries(step.parameters)
      .map(([k, v]) => `--${k} ${v}`)
      .join(' ');
    return `${step.toolId} -i input_${step.stepId}.fastq -o output_${step.stepId}.bam ${params}`.trim();
  });

  const inputFileHashes: Record<string, string> = {};
  analysis.sampleIds.forEach((sampleId: string, idx: number) => {
    const sample = MOCK_SAMPLES.find((s: Sample) => s.id === sampleId);
    if (sample) {
      let hash = 0;
      const str = sample.sequence.substring(0, 100);
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      inputFileHashes[`${sample.name}.fastq`] = `sha256:${Math.abs(hash).toString(16).padStart(16, '0')}${idx.toString().padStart(8, '0')}a1b2c3d4e5f6`;
    }
  });

  const analysisVariants = MOCK_VARIANTS.filter((v: Variant) => analysis.sampleIds.includes(v.sampleId));
  const variantSummary = {
    totalVariants: analysis.resultSummary?.totalVariants ?? analysisVariants.length,
    snpCount: analysis.resultSummary?.snpCount ?? analysisVariants.filter(v => v.type === 'SNP').length,
    indelCount: analysis.resultSummary?.indelCount ?? analysisVariants.filter(v => v.type !== 'SNP').length,
    pathogenicCount: analysis.resultSummary?.pathogenicCount ?? analysisVariants.filter(v => v.clinicalSignificance === 'pathogenic').length,
    alignedReads: analysis.resultSummary?.alignedReads ?? 100000,
    alignmentRate: analysis.resultSummary?.alignmentRate ?? 97.5 + Math.random() * 2,
    meanQuality: analysis.resultSummary?.meanQuality ?? 30 + Math.random() * 10,
  };

  const sampleTableData = analysis.sampleIds.map((sampleId: string) => {
    const sample = MOCK_SAMPLES.find((s: Sample) => s.id === sampleId);
    const sampleVariants = analysisVariants.filter(v => v.sampleId === sampleId);
    return {
      样本名称: sample?.name || sampleId,
      物种: sample?.organism || '-',
      序列长度: sample ? `${sample.sequence.length.toLocaleString()} bp` : '-',
      检出变异: sampleVariants.length.toLocaleString(),
      SNP: sampleVariants.filter(v => v.type === 'SNP').length,
      Indel: sampleVariants.filter(v => v.type !== 'SNP').length,
      状态: '分析完成',
    };
  });

  const variantTypeData: Record<string, number> = {
    'SNP': analysisVariants.filter(v => v.type === 'SNP').length,
    '插入': analysisVariants.filter(v => v.type === 'INSERTION').length,
    '缺失': analysisVariants.filter(v => v.type === 'DELETION' || v.type === 'INDEL').length,
  };

  const stepDescriptions = analysis.steps.length > 0
    ? `本次分析采用 ${analysis.steps.map(s => ALIGNMENT_TOOLS.find(t => t.id === s.toolId)?.name || s.toolId).join(' → ')} 工具链，对 ${analysis.sampleIds.length} 个样本进行了全流程分析。
共执行 ${analysis.steps.length} 个分析步骤，整体比对率达到 ${variantSummary.alignmentRate.toFixed(2)}%，平均测序质量 Q${variantSummary.meanQuality.toFixed(0)}。
共检出 ${variantSummary.totalVariants.toLocaleString()} 个变异位点，其中包含 ${variantSummary.snpCount.toLocaleString()} 个SNP、${variantSummary.indelCount.toLocaleString()} 个Indel变异。
在临床意义层面，共发现 ${variantSummary.pathogenicCount.toLocaleString()} 个致病性变异位点，建议进行后续验证实验。`
    : '本分析为基础比对分析，包含序列比对和质量控制步骤。';

  const newReport: AnalysisReport = {
    id: `report_${String(MOCK_REPORTS.length + 1).padStart(3, '0')}`,
    analysisId,
    title: `${analysis.name} - 完整分析报告`,
    generatedAt: new Date().toISOString(),
    generatedBy: analysis.createdBy || 'current_user',
    sections: [
      {
        id: 'sec1',
        title: '分析概述',
        type: 'text',
        content: `分析项目：${analysis.name}\n\n项目描述：${analysis.description}\n\n分析版本：v${analysis.version}\n\n${stepDescriptions}`
      },
      {
        id: 'sec2',
        title: '样本信息表',
        type: 'table',
        content: sampleTableData
      },
      {
        id: 'sec3',
        title: '变异类型分布统计',
        type: 'chart',
        content: variantTypeData
      },
      {
        id: 'sec4',
        title: '完整参数配置',
        type: 'code',
        content: JSON.stringify({
          全局参数: analysis.parametersSnapshot,
          步骤参数: analysis.steps.reduce((acc: Record<string, unknown>, step) => {
            acc[step.stepName] = step.parameters;
            return acc;
          }, {})
        }, null, 2)
      },
    ],
    reproducibilityInfo: {
      softwareVersions: ALIGNMENT_TOOLS.reduce((acc: Record<string, string>, t) => ({ ...acc, [t.id]: t.version }), {}),
      parameters: analysis.parametersSnapshot,
      commandLines: commandLines,
      inputFileHashes: inputFileHashes,
    },
  };

  MOCK_REPORTS.push(newReport);
  res.status(201).json(successResponse(newReport, '报告生成成功'));
});

app.get('/api/stats/overview', (req, res) => {
  const stats = {
    projects: {
      total: MOCK_PROJECTS.length,
      active: MOCK_PROJECTS.filter((p: Project) => p.status === 'active').length,
      completed: MOCK_PROJECTS.filter((p: Project) => p.status === 'completed').length,
    },
    samples: {
      total: MOCK_SAMPLES.length,
      byProject: MOCK_PROJECTS.map((p: Project) => ({
        projectId: p.id,
        projectName: p.name,
        count: MOCK_SAMPLES.filter((s: Sample) => s.projectId === p.id).length,
      })),
    },
    analyses: {
      total: MOCK_ANALYSES.length,
      completed: MOCK_ANALYSES.filter((a: AnalysisRecord) => a.status === 'completed').length,
      running: MOCK_ANALYSES.filter((a: AnalysisRecord) => a.status === 'running').length,
      pending: MOCK_ANALYSES.filter((a: AnalysisRecord) => a.status === 'pending').length,
      failed: MOCK_ANALYSES.filter((a: AnalysisRecord) => a.status === 'failed').length,
    },
    variants: {
      total: MOCK_VARIANTS.length,
      pathogenic: MOCK_VARIANTS.filter((v: Variant) => v.clinicalSignificance === 'pathogenic').length,
      snp: MOCK_VARIANTS.filter((v: Variant) => v.type === 'SNP').length,
      indel: MOCK_VARIANTS.filter((v: Variant) => v.type === 'INDEL' || v.type === 'INSERTION' || v.type === 'DELETION').length,
    },
  };
  res.json(successResponse(stats));
});

app.listen(PORT, () => {
  console.log(`GenomeLab API server running on http://localhost:${PORT}`);
});
