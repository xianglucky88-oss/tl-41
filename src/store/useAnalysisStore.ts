import { create } from 'zustand';
import type { Project, Batch, Sample, AnalysisRecord, Variant, AlignmentResult, AlignmentTool, AnalysisReport, AnalysisVersionHistory, BlastDotPlotData, ClustalAlignmentData, GcSlidingWindowResult, CodonPreferenceResult } from '@shared/types';
import { MOCK_PROJECTS, MOCK_BATCHES, MOCK_SAMPLES, MOCK_ANALYSES, MOCK_VARIANTS, MOCK_REPORTS, generateAlignmentResult, generateBlastDotPlotData, generateClustalAlignmentData, computeGcSlidingWindow, computeCodonPreference } from '@shared/mockData';
import { ALIGNMENT_TOOLS } from '@shared/toolConfigs';

interface AnalysisState {
  projects: Project[];
  batches: Batch[];
  samples: Sample[];
  analyses: AnalysisRecord[];
  variants: Variant[];
  reports: AnalysisReport[];
  alignmentTools: typeof ALIGNMENT_TOOLS;
  currentProject: Project | null;
  currentBatch: Batch | null;
  currentAnalysis: AnalysisRecord | null;
  alignmentResults: AlignmentResult[];
  blastDotPlotData: BlastDotPlotData | null;
  clustalAlignmentData: ClustalAlignmentData | null;
  gcSlidingWindowResult: GcSlidingWindowResult | null;
  codonPreferenceResult: CodonPreferenceResult | null;
  selectedSampleIds: string[];
  selectedVariantIds: string[];
  filters: {
    projectId?: string;
    batchId?: string;
    searchText?: string;
    status?: string;
  };
  loading: boolean;
  error: string | null;
}

interface AnalysisActions {
  setCurrentProject: (project: Project | null) => void;
  setCurrentBatch: (batch: Batch | null) => void;
  setCurrentAnalysis: (analysis: AnalysisRecord | null) => void;
  setSelectedSampleIds: (ids: string[]) => void;
  setSelectedVariantIds: (ids: string[]) => void;
  setFilters: (filters: Partial<AnalysisState['filters']>) => void;
  runAlignment: (toolId: AlignmentTool, params: Record<string, string | number | boolean>, sampleIds: string[]) => Promise<void>;
  createAnalysis: (data: Partial<AnalysisRecord>) => Promise<AnalysisRecord>;
  updateAnalysis: (id: string, data: Partial<AnalysisRecord>, changeDescription?: string) => Promise<void>;
  completeAnalysis: (id: string, resultData?: Partial<AnalysisRecord['resultSummary']>) => Promise<void>;
  deleteAnalysis: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  deleteSample: (id: string) => Promise<void>;
  fetchProjects: () => Promise<void>;
  fetchBatches: (projectId?: string) => Promise<void>;
  fetchSamples: (batchId?: string, projectId?: string) => Promise<void>;
  fetchAnalyses: (projectId?: string, batchId?: string) => Promise<void>;
  fetchVariants: (analysisId?: string, sampleIds?: string[]) => Promise<void>;
  fetchReports: (analysisId?: string) => Promise<void>;
  generateReport: (analysisId: string) => Promise<AnalysisReport>;
  clearSelection: () => void;
  createProject: (data: Partial<Project>) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  createSample: (data: Partial<Sample>) => Promise<Sample>;
  updateSample: (id: string, data: Partial<Sample>) => Promise<void>;
  saveAnalysisTemplate: (name: string) => Promise<void>;
  batchAnalysis: (sampleIds: string[], toolId: AlignmentTool, params: Record<string, string | number | boolean>) => Promise<void>;
  createBatch: (data: Partial<Batch>) => Promise<Batch>;
  updateBatch: (id: string, data: Partial<Batch>) => Promise<void>;
  deleteBatch: (id: string) => Promise<void>;
  generateBlastDotPlot: (queryId: string, subjectId: string) => Promise<void>;
  generateClustalAlignment: (sequenceCount: number, alignmentLength: number, sequenceType: 'dna' | 'protein') => Promise<void>;
  analyzeGcContent: (sampleId: string, windowSize: number, stepSize: number) => Promise<void>;
  analyzeCodonPreference: (sampleId: string) => Promise<void>;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const computeFileHash = (sample: Sample, idx: number): string => {
  let hash = 0;
  const str = sample.sequence.substring(0, 100);
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return `sha256:${Math.abs(hash).toString(16).padStart(16, '0')}${idx.toString().padStart(8, '0')}a1b2c3d4e5f6`;
};

const initAnalysisWithHistory = (analysis: AnalysisRecord): AnalysisRecord => {
  if (analysis.versionHistory && analysis.versionHistory.length > 0) {
    return analysis;
  }
  return {
    ...analysis,
    versionHistory: [{
      version: analysis.version,
      timestamp: analysis.createdAt,
      changedBy: analysis.createdBy,
      description: '初始分析版本',
      steps: analysis.steps,
      parametersSnapshot: analysis.parametersSnapshot,
      sampleIds: analysis.sampleIds,
    }],
  };
};

const initializedAnalyses = MOCK_ANALYSES.map(initAnalysisWithHistory);
const initializedReports = MOCK_REPORTS;

export const useAnalysisStore = create<AnalysisState & AnalysisActions>((set, get) => ({
  projects: MOCK_PROJECTS,
  batches: MOCK_BATCHES,
  samples: MOCK_SAMPLES,
  analyses: initializedAnalyses,
  variants: MOCK_VARIANTS,
  reports: initializedReports,
  alignmentTools: ALIGNMENT_TOOLS,
  currentProject: null,
  currentBatch: null,
  currentAnalysis: null,
  alignmentResults: [],
  blastDotPlotData: null,
  clustalAlignmentData: null,
  gcSlidingWindowResult: null,
  codonPreferenceResult: null,
  selectedSampleIds: [],
  selectedVariantIds: [],
  filters: {},
  loading: false,
  error: null,

  setCurrentProject: (project) => set({ currentProject: project }),
  setCurrentBatch: (batch) => set({ currentBatch: batch }),
  setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),
  setSelectedSampleIds: (ids) => set({ selectedSampleIds: ids }),
  setSelectedVariantIds: (ids) => set({ selectedVariantIds: ids }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),

  fetchProjects: async () => {
    set({ loading: true });
    await delay(200);
    set({ projects: MOCK_PROJECTS, loading: false });
  },

  fetchBatches: async (projectId) => {
    set({ loading: true });
    await delay(200);
    const batches = projectId
      ? MOCK_BATCHES.filter(b => b.projectId === projectId)
      : MOCK_BATCHES;
    set({ batches, loading: false });
  },

  fetchSamples: async (batchId, projectId) => {
    set({ loading: true });
    await delay(200);
    let samples = MOCK_SAMPLES;
    if (batchId) samples = samples.filter(s => s.batchId === batchId);
    if (projectId) samples = samples.filter(s => s.projectId === projectId);
    set({ samples, loading: false });
  },

  fetchAnalyses: async (projectId, batchId) => {
    set({ loading: true });
    await delay(200);
    let analyses = get().analyses;
    if (projectId) analyses = analyses.filter(a => a.projectId === projectId);
    if (batchId) analyses = analyses.filter(a => a.batchId === batchId);
    set({ analyses, loading: false });
  },

  fetchVariants: async (analysisId, sampleIds) => {
    set({ loading: true });
    await delay(200);
    let variants = MOCK_VARIANTS;
    if (analysisId) variants = variants.filter(v => v.analysisId === analysisId);
    if (sampleIds && sampleIds.length > 0) {
      variants = variants.filter(v => sampleIds.includes(v.sampleId));
    }
    set({ variants, loading: false });
  },

  fetchReports: async (analysisId) => {
    set({ loading: true });
    await delay(200);
    const reports = analysisId
      ? get().reports.filter(r => r.analysisId === analysisId)
      : get().reports;
    set({ reports, loading: false });
  },

  runAlignment: async (toolId, params, sampleIds) => {
    set({ loading: true, error: null });
    try {
      await delay(1500);
      const results = sampleIds.flatMap(sampleId =>
        Array.from({ length: 3 }, (_, i) =>
          generateAlignmentResult(sampleId, `subject_${i + 1}`)
        )
      );
      set({ alignmentResults: results, loading: false });
    } catch (error) {
      set({ error: '比对失败，请检查参数后重试', loading: false });
    }
  },

  completeAnalysis: async (id, resultData) => {
    set({ loading: true });
    await delay(500);

    const analysis = get().analyses.find(a => a.id === id);
    if (!analysis) {
      set({ loading: false });
      return;
    }

    const totalVars = resultData?.totalVariants ?? 100 + Math.floor(Math.random() * 900);
    const resultSummary = {
      totalVariants: totalVars,
      snpCount: resultData?.snpCount ?? Math.floor(totalVars * 0.85),
      indelCount: resultData?.indelCount ?? Math.floor(totalVars * 0.15),
      pathogenicCount: resultData?.pathogenicCount ?? Math.floor(totalVars * 0.02),
      alignedReads: resultData?.alignedReads ?? Math.floor(Math.random() * 10000000) + 1000000,
      alignmentRate: resultData?.alignmentRate ?? 95 + Math.random() * 4.9,
      meanQuality: resultData?.meanQuality ?? 30 + Math.random() * 20,
    };

    const now = new Date().toISOString();

    const completedSteps = analysis.steps.map((step, idx) => ({
      ...step,
      status: 'completed' as const,
      endTime: step.endTime || new Date(Date.now() - (analysis.steps.length - idx) * 60000).toISOString(),
      log: step.log || `步骤 ${idx + 1} 完成`,
    }));

    const newVersionHistory: AnalysisVersionHistory = {
      version: analysis.version + 1,
      timestamp: now,
      changedBy: analysis.createdBy,
      description: '分析完成，生成最终结果',
      steps: completedSteps,
      parametersSnapshot: analysis.parametersSnapshot,
      sampleIds: analysis.sampleIds,
    };

    const completedAnalysis: AnalysisRecord = {
      ...analysis,
      status: 'completed',
      completedAt: now,
      startedAt: analysis.startedAt || analysis.createdAt,
      steps: completedSteps,
      version: analysis.version + 1,
      resultSummary,
      versionHistory: [...analysis.versionHistory, newVersionHistory],
    };

    set(state => ({
      analyses: state.analyses.map(a =>
        a.id === id ? completedAnalysis : a
      ),
      currentAnalysis: state.currentAnalysis?.id === id
        ? completedAnalysis
        : state.currentAnalysis,
      loading: false,
    }));

    await get().generateReport(id);
  },

  createAnalysis: async (data) => {
    set({ loading: true });
    await delay(400);
    const now = new Date().toISOString();
    const steps = data.steps || [];
    const newAnalysis: AnalysisRecord = {
      id: `analysis_${String(get().analyses.length + 1).padStart(3, '0')}`,
      name: data.name || '新建分析',
      projectId: data.projectId || get().currentProject?.id || 'proj_001',
      batchId: data.batchId,
      sampleIds: data.sampleIds || [],
      description: data.description || '',
      status: 'pending',
      createdAt: now,
      startedAt: undefined,
      completedAt: undefined,
      createdBy: data.createdBy || '当前用户',
      version: 1,
      parentAnalysisId: data.parentAnalysisId,
      currentStep: 0,
      steps: steps,
      parametersSnapshot: data.parametersSnapshot || {},
      resultSummary: data.resultSummary,
      versionHistory: [{
        version: 1,
        timestamp: now,
        changedBy: data.createdBy || '当前用户',
        description: '分析任务创建',
        steps: steps,
        parametersSnapshot: data.parametersSnapshot || {},
        sampleIds: data.sampleIds || [],
      }],
    };
    set(state => ({
      analyses: [...state.analyses, newAnalysis],
      currentAnalysis: newAnalysis,
      loading: false,
    }));
    return newAnalysis;
  },

  updateAnalysis: async (id, data, changeDescription) => {
    set({ loading: true });
    await delay(300);
    const now = new Date().toISOString();
    set(state => {
      const oldAnalysis = state.analyses.find(a => a.id === id);
      if (!oldAnalysis) return { loading: false };

      const newVersion = oldAnalysis.version + 1;
      const updatedSteps = data.steps ?? oldAnalysis.steps;
      const updatedParams = data.parametersSnapshot ?? oldAnalysis.parametersSnapshot;
      const updatedSamples = data.sampleIds ?? oldAnalysis.sampleIds;

      const historyEntry: AnalysisVersionHistory = {
        version: newVersion,
        timestamp: now,
        changedBy: '当前用户',
        description: changeDescription || '参数更新',
        steps: updatedSteps,
        parametersSnapshot: updatedParams,
        sampleIds: updatedSamples,
      };

      const updatedAnalysis: AnalysisRecord = {
        ...oldAnalysis,
        ...data,
        version: newVersion,
        versionHistory: [...oldAnalysis.versionHistory, historyEntry],
      };

      return {
        analyses: state.analyses.map(a =>
          a.id === id ? updatedAnalysis : a
        ),
        currentAnalysis: state.currentAnalysis?.id === id
          ? updatedAnalysis
          : state.currentAnalysis,
        loading: false,
      };
    });
  },

  generateReport: async (analysisId) => {
    set({ loading: true });
    await delay(600);

    const analysis = get().analyses.find(a => a.id === analysisId);
    if (!analysis) {
      set({ loading: false });
      throw new Error('分析记录不存在');
    }

    const commandLines = analysis.steps.map(step => {
      const params = Object.entries(step.parameters)
        .map(([k, v]) => `--${k} ${v}`)
        .join(' ');
      return `${step.toolId} -i input_${step.stepId}.fastq -o output_${step.stepId}.bam ${params}`.trim();
    });

    const inputFileHashes: Record<string, string> = {};
    analysis.sampleIds.forEach((sampleId, idx) => {
      const sample = get().samples.find(s => s.id === sampleId);
      if (sample) {
        inputFileHashes[`${sample.name}.fastq`] = computeFileHash(sample, idx);
      }
    });

    const analysisVariants = get().variants.filter(v => analysis.sampleIds.includes(v.sampleId));
    const variantSummary = analysis.resultSummary || {
      totalVariants: analysisVariants.length,
      snpCount: analysisVariants.filter(v => v.type === 'SNP').length,
      indelCount: analysisVariants.filter(v => v.type !== 'SNP').length,
      pathogenicCount: analysisVariants.filter(v => v.clinicalSignificance === 'pathogenic').length,
      alignmentRate: 97.5,
      meanQuality: 35,
    };

    const sampleTableData = analysis.sampleIds.map(sampleId => {
      const sample = get().samples.find(s => s.id === sampleId);
      const sampleVariants = analysisVariants.filter(v => v.sampleId === sampleId);
      return {
        样本名称: sample?.name || sampleId,
        物种: sample?.organism || '-',
        序列长度: sample ? `${sample.sequence.length.toLocaleString()} bp` : '-',
        检出变异: sampleVariants.length.toLocaleString(),
        SNP: sampleVariants.filter(v => v.type === 'SNP').length,
        Indel: sampleVariants.filter(v => v.type !== 'SNP').length,
        状态: analysis.status === 'completed' ? '分析完成' : '进行中',
      };
    });

    const variantTypeData: Record<string, number> = {
      'SNP': analysisVariants.filter(v => v.type === 'SNP').length,
      '插入': analysisVariants.filter(v => v.type === 'INSERTION').length,
      '缺失': analysisVariants.filter(v => v.type === 'DELETION' || v.type === 'INDEL').length,
    };

    const toolNames = analysis.steps.length > 0
      ? analysis.steps.map(s => ALIGNMENT_TOOLS.find(t => t.id === s.toolId)?.name || s.toolId).join(' → ')
      : '基础比对';

    const newReport: AnalysisReport = {
      id: `report_${String(get().reports.length + 1).padStart(3, '0')}`,
      analysisId,
      title: `${analysis.name} - 完整分析报告 v${analysis.version}`,
      generatedAt: new Date().toISOString(),
      generatedBy: analysis.createdBy || '当前用户',
      sections: [
        {
          id: 'sec1',
          title: '分析概述',
          type: 'text',
          content: `分析项目：${analysis.name}\n\n项目描述：${analysis.description}\n\n分析版本：v${analysis.version}\n\n本次分析采用 ${toolNames} 工具链，对 ${analysis.sampleIds.length} 个样本进行了全流程分析。\n共执行 ${analysis.steps.length} 个分析步骤，整体比对率达到 ${variantSummary.alignmentRate.toFixed(2)}%，平均测序质量 Q${variantSummary.meanQuality.toFixed(0)}。\n共检出 ${variantSummary.totalVariants.toLocaleString()} 个变异位点，建议进行后续验证实验。`
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

    set(state => ({
      reports: [...state.reports, newReport],
      loading: false,
    }));
    return newReport;
  },

  createProject: async (data) => {
    set({ loading: true });
    await delay(400);
    const now = new Date().toISOString();
    const newProject: Project = {
      id: `proj_${String(get().projects.length + 1).padStart(3, '0')}`,
      name: data.name || '新项目',
      description: data.description || '',
      organism: data.organism || 'Homo sapiens',
      batchCount: 0,
      sampleCount: 0,
      analysisCount: 0,
      createdAt: now,
      updatedAt: now,
      status: 'active',
      principalInvestigator: data.principalInvestigator || '当前用户',
    };
    set(state => ({
      projects: [...state.projects, newProject],
      currentProject: newProject,
      loading: false,
    }));
    return newProject;
  },

  createSample: async (data) => {
    set({ loading: true });
    await delay(300);
    const generateSeq = () => {
      const bases = ['A', 'T', 'G', 'C'];
      let seq = '';
      for (let i = 0; i < 5000; i++) seq += bases[Math.floor(Math.random() * 4)];
      return seq;
    };
    const newSample: Sample = {
      id: `sample_${String(get().samples.length + 1).padStart(3, '0')}`,
      name: data.name || `SAMPLE-${Date.now()}`,
      batchId: data.batchId || 'batch_001',
      projectId: data.projectId || get().currentProject?.id || 'proj_001',
      description: data.description || '',
      sequenceType: (data.sequenceType as 'dna' | 'rna' | 'protein') || 'dna',
      sequence: data.sequence || generateSeq(),
      organism: data.organism || 'Homo sapiens',
      createdAt: new Date().toISOString(),
      metadata: data.metadata || {},
    };
    set(state => ({
      samples: [...state.samples, newSample],
      loading: false,
    }));
    return newSample;
  },

  updateProject: async (id, data) => {
    set({ loading: true });
    await delay(200);
    const now = new Date().toISOString();
    set(state => ({
      projects: state.projects.map(p =>
        p.id === id ? { ...p, ...data, updatedAt: now } : p
      ),
      currentProject: state.currentProject?.id === id
        ? { ...state.currentProject, ...data, updatedAt: now }
        : state.currentProject,
      loading: false,
    }));
  },

  updateSample: async (id, data) => {
    set({ loading: true });
    await delay(200);
    set(state => ({
      samples: state.samples.map(s =>
        s.id === id ? { ...s, ...data } : s
      ),
      loading: false,
    }));
  },

  deleteAnalysis: async (id) => {
    set({ loading: true });
    await delay(300);
    set(state => ({
      analyses: state.analyses.filter(a => a.id !== id),
      reports: state.reports.filter(r => r.analysisId !== id),
      currentAnalysis: state.currentAnalysis?.id === id ? null : state.currentAnalysis,
      loading: false,
    }));
  },

  deleteProject: async (id) => {
    set({ loading: true });
    await delay(300);
    const relatedBatches = get().batches.filter(b => b.projectId === id);
    const relatedSampleIds = get().samples.filter(s => s.projectId === id).map(s => s.id);
    const relatedAnalysisIds = get().analyses.filter(a => a.projectId === id).map(a => a.id);
    set(state => ({
      projects: state.projects.filter(p => p.id !== id),
      batches: state.batches.filter(b => b.projectId !== id),
      samples: state.samples.filter(s => s.projectId !== id),
      analyses: state.analyses.filter(a => a.projectId !== id),
      reports: state.reports.filter(r => !relatedAnalysisIds.includes(r.analysisId)),
      currentProject: state.currentProject?.id === id ? null : state.currentProject,
      loading: false,
    }));
  },

  deleteSample: async (id) => {
    set({ loading: true });
    await delay(200);
    set(state => ({
      samples: state.samples.filter(s => s.id !== id),
      selectedSampleIds: state.selectedSampleIds.filter(sid => sid !== id),
      loading: false,
    }));
  },

  saveAnalysisTemplate: async (name) => {
    set({ loading: true });
    await delay(300);
    const current = get().currentAnalysis;
    if (!current) {
      set({ loading: false });
      return;
    }
    const templates = JSON.parse(localStorage.getItem('analysisTemplates') || '[]');
    templates.push({
      id: `template_${Date.now()}`,
      name,
      steps: current.steps,
      parametersSnapshot: current.parametersSnapshot,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem('analysisTemplates', JSON.stringify(templates));
    set({ loading: false });
  },

  batchAnalysis: async (sampleIds, toolId, params) => {
    set({ loading: true, error: null });
    try {
      await delay(1000);
      const results = sampleIds.flatMap(sampleId =>
        Array.from({ length: 3 }, (_, i) =>
          generateAlignmentResult(sampleId, `subject_${i + 1}`)
        )
      );
      set({ alignmentResults: results, loading: false });
    } catch (error) {
      set({ error: '批量分析失败', loading: false });
    }
  },

  createBatch: async (data) => {
    set({ loading: true });
    await delay(300);
    const newBatch: Batch = {
      id: `batch_${Date.now()}`,
      name: data.name || 'New Batch',
      projectId: data.projectId || '',
      description: data.description || '',
      sampleCount: 0,
      createdAt: new Date().toISOString(),
      createdBy: '当前用户',
      status: data.status || 'processing',
    };
    set(state => ({
      batches: [...state.batches, newBatch],
      loading: false,
    }));
    return newBatch;
  },

  updateBatch: async (id, data) => {
    set({ loading: true });
    await delay(200);
    set(state => ({
      batches: state.batches.map(b =>
        b.id === id ? { ...b, ...data } : b
      ),
      currentBatch: state.currentBatch?.id === id
        ? { ...state.currentBatch, ...data }
        : state.currentBatch,
      loading: false,
    }));
  },

  deleteBatch: async (id) => {
    set({ loading: true });
    await delay(300);
    const relatedSampleIds = get().samples.filter(s => s.batchId === id).map(s => s.id);
    set(state => ({
      batches: state.batches.filter(b => b.id !== id),
      samples: state.samples.map(s => s.batchId === id ? { ...s, batchId: '' } : s),
      analyses: state.analyses.filter(a => a.batchId !== id),
      currentBatch: state.currentBatch?.id === id ? null : state.currentBatch,
      loading: false,
    }));
  },

  clearSelection: () => {
    set({
      currentProject: null,
      currentBatch: null,
      currentAnalysis: null,
      selectedSampleIds: [],
      selectedVariantIds: [],
      alignmentResults: [],
    });
  },

  generateBlastDotPlot: async (queryId, subjectId) => {
    set({ loading: true, error: null });
    try {
      await delay(400);
      const data = generateBlastDotPlotData(queryId, subjectId);
      set({ blastDotPlotData: data, loading: false });
    } catch {
      set({ error: 'BLAST 点阵图生成失败', loading: false });
    }
  },

  generateClustalAlignment: async (sequenceCount, alignmentLength, sequenceType) => {
    set({ loading: true, error: null });
    try {
      await delay(500);
      const data = generateClustalAlignmentData(sequenceCount, alignmentLength, sequenceType);
      set({ clustalAlignmentData: data, loading: false });
    } catch {
      set({ error: 'ClustalW 比对数据生成失败', loading: false });
    }
  },

  analyzeGcContent: async (sampleId, windowSize, stepSize) => {
    set({ loading: true, error: null });
    try {
      await delay(300);
      const sample = get().samples.find(s => s.id === sampleId);
      if (!sample) {
        set({ error: '样本不存在', loading: false });
        return;
      }
      const result = computeGcSlidingWindow(sample.sequence, sampleId, windowSize, stepSize);
      set({ gcSlidingWindowResult: result, loading: false });
    } catch {
      set({ error: 'GC含量分析失败', loading: false });
    }
  },

  analyzeCodonPreference: async (sampleId) => {
    set({ loading: true, error: null });
    try {
      await delay(400);
      const sample = get().samples.find(s => s.id === sampleId);
      if (!sample) {
        set({ error: '样本不存在', loading: false });
        return;
      }
      const result = computeCodonPreference(sample.sequence, sampleId);
      set({ codonPreferenceResult: result, loading: false });
    } catch {
      set({ error: '密码子偏好分析失败', loading: false });
    }
  },
}));
