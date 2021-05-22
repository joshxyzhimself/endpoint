
declare class AssertionError {
  constructor(message?: string);
  toJSON () : string;
  static assert(value: boolean, message?: string) : void;
}

export = AssertionError;