export interface types {
  DEFAULT: string;
  DEBUG: string;
  INFO: string;
  NOTICE: string;
  WARNING: string;
  ERROR: string;
  CRITICAL: string;
  ALERT: string;
  EMERGENCY: string;
}
export const types: types;


export interface codes {
  DEFAULT: number;
  DEBUG: number;
  INFO: number;
  NOTICE: number;
  WARNING: number;
  ERROR: number;
  CRITICAL: number;
  ALERT: number;
  EMERGENCY: number;
}
export const codes: codes;


export interface error {
  name?: string;
  code?: string;
  message?: string;
  stack?: string;
}
export type extract_error = (error: Error & error) => error;
export const extract_error: extract_error;