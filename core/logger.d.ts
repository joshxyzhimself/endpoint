
import { on, off } from './create_emitter';

export interface severity_types {
  DEFAULT: string
  DEBUG: string
  INFO: string
  NOTICE: string
  WARNING: string
  ERROR: string
  CRITICAL: string
  ALERT: string
  EMERGENCY: string
}

export type severity_codes = Map<string, number>;

interface error_types {
  ERR_INVALID_PARAMETER_TYPE: string
}

export type log = (id: string|number, severity_type: string, message: string, data?: object) => void;

export const severity_types: severity_types;
export const error_types: error_types;
export const log: log;

interface logger {
  log: log
  severity_types: severity_types
  severity_codes: severity_codes
  error_types: error_types
  on: on
  off: off
}

const logger: logger;

export = logger;