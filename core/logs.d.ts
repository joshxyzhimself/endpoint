export interface severity_types {
  DEFAULT: string,
  DEBUG: string,
  INFO: string,
  NOTICE: string,
  WARNING: string,
  ERROR: string,
  CRITICAL: string,
  ALERT: string,
  EMERGENCY: string,
}

export interface severity_codes {
  DEFAULT: number,
  DEBUG: number,
  INFO: number,
  NOTICE: number,
  WARNING: number,
  ERROR: number,
  CRITICAL: number,
  ALERT: number,
  EMERGENCY: number,
}

export interface data {
  [key:string]: unknown,
}

export interface error {
  name: string,
  message: string,
  stack: string,
  got_response_status_code?: unknown,
  got_response_status_message?: unknown,
  got_response_body?: unknown,
  [key:string]: unknown,
}

export interface severity {
  type: string,
  code: number,
  [key:string]: unknown,
}

export interface trace {
  /**
   * epoch milliseconds number.
   */
  mts: number,

  /**
  * RFC 2822-compatible string.
  */
  rfc?: string,
   
  /**
  * ISO 8601-compliant string.
  */
  iso?: string,

  [key:string]: unknown,
}

export interface entry {
  resource_id: string,
  operation_id: string,
  message?: string,
  data?: data,
  error?: error,
  severity: severity,
  trace: trace,
}

export type capture_error = (e: Error) => error;
export type emit = (entry: entry) => void;

export type listener = (entry: entry) => void;
export type on = (id: string|number, listener: listener) => void; 
export type off = (id: string|number, listener: listener) => void; 

export interface logs {
  severity_types: severity_types,
  severity_codes: severity_codes,
  capture_error: capture_error,
  emit: emit,
  on: on,
  off: off,
}
const logs: logs;
export = logs;