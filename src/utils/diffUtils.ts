import type { AnalysisStep, AnalysisVersionHistory } from '@shared/types';

export type DiffChangeType = 'added' | 'removed' | 'modified' | 'unchanged';

export interface StepDiffItem {
  type: DiffChangeType;
  stepId: string;
  oldStep?: AnalysisStep;
  newStep?: AnalysisStep;
  parameterDiffs: ParameterDiffItem[];
}

export interface ParameterDiffItem {
  key: string;
  type: DiffChangeType;
  oldValue?: string | number | boolean;
  newValue?: string | number | boolean;
}

export interface SampleDiffItem {
  type: DiffChangeType;
  sampleId: string;
  sampleName?: string;
}

export interface VersionDiffResult {
  steps: StepDiffItem[];
  globalParameters: ParameterDiffItem[];
  samples: SampleDiffItem[];
  summary: {
    stepsAdded: number;
    stepsRemoved: number;
    stepsModified: number;
    paramsChanged: number;
    samplesAdded: number;
    samplesRemoved: number;
  };
}

export const computeStepDiffs = (
  oldSteps: AnalysisStep[],
  newSteps: AnalysisStep[]
): StepDiffItem[] => {
  const oldStepMap = new Map(oldSteps.map(s => [s.stepId, s]));
  const newStepMap = new Map(newSteps.map(s => [s.stepId, s]));
  const allStepIds = new Set([...oldStepMap.keys(), ...newStepMap.keys()]);

  const diffs: StepDiffItem[] = [];

  for (const stepId of allStepIds) {
    const oldStep = oldStepMap.get(stepId);
    const newStep = newStepMap.get(stepId);

    if (oldStep && newStep) {
      const parameterDiffs = computeParameterDiffs(
        oldStep.parameters as Record<string, string | number | boolean>,
        newStep.parameters as Record<string, string | number | boolean>
      );
      const hasChanges = parameterDiffs.some(p => p.type !== 'unchanged');
      diffs.push({
        type: hasChanges ? 'modified' : 'unchanged',
        stepId,
        oldStep,
        newStep,
        parameterDiffs,
      });
    } else if (newStep && !oldStep) {
      diffs.push({
        type: 'added',
        stepId,
        newStep,
        parameterDiffs: computeParameterDiffs(
          {},
          newStep.parameters as Record<string, string | number | boolean>
        ),
      });
    } else if (oldStep && !newStep) {
      diffs.push({
        type: 'removed',
        stepId,
        oldStep,
        parameterDiffs: computeParameterDiffs(
          oldStep.parameters as Record<string, string | number | boolean>,
          {}
        ),
      });
    }
  }

  return sortByOrder(diffs, oldSteps, newSteps);
};

const sortByOrder = (
  diffs: StepDiffItem[],
  oldSteps: AnalysisStep[],
  newSteps: AnalysisStep[]
): StepDiffItem[] => {
  const oldOrder = new Map(oldSteps.map((s, i) => [s.stepId, i]));
  const newOrder = new Map(newSteps.map((s, i) => [s.stepId, i]));

  return [...diffs].sort((a, b) => {
    const aOldIdx = oldOrder.get(a.stepId);
    const aNewIdx = newOrder.get(a.stepId);
    const bOldIdx = oldOrder.get(b.stepId);
    const bNewIdx = newOrder.get(b.stepId);

    const aIdx = aNewIdx !== undefined ? aNewIdx : (aOldIdx ?? 0);
    const bIdx = bNewIdx !== undefined ? bNewIdx : (bOldIdx ?? 0);

    return aIdx - bIdx;
  });
};

export const computeParameterDiffs = (
  oldParams: Record<string, string | number | boolean>,
  newParams: Record<string, string | number | boolean>
): ParameterDiffItem[] => {
  const allKeys = new Set([...Object.keys(oldParams), ...Object.keys(newParams)]);
  const diffs: ParameterDiffItem[] = [];

  for (const key of allKeys) {
    const oldVal = oldParams[key];
    const newVal = newParams[key];

    if (oldVal === undefined && newVal !== undefined) {
      diffs.push({ key, type: 'added', newValue: newVal });
    } else if (oldVal !== undefined && newVal === undefined) {
      diffs.push({ key, type: 'removed', oldValue: oldVal });
    } else if (oldVal !== newVal) {
      diffs.push({ key, type: 'modified', oldValue: oldVal, newValue: newVal });
    } else {
      diffs.push({ key, type: 'unchanged', oldValue: oldVal, newValue: newVal });
    }
  }

  return diffs.sort((a, b) => a.key.localeCompare(b.key));
};

export const computeSampleDiffs = (
  oldSampleIds: string[],
  newSampleIds: string[],
  sampleNames: Map<string, string>
): SampleDiffItem[] => {
  const oldSet = new Set(oldSampleIds);
  const newSet = new Set(newSampleIds);
  const allIds = new Set([...oldSet, ...newSet]);
  const diffs: SampleDiffItem[] = [];

  for (const sampleId of allIds) {
    const inOld = oldSet.has(sampleId);
    const inNew = newSet.has(sampleId);

    if (inOld && inNew) {
      diffs.push({ type: 'unchanged', sampleId, sampleName: sampleNames.get(sampleId) });
    } else if (inNew && !inOld) {
      diffs.push({ type: 'added', sampleId, sampleName: sampleNames.get(sampleId) });
    } else if (inOld && !inNew) {
      diffs.push({ type: 'removed', sampleId, sampleName: sampleNames.get(sampleId) });
    }
  }

  return diffs.sort((a, b) => {
    const typeOrder: Record<DiffChangeType, number> = { added: 0, removed: 1, modified: 2, unchanged: 3 };
    const typeDiff = typeOrder[a.type] - typeOrder[b.type];
    if (typeDiff !== 0) return typeDiff;
    return (a.sampleName || a.sampleId).localeCompare(b.sampleName || b.sampleId);
  });
};

export const computeVersionDiff = (
  oldVersion: AnalysisVersionHistory,
  newVersion: AnalysisVersionHistory,
  sampleNames: Map<string, string>
): VersionDiffResult => {
  const steps = computeStepDiffs(oldVersion.steps, newVersion.steps);
  const globalParameters = computeParameterDiffs(
    oldVersion.parametersSnapshot as Record<string, string | number | boolean>,
    newVersion.parametersSnapshot as Record<string, string | number | boolean>
  );
  const samples = computeSampleDiffs(oldVersion.sampleIds, newVersion.sampleIds, sampleNames);

  const stepsAdded = steps.filter(s => s.type === 'added').length;
  const stepsRemoved = steps.filter(s => s.type === 'removed').length;
  const stepsModified = steps.filter(s => s.type === 'modified').length;
  const paramsChanged = globalParameters.filter(p => p.type !== 'unchanged').length;
  const samplesAdded = samples.filter(s => s.type === 'added').length;
  const samplesRemoved = samples.filter(s => s.type === 'removed').length;

  return {
    steps,
    globalParameters,
    samples,
    summary: {
      stepsAdded,
      stepsRemoved,
      stepsModified,
      paramsChanged,
      samplesAdded,
      samplesRemoved,
    },
  };
};
