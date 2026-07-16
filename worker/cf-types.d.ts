// Cloudflare Workers global type declarations

// Web APIs available in Workers
declare function fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;

interface URL {
  hash: string; host: string; hostname: string; href: string;
  readonly origin: string; password: string; pathname: string;
  port: string; protocol: string; search: string; searchParams: URLSearchParams;
  username: string;
  toJSON(): string;
  toString(): string;
}

declare var URL: {
  prototype: URL;
  new(url: string | URL, base?: string | URL): URL;
};

interface URLSearchParams {
  append(name: string, value: string): void;
  delete(name: string): void;
  get(name: string): string | null;
  getAll(name: string): string[];
  has(name: string): boolean;
  set(name: string, value: string): void;
  sort(): void;
  toString(): string;
}

interface Request extends Body {
  readonly url: string;
  readonly method: string;
  readonly headers: Headers;
  json(): Promise<any>;
  text(): Promise<string>;
  clone(): Request;
}

declare var Request: {
  prototype: Request;
  new(input: RequestInfo, init?: RequestInit): Request;
};

interface Response extends Body {
  readonly headers: Headers;
  readonly ok: boolean;
  readonly status: number;
  readonly url: string;
  json(): Promise<any>;
  text(): Promise<string>;
  clone(): Response;
}

declare var Response: {
  prototype: Response;
  new(body?: BodyInit | null, init?: ResponseInit): Response;
  json(data: any, init?: ResponseInit): Response;
};

declare var console: {
  log(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
};

type RequestInfo = Request | string;
type BodyInit = string | any;
type RequestInit = { method?: string; headers?: Record<string, string>; body?: BodyInit };
type ResponseInit = { status?: number; headers?: Record<string, string> };

interface Body { readonly body: any | null; }
interface Headers { get(name: string): string | null; set(name: string, value: string): void; }

interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
  exec(query: string): Promise<D1Result>;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
  raw<T = unknown>(): Promise<T[]>;
}

interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  meta?: any;
  error?: string;
}

interface ScheduledEvent {
  cron: string;
  scheduledTime: number;
}
