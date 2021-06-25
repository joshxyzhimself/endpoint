import * as uws from 'uWebSockets.js';

export interface cache_control_types {
  no_store: string,
  no_cache: string,
  private_cached: string,
  public_cached: string,
}

export interface port_access_types {
  SHARED: number,
  EXCLUSIVE: number,
}

export interface response {
  aborted?: boolean,
  ended?: boolean,
  error?: Error,

  status?: number,
  headers?: object,

  file_path?: string,
  file_name?: string,
  file_content_type?: string,
  file_dispose?: boolean,
  file_cache?: boolean,
  file_cache_max_age_ms?: number,

  text?: string,
  html?: string,
  json?: object,
  buffer?: Buffer,
  buffer_hash?: string,

  compress?: boolean,
  compressed?: boolean,
  brotli_buffer?: Buffer,
  brotli_buffer_hash?: string,
  gzip_buffer?: Buffer,
  gzip_buffer_hash?: string,

  timestamp?: number,
  start?: number,
  end?: number,
  took?: number,
}

export interface headers {
  host: string,
  accept: string,
  accept_encoding: string,
  content_type: string,
  if_none_match: string,
  user_agent: string,
}

export interface request {
  url: string,
  query: string,
  method: string,
  headers: headers,
  json: object,
}

export const cache_control_types: cache_control_types;
export const port_access_types: port_access_types;

export type handler = (response: response, request: request) => void;
export type internal_handler_2 = (res: uws.HttpResponse, handler: handler, response: response, request: request) => void;
export type internal_handler = (res: uws.HttpResponse, req: uws.HttpRequest) => void;
export type serve_handler = (handler: handler) => internal_handler;
export const serve_handler: serve_handler;

export type serve_static = (app: uws.TemplatedApp, route_path: string, local_path: string, response_override: response) => void;
export const serve_static: serve_static;

export type serve_redirect = (app: uws.TemplatedApp) => void;
export const serve_redirect: serve_redirect;

export type serve_http = (app: uws.TemplatedApp, port_access_type: number, port: number) => Promise<uws.us_listen_socket>;
export const serve_http: serve_http;

export type serve_https = (app: uws.TemplatedApp, port_access_type: number, port: number) => Promise<uws.us_listen_socket>;
export const serve_https: serve_https;

export * as uws from 'uWebSockets.js';