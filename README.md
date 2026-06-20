# ⚡ NotifyFlow – Event-Driven Notification System

## Overview

NotifyFlow is a fault-tolerant event-driven notification delivery system built to demonstrate real-world backend engineering concepts such as asynchronous processing, queue-based architectures, retry mechanisms, failure handling, observability, and distributed system design.

Instead of sending notifications directly from the API, requests are persisted, queued, processed by background workers, retried on failure, and tracked throughout their lifecycle.

---

## Architecture

```text
Client
   ↓
React Dashboard
   ↓
Express API (Producer)
   ↓
PostgreSQL
   ↓
BullMQ Queue
   ↓
Redis
   ↓
Worker Process (Consumer)
   ↓
External Webhook
   ↓
Status Update
````

---

## Tech Stack

### Backend
- Node.js
- Express.js
- TypeScript

### Database
- PostgreSQL
- Prisma ORM

### Queue & Messaging
- Redis
- BullMQ

### Frontend
- React
- Vite
- Axios

### Infrastructure
- Docker
- Docker Compose

---

## Features

### Notification Creation
- Create notifications through API or Dashboard
- Validate input payloads
- Store notifications in PostgreSQL

### Queue-Based Processing
- BullMQ queue integration
- Redis-backed job management
- Decoupled API and processing logic

### Worker System
- Dedicated worker process
- Independent background execution
- Consumer architecture

### Webhook Delivery
- Sends payloads to external webhook endpoints
- Tracks delivery status
- Updates database after execution

### Retry Mechanism
- Automatic retries on failure
- Exponential backoff strategy

Example:

```text
Retry 1 → 2 seconds
Retry 2 → 4 seconds
Retry 3 → 8 seconds
Retry 4 → 16 seconds
```

### Failure Tracking
- Failed notifications are never lost
- Error messages stored in database
- Retry count tracking
- Permanent failure state support

### Observability
- Metrics endpoint
- Queue monitoring
- Failed job monitoring
- Processing statistics

### Dashboard
- Create notifications
- View notification history
- Status badges
- Retry counts
- Error visibility
- Metrics cards

---

## Notification Lifecycle

```text
PENDING
   ↓
QUEUED
   ↓
PROCESSING
   ↓
SUCCESS

OR

PROCESSING
   ↓
RETRY
   ↓
RETRY
   ↓
FAILED
```

---

## Database Schema

### Notification

| Field | Description |
|---------|---------|
| id | Unique identifier |
| url | Webhook endpoint |
| payload | Notification payload |
| status | Current state |
| retries | Retry count |
| lastError | Latest error message |
| createdAt | Creation timestamp |

---

## API Endpoints

### Create Notification

```http
POST /notifications
```

Example:

```json
{
  "url": "https://example.com/webhook",
  "payload": {
    "message": "Hello World"
  }
}
```

---

### Get Notifications

```http
GET /notifications
```

Returns all notifications with status and retry information.

---

### Metrics

```http
GET /metrics
```

Returns:

- Waiting jobs
- Active jobs
- Completed jobs
- Failed jobs

---

## Docker Setup

### Start Infrastructure

```bash
docker compose up postgres redis
```

### Start API

```bash
pnpm dev
```

### Start Worker

```bash
pnpm worker
```

### Start Dashboard

```bash
pnpm dev
```

---

## Screenshots

### Dashboard

> INSERT DASHBOARD SCREENSHOT HERE

---

### Notification Creation

> INSERT NOTIFICATION CREATION SCREENSHOT HERE

---

### Successful Delivery

> INSERT SUCCESS SCREENSHOT HERE

---

### Failed Notification

> INSERT FAILED NOTIFICATION SCREENSHOT HERE

---

### Metrics Dashboard

> INSERT METRICS SCREENSHOT HERE

---

## Key Concepts Demonstrated

- Asynchronous Processing
- Producer Consumer Architecture
- Queue Systems
- Redis
- BullMQ
- Worker Processes
- Reliability Engineering
- Retry Strategies
- Exponential Backoff
- Failure Handling
- Observability
- System Design Thinking
- Event-Driven Architecture

---

## Common Failure Scenarios Tested

### Invalid Webhook

```text
404 Not Found
```

### Invalid Domain

```text
getaddrinfo ENOTFOUND abc.invalid
```

### Retry Verification

- Retry 1
- Retry 2
- Retry 3
- Retry 4
- Mark as FAILED

---

## Project Status

| Component | Status |
|------------|---------|
| Backend API | ✅ |
| PostgreSQL Integration | ✅ |
| Prisma ORM | ✅ |
| Redis Integration | ✅ |
| BullMQ Queue | ✅ |
| Worker System | ✅ |
| Webhook Delivery | ✅ |
| Retry Mechanism | ✅ |
| Failure Tracking | ✅ |
| Metrics Endpoint | ✅ |
| Dashboard | ✅ |
| Dockerized PostgreSQL | ✅ |
| Dockerized Redis | ✅ |

---

## Interview Summary

Built a fault-tolerant event-driven notification system using Express, PostgreSQL, Redis, BullMQ, and React. The API acts as a producer that stores notifications and pushes jobs into a queue. A dedicated worker consumes jobs asynchronously and sends webhook requests. Failures trigger retries using exponential backoff, while permanent failures are tracked and stored for visibility. The system exposes metrics and provides a dashboard for monitoring notification health and delivery status.

---

## Resume One-Liner

**Built NotifyFlow, a fault-tolerant event-driven notification system using Express, PostgreSQL, Redis, BullMQ, Docker, and React, implementing asynchronous processing, retries, failure tracking, and observability.**
