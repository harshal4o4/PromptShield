import type {
  AnalysisRequest,
  AnalysisResponse,
  FileInspectionResponse,
  EventsListResponse,
  EventDetail,
  OverviewResponse,
  PolicyConfig,
  EvaluationResult,
  DatasetSummary,
  AppSettings
} from '../types/api';

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:8000' : '');

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errMsg = `Request failed with status ${res.status}`;
    try {
      const errData = await res.json();
      if (errData.detail) {
        errMsg = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
      } else if (errData.error) {
        errMsg = errData.error;
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errMsg);
  }
  return res.json();
}

export const api = {
  async getHealth(): Promise<{ status: string; app: string; version: string; database: string }> {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse(res);
  },

  async analyzePrompt(payload: AnalysisRequest): Promise<AnalysisResponse> {
    const res = await fetch(`${API_BASE}/api/v1/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async inspectFile(file: File, callModel: boolean = false): Promise<FileInspectionResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('call_model', callModel ? 'true' : 'false');

    const res = await fetch(`${API_BASE}/api/v1/inspect/file`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(res);
  },

  async getOverview(): Promise<OverviewResponse> {
    const res = await fetch(`${API_BASE}/api/v1/overview`);
    return handleResponse(res);
  },

  async getEvents(params: {
    search?: string;
    decision?: string;
    risk_level?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    page_size?: number;
  } = {}): Promise<EventsListResponse> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.decision && params.decision !== 'ALL') query.set('decision', params.decision);
    if (params.risk_level && params.risk_level !== 'all') query.set('risk_level', params.risk_level);
    if (params.date_from) query.set('date_from', params.date_from);
    if (params.date_to) query.set('date_to', params.date_to);
    if (params.page) query.set('page', params.page.toString());
    if (params.page_size) query.set('page_size', params.page_size.toString());

    const res = await fetch(`${API_BASE}/api/v1/events?${query.toString()}`);
    return handleResponse(res);
  },

  async getEventDetail(eventId: string): Promise<EventDetail> {
    const res = await fetch(`${API_BASE}/api/v1/events/${eventId}`);
    return handleResponse(res);
  },

  async getPolicies(): Promise<PolicyConfig> {
    const res = await fetch(`${API_BASE}/api/v1/policies`);
    return handleResponse(res);
  },

  async updatePolicies(payload: Partial<PolicyConfig>): Promise<PolicyConfig> {
    const res = await fetch(`${API_BASE}/api/v1/policies`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async resetPolicies(): Promise<PolicyConfig> {
    const res = await fetch(`${API_BASE}/api/v1/policies/reset`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  async getEvaluationDataset(): Promise<DatasetSummary> {
    const res = await fetch(`${API_BASE}/api/v1/evaluation/dataset`);
    return handleResponse(res);
  },

  async runEvaluation(): Promise<EvaluationResult> {
    const res = await fetch(`${API_BASE}/api/v1/evaluation/run`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  async getLatestEvaluation(): Promise<EvaluationResult | null> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/evaluation/latest`);
      return await handleResponse(res);
    } catch {
      return null;
    }
  },

  async getSettings(): Promise<AppSettings> {
    const res = await fetch(`${API_BASE}/api/v1/settings`);
    return handleResponse(res);
  },

  async updateSettings(payload: Partial<AppSettings>): Promise<AppSettings> {
    const res = await fetch(`${API_BASE}/api/v1/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },
};
