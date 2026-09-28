const LIVE_ENVS = new Set(['live', 'production']);

function pick(env, key, prefix) {
  if (Object.prototype.hasOwnProperty.call(env, key) && env[key] != null && String(env[key]) !== '') {
    return env[key];
  }

  const prefixedKey = `${prefix}_${key}`;
  if (Object.prototype.hasOwnProperty.call(env, prefixedKey) && env[prefixedKey] != null) {
    return env[prefixedKey];
  }

  return undefined;
}

export function resolveDbConfig(env = process.env) {
  const requested = String(env.APP_ENV || 'local').trim().toLowerCase();
  const isLive = LIVE_ENVS.has(requested);
  if (requested !== 'local' && !isLive) {
    throw new Error('APP_ENV must be local or live.');
  }

  const appEnv = isLive ? 'live' : 'local';
  const prefix = isLive ? 'LIVE' : 'LOCAL';
  const host = pick(env, 'DB_HOST', prefix) || (isLive ? '' : '127.0.0.1');
  const port = Number(pick(env, 'DB_PORT', prefix) || 3306);
  const user = pick(env, 'DB_USER', prefix);
  const password = pick(env, 'DB_PASSWORD', prefix) ?? '';
  const database = pick(env, 'DB_NAME', prefix);
  const sslFlag = pick(env, 'DB_SSL', prefix);

  const missing = [];
  if (!String(host).trim()) missing.push(`${prefix}_DB_HOST`);
  if (user == null || String(user).trim() === '') missing.push(`${prefix}_DB_USER`);
  if (database == null || String(database).trim() === '') missing.push(`${prefix}_DB_NAME`);
  if (isLive && String(password).trim() === '') missing.push(`${prefix}_DB_PASSWORD`);

  if (missing.length > 0) {
    throw new Error(`Missing ${appEnv} database settings in .env: ${missing.join(', ')}`);
  }

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('DB_PORT must be a positive number.');
  }

  const config = {
    host,
    port,
    user,
    password: String(password),
    database,
    waitForConnections: true,
    connectionLimit: isLive ? 20 : 10,
    charset: 'utf8mb4',
    timezone: 'Z',
  };

  if (isLive && String(sslFlag || '').toLowerCase() === 'true') {
    config.ssl = { rejectUnauthorized: true };
  }

  return { appEnv, config };
}
