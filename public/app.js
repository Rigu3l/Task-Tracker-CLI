const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const template = document.querySelector("#task-template");
const modal = document.querySelector("#task-modal");
let tasks = [];
let filter = "all";

const api = async (url, options) => {
  const response = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  if (!response.ok) throw new Error((await response.json()).error || "Something went wrong.");
  return response.status === 204 ? null : response.json();
};

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

async function updateTask(id, changes) { tasks = tasks.map(task => task.id === id ? awaitTask(task, changes) : task); render(); try { await api(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(changes) }); } catch (error) { await load(); alert(error.message); } }
function awaitTask(task, changes) { return { ...task, ...changes }; }
async function deleteTask(id) { const previous = tasks; tasks = tasks.filter(task => task.id !== id); render(); try { await api(`/api/tasks/${id}`, { method: "DELETE" }); } catch (error) { tasks = previous; render(); alert(error.message); } }
async function load() { try { tasks = await api("/api/tasks"); render(); } catch (error) { taskList.textContent = `Could not load tasks: ${error.message}`; } }

document.querySelectorAll(".filter").forEach(button => button.onclick = () => { filter = button.dataset.filter; document.querySelectorAll(".filter").forEach(item => item.classList.toggle("active", item === button)); render(); });
document.querySelector("#open-modal").onclick = () => modal.showModal();
document.querySelector("#close-modal").onclick = () => modal.close();
document.querySelector("#task-form").onsubmit = async (event) => { event.preventDefault(); const form = new FormData(event.target); try { const task = await api("/api/tasks", { method: "POST", body: JSON.stringify(Object.fromEntries(form)) }); tasks.push(task); render(); event.target.reset(); modal.close(); } catch (error) { alert(error.message); } };
const now = new Date(); document.querySelector("#today").innerHTML = `${now.toLocaleDateString(undefined, { weekday: "long" })}<strong>${now.getDate()}</strong>${now.toLocaleDateString(undefined, { month: "long", year: "numeric" })}`;
load();
