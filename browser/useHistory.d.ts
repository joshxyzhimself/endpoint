
export type push = (next_pathname: string) => void;
export type replace = (next_pathname: string) => void;

export interface history {
  previous_pathname: string;
  pathname: string;
  push: push;
  replace: replace;
}

export type useHistory = () => history;

export const default_export: useHistory;

export = default_export;