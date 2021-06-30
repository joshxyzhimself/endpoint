
export interface error_json {
  name: string,
  code: string,
  message: string,
  stack: string,
}

export class AssertionError {
  constructor(code: string, message: string) : void;
  toJSON() : error_json;
  static assert: (value: boolean, code: string, message: string) => void;
}

export = AssertionError;