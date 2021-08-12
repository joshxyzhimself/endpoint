
export interface AssertionErrorJSON {
  name: string;
  code: string;
  message: string;
  stack: string;
}

export class AssertionError extends Error {
  name: string;
  code: string;
  message: string;
  stack: string;
  constructor(code: string, message: string);
  toJSON() : AssertionErrorJSON;
}

export = AssertionError;