import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveDbConfig } from '../src/dbConfig.js';

test('local defaults to the machine database on port 3306', () => {
  const { appEnv, config } = resolveDbConfig({
    DB_USER: 'root',
    DB_PASSWORD: '',
    DB_NAME: 'taskdb',
  });

  assert.equal(appEnv, 'local');
  assert.equal(config.host, '127.0.0.1');
  assert.equal(config.port, 3306);
  assert.equal(config.password, '');
  assert.equal(config.ssl, undefined);
});

test('local keeps an explicit host such as the Compose service name', () => {
  const { config } = resolveDbConfig({
    APP_ENV: 'local',
    DB_HOST: 'mysql',
    DB_PORT: '3306',
    DB_USER: 'taskuser',
    DB_PASSWORD: 'change-me-app',
    DB_NAME: 'taskdb',
  });

  assert.equal(config.host, 'mysql');
  assert.equal(config.user, 'taskuser');
});

test('live settings come from the LIVE_ variables in the same env file', () => {
  const { appEnv, config } = resolveDbConfig({
    APP_ENV: 'live',
    LOCAL_DB_HOST: '127.0.0.1',
    LOCAL_DB_USER: 'root',
    LOCAL_DB_PASSWORD: '',
    LOCAL_DB_NAME: 'taskdb',
    LIVE_DB_HOST: 'db.example.com',
    LIVE_DB_PORT: '3306',
    LIVE_DB_USER: 'taskuser',
    LIVE_DB_PASSWORD: 'secret',
    LIVE_DB_NAME: 'taskdb',
    LIVE_DB_SSL: 'true',
  });

  assert.equal(appEnv, 'live');
  assert.equal(config.host, 'db.example.com');
  assert.equal(config.user, 'taskuser');
  assert.equal(config.connectionLimit, 20);
  assert.equal(config.ssl.rejectUnauthorized, true);
});

test('local settings come from the LOCAL_ variables in the same env file', () => {
  const { appEnv, config } = resolveDbConfig({
    APP_ENV: 'local',
    LOCAL_DB_HOST: '127.0.0.1',
    LOCAL_DB_PORT: '3306',
    LOCAL_DB_USER: 'root',
    LOCAL_DB_PASSWORD: '',
    LOCAL_DB_NAME: 'taskdb',
    LIVE_DB_HOST: 'db.example.com',
    LIVE_DB_USER: 'taskuser',
    LIVE_DB_PASSWORD: 'secret',
    LIVE_DB_NAME: 'taskdb',
  });

  assert.equal(appEnv, 'local');
  assert.equal(config.host, '127.0.0.1');
  assert.equal(config.user, 'root');
  assert.equal(config.password, '');
});

test('live requires a host and password', () => {
  assert.throws(
    () => resolveDbConfig({
      APP_ENV: 'live',
      LIVE_DB_USER: 'taskuser',
      LIVE_DB_NAME: 'taskdb',
    }),
    /LIVE_DB_HOST/
  );
});
