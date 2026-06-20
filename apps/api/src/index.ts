import express from "express";
import cors from "cors";

import notificationsRouter from "./routes/notifications";
import metricsRouter from "./routes/metrics";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_, res) => {
  res.json({
    status: "ok",
  });
});

app.use(
  "/notifications",
  notificationsRouter
);

app.use(
  "/metrics",
  metricsRouter
);

app.listen(3000, () => {
  console.log(
    "API running on port 3000"
  );
});