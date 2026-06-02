// Backend base URL. Configurable via VITE_API_URL or VITE_API_PORT env vars.
// In production Tauri builds, the webview talks to the sidecar on localhost.
// For LAN clients, auto-detect the server host from the browser's URL so
// API calls go back to the same machine that served the page.
const viteEnv = import.meta.env ?? {};
const _port = viteEnv.VITE_API_PORT || '3900';
const _host = (typeof window !== 'undefined' && window.location.hostname) || '127.0.0.1';
export const API = viteEnv.VITE_API_URL || `http://${_host}:${_port}`;

function getClientId(): string {
  if (typeof window === 'undefined') return 'unknown';
  let clientId = localStorage.getItem('omnivoice.clientId');
  if (!clientId) {
    clientId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('omnivoice.clientId', clientId);
  }
  return clientId;
}

export class ApiError extends Error {
  status?: number;
  detail?: unknown;
  constructor(message: string, init: { status?: number; detail?: unknown } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = init.status;
    this.detail = init.detail;
  }
}

export function apiUrl(path?: string): string {
  if (!path) return API;
  return path.startsWith('http') ? path : `${API}${path.startsWith('/') ? '' : '/'}${path}`;
}

async function readError(res: Response): Promise<string> {
  const text = await res.text().catch(() => '');
  try {
    const j = JSON.parse(text);
    return j.detail || j.error || text || res.statusText;
  } catch {
    return text || res.statusText;
  }
}

export async function apiFetch(path: string, opts: RequestInit = {}): Promise<Response> {
  const headers = new Headers(opts.headers || {});
  headers.set('X-Client-Id', getClientId());
  
  const res = await fetch(apiUrl(path), { ...opts, headers });
  if (!res.ok) {
    const detail = await readError(res);
    throw new ApiError(`${res.status} ${res.statusText}: ${detail}`, { status: res.status, detail });
  }
  return res;
}

export async function apiJson<T = unknown>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, opts);
  return res.json() as Promise<T>;
}

export async function apiPost<T = unknown>(
  path: string,
  body?: unknown,
  opts: RequestInit = {},
): Promise<T> {
  const init: RequestInit = { method: 'POST', ...opts };
  if (body instanceof FormData) {
    init.body = body;
  } else if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json', ...(opts.headers as Record<string, string> || {}) };
    init.body = JSON.stringify(body);
  }
  return apiJson<T>(path, init);
}

export async function apiDelete(path: string, opts: RequestInit = {}): Promise<Response> {
  return apiFetch(path, { method: 'DELETE', ...opts });
}
