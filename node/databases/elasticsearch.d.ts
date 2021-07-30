
export interface document_operation {
  _index: string,
  _id: string,
  [key: string]: unknown,
}

export interface document {
  _index: string,
  _id?: string,
  [key: string]: string|number|boolean,
}
