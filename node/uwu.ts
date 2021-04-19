

export type response = {
  aborted: boolean
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
