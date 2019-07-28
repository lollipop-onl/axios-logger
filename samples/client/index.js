/* eslint-disable import/no-relative-parent-imports */
import axios from 'axios';
import AxiosLogger from '../..';

const BASE_URL = 'https://jsonplaceholder.typicode.com';
const logger = new AxiosLogger({
  baseURL: BASE_URL
});
const request = axios.create({
  baseURL: BASE_URL,
  responseType: 'json'
});
const noop = () => {};
const cancelSource = axios.CancelToken.source();

request.interceptors.response.use(...logger.response);

console.log('Sample app is ready.');

request
  .get('todos/1', {
    params: {
      foo: 'hello'
    }
  })
  .catch(noop);
request.get('todos/invalid_link').catch(noop);
// eslint-disable-next-line
request.get('todos/2', {
  cancelToken: cancelSource.token
});

cancelSource.cancel();
