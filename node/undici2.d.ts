
import * as http from 'http';
import * as undici from 'undici';


export interface request_urlencoded_interface {
  [key: string]: string,
}


export interface request_json_interface {
  [key: string]: any,
}


export interface request_form_item {
  name: string,
  value: object|string|Buffer,
  filename?: string,
}


export interface request_options {
  method: string,
  url: string,
  headers?: http.IncomingHttpHeaders,
  urlencoded?: request_urlencoded_interface,
  json?: request_json_interface,
  multipart?: request_form_item[],
  buffer?: string|Buffer,
}


export interface response_body {
  json: object,
  text_plain: string,
  text_tsv: string,
  buffer: Buffer,
}


export type get_response_body = (
  response: undici.Dispatcher.ResponseData,
) => Promise<response_body>;


export interface response {
  status: number,
  headers: object,
  body: response_body,
}


export type request = (request_options: request_options) => Promise<response>;


export interface undici2 {
  request: request,
}


const undici2: undici2;


export = undici2;