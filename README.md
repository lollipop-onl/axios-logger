# @lollipop-onl/axios-logger

`@lollipop-onl/axios-logger` is a cute logger for [Axios](https://github.com/axios/axios).

## Installation

```sh
$ yarn add -D @lollipop-onl/axios-logger
# or
$ npm i -D @lollipop-onl/axios-logger
```

## Usage

```ts
import axios from "axios";
import AxiosLogger from "@lollipop-onl/axios-logger";

const BASE_URL = "https://jsonplaceholder.typicode.com";

const request = axios.create({
  baseURL: BASE_URL,
  responseType: "json"
});
const logger = new AxiosLogger({
  baseURL: BASE_URL
});

request.interceptors.response.use(...Logger.response);
```

### Browser console

<p style="text-align: center">
  <img src="https://gitlab.com/lollipop.onl/axios-logger/raw/master/docs/browser-console.png" />
</p>

### Node.js console

<p style="text-align: center">
  <img src="https://gitlab.com/lollipop.onl/axios-logger/raw/master/docs/node-terminal.png" />
</p>

## Documentation

### `constructor`

```ts
const logger = new AxiosLogger({
  baseURL: 'https://jsonplaceholder.typicode.com';
  isServer: false;
  showRequest: true;
  showResponse: true;
  quiet: false;
});
```

### `baseURL` (`boolean`)

default: `''`

Here you specify the base URL of the main request. It is omitted from the displayed request URL (Only client).

### `isServer` (`boolean`)

default: Automatic discrimination between Node.js and browser

This parameter is affected for log style.

### `showRequest`/`showResponse` (`boolean`)

default: `false`

When those parameters are enabled, request/response logs will be displayed on Node.js.

### `quiet` (`boolean`)

default: `false`

When this parameter is enabled, all logs will not be displayed.

### Override configurations

You can change configuration directly.

```ts
const logger = new AxiosLogger();

logger.showResponse = true;
logger.quiet = true;
```

## for Nuxt

In Nuxt.js, `isServer` or `process.server` passes to `isServer` property.

```ts
// plugins/axios.ts
import AxiosLogger from "@lollipop-onl/axios-logger";

export default ({ $axios, isDev, isServer }) => {
  const logger = new AxiosLogger({
    isServer,
    quiet: !isDev
  });

  $axios.onResponse(response => {
    logger.log(response);
  });

  $axios.onResponseError(response => {
    logger.log(response);
  });
};
```

## Licence

MIT
