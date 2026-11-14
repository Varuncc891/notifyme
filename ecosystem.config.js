module.exports = {
  apps: [
    { name: "api", script: "apps/api/dist/index.js", cwd: ".", exec_mode: "fork", instances: 1, kill_timeout: 15000 },
    { name: "worker", script: "apps/api/dist/worker.js", cwd: ".", exec_mode: "fork", instances: 1, kill_timeout: 15000 },
  ],
};
