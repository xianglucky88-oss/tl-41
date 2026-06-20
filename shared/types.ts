export type AlignmentTool = 'blastn' | 'blastp' | 'clustalw' | 'mafft' | 'muscle' | 'bowtie2' | 'bwa' | 'minimap2';

export type AnalysisStatus = 'pending' | 'running' | 'completed' | 'failed';

export type VariantType = 'SNP' | 'INDEL' | 'INSERTION' | 'DELETION' | 'CNV' | 'TRANSLOCATION';

export type VariantEffect = 'synonymous' | 'missense' | 'nonsense' | 'frameshift' | 'splice_site' | 'intronic' | 'intergenic';

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  label: string;
  defaultValue: string | number | boolean;
  options?: (string | number)[];
  description: string;
}

export interface AlignmentToolConfig {
  id: AlignmentTool;
  name: string;
  description: string;
  category: 'alignment' | 'variant_calling' | 'assembly' | 'annotation';
  parameters: ToolParameter[];
  version: string;
}

export interface Sample {
  id: string;
  name: string;
  batchId: string;
  projectId: string;
  description: string;
  sequenceType: 'dna' | 'rna' | 'protein';
  sequence: string;
  qualityScore?: string;
  organism: string;
  createdAt: string;
  metadata: Record<string, string>;
}

export interface Batch {
  id: string;
  name: string;
  projectId: string;
  description: string;
  sampleCount: number;
  createdAt: string;
  createdBy: string;
  status: 'processing' | 'completed' | 'archived';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  organism: string;
  batchCount: number;
  sampleCount: number;
  analysisCount: number;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'completed' | 'archived';
  principalInvestigator: string;
}

export interface AnalysisStep {
  stepId: string;
  stepName: string;
  toolId: AlignmentTool;
  toolVersion: string;
  parameters: Record<string, string | number | boolean>;
  startTime: string;
  endTime: string;
  status: AnalysisStatus;
  inputFileIds: string[];
  outputFileIds: string[];
  log: string;
}

export interface AnalysisVersionHistory {
  version: number;
  timestamp: string;
  changedBy: string;
  description: string;
  steps: AnalysisStep[];
  parametersSnapshot: Record<string, unknown>;
  sampleIds: string[];
}

export interface AnalysisRecord {
  id: string;
  name: string;
  projectId: string;
  batchId?: string;
  sampleIds: string[];
  description: string;
  steps: AnalysisStep[];
  currentStep: number;
  status: AnalysisStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  createdBy: string;
  version: number;
  parentAnalysisId?: string;
  parametersSnapshot: Record<string, unknown>;
  resultSummary?: {
    totalVariants: number;
    snpCount: number;
    indelCount: number;
    pathogenicCount: number;
    alignedReads: number;
    alignmentRate: number;
    meanQuality: number;
  };
  versionHistory: AnalysisVersionHistory[];
}

export interface Variant {
  id: string;
  analysisId: string;
  sampleId: string;
  chromosome: string;
  position: number;
  ref: string;
  alt: string;
  type: VariantType;
  quality: number;
  depth: number;
  alleleFrequency: number;
  effect: VariantEffect;
  gene?: string;
  transcript?: string;
  proteinChange?: string;
  clinicalSignificance?: 'pathogenic' | 'likely_pathogenic' | 'uncertain' | 'likely_benign' | 'benign';
  dbSnpId?: string;
  cosmidId?: string;
  annotations: VariantAnnotation[];
  filters: string[];
}

export interface VariantAnnotation {
  source: string;
  database: string;
  annotationId: string;
  description: string;
  clinicalRelevance?: string;
  references?: string[];
}

export interface AlignmentResult {
  queryId: string;
  subjectId: string;
  percentIdentity: number;
  alignmentLength: number;
  mismatches: number;
  gapOpens: number;
  queryStart: number;
  queryEnd: number;
  subjectStart: number;
  subjectEnd: number;
  eValue: number;
  bitScore: number;
  querySequence: string;
  subjectSequence: string;
  midline: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'text' | 'table' | 'chart' | 'code' | 'image';
  content: unknown;
}

export interface AnalysisReport {
  id: string;
  analysisId: string;
  title: string;
  generatedAt: string;
  generatedBy: string;
  sections: ReportSection[];
  reproducibilityInfo: {
    softwareVersions: Record<string, string>;
    parameters: Record<string, unknown>;
    commandLines: string[];
    inputFileHashes: Record<string, string>;
  };
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BlastHSP {
  queryStart: number;
  queryEnd: number;
  subjectStart: number;
  subjectEnd: number;
  percentIdentity: number;
  alignmentLength: number;
  bitScore: number;
  eValue: number;
  strand: 'plus' | 'minus';
}

export interface BlastDotPlotData {
  queryId: string;
  queryLength: number;
  subjectId: string;
  subjectLength: number;
  hsps: BlastHSP[];
}

export interface ClustalAlignedSequence {
  id: string;
  name: string;
  sequence: string;
}

export interface ClustalColumnInfo {
  position: number;
  conservation: number;
  consensus: string;
  aminoAcids: Record<string, number>;
  isGapColumn: boolean;
}

export interface ClustalAlignmentData {
  sequences: ClustalAlignedSequence[];
  alignmentLength: number;
  columns: ClustalColumnInfo[];
  consensusSequence: string;
  conservationScores: number[];
}

export interface GcWindowPoint {
  position: number;
  gcPercent: number;
}

export interface GcSlidingWindowResult {
  sequenceId: string;
  sequenceLength: number;
  windowSize: number;
  stepSize: number;
  overallGcPercent: number;
  dataPoints: GcWindowPoint[];
}

export interface CodonPositionBaseFrequency {
  position: 1 | 2 | 3;
  A: number;
  T: number;
  G: number;
  C: number;
  gcPercent: number;
}

export interface RscuEntry {
  codon: string;
  aminoAcid: string;
  count: number;
  expected: number;
  rscu: number;
}

export interface CodonPreferenceResult {
  sequenceId: string;
  sequenceLength: number;
  codonCount: number;
  positionFrequencies: CodonPositionBaseFrequency[];
  rscuTable: RscuEntry[];
}
