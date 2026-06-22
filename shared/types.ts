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

export interface SequencingQCMetrics {
  q20Bases: number;
  q30Bases: number;
  gcContent: number;
  adapterRate: number;
  duplicationRate: number;
  contaminationRate: number;
  totalReads: number;
  mappedReads: number;
  mappingRate: number;
  coverageDepth: number;
  coverageBreadth: number;
  insertSizeMean: number;
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
  qcMetrics?: SequencingQCMetrics;
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

export type ReportSectionType = 'text' | 'table' | 'chart' | 'code' | 'image' | 'quote';

export interface ReportSection {
  id: string;
  title: string;
  type: ReportSectionType;
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

export interface OrfRecord {
  id: string;
  frame: number;
  strand: '+' | '-';
  startCodon: string;
  stopCodon: string;
  startPosition: number;
  endPosition: number;
  orfLength: number;
  nucleotideSequence: string;
  proteinSequence: string;
  proteinLength: number;
  gcPercent: number;
  gc1Percent: number;
  gc2Percent: number;
  gc3Percent: number;
}

export interface OrfPredictionResult {
  sequenceId: string;
  sequenceLength: number;
  minOrfLength: number;
  totalOrfs: number;
  orfs: OrfRecord[];
  frameSummary: {
    frame: number;
    strand: '+' | '-';
    orfCount: number;
    longestOrf: number;
  }[];
}

export interface RestrictionEnzyme {
  name: string;
  recognitionSite: string;
  cutTopStrand: number;
  cutBottomStrand: number;
  isPalindromic: boolean;
  type: 'I' | 'II' | 'IIS' | 'III';
  organism: string;
  temperature: number;
  buffer: string;
  methylationSensitive: boolean;
}

export interface CutSite {
  enzymeName: string;
  position: number;
  topCutOffset: number;
  bottomCutOffset: number;
  recognitionSite: string;
  isPalindromic: boolean;
}

export interface DigestionFragment {
  start: number;
  end: number;
  length: number;
  leftEnzyme: string;
  rightEnzyme: string;
}

export interface DigestionResult {
  sequenceId: string;
  sequenceLength: number;
  selectedEnzymes: string[];
  totalCutSites: number;
  cutSites: CutSite[];
  fragments: DigestionFragment[];
  fragmentCount: number;
}

export interface CodonPreferenceResult {
  sequenceId: string;
  sequenceLength: number;
  codonCount: number;
  positionFrequencies: CodonPositionBaseFrequency[];
  rscuTable: RscuEntry[];
}

export interface PrimerConstraints {
  minLength: number;
  maxLength: number;
  minTm: number;
  maxTm: number;
  minGc: number;
  maxGc: number;
  maxDimerDeltaG: number;
  maxHairpinDeltaG: number;
  maxHomopolymer: number;
  productMinSize: number;
  productMaxSize: number;
  tmDifference: number;
  avoid5PrimeAT: boolean;
  gcClamp3Prime: number;
}

export interface PrimerMetrics {
  length: number;
  gcPercent: number;
  tm: number;
  homopolymerMax: number;
  dimerDeltaG: number;
  hairpinDeltaG: number;
  hasGcClamp: boolean;
  startsWithAT: boolean;
  complexityScore: number;
}

export interface Primer {
  id: string;
  sequence: string;
  direction: 'forward' | 'reverse';
  start: number;
  end: number;
  strand: '+' | '-';
  metrics: PrimerMetrics;
}

export interface PrimerPair {
  id: string;
  forward: Primer;
  reverse: Primer;
  productSize: number;
  productTm: number;
  tmDifference: number;
  penaltyScore: number;
  passesConstraints: boolean;
  warnings: string[];
}

export interface PrimerDesignResult {
  sequenceId: string;
  sequenceLength: number;
  selectedRegionStart: number;
  selectedRegionEnd: number;
  constraints: PrimerConstraints;
  forwardCandidates: Primer[];
  reverseCandidates: Primer[];
  pairs: PrimerPair[];
  totalForwardChecked: number;
  totalReverseChecked: number;
  totalPairsEvaluated: number;
}

export interface CpgSite {
  position: number;
  cPosition: number;
  gPosition: number;
  methylated: boolean;
  contextSequence: string;
  inIsland: boolean;
  islandId?: string;
}

export interface CpgIsland {
  id: string;
  startPosition: number;
  endPosition: number;
  length: number;
  gcPercent: number;
  cpgCount: number;
  observedCpg: number;
  expectedCpg: number;
  oeRatio: number;
  cpgDensity: number;
  cSites: number;
  gSites: number;
  sequence: string;
}

export interface CpgScanParameters {
  minLength: number;
  minGcPercent: number;
  minOeRatio: number;
  initialMethylationRate: number;
}

export interface CpgIslandScanResult {
  sequenceId: string;
  sequenceLength: number;
  parameters: CpgScanParameters;
  totalCpgSites: number;
  totalIslands: number;
  methylatedCount: number;
  unmethylatedCount: number;
  overallMethylationRate: number;
  islands: CpgIsland[];
  cpgSites: CpgSite[];
}

export interface MethylationToggleResult {
  site: CpgSite;
  previousState: boolean;
  newState: boolean;
  islandMethylationRate?: number;
}

export const DEFAULT_CPG_SCAN_PARAMETERS: CpgScanParameters = {
  minLength: 200,
  minGcPercent: 50,
  minOeRatio: 0.6,
  initialMethylationRate: 0.3,
};

export type WorkflowNodeType = 'input' | 'tool' | 'branch' | 'merge' | 'output';

export interface WorkflowNodePosition {
  x: number;
  y: number;
}

export interface WorkflowNodePort {
  id: string;
  label?: string;
}

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  label: string;
  position: WorkflowNodePosition;
  toolId?: AlignmentTool;
  parameters?: Record<string, string | number | boolean>;
  branchConditions?: string[];
  inputPorts: WorkflowNodePort[];
  outputPorts: WorkflowNodePort[];
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourcePort: string;
  targetPort: string;
  label?: string;
}

export interface WorkflowGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface DragState {
  isDragging: boolean;
  nodeId: string | null;
  offset: { x: number; y: number };
}

export interface ConnectionState {
  isConnecting: boolean;
  sourceNodeId: string | null;
  sourcePortId: string | null;
  mousePosition: { x: number; y: number };
}

export type TemplateCategory = 
  | 'variant_calling'
  | 'alignment'
  | 'assembly'
  | 'annotation'
  | 'rna_seq'
  | 'chip_seq'
  | 'methylation'
  | 'metagenomics'
  | 'single_cell'
  | 'custom';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  isBuiltIn: boolean;
  isPublic: boolean;
  author: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  favoriteCount: number;
  shareCount: number;
  graph: WorkflowGraph;
  parameters: Record<string, string | number | boolean>;
  estimatedRuntime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  version: string;
  requirements: {
    minRAM: string;
    minCores: number;
    referenceGenome?: string;
  };
}

export interface UserFavorite {
  id: string;
  templateId: string;
  userId: string;
  createdAt: string;
}

export interface ShareLink {
  id: string;
  templateId: string;
  shareCode: string;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
  accessCount: number;
  isActive: boolean;
  permissions: 'view' | 'view_copy';
}

export interface ShareTemplatePayload {
  templateId: string;
  permissions: 'view' | 'view_copy';
  expiresInDays?: number;
}

export interface TemplateUsageStats {
  templateId: string;
  totalRuns: number;
  successRate: number;
  avgRuntime: number;
  lastUsed: string;
}

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  variant_calling: '变异检测',
  alignment: '序列比对',
  assembly: '基因组组装',
  annotation: '基因注释',
  rna_seq: '转录组分析',
  chip_seq: 'ChIP-seq分析',
  methylation: '甲基化分析',
  metagenomics: '宏基因组',
  single_cell: '单细胞分析',
  custom: '自定义模板',
};
