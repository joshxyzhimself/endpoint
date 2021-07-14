
import * as http from 'http';
import * as undici from 'undici';


export type get_response_body = (
  response: undici.Dispatcher.ResponseData,
) => Promise<Buffer|object>;


export interface json_response {
  status: number,
  headers: object,
  body: Buffer|object,
}


export type json_post = (
  request_url: string,
  request_headers: http.IncomingHttpHeaders,
  request_body: object,
) => json_response


export type json_get = (
  request_url: string,
  request_headers: http.IncomingHttpHeaders,
) => json_response


export interface form_item {
  name: string,
  value: string|Buffer|object,
  filename?: string,
}


export type form_post = (
  request_url: string,
  request_headers: http.IncomingHttpHeaders,
  form_items: form_item[],
) => json_response


export interface undici2 {
  json_post,
  json_get,
}


const undici2: undici2;


export = undici2;