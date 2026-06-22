import { create } from 'zustand';
import type { Project, Batch, Sample, AnalysisRecord, Variant, AlignmentResult, AlignmentTool, AnalysisReport, AnalysisVersionHistory, BlastDotPlotData, ClustalAlignmentData, GcSlidingWindowResult, CodonPreferenceResult, OrfPredictionResult, DigestionResult, PrimerDesignResult, PrimerConstraints, PrimerMetrics, CpgIslandScanResult, CpgScanParameters, MethylationToggleResult, WorkflowTemplate, WorkflowGraph, ShareLink, TemplateCategory, ReportSection, ReportSectionType } from '@shared/types';
import { MOCK_PROJECTS, MOCK_BATCHES, MOCK_SAMPLES, MOCK_ANALYSES, MOCK_VARIANTS, MOCK_REPORTS, generateAlignmentResult, generateBlastDotPlotData, generateClustalAlignmentData, computeGcSlidingWindow, computeCodonPreference, predictOrfs, digestSequence, RESTRICTION_ENZYMES, designPrimers, DEFAULT_PRIMER_CONSTRAINTS, computePrimerMetrics, scanCpgIslands, toggleMethylation, batchToggleMethylation } from '@shared/mockData';
import { ALIGNMENT_TOOLS } from '@shared/toolConfigs';
import { BUILT_IN_TEMPLATES } from '@shared/workflowTemplates';

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
  orfPredictionResult: OrfPredictionResult | null;
  digestionResult: DigestionResult | null;
  primerDesignResult: PrimerDesignResult | null;
  primerConstraints: PrimerConstraints;
  cpgScanResult: CpgIslandScanResult | null;
  restrictionEnzymes: typeof RESTRICTION_ENZYMES;
  selectedSampleIds: string[];
  selectedVariantIds: string[];
  filters: {
    projectId?: string;
    batchId?: string;
    searchText?: string;
    status?: string;
  };
  templates: WorkflowTemplate[];
  favoriteTemplates: WorkflowTemplate[];
  currentTemplate: WorkflowTemplate | null;
  templateCategories: { id: string; name: string; count: number }[];
  popularTemplates: WorkflowTemplate[];
  shareLinks: ShareLink[];
  pendingTemplateGraph: WorkflowGraph | null;
  pendingTemplateName: string | null;
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
  predictOrf: (sampleId: string, minOrfLength: number) => Promise<void>;
  analyzeRestrictionEnzyme: (sampleId: string, enzymeNames: string[]) => Promise<void>;
  designPcrPrimers: (sampleId: string, regionStart: number, regionEnd: number, constraints?: Partial<PrimerConstraints>) => Promise<void>;
  setPrimerConstraints: (constraints: Partial<PrimerConstraints>) => void;
  computePrimerMetrics: (sequence: string) => PrimerMetrics;
  clearPrimerResults: () => void;
  scanCpgIslands: (sampleId: string, params?: Partial<CpgScanParameters>) => Promise<void>;
  toggleMethylationSite: (sitePosition: number) => MethylationToggleResult | null;
  batchToggleMethylationSites: (islandId: string, methylate: boolean) => number;
  clearCpgResults: () => void;
  fetchTemplates: (params?: {
    category?: string;
    search?: string;
    isBuiltIn?: boolean;
    isFavorite?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
  }) => Promise<void>;
  fetchTemplateCategories: () => Promise<void>;
  fetchTemplateById: (id: string) => Promise<WorkflowTemplate | null>;
  createTemplate: (data: Partial<WorkflowTemplate> & { graph: WorkflowGraph }) => Promise<WorkflowTemplate>;
  updateTemplate: (id: string, data: Partial<WorkflowTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  toggleFavorite: (templateId: string) => Promise<{ isFavorited: boolean }>;
  fetchFavorites: () => Promise<void>;
  shareTemplate: (templateId: string, permissions?: 'view' | 'view_copy', expiresInDays?: number) => Promise<ShareLink & { shareUrl: string }>;
  revokeShare: (shareId: string) => Promise<void>;
  fetchShares: () => Promise<void>;
  useTemplate: (templateId: string) => Promise<{ graph: WorkflowGraph; parameters: Record<string, string | number | boolean>; name: string } | null>;
  fetchPopularTemplates: (limit?: number) => Promise<void>;
  setCurrentTemplate: (template: WorkflowTemplate | null) => void;
  setPendingTemplate: (graph: WorkflowGraph | null, name?: string | null) => void;
  clearPendingTemplate: () => void;
  updateReportTitle: (reportId: string, title: string) => Promise<void>;
  updateReportSection: (reportId: string, sectionId: string, data: Partial<ReportSection>) => Promise<void>;
  reorderReportSections: (reportId: string, fromIndex: number, toIndex: number) => Promise<void>;
  addReportSection: (reportId: string, type: ReportSectionType, insertIndex?: number) => Promise<void>;
  deleteReportSection: (reportId: string, sectionId: string) => Promise<void>;
  updateReport: (reportId: string, data: Partial<AnalysisReport>) => Promise<void>;
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
  orfPredictionResult: null,
  digestionResult: null,
  primerDesignResult: null,
  primerConstraints: { ...DEFAULT_PRIMER_CONSTRAINTS },
  cpgScanResult: null,
  restrictionEnzymes: RESTRICTION_ENZYMES,
  selectedSampleIds: [],
  selectedVariantIds: [],
  filters: {},
  templates: BUILT_IN_TEMPLATES,
  favoriteTemplates: [],
  currentTemplate: null,
  templateCategories: [],
  popularTemplates: [],
  shareLinks: [],
  pendingTemplateGraph: null,
  pendingTemplateName: null,
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

  predictOrf: async (sampleId, minOrfLength) => {
    set({ loading: true, error: null });
    try {
      await delay(500);
      const sample = get().samples.find(s => s.id === sampleId);
      if (!sample) {
        set({ error: '样本不存在', loading: false });
        return;
      }
      const result = predictOrfs(sample.sequence, sampleId, minOrfLength);
      set({ orfPredictionResult: result, loading: false });
    } catch {
      set({ error: 'ORF预测失败', loading: false });
    }
  },

  analyzeRestrictionEnzyme: async (sampleId, enzymeNames) => {
    set({ loading: true, error: null });
    try {
      await delay(400);
      const sample = get().samples.find(s => s.id === sampleId);
      if (!sample) {
        set({ error: '样本不存在', loading: false });
        return;
      }
      const result = digestSequence(sample.sequence, sampleId, enzymeNames);
      set({ digestionResult: result, loading: false });
    } catch {
      set({ error: '限制酶酶切分析失败', loading: false });
    }
  },

  designPcrPrimers: async (sampleId, regionStart, regionEnd, constraints) => {
    set({ loading: true, error: null });
    try {
      await delay(500);
      const sample = get().samples.find(s => s.id === sampleId);
      if (!sample) {
        set({ error: '样本不存在', loading: false });
        return;
      }
      const mergedConstraints = { ...get().primerConstraints, ...(constraints || {}) };
      const result = designPrimers(
        sample.sequence,
        sampleId,
        regionStart,
        regionEnd,
        mergedConstraints
      );
      set({ primerDesignResult: result, loading: false });
    } catch {
      set({ error: '引物设计失败', loading: false });
    }
  },

  setPrimerConstraints: (constraints) => {
    set(state => ({
      primerConstraints: { ...state.primerConstraints, ...constraints },
    }));
  },

  computePrimerMetrics: (sequence) => {
    return computePrimerMetrics(sequence);
  },

  clearPrimerResults: () => {
    set({ primerDesignResult: null });
  },

  scanCpgIslands: async (sampleId, params) => {
    set({ loading: true, error: null });
    try {
      await delay(500);
      const sample = get().samples.find(s => s.id === sampleId);
      if (!sample) {
        set({ error: '样本不存在', loading: false });
        return;
      }
      const result = scanCpgIslands(sample.sequence, sampleId, params);
      set({ cpgScanResult: result, loading: false });
    } catch {
      set({ error: 'CpG 岛扫描失败', loading: false });
    }
  },

  toggleMethylationSite: (sitePosition) => {
    const state = get();
    if (!state.cpgScanResult) return null;
    const newResult = { ...state.cpgScanResult };
    const toggleResult = toggleMethylation(newResult, sitePosition);
    if (toggleResult) {
      set({ cpgScanResult: { ...newResult } });
    }
    return toggleResult;
  },

  batchToggleMethylationSites: (islandId, methylate) => {
    const state = get();
    if (!state.cpgScanResult) return 0;
    const newResult = { ...state.cpgScanResult };
    const changedCount = batchToggleMethylation(newResult, islandId, methylate);
    if (changedCount > 0) {
      set({ cpgScanResult: { ...newResult } });
    }
    return changedCount;
  },

  clearCpgResults: () => {
    set({ cpgScanResult: null });
  },

  fetchTemplates: async (params) => {
    set({ loading: true, error: null });
    try {
      const query = new URLSearchParams();
      if (params?.category) query.set('category', params.category);
      if (params?.search) query.set('search', params.search);
      if (params?.isBuiltIn !== undefined) query.set('isBuiltIn', String(params.isBuiltIn));
      if (params?.isFavorite !== undefined) query.set('isFavorite', String(params.isFavorite));
      if (params?.sortBy) query.set('sortBy', params.sortBy);
      if (params?.sortOrder) query.set('sortOrder', params.sortOrder);
      if (params?.page) query.set('page', String(params.page));
      if (params?.pageSize) query.set('pageSize', String(params.pageSize));

      const res = await fetch(`/api/templates?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        set({ templates: data.data.items });
      }
    } catch {
      set({ templates: BUILT_IN_TEMPLATES });
    } finally {
      set({ loading: false });
    }
  },

  fetchTemplateCategories: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/templates/categories');
      const data = await res.json();
      if (data.success) {
        set({ templateCategories: data.data });
      }
    } catch {
      set({
        templateCategories: [
          { id: 'variant_calling', name: '变异检测', count: 0 },
          { id: 'alignment', name: '序列比对', count: 0 },
          { id: 'assembly', name: '基因组组装', count: 0 },
          { id: 'annotation', name: '基因注释', count: 0 },
          { id: 'rna_seq', name: '转录组分析', count: 0 },
          { id: 'chip_seq', name: 'ChIP-seq分析', count: 0 },
          { id: 'methylation', name: '甲基化分析', count: 0 },
          { id: 'metagenomics', name: '宏基因组', count: 0 },
          { id: 'single_cell', name: '单细胞分析', count: 0 },
          { id: 'custom', name: '自定义模板', count: 0 },
        ],
      });
    } finally {
      set({ loading: false });
    }
  },

  fetchTemplateById: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/templates/${id}`);
      const data = await res.json();
      if (data.success) {
        set({ currentTemplate: data.data });
        return data.data;
      }
    } catch {
      const template = BUILT_IN_TEMPLATES.find(t => t.id === id);
      if (template) {
        set({ currentTemplate: template });
        return template;
      }
    } finally {
      set({ loading: false });
    }
    return null;
  },

  createTemplate: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        set(state => ({ templates: [...state.templates, result.data] }));
        return result.data;
      }
      throw new Error(result.message || '创建失败');
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '创建模板失败' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateTemplate: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        set(state => ({
          templates: state.templates.map(t => t.id === id ? result.data : t),
          currentTemplate: state.currentTemplate?.id === id ? result.data : state.currentTemplate,
        }));
      } else {
        throw new Error(result.message || '更新失败');
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '更新模板失败' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteTemplate: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        set(state => ({
          templates: state.templates.filter(t => t.id !== id),
          favoriteTemplates: state.favoriteTemplates.filter(t => t.id !== id),
          currentTemplate: state.currentTemplate?.id === id ? null : state.currentTemplate,
        }));
      } else {
        throw new Error(data.message || '删除失败');
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '删除模板失败' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  toggleFavorite: async (templateId) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/templates/${templateId}/favorite`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        set(state => ({
          templates: state.templates.map(t =>
            t.id === templateId ? { ...t, isFavorited: data.data.isFavorited } : t
          ),
          favoriteTemplates: data.data.isFavorited
            ? [...state.favoriteTemplates, state.templates.find(t => t.id === templateId)!]
            : state.favoriteTemplates.filter(t => t.id !== templateId),
        }));
        return data.data;
      }
      throw new Error(data.message || '操作失败');
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '收藏操作失败' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchFavorites: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/favorites');
      const data = await res.json();
      if (data.success) {
        set({ favoriteTemplates: data.data.items });
      }
    } catch {
      set({ favoriteTemplates: [] });
    } finally {
      set({ loading: false });
    }
  },

  shareTemplate: async (templateId, permissions = 'view', expiresInDays) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/templates/${templateId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions, expiresInDays }),
      });
      const data = await res.json();
      if (data.success) {
        set(state => ({
          shareLinks: [...state.shareLinks, data.data],
        }));
        return data.data;
      }
      throw new Error(data.message || '分享失败');
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '创建分享链接失败' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  revokeShare: async (shareId) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/share/${shareId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        set(state => ({
          shareLinks: state.shareLinks.map(s =>
            s.id === shareId ? { ...s, isActive: false } : s
          ),
        }));
      } else {
        throw new Error(data.message || '撤销失败');
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '撤销分享失败' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchShares: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/shares');
      const data = await res.json();
      if (data.success) {
        set({ shareLinks: data.data.items });
      }
    } catch {
      set({ shareLinks: [] });
    } finally {
      set({ loading: false });
    }
  },

  useTemplate: async (templateId) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/templates/${templateId}/use`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        set({ pendingTemplateGraph: data.data.graph, pendingTemplateName: data.data.name });
        return data.data;
      }
      const template = BUILT_IN_TEMPLATES.find(t => t.id === templateId);
      if (template) {
        const result = {
          graph: template.graph,
          parameters: template.parameters,
          name: template.name,
        };
        set({ pendingTemplateGraph: result.graph, pendingTemplateName: result.name });
        return result;
      }
      throw new Error(data.message || '加载模板失败');
    } catch (error) {
      const template = BUILT_IN_TEMPLATES.find(t => t.id === templateId);
      if (template) {
        const result = {
          graph: template.graph,
          parameters: template.parameters,
          name: template.name,
        };
        set({ error: null, pendingTemplateGraph: result.graph, pendingTemplateName: result.name });
        return result;
      }
      set({ error: error instanceof Error ? error.message : '加载模板失败' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  fetchPopularTemplates: async (limit = 8) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/templates/popular?limit=${limit}`);
      const data = await res.json();
      if (data.success && data.data) {
        set({ popularTemplates: data.data });
      } else {
        const popular = [...BUILT_IN_TEMPLATES]
          .sort((a, b) => b.usageCount - a.usageCount)
          .slice(0, limit);
        set({ popularTemplates: popular });
      }
    } catch {
      const popular = [...BUILT_IN_TEMPLATES]
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, limit);
      set({ popularTemplates: popular });
    } finally {
      set({ loading: false });
    }
  },

  setCurrentTemplate: (template) => set({ currentTemplate: template }),
  setPendingTemplate: (graph, name = null) => set({ pendingTemplateGraph: graph, pendingTemplateName: name }),
  clearPendingTemplate: () => set({ pendingTemplateGraph: null, pendingTemplateName: null }),

  updateReportTitle: async (reportId, title) => {
    set({ loading: true });
    await delay(100);
    set(state => ({
      reports: state.reports.map(r =>
        r.id === reportId ? { ...r, title } : r
      ),
      loading: false,
    }));
  },

  updateReportSection: async (reportId, sectionId, data) => {
    set({ loading: true });
    await delay(100);
    set(state => ({
      reports: state.reports.map(r =>
        r.id === reportId
          ? {
              ...r,
              sections: r.sections.map(s =>
                s.id === sectionId ? { ...s, ...data } : s
              ),
            }
          : r
      ),
      loading: false,
    }));
  },

  reorderReportSections: async (reportId, fromIndex, toIndex) => {
    set({ loading: true });
    await delay(100);
    set(state => ({
      reports: state.reports.map(r => {
        if (r.id !== reportId) return r;
        const sections = [...r.sections];
        const [removed] = sections.splice(fromIndex, 1);
        sections.splice(toIndex, 0, removed);
        return { ...r, sections };
      }),
      loading: false,
    }));
  },

  addReportSection: async (reportId, type, insertIndex) => {
    set({ loading: true });
    await delay(100);
    const newId = `sec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    let defaultContent: unknown;
    let defaultTitle = '';
    switch (type) {
      case 'text':
        defaultContent = '<p>在这里输入文本内容...</p>';
        defaultTitle = '新建文本章节';
        break;
      case 'table':
        defaultContent = [
          { 列1: '示例值1', 列2: '示例值2', 列3: '示例值3' },
          { 列1: '示例值4', 列2: '示例值5', 列3: '示例值6' },
        ];
        defaultTitle = '新建表格章节';
        break;
      case 'chart':
        defaultContent = { 类别A: 30, 类别B: 50, 类别C: 20 };
        defaultTitle = '新建图表章节';
        break;
      case 'code':
        defaultContent = '// 在此处粘贴代码\nfunction example() {\n  return "Hello World";\n}';
        defaultTitle = '新建代码章节';
        break;
      case 'image':
        defaultContent = { url: '', alt: '图片描述', caption: '' };
        defaultTitle = '新建图片章节';
        break;
      case 'quote':
        defaultContent = '在这里输入引用内容...';
        defaultTitle = '新建引用章节';
        break;
    }
    const newSection: ReportSection = {
      id: newId,
      title: defaultTitle,
      type,
      content: defaultContent,
    };
    set(state => ({
      reports: state.reports.map(r => {
        if (r.id !== reportId) return r;
        const sections = [...r.sections];
        if (insertIndex !== undefined && insertIndex >= 0) {
          sections.splice(insertIndex, 0, newSection);
        } else {
          sections.push(newSection);
        }
        return { ...r, sections };
      }),
      loading: false,
    }));
  },

  deleteReportSection: async (reportId, sectionId) => {
    set({ loading: true });
    await delay(100);
    set(state => ({
      reports: state.reports.map(r =>
        r.id === reportId
          ? { ...r, sections: r.sections.filter(s => s.id !== sectionId) }
          : r
      ),
      loading: false,
    }));
  },

  updateReport: async (reportId, data) => {
    set({ loading: true });
    await delay(100);
    set(state => ({
      reports: state.reports.map(r =>
        r.id === reportId ? { ...r, ...data } : r
      ),
      loading: false,
    }));
  },
}));
