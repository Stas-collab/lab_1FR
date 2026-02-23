const { createServer } = require("node:http");
let TASKS = [{ id: 1, title: "Learn Node.js", done: false, priority: "high" }];

const PORT = process.env.PORT || 3000;
const HOSTNAME = "localhost";

const server = createServer((req, res) => {
  const method = req.method;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  //GET

  if (method === "GET" && pathname === "/tasks") {
    const priority = url.searchParams.get("priority");

    let result = [...TASKS];

    if (priority) {
      result = result.filter((task) => task.priority === priority);
    }

    res.statusCode = 200;
    return res.end(JSON.stringify(result));
  }

  //POST
  if (method === "POST" && pathname === "/tasks") {
    let body = "";

    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => {
      try {
        const data = JSON.parse(body);

        if (!data.title || !data.priority) {
          res.statusCode = 400;
          return res.end(
            JSON.stringify({ error: "title and priority are required" }),
          );
        }

        const newTask = {
          id: TASKS.length ? TASKS[TASKS.length - 1].id + 1 : 1,
          title: data.title,
          done: Boolean(data.done),
          priority: data.priority,
        };

        TASKS.push(newTask);
        res.statusCode = 201;
        res.end(JSON.stringify(newTask));
      } catch {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }
  //PATCH
  if (method === "PATCH" && pathname.startsWith("/tasks/")) {
    const id = Number(pathname.split("/")[2]);
    let body = "";

    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => {
      const task = TASKS.find((t) => t.id === id);
      if (!task) {
        res.statusCode = 404;
        return res.end(JSON.stringify({ error: "Task not found" }));
      }

      const updates = JSON.parse(body);
      delete updates.id;

      Object.assign(task, updates);
      res.statusCode = 200;
      res.end(JSON.stringify(task));
    });
    return;
  }
  //DELETE
  if (method === "DELETE" && pathname.startsWith("/tasks/")) {
    const id = Number(pathname.split("/")[2]);
    const initialLength = TASKS.length;

    TASKS = TASKS.filter((task) => task.id !== id);

    if (TASKS.length === initialLength) {
      res.statusCode = 404;
      return res.end(JSON.stringify({ error: "Task not found" }));
    }

    res.statusCode = 200;
    return res.end(JSON.stringify({ message: "Task deleted" }));
  }

  // ---------- 404 ----------
  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Route not found" }));
});

server.listen(PORT, HOSTNAME, () => {
  console.log(`Server running at http://${HOSTNAME}:${PORT}`);
});
