import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";

const processes = ["index.js", "worker.js"].map((entry) =>
  spawn(process.execPath, [path.join(__dirname, entry)], { stdio: "inherit" }),
);

let shuttingDown = false;

function stop(signal: NodeJS.Signals): void {
  if (shuttingDown) return;
  shuttingDown = true;

  const timeout = setTimeout(() => {
    for (const child of processes) child.kill("SIGKILL");
    process.exit(1);
  }, 12_000);

  for (const child of processes) {
    if (child.exitCode === null && child.signalCode === null) child.kill(signal);
  }

  void Promise.all(
    processes.map(
      (child) =>
        new Promise<void>((resolve) => {
          if (child.exitCode !== null || child.signalCode !== null) return resolve();
          child.once("exit", () => resolve());
        }),
    ),
  ).then(() => {
    clearTimeout(timeout);
    process.exit(0);
  });
}

for (const child of processes) {
  child.once("error", (error) => {
    console.error("Failed to start API or worker process", error);
    stop("SIGTERM");
  });
  child.once("exit", (code) => {
    if (!shuttingDown) {
      process.exitCode = code ?? 1;
      stop("SIGTERM");
    }
  });
}

process.on("SIGTERM", () => stop("SIGTERM"));
process.on("SIGINT", () => stop("SIGINT"));
