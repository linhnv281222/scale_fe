
const { contextBridge } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

const configPath = path.join(
  process.env.PROGRAMDATA ||
    path.join(os.homedir(), 'AppData', 'Local'),
  'ScaleHub',
  'config',
  'desktop-config.json'
);

function loadConfig() {
  const defaults = {
    apiBaseUrl: 'http://localhost:8080'
  };

  try {
    const content = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(content);

    if (
      typeof config.apiBaseUrl === 'string' &&
      /^https?:\/\/[^/]+(?:\/.*)?$/i.test(config.apiBaseUrl)
    ) {
      return {
        apiBaseUrl: config.apiBaseUrl.replace(/\/+$/, '')
      };
    }
  } catch (error) {
    console.warn('Using default API configuration:', error.message);
  }

  return defaults;
}

contextBridge.exposeInMainWorld('scaleHubConfig', {
  ...loadConfig()
});
