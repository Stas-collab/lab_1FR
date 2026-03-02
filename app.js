const { createServer } = require("node:http");
const config = require("./config");

let TASKS = [{ id: 1, title: "Learn Node.js", done: false, priority: "high" }];

// -------------------- LOGGER  --------------------
function logRequest(level, req, statusCode) {
  const agent = req.headers["user-agent"] || "Unknown";
  const ip = req.socket.remoteAddress || "Unknown";

  console.log(
    `[${level}] ${req.method} ${req.url} | Status: ${statusCode} | Agent: ${agent} | IP: ${ip}`,
  );
}

// -------------------- SERVER --------------------
const server = createServer((req, res) => {
  const method = req.method;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  res.setHeader("Content-Type", "application/json; charset=utf-8");

  function sendResponse(status, data) {
    res.statusCode = status;
    res.end(JSON.stringify(data));

    if (config.NODE_ENV === "development") {
      logRequest("INFO", req, status);
    } else {
      if (status >= 400) {
        logRequest("ERROR", req, status);
      }
    }
  }

  // -------------------- HEALTH --------------------
  if (method === "GET" && pathname === "/health") {
    return sendResponse(200, {
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    });
  }

  // -------------------- GET --------------------
  if (method === "GET" && pathname === "/tasks") {
    const priority = url.searchParams.get("priority");
    let result = [...TASKS];

    if (priority) {
      result = result.filter((task) => task.priority === priority);
    }

    return sendResponse(200, result);
  }

  // -------------------- POST --------------------
  if (method === "POST" && pathname === "/tasks") {
    let body = "";

    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => {
      try {
        const data = JSON.parse(body);

        if (!data.title || !data.priority) {
          return sendResponse(400, {
            error: "title and priority are required",
          });
        }

        const newTask = {
          id: TASKS.length ? TASKS[TASKS.length - 1].id + 1 : 1,
          title: data.title,
          done: Boolean(data.done),
          priority: data.priority,
        };

        TASKS.push(newTask);
        return sendResponse(201, newTask);
      } catch {
        return sendResponse(400, { error: "Invalid JSON" });
      }
    });
    return;
  }

  // -------------------- PATCH --------------------
  if (method === "PATCH" && pathname.startsWith("/tasks/")) {
    const id = Number(pathname.split("/")[2]);
    let body = "";

    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => {
      try {
        const task = TASKS.find((t) => t.id === id);
        if (!task) {
          return sendResponse(404, { error: "Task not found" });
        }

        const updates = JSON.parse(body);
        delete updates.id;

        Object.assign(task, updates);
        return sendResponse(200, task);
      } catch {
        return sendResponse(400, { error: "Invalid JSON" });
      }
    });
    return;
  }

  // -------------------- DELETE --------------------
  if (method === "DELETE" && pathname.startsWith("/tasks/")) {
    const id = Number(pathname.split("/")[2]);
    const initialLength = TASKS.length;

    TASKS = TASKS.filter((task) => task.id !== id);

    if (TASKS.length === initialLength) {
      return sendResponse(404, { error: "Task not found" });
    }

    return sendResponse(200, { message: "Task deleted" });
  }

  // -------------------- 404 --------------------
  return sendResponse(404, { error: "Route not found" });
});

// -------------------- START SERVER --------------------
server.listen(config.PORT, config.HOSTNAME, () => {
  console.log(`Server running at http://${config.HOSTNAME}:${config.PORT}`);
});

// -------------------- GRACEFUL SHUTDOWN --------------------
function gracefulShutdown(signal) {
  console.log(`Received ${signal}. Shutting down gracefully...`);

  const timeout = setTimeout(() => {
    console.error("Force shutdown due to timeout");
    process.exit(1);
  }, 10000);

  server.close((err) => {
    clearTimeout(timeout);

    if (err) {
      console.error("Error during shutdown:", err);
      process.exit(1);
    }

    console.log("Server closed successfully");
    process.exit(0);
  });
}

// -------------------- SIGNALS --------------------
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// -------------------- GLOBAL ERRORS --------------------
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  gracefulShutdown("unhandledRejection");
});
