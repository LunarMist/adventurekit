/**
 * Application settings model
 */
export default interface AppSettings {
  mode: 'development' | 'production',
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
  session: {
    cookie: {
      maxAge: string, // ISO 8601 duration
      secure: boolean,
    },
    name: string,
    secret: string,
    redisDB: number,
    redisPrefix: string,
  },
}
