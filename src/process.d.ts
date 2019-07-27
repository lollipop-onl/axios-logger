declare namespace NodeJS {
  // eslint-disable-next-line @typescript-eslint/interface-name-prefix
  interface Process {
    client: boolean;
    server: boolean;
  }
}
