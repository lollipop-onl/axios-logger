import axios, { AxiosResponse, AxiosError } from 'axios';
import * as queryString from 'querystring';

class AxiosLogger {
  /** Axios request base URL */
  public baseURL!: string;

  /** Running platform */
  public isServer!: boolean;

  /** Is displayed the request payload when node.js */
  public showRequest!: boolean

  /** Is displayed the response data when node.js */
  public showResponse!: boolean;

  /** Is NOT display logs */
  public quiet!: boolean;

  /**
   * @constructor
   * @param args.baseURL Main request base URL
   */
  constructor (args?: {
    baseURL?: string;
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

    this.baseURL = baseURL.replace(/\/$/, '');
    this.isServer = isServer;
    this.showRequest = request;
    this.showResponse = response;
    this.quiet = quiet;

    this.log = this.log.bind(this);
  }

  public get response (): [AxiosLogger['log'], AxiosLogger['log']] {
    return [this.log, this.log];
  }

  public log (response: AxiosResponse | AxiosError): void {
    if (this.quiet || 'config' in response) {
      return;
    }

    // When the request is canceled
    if (axios.isCancel(response)) {
      this.printCancelLog((response as any).message);

      return;
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

      return;
    }

    // When receive error response
    const status = response.response ? response.response.status : response.code;

    this.printResponseLog(method, url, status, request, response.response);
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
    const path = url.replace(/^([^?]*).*/, '$1').replace(this.baseURL, '');
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
}

export = AxiosLogger;
