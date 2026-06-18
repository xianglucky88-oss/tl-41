import { create } from 'zustand';
import type { Project, Batch, Sample, AnalysisRecord, Variant, AlignmentResult, AlignmentTool, AnalysisReport } from '@shared/types';
import { MOCK_PROJECTS, MOCK_BATCHES, MOCK_SAMPLES, MOCK_ANALYSES, MOCK_VARIANTS, MOCK_REPORTS, generateAlignmentResult } from '@shared/mockData';
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
  updateAnalysis: (id: string, data: Partial<AnalysisRecord>) => Promise<void>;
  fetchProjects: () => Promise<void>;
  fetchBatches: (projectId?: string) => Promise<void>;
  fetchSamples: (batchId?: string, projectId?: string) => Promise<void>;
  fetchAnalyses: (projectId?: string, batchId?: string) => Promise<void>;
  fetchVariants: (analysisId?: string, sampleIds?: string[]) => Promise<void>;
  fetchReports: (analysisId?: string) => Promise<void>;
  generateReport: (analysisId: string) => Promise<AnalysisReport>;
  clearSelection: () => void;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useAnalysisStore = create<AnalysisState & AnalysisActions>((set, get) => ({
  projects: MOCK_PROJECTS,
  batches: MOCK_BATCHES,
  samples: MOCK_SAMPLES,
  analyses: MOCK_ANALYSES,
  variants: MOCK_VARIANTS,
  reports: MOCK_REPORTS,
  alignmentTools: ALIGNMENT_TOOLS,
  currentProject: null,
  currentBatch: null,
  currentAnalysis: null,
  alignmentResults: [],
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
    await delay(300);
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
    await delay(300);
    let analyses = MOCK_ANALYSES;
    if (projectId) analyses = analyses.filter(a => a.projectId === projectId);
    if (batchId) analyses = analyses.filter(a => a.batchId === batchId);
    set({ analyses, loading: false });
  },

  fetchVariants: async (analysisId, sampleIds) => {
    set({ loading: true });
    await delay(300);
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
      ? MOCK_REPORTS.filter(r => r.analysisId === analysisId)
      : MOCK_REPORTS;
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

  createAnalysis: async (data) => {
    set({ loading: true });
    await delay(500);
    const newAnalysis: AnalysisRecord = {
      id: `analysis_${String(get().analyses.length + 1).padStart(3, '0')}`,
      name: data.name || '新建分析',
      projectId: data.projectId || get().currentProject?.id || 'proj_001',
      batchId: data.batchId,
      sampleIds: data.sampleIds || [],
      description: data.description || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      createdBy: '当前用户',
      version: 1,
      currentStep: 0,
      steps: data.steps || [],
      parametersSnapshot: data.parametersSnapshot || {},
      ...data,
    };
    set(state => ({
      analyses: [...state.analyses, newAnalysis],
      currentAnalysis: newAnalysis,
      loading: false,
    }));
    return newAnalysis;
  },

  updateAnalysis: async (id, data) => {
    set({ loading: true });
    await delay(300);
    set(state => ({
      analyses: state.analyses.map(a =>
        a.id === id ? { ...a, ...data, version: a.version + 1 } : a
      ),
      currentAnalysis: state.currentAnalysis?.id === id
        ? { ...state.currentAnalysis, ...data, version: state.currentAnalysis.version + 1 }
        : state.currentAnalysis,
      loading: false,
    }));
  },

  generateReport: async (analysisId) => {
    set({ loading: true });
    await delay(800);
    const analysis = get().analyses.find(a => a.id === analysisId);
    const newReport: AnalysisReport = {
      id: `report_${String(get().reports.length + 1).padStart(3, '0')}`,
      analysisId,
      title: `${analysis?.name || '分析'} - 分析报告`,
      generatedAt: new Date().toISOString(),
      generatedBy: '当前用户',
      sections: [
        { id: 'sec1', title: '分析概述', type: 'text', content: analysis?.description || '' },
        { id: 'sec2', title: '样本信息', type: 'table', content: analysis?.sampleIds.map(id => ({ sampleId: id, status: '已分析' })) || [] },
        { id: 'sec3', title: '分析参数', type: 'code', content: JSON.stringify(analysis?.parametersSnapshot || {}, null, 2) },
        { id: 'sec4', title: '结果统计', type: 'chart', content: analysis?.resultSummary || { totalVariants: 0 } },
      ],
      reproducibilityInfo: {
        softwareVersions: ALIGNMENT_TOOLS.reduce((acc, t) => ({ ...acc, [t.id]: t.version }), {}),
        parameters: analysis?.parametersSnapshot || {},
        commandLines: [],
        inputFileHashes: {},
      },
    };
    set(state => ({
      reports: [...state.reports, newReport],
      loading: false,
    }));
    return newReport;
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
}));
