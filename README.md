# @lollipop-onl/axios-logger

## Installation

```sh
$ npm i -D @lollipop-onl/axios-logger
```

## Usage

```ts
import axios from "axios";
import AxiosLogger from "@lollipop-onl/axios-logger";

const logger = new AxiosLogger({
  mode: "nuxt"
});

logger.mode = "nuxt"; // vanilla or nuxt (Default: vanilla)

axios.interceptors.response.use(...Logger.response);
```
