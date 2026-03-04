import { apiFetch } from '@/lib/api';

export type WeekStatus =
  | 'NOT_STARTED'
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'PARTIAL_SUCCEEDED'
  | 'FAILED'
  | 'FAILED_TIMEOUT'
  | 'SKIPPED';

export interface CurriculumJob {
  id: number;
  jobType: 'GENERATE' | 'RETRY' | 'REGENERATE';
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'PARTIAL_SUCCEEDED' | 'FAILED' | 'FAILED_TIMEOUT' | 'CANCELLED';
  errorCode?: string | null;
  errorMessage?: string | null;
  queuedAt?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
}

export interface CurriculumWeek {
  id: number;
  weekNo: number;
  primaryGoal: string;
  subGoals: string[];
  status: WeekStatus;
  storyId?: number | null;
  currentVersionNo: number;
  continuityStale: boolean;
  autoRetryUsed: boolean;
  manualRetryUsed: boolean;
  skipReason?: string | null;
  latestJob?: CurriculumJob | null;
}

export interface CurriculumSummary {
  id: number;
  title: string;
  category: string;
  subTopic?: string | null;
  ageRange?: string | null;
  baseLanguage: string;
  weeks: number;
  completedWeeks: number;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';
  nextWeekToGenerate?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CurriculumDetail {
  id: number;
  title: string;
  category: string;
  subTopic?: string | null;
  ageRange?: string | null;
  baseLanguage: string;
  weeks: number;
  generationMode: 'ON_DEMAND' | 'SCHEDULED';
  scheduleRule?: string | null;
  nextRunAt?: string | null;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';
  defaultArtStyle?: string | null;
  defaultVoice?: string | null;
  defaultCharacterIds: number[];
  baseLanguageLocked: boolean;
  weekItems: CurriculumWeek[];
}

export interface WeekGoalDraft {
  weekNo: number;
  primaryGoal: string;
  subGoals?: string[];
}

export interface CreateCurriculumPayload {
  title: string;
  category: string;
  subTopic?: string;
  ageRange?: string;
  baseLanguage: string;
  weeks: 2 | 4;
  generationMode?: 'ON_DEMAND' | 'SCHEDULED';
  defaultCharacterIds?: number[];
  defaultArtStyle?: string;
  defaultVoice?: string;
  weekGoals: WeekGoalDraft[];
}

function normalizeWeek(raw: any): CurriculumWeek {
  return {
    id: Number(raw.id),
    weekNo: Number(raw.weekNo ?? raw.week_no),
    primaryGoal: raw.primaryGoal ?? raw.primary_goal ?? '',
    subGoals: Array.isArray(raw.subGoals ?? raw.sub_goals) ? (raw.subGoals ?? raw.sub_goals) : [],
    status: (raw.status ?? 'NOT_STARTED') as WeekStatus,
    storyId: raw.storyId ?? raw.story_id ?? null,
    currentVersionNo: Number(raw.currentVersionNo ?? raw.current_version_no ?? 0),
    continuityStale: Boolean(raw.continuityStale ?? raw.continuity_stale),
    autoRetryUsed: Boolean(raw.autoRetryUsed ?? raw.auto_retry_used),
    manualRetryUsed: Boolean(raw.manualRetryUsed ?? raw.manual_retry_used),
    skipReason: raw.skipReason ?? raw.skip_reason ?? null,
    latestJob: raw.latestJob ?? raw.latest_job ?? null,
  };
}

function normalizeSummary(raw: any): CurriculumSummary {
  return {
    id: Number(raw.id),
    title: raw.title,
    category: raw.category,
    subTopic: raw.subTopic ?? raw.sub_topic ?? null,
    ageRange: raw.ageRange ?? raw.age_range ?? null,
    baseLanguage: raw.baseLanguage ?? raw.base_language,
    weeks: Number(raw.weeks),
    completedWeeks: Number(raw.completedWeeks ?? raw.completed_weeks ?? 0),
    status: raw.status,
    nextWeekToGenerate: raw.nextWeekToGenerate ?? raw.next_week_to_generate ?? null,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
  };
}

function normalizeDetail(raw: any): CurriculumDetail {
  return {
    id: Number(raw.id),
    title: raw.title,
    category: raw.category,
    subTopic: raw.subTopic ?? raw.sub_topic ?? null,
    ageRange: raw.ageRange ?? raw.age_range ?? null,
    baseLanguage: raw.baseLanguage ?? raw.base_language,
    weeks: Number(raw.weeks),
    generationMode: (raw.generationMode ?? raw.generation_mode ?? 'ON_DEMAND') as 'ON_DEMAND' | 'SCHEDULED',
    scheduleRule: raw.scheduleRule ?? raw.schedule_rule ?? null,
    nextRunAt: raw.nextRunAt ?? raw.next_run_at ?? null,
    status: raw.status,
    defaultArtStyle: raw.defaultArtStyle ?? raw.default_art_style ?? null,
    defaultVoice: raw.defaultVoice ?? raw.default_voice ?? null,
    defaultCharacterIds: Array.isArray(raw.defaultCharacterIds ?? raw.default_character_ids)
      ? (raw.defaultCharacterIds ?? raw.default_character_ids)
      : [],
    baseLanguageLocked: Boolean(raw.baseLanguageLocked ?? raw.base_language_locked),
    weekItems: Array.isArray(raw.weekItems ?? raw.week_items)
      ? (raw.weekItems ?? raw.week_items).map(normalizeWeek)
      : [],
  };
}

export async function listCurriculums(): Promise<CurriculumSummary[]> {
  const data = await apiFetch<any[]>('/curriculums');
  return (data ?? []).map(normalizeSummary);
}

export async function getCurriculum(id: number): Promise<CurriculumDetail> {
  const data = await apiFetch<any>(`/curriculums/${id}`);
  return normalizeDetail(data);
}

export async function draftGoals(payload: {
  category: string;
  subTopic?: string;
  ageRange?: string;
  baseLanguage: string;
  weeks: 2 | 4;
  title?: string;
}): Promise<WeekGoalDraft[]> {
  const data = await apiFetch<{ goals: any[] }>('/curriculums/goal-drafts', {
    method: 'POST',
    body: payload,
  });
  const goals = data?.goals ?? [];
  return goals.map((goal: any) => ({
    weekNo: Number(goal.weekNo ?? goal.week_no),
    primaryGoal: goal.primaryGoal ?? goal.primary_goal ?? '',
    subGoals: Array.isArray(goal.subGoals ?? goal.sub_goals) ? (goal.subGoals ?? goal.sub_goals) : [],
  }));
}

export async function createCurriculum(payload: CreateCurriculumPayload): Promise<CurriculumDetail> {
  const created = await apiFetch<any>('/curriculums', {
    method: 'POST',
    body: payload,
  });
  return normalizeDetail(created);
}

export async function updateWeekGoal(
  curriculumId: number,
  weekNo: number,
  payload: { primaryGoal: string; subGoals?: string[] }
): Promise<CurriculumWeek> {
  const resp = await apiFetch<any>(`/curriculums/${curriculumId}/weeks/${weekNo}/goal`, {
    method: 'PATCH',
    body: payload,
  });
  return normalizeWeek(resp.week ?? resp.week_data ?? resp);
}

export async function generateWeek(curriculumId: number, weekNo: number, payload?: { artStyle?: string; voicePreset?: string; characterIds?: number[] }) {
  await apiFetch(`/curriculums/${curriculumId}/weeks/${weekNo}/generate`, { method: 'POST', body: payload ?? {} });
}

export async function retryWeek(curriculumId: number, weekNo: number, payload?: { artStyle?: string; voicePreset?: string; characterIds?: number[] }) {
  await apiFetch(`/curriculums/${curriculumId}/weeks/${weekNo}/retry`, { method: 'POST', body: payload ?? {} });
}

export async function regenerateWeek(curriculumId: number, weekNo: number, payload?: { artStyle?: string; voicePreset?: string; characterIds?: number[] }) {
  await apiFetch(`/curriculums/${curriculumId}/weeks/${weekNo}/regenerate`, { method: 'POST', body: payload ?? {} });
}

export async function cancelWeek(curriculumId: number, weekNo: number) {
  await apiFetch(`/curriculums/${curriculumId}/weeks/${weekNo}/cancel`, { method: 'POST' });
}
