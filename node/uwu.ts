
export type response = {
  aborted: boolean
  ended: boolean
  error: Error
  cache_files: boolean
  cache_files_max_age_ms: number
  compress: boolean
  dispose: boolean
  status: number
  headers: string
  file_path: string
  file_name: string
  file_content_type: string
  text: string
  html: string
  json: object
  buffer: Buffer
  buffer_hash: string
  brotli_buffer: Buffer
  brotli_buffer_hash: string
  gzip_buffer: Buffer
  gzip_buffer_hash: string
  timestamp: number
  start: number
  end: number
}

export type headers = {
  accept: string
  accept_encoding: string
  content_type: string
  if_none_match: string
  user_agent: string
}

export type request = {
  url: string
  query: string
  headers: headers
  json: object
}

export type handler = (response: response, request: request) => void;

export type internal_handler_2 = (res: object, handler: handler, response: response, request: request) => void;

export type internal_handler = (res: object, req: object) => void;

export type serve_handler = (handler: handler) => internal_handler;

export type serve_static_options = {
  cache_files: boolean
}

export type serve_static = (app: object, route_path: string, local_path: string, response_override: response) => void;

export type cache_control_types = {
  no_store: string
  no_cache: string
  private_cached: string
  public_cached: string
}

export type uwu = {
  cache_control_types: cache_control_types
  serve_handler: serve_handler
  serve_static: serve_static
}