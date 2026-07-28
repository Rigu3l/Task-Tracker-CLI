const fs = require("fs");
const path = require("path");
const http = require("http");

const PORT = process.env.PORT || 3000;
const tasksFilePath = path.join(__dirname, "tasks.json");
const publicDirectory = path.join(__dirname, "public");

function readTasks() {
  try {
    if (!fs.existsSync(tasksFilePath)) return [];
    const tasks = JSON.parse(fs.readFileSync(tasksFilePath, "utf8"));
    return Array.isArray(tasks) ? tasks : [];
  } catch {
    return [];
  }
}

function writeTasks(tasks) {
  fs.writeFileSync(tasksFilePath, JSON.stringify(tasks, null, 2) + "\n", "utf8");
}

function getNextId(tasks) {
  return tasks.reduce((max, task) => Math.max(max, Number(task.id) || 0), 0) + 1;
}

function sendJson(response, status, data) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(data));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) request.destroy();
    });
    request.on("end", () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error("Invalid JSON")); }
    });
  });
}

const contentTypes = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "application/javascript; charset=utf-8" };

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const taskMatch = url.pathname.match(/^\/api\/tasks\/(\d+)$/);

  try {
    if (url.pathname === "/api/tasks" && request.method === "GET") {
      return sendJson(response, 200, readTasks());
    }
    if (url.pathname === "/api/tasks" && request.method === "POST") {
      const { title, priority = "medium", dueDate = "" } = await readBody(request);
      if (typeof title !== "string" || !title.trim()) return sendJson(response, 400, { error: "A task title is required." });
      const tasks = readTasks();
      const task = { id: getNextId(tasks), title: title.trim(), priority, dueDate, completed: false, createdAt: new Date().toISOString() };
      tasks.push(task);
      writeTasks(tasks);
      return sendJson(response, 201, task);
    }
    if (taskMatch && request.method === "PATCH") {
      const tasks = readTasks();
      const task = tasks.find((item) => item.id === Number(taskMatch[1]));
      if (!task) return sendJson(response, 404, { error: "Task not found." });
      const updates = await readBody(request);
      if (typeof updates.title === "string" && updates.title.trim()) task.title = updates.title.trim();
      if (["low", "medium", "high"].includes(updates.priority)) task.priority = updates.priority;
      if (typeof updates.dueDate === "string") task.dueDate = updates.dueDate;
      if (typeof updates.completed === "boolean") task.completed = updates.completed;
      writeTasks(tasks);
      return sendJson(response, 200, task);
    }
    if (taskMatch && request.method === "DELETE") {
      const tasks = readTasks();
      const remaining = tasks.filter((item) => item.id !== Number(taskMatch[1]));
      if (remaining.length === tasks.length) return sendJson(response, 404, { error: "Task not found." });
      writeTasks(remaining);
      return sendJson(response, 204, {});
    }

    if (request.method !== "GET") return sendJson(response, 405, { error: "Method not allowed." });
    const requested = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const filePath = path.resolve(publicDirectory, requested);
    if (!filePath.startsWith(publicDirectory) || !fs.existsSync(filePath)) {
      response.writeHead(404); return response.end("Not found");
    }
    response.writeHead(200, { "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(response);
  } catch (error) {
    sendJson(response, 400, { error: error.message });
  }
});

server.listen(PORT, () => console.log(`Task Tracker is running at http://localhost:${PORT}`));
