const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const template = document.querySelector("#task-template");
const modal = document.querySelector("#task-modal");
let tasks = [];
let filter = "all";
let useLocalStorage = false;
const storageKey = "momentum-task-tracker-tasks";

const api = async (url, options) => {
  const response = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  const type = response.headers.get("content-type") || "";
  const payload = response.status === 204 ? null : type.includes("application/json") ? await response.json() : null;
  if (!response.ok) throw new Error(payload?.error || "Something went wrong.");
  if (response.status === 204) return null;
  if (payload === null) throw new Error("The task API is unavailable.");
  return payload;
};

function saveLocalTasks() {
  localStorage.setItem(storageKey, JSON.stringify(tasks));
}

function formatDate(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(`${date}T12:00:00`));
}

function render() {
  const shown = tasks.filter(task => filter === "all" || filter === "completed" ? (filter === "all" || task.completed) : !task.completed);
  taskList.replaceChildren();
  shown.forEach(task => {
    const node = template.content.cloneNode(true);
    const card = node.querySelector(".task");
    card.classList.toggle("completed", task.completed);
    node.querySelector("h2").textContent = task.title;
    const priority = node.querySelector(".priority"); priority.textContent = task.priority; priority.classList.add(task.priority);
    node.querySelector(".due-date").textContent = task.dueDate ? `Due ${formatDate(task.dueDate)}` : "";
    node.querySelector(".check").onclick = () => updateTask(task.id, { completed: !task.completed });
    node.querySelector(".delete").onclick = () => { if (confirm(`Delete “${task.title}”?`)) deleteTask(task.id); };
    taskList.append(node);
  });
  emptyState.hidden = shown.length !== 0;
  const done = tasks.filter(task => task.completed).length;
  document.querySelector("#progress-text").textContent = `${done} of ${tasks.length} complete`;
  document.querySelector("#progress-bar").style.width = tasks.length ? `${done / tasks.length * 100}%` : "0";
  document.querySelector("#count-all").textContent = tasks.length;
  document.querySelector("#count-active").textContent = tasks.length - done;
  document.querySelector("#count-completed").textContent = done;
}

async function updateTask(id, changes) { tasks = tasks.map(task => task.id === id ? awaitTask(task, changes) : task); render(); if (useLocalStorage) return saveLocalTasks(); try { await api(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(changes) }); } catch (error) { await load(); alert(error.message); } }
function awaitTask(task, changes) { return { ...task, ...changes }; }
async function deleteTask(id) { const previous = tasks; tasks = tasks.filter(task => task.id !== id); render(); if (useLocalStorage) return saveLocalTasks(); try { await api(`/api/tasks/${id}`, { method: "DELETE" }); } catch (error) { tasks = previous; render(); alert(error.message); } }
async function load() { try { tasks = await api("/api/tasks"); render(); } catch { useLocalStorage = true; try { tasks = JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch { tasks = []; } render(); } }

document.querySelectorAll(".filter").forEach(button => button.onclick = () => { filter = button.dataset.filter; document.querySelectorAll(".filter").forEach(item => item.classList.toggle("active", item === button)); render(); });
document.querySelector("#open-modal").onclick = () => modal.showModal();
document.querySelector("#close-modal").onclick = () => modal.close();
document.querySelector("#task-form").onsubmit = async (event) => { event.preventDefault(); const form = new FormData(event.target); try { const values = Object.fromEntries(form); const task = useLocalStorage ? { id: Date.now(), ...values, completed: false, createdAt: new Date().toISOString() } : await api("/api/tasks", { method: "POST", body: JSON.stringify(values) }); tasks.push(task); if (useLocalStorage) saveLocalTasks(); render(); event.target.reset(); modal.close(); } catch (error) { alert(error.message); } };
const now = new Date(); document.querySelector("#today").innerHTML = `${now.toLocaleDateString(undefined, { weekday: "long" })}<strong>${now.getDate()}</strong>${now.toLocaleDateString(undefined, { month: "long", year: "numeric" })}`;
load();
