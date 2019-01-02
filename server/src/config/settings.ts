/**
 * Application settings model
 */
export default interface AppSettings {
  mode: string,
  web: {
    host: string,
    port: number,
  },
  redis: {
    host: string,
    port: number,
  },
  postgres: {
    host: string,
    port: number,
    username: string,
    password: string,
    database: string,
  },
  socketIO: {
    redisKey: string,
  },
}
