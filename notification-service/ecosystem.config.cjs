module.exports = {
  apps: [
    {
      name: 'notification-service',
      script: './dist/app.js',
      instances: 1,
      autorestart: true,
      max_memory_restart: '300M',
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
