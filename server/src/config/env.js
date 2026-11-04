import 'dotenv/config';

const parsedPort = Number.parseInt(process.env.PORT ?? '5000', 10);
const parsedMysqlPort = Number.parseInt(process.env.MYSQL_PORT ?? '3306', 10);
const parsedPoolLimit = Number.parseInt(process.env.MYSQL_CONNECTION_LIMIT ?? '10', 10);

if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
  throw new Error('PORT must be a valid TCP port between 1 and 65535.');
}

const databaseValues = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD ?? '',
  database: process.env.MYSQL_DATABASE
};
const requiredDatabaseValues = {
  host: databaseValues.host,
  user: databaseValues.user,
  database: databaseValues.database
};

const databaseConfigured = Object.values(requiredDatabaseValues).every(
  (value) => typeof value === 'string' && value.length > 0
);
const anyRequiredDatabaseValueProvided = Object.values(requiredDatabaseValues).some(
  (value) => typeof value === 'string' && value.length > 0
);

if (anyRequiredDatabaseValueProvided && !databaseConfigured) {
  throw new Error('Configure MYSQL_HOST, MYSQL_USER and MYSQL_DATABASE together.');
}
if (!Number.isInteger(parsedMysqlPort) || parsedMysqlPort < 1 || parsedMysqlPort > 65535) {
  throw new Error('MYSQL_PORT must be a valid TCP port.');
}
if (!Number.isInteger(parsedPoolLimit) || parsedPoolLimit < 1 || parsedPoolLimit > 50) {
  throw new Error('MYSQL_CONNECTION_LIMIT must be between 1 and 50.');
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parsedPort,
  clientOrigins: (process.env.CLIENT_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  databaseConfigured,
  database: databaseConfigured
    ? {
        ...databaseValues,
        port: parsedMysqlPort,
        waitForConnections: true,
        connectionLimit: parsedPoolLimit,
        queueLimit: 0,
        enableKeepAlive: true
      }
    : null
};
