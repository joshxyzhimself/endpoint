
export interface AssertionErrorJSON {
  name: string,
  code: string,
  message: string,
  stack: string,
}

export class AssertionError {
  constructor(code: string, message: string) : void;
  toJSON() : AssertionErrorJSON;
}

export = AssertionError;