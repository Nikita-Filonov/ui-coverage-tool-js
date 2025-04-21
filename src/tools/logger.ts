export const getLogger = (name: string) => ({
  info: (msg: string) => console.info(`[${name}] ${msg}`),
  debug: (msg: string) => console.debug(`[${name}] ${msg}`),
  error: (msg: string) => console.error(`[${name}] ${msg}`),
  warning: (msg: string) => console.warn(`[${name}] ${msg}`)
});