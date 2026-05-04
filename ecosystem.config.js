module.exports = {
  apps: [
    {
      name: 'trades-api',
      script: './server/server.js',
      cwd: '/var/www/trades',
      env: {
        NODE_ENV: 'production',
        PORT: 5001,
      },
      restart_delay: 3000,
      max_restarts: 10,
      watch: false,
    },
  ],
};
