const axios = require('axios');
const AxiosLogger = require('../../');

const BASE_URL = 'https://jsonplaceholder.typicode.com';
const logger = new AxiosLogger({
  baseURL: BASE_URL
});
const request = axios.create({
  baseURL: BASE_URL,
  responseType: 'json'
});
const noop = () => {};
const { CancelToken } = axios;
const cancelSource = CancelToken.source();

request.interceptors.response.use(...logger.response);

request.get('/todos/1', {
  params: {
    foo: 'hello'
  }
}).catch(noop);
request.get('/todos/__1').catch(noop);
request.get('todos/2', {
  cancelToken: cancelSource.token
}).catch(noop);
cancelSource.cancel();
