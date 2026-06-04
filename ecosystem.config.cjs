const path = require('path');

module.exports = {
  apps: [
    {
      name: 'admin-check-frontend',
      script: 'scripts/production-server.mjs',
      cwd: path.join(__dirname),
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      time: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3007,
        HOST: '0.0.0.0',
        API_PROXY_TARGET: 'http://127.0.0.1:5001',
      },
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      merge_logs: true,
    },
  ],
};
