import * as uws from 'uWebSockets.js';

export interface cache_control_types {
  no_store: string
  no_cache: string
  private_cached: string
  public_cached: string
}

export interface response {
  aborted?: boolean
  ended?: boolean
  error?: Error

  status?: number
  headers?: object

  file_path?: string
  file_name?: string
  file_content_type?: string
  file_dispose?: boolean
  file_cache?: boolean
  file_cache_max_age_ms?: number

  text?: string
  html?: string
  json?: object
  buffer?: Buffer
  buffer_hash?: string

  compress?: boolean
  compressed?: boolean
  brotli_buffer?: Buffer
  brotli_buffer_hash?: string
  gzip_buffer?: Buffer
  gzip_buffer_hash?: string

  timestamp?: number
  start?: number
  end?: number
  took?: number
}

export interface headers {
  host: string
  accept: string
  accept_encoding: string
  content_type: string
  if_none_match: string
  user_agent: string
}

export interface request {
  url: string
  query: string
  method: string
  headers: headers
  json: object
}

export type handler = (response: response, request: request) => void;
export type internal_handler_2 = (res: uws.HttpResponse, handler: handler, response: response, request: request) => void;
export type internal_handler = (res: uws.HttpResponse, req: uws.HttpRequest) => void;
export type serve_handler = (handler: handler) => internal_handler;
export type serve_static = (app: uws.TemplatedApp, route_path: string, local_path: string, response_override: response) => void;

export const cache_control_types: cache_control_types;
export const serve_handler: serve_handler;
export const serve_static: serve_static;

export * as uws from 'uWebSockets.js';