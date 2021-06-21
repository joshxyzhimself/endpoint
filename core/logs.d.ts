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

export interface application {
  id: string|number,
  version: string|number,
}
export interface resource {
  id: string|number,
}
export interface operation {
  id: string|number,
}
export interface session {
  id: string|number,
}
export interface trace {
  session?: session,
  start?: number,
  end?: number,
}
export interface input {

}
export interface output {

}
export interface error {
  name: string,
  message: string,
  stack: string,
}
export interface severity {
  type: string,
  code: number,
}
export interface timestamp {
  mts: number,
  rfc?: string,
  iso?: string,
}
export interface entry {
  application?: application,
  resource: resource,
  operation: operation,
  trace?: trace,
  input?: input,
  output?: output,
  error?: error,
  severity: severity,
  timestamp: timestamp,
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