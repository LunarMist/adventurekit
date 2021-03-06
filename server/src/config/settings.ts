/**
 * Secret application settings model
 */
export interface AppSettingsSecret {
  sendgrid: {
    apiKey: string;
  };
}

/**
 * Application settings model
 */
export interface AppSettings {
  mode: 'development' | 'production';
  web: {
    host: string;
    port: number;
  };
  redis: {
    host: string;
    port: number;
    password: string | undefined;
  };
  postgres: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
  socketIO: {
    redisKey: string;
  };
  session: {
    cookie: {
      secure: boolean;
    };
    name: string;
    secret: string;
    redisDB: number;
    redisPrefix: string;
    ttl: string; // ISO 8601 duration
  };
  registration: {
    urlBase: string;
    jwtSecret: string;
  };
  secret: AppSettingsSecret;
}
