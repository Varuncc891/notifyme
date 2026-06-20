import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:3000";

interface Notification {
  id: string;
  url: string;
  status: string;
  retries: number;
  lastError: string | null;
  createdAt: string;
}

interface Metrics {
  active: number;
  completed: number;
  delayed: number;
  failed: number;
  waiting: number;
}

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

  const [metrics, setMetrics] = useState<Metrics>({
    active: 0,
    completed: 0,
    delayed: 0,
    failed: 0,
    waiting: 0,
  });

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/notifications`
      );

      setNotifications(response.data);
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
          url,
          payload: JSON.parse(payload),
        }
      );

      setUrl("");

      fetchNotifications();
      fetchMetrics();

    } catch (error) {
      console.error(error);
      alert("Failed to create notification");
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
  }, []);

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
          <h3>Waiting</h3>
          <h1>{metrics.waiting}</h1>
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
          <h1>{metrics.active}</h1>
        </div>

        <div
          style={{
            background: "#111111",
            border: "1px solid #22c55e",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <h3>Completed</h3>
          <h1>{metrics.completed}</h1>
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
          <h1>{metrics.failed}</h1>
        </div>
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

                <td>
                  {new Date(
                    notification.createdAt
                  ).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
