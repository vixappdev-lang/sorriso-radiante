module.exports = {
  apps: [
    {
      name: "levii-wa",
      script: "server.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 50,
      min_uptime: "30s",
      restart_delay: 4000,
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || 3000,
        LEVII_TOKEN: process.env.LEVII_TOKEN,
      },
      out_file: "./logs/out.log",
      error_file: "./logs/err.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      merge_logs: true,
    },
  ],
};
