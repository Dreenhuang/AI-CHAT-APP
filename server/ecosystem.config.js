{
  "apps": [
    {
      "name": "aichat-api",
      "script": "index.js",
      "cwd": "/www/wwwroot/aichat/server",
      "instances": 1,
      "exec_mode": "fork",
      "env": {
        "NODE_ENV": "production",
        "PORT": "9461"
      },
      "log_date_format": "YYYY-MM-DD HH:mm:ss",
      "error_file": "/var/log/aichat/error.log",
      "out_file": "/var/log/aichat/out.log",
      "max_memory_restart": "500M",
      "autorestart": true,
      "watch": false,
      "restart_delay": 3000,
      "max_restarts": 10
    }
  ]
}
