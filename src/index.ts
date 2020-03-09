import axios, { AxiosResponse, AxiosError } from 'axios';
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
    const request = params || data || {};

    // When receive normal response
    if ('status' in response) {
      const { data: responseData, status } = response;
      const query = `${url}`.split('?')[1];
      const requestData = query ? queryString.parse(query) : request;

      this.printResponseLog(method, url, status, requestData, responseData);

      return this.wrapRejectIfNeeded(response);
    }

    // When receive error response
    const status = response.response ? response.response.status : response.code;

    this.printResponseLog(method, url, status, request, response.response);

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
    request?: any,
    response?: any
  ): void {
    // Ignore queries
    const path = this.optimizePath(url);
    const isSuccess = status < 400;

    // Clone the request if it is object
    if (typeof request === 'object') {
      try {
        request = JSON.parse(JSON.stringify(request));
      } catch (e) {
        // Do nothing
      }
    }

    // Parse the request if it isn't object
    if (typeof request !== 'object') {
      try {
        request = JSON.parse(request);
      } catch (e) {
        // Do nothing
      }
    }

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
        console.log(titleStyle, 'Request Payload');
        console.log(request);
      }

      if (this.showResponse) {
        console.log(titleStyle, 'Response Data');

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
    console.log('Request  ➡️', request);
    console.log('Response ⬅️', response);
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
