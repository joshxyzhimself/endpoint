
import * as ElasticSearch from '@elastic/elasticsearch';


export interface document_operation {
  _index: string,
  _id: string,
  [key: string]: unknown,
}


export interface document {
  _index: string,
  _id?: string,
  [key: string]: any,
}


export type create_index = (index: string, body?: object) => void;


export type delete_index = (index: string) => void;


export type refresh_indices = (...indices: string[]) => void;


export interface search_response {
  hits: document[],
  count: number,
  took: number,
}


export type search_by_body = (
  body: object,
  limit: number,
  offset: number,
  ...indices: string[],
) => search_response;


export type search_by_text = (
  query: string,
  limit: number,
  offset: number,
  ...indices: string[],
) => search_response;


export type get_document = (
  index: string,
  id: string,
) => document;


export interface bulk_operation {
  index: (document: document) => document,
  create: (document: document) => document,
  update: (document: document) => document,
  ignore_error_types: (...error_types: string[]) => void,
  commit: () => Promise<void>,
}


export type create_bulk_operation = () => bulk_operation;


export interface es_client {
  client: ElasticSearch.Client,
  create_index: create_index,
  delete_index: delete_index,
  refresh_indices: refresh_indices,
  search_by_body: search_by_body,
  search_by_text: search_by_text,
  get_document: get_document,
  create_bulk_operation: create_bulk_operation,
}


export type create_es_client = (
  elasticsearch_host: string,
  elasticsearch_port: number,
  elasticsearch_password: string,
  elasticsearch_username: string,
) => es_client;


export interface elasticsearch {
  create_es_client: create_es_client,
}


const default_export: elasticsearch;

export = default_export;