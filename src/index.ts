import axios, { AxiosResponse, AxiosError } from 'axios';
import { parse } from 'path';
import * as queryString from 'querystring';

class AxiosLogger {
  /** Axios request base URL */
  public baseURL!: string | string[] | RegExp;

  /** Running platform */
  public isServer!: boolean;

  /** Is displayed the request payload when node.js */
  public showRequest!: boolean;

  /** Is displayed the response data when node.js */
  public showResponse!: boolean;

  /** Is NOT display logs */
  public quiet!: boolean;

  /**
   * @constructor
   * @param args.baseURL Main request base URL
   */
  constructor (args?: {
    baseURL?: string | string[] | RegExp;
    isServer?: boolean;
    request?: boolean;
    response?: boolean;
    quiet?: boolean;
  }) {
    if (!args) {
      return;
    }

    const {
      baseURL = '',
      isServer = typeof window === 'undefined' || typeof document === 'undefined',
      request = false,
      response = false,
      quiet = false
    } = args;

    this.baseURL = baseURL;
    this.isServer = isServer;
    this.showRequest = request;
    this.showResponse = response;
    this.quiet = quiet;

    this.log = this.log.bind(this);
  }

  public get response (): [AxiosLogger['log'], AxiosLogger['log']] {
    return [this.log, this.log];
  }

  public log (response: AxiosResponse | AxiosError): AxiosResponse | Promise<AxiosError> {
    if (this.quiet) {
      return this.wrapRejectIfNeeded(response as any);
    }

    // When the request is canceled
    if (axios.isCancel(response)) {
      this.printCancelLog((response as any).message);

      return this.wrapRejectIfNeeded(response as any);
    }

    if (!('config' in response)) {
      return this.wrapRejectIfNeeded(response as any);
    }

    const { config } = response;
    const {
      method, url, params, data
    } = config;
    const query = `${url}`.split('?')[1];
    const search = query && queryString.parse(query);

    // When receive normal response
    if ('status' in response) {
      const { data: responseData, status } = response;

      this.printResponseLog(method, url, status, { search, params, data }, responseData);

      return this.wrapRejectIfNeeded(response);
    }

    // When receive error response
    const status = response.response ? response.response.status : response.code;

    this.printResponseLog(method, url, status, { search, params, data }, response.response);

    return this.wrapRejectIfNeeded(response);
  }

  /**
   * Print a log of response
   * @param [method] Request method
   * @param [url] Request url
   * @param [status] HTTP status
   * @param [request] Request data
   * @param [response] Response data
   */
  private printResponseLog (
    method = 'unknown',
    url = 'unknown',
    status: string | number = 'unknown',
    requests?: {
      search?: any;
      params?: any;
      data?: any;
    },
    response?: any
  ): void {
    // Ignore queries
    const path = this.optimizePath(url);
    const isSuccess = status < 400;
    const parseRequest = (request: any): any | undefined => {
      // Clone the request if it is object
      if (typeof request === 'object') {
        try {
          return JSON.parse(JSON.stringify(request));
        } catch {
          // Do nothing
        }
      }

      try {
        return JSON.parse(request);
      } catch {
        return request;
      }
    }
    const search = parseRequest(requests?.search);
    const params = parseRequest(requests?.params);
    const data = parseRequest(requests?.data);

    // Clone the request if it is object
    if (typeof response === 'object') {
      try {
        response = JSON.parse(JSON.stringify(response));
      } catch (e) {
        // Do nothing
      }
    }

    if (this.isServer) {
      const style = isSuccess
        ? '\x1b[42m \x1b[0m \x1b[32m%s\x1b[0m'
        : '\x1b[41m \x1b[0m \x1b[31m%s\x1b[0m';
      const titleStyle = isSuccess
        ? '\x1b[42m \x1b[0m %s'
        : '\x1b[41m \x1b[0m %s';

      console.log(style, `${method}: ${url} - ${status}`);

      if (this.showRequest) {
        if (search != null) {
          console.log(titleStyle, 'search');
          console.log(search);
        }

        if (params != null) {
          console.log(titleStyle, 'params');
          console.log(params);
        }

        if (data != null) {
          console.log(titleStyle, 'body');
          console.log(data);
        }
      }

      if (this.showResponse) {
        console.log(titleStyle, 'response');

        if (isSuccess) {
          console.log(response);
        } else {
          console.log(response);
        }
      }

      return;
    }

    const style = isSuccess
      ? 'background: #eee; border-left: 10px solid #2CA58D; color: #2D4E19; padding: 2px 10px'
      : 'background: #eee; border-left: 10px solid #A53860; color: #69140E; padding: 2px 10px';

    console.groupCollapsed(`%c${method}: ${path} - ${status}`, style);

    if (search != null) {
      console.log('search :', search);
    }

    if (params != null) {
      console.log('params :', params);
    }

    if (data != null) {
      console.log(' data  :', data);
    }

    console.log('%cresponse\n', 'padding-bottom: 0.5em; font-weight: bold', response);
    console.groupEnd();
  }

  /**
   * Print request canceled log
   */
  private printCancelLog (message = '(no message)'): void {
    if (this.isServer) {
      console.log('\x1b[43m \x1b[0m \x1b[33m%s\x1b[0m', `Canceled - ${message}`);
    } else {
      console.log(
        `%ccanceled - ${message}`,
        'background: #eee; border-left: 10px solid #FFA552; color: #8C5A2D; padding: 2px 10px; font-weight: bold'
      );
    }
  }

  /**
   * It wrap in Promise.reject if the response when AxiosError
   */
  private wrapRejectIfNeeded(response: AxiosResponse): AxiosResponse;
  private wrapRejectIfNeeded(response: AxiosError): Promise<AxiosError>;
  private wrapRejectIfNeeded(response: AxiosResponse | AxiosError) {
    const isAxiosError = 'isAxiosError' in response && response.isAxiosError;

    return isAxiosError ? Promise.reject<AxiosError>(response) : response;
  }

  /**
   * Optimize displaying path
   */
  private optimizePath(url: string): string {
    const path = url.replace(/^([^?]*).*/, '$1');

    if (!this.baseURL) {
      return path;
    }

    if (!Array.isArray(this.baseURL)) {
      return path.replace(this.baseURL, '');
    }

    for (let i = 0; i < path.length; i++) {
      const basePath = this.baseURL[i];

      if (!path.startsWith(basePath)) {
        continue;
      }

      return path.replace(basePath, '');
    }

    return path;
  }
}

export = AxiosLogger;
