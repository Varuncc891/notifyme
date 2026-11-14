import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

interface Notification {
  id: string;
  url: string;
  status: string;
  httpStatus: number | null;
  retries: number;
  lastError: string | null;
  createdAt: string;
}

interface Metrics { queue: { waiting: number; active: number; delayed: number }; database: Record<"PENDING" | "PROCESSING" | "SUCCESS" | "FAILED", number> }
interface PageResult { data: Notification[]; page: number; limit: number; total: number; totalPages: number }

function getStatusColor(status: string) {
  switch (status) {
    case "SUCCESS":
      return "#22c55e";
    case "FAILED":
      return "#ef4444";
    case "PROCESSING":
      return "#eab308";
    default:
      return "#3b82f6";
  }
}

function App() {
  const [url, setUrl] = useState("");
  const [payload, setPayload] = useState('{ "message": "hello" }');

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [formError, setFormError] = useState("");

  const [metrics, setMetrics] = useState<Metrics>({
    queue: { waiting: 0, active: 0, delayed: 0 },
    database: { PENDING: 0, PROCESSING: 0, SUCCESS: 0, FAILED: 0 },
  });

  const fetchNotifications = async () => {
    try {
      const response = await axios.get<PageResult>(`${API_URL}/notifications`, { params: { page, limit: 20, ...(statusFilter ? { status: statusFilter } : {}) } });
      setNotifications(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/metrics`
      );

      setMetrics(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const createNotification = async () => {
    try {
      await axios.post(
        `${API_URL}/notifications`,
        {
          type: "webhook",
          url,
          payload: JSON.parse(payload),
        }
      );

      setUrl("");
      setFormError("");

      fetchNotifications();
      fetchMetrics();

    } catch (error) {
      console.error(error);
      if (axios.isAxiosError(error) && error.response?.status === 400) setFormError(error.response.data?.message ?? "Invalid notification");
      else setFormError("Failed to create notification");
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchMetrics();

    const interval = setInterval(() => {
      fetchNotifications();
      fetchMetrics();
    }, 5000);

    return () => clearInterval(interval);
  }, [page, statusFilter]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0a0a0a",
        color: "#e5e7eb",
        padding: "40px",
        fontFamily: "Inter, Segoe UI, sans-serif",
      }}
    >
      <h1
        style={{
          color: "#22c55e",
          marginBottom: "25px",
        }}
      >
        NotifyFlow Dashboard
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "15px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            background: "#111111",
            border: "1px solid #22c55e",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
        <h3>Queue · Waiting</h3>
          <h1>{metrics.queue.waiting}</h1>
        </div>

        <div
          style={{
            background: "#111111",
            border: "1px solid #eab308",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <h3>Active</h3>
          <h3>Queue · Active</h3><h1>{metrics.queue.active}</h1>
        </div>

        <div
          style={{
            background: "#111111",
            border: "1px solid #22c55e",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <h3>Queue · Delayed</h3>
          <h1>{metrics.queue.delayed}</h1>
        </div>

        <div
          style={{
            background: "#111111",
            border: "1px solid #ef4444",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <h3>Failed</h3>
          <h3>Database · FAILED</h3><h1>{metrics.database.FAILED}</h1>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {(["PENDING", "PROCESSING", "SUCCESS"] as const).map((status) => <div key={status} style={{ background: "#111", padding: 12, borderRadius: 8 }}>{status}: {metrics.database[status]}</div>)}
      </div>

      <div
        style={{
          background: "#111111",
          border: "1px solid #22c55e",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "30px",
        }}
      >
        <h2>Create Notification</h2>

        <input
          placeholder="Webhook URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            background: "#0a0a0a",
            color: "white",
            border: "1px solid #22c55e",
            borderRadius: "8px",
            marginBottom: "12px",
          }}
        />

        <textarea
          rows={5}
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          style={{
            width: "100%",
            background: "#0a0a0a",
            color: "white",
            border: "1px solid #22c55e",
            borderRadius: "8px",
            padding: "12px",
          }}
        />

        <br />

        <button
          onClick={createNotification}
          style={{
            marginTop: "12px",
            padding: "12px 20px",
            border: "none",
            borderRadius: "8px",
            background: "#22c55e",
            color: "black",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Create Notification
        </button>
        {formError && <p role="alert" style={{ color: "#ef4444" }}>{formError}</p>}
      </div>

      <div
        style={{
          background: "#111111",
          border: "1px solid #22c55e",
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        <h2>Notifications</h2>
        <label>Status filter <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}><option value="">All</option><option>PENDING</option><option>PROCESSING</option><option>SUCCESS</option><option>FAILED</option></select></label>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th>Status</th>
              <th>Retries</th>
              <th>URL</th>
              <th>Error</th>
              <th>HTTP</th>
              <th>Created</th>
            </tr>
          </thead>

          <tbody>
            {notifications.map((notification) => (
              <tr key={notification.id}>
                <td>
                  <span
                    style={{
                      background: getStatusColor(
                        notification.status
                      ),
                      color: "black",
                      padding: "4px 10px",
                      borderRadius: "999px",
                      fontWeight: "bold",
                    }}
                  >
                    {notification.status}
                  </span>
                </td>

                <td>{notification.retries}</td>

                <td>{notification.url}</td>

                <td>
                  {notification.lastError ?? "-"}
                </td>
                <td>{notification.httpStatus ?? "-"}</td>

                <td>
                  {new Date(
                    notification.createdAt
                  ).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 16 }}>
          <button disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
}

export default App;
