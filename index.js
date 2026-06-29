const fs = require("fs");
const path = require("path");

const tasksFilePath = path.join(__dirname, "tasks.json");

const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "x1b[33m",
    cyan: "\x1b[36m",
};

function readTasks() {
    if (fs.existsSync(tasksFilePath)) {
        const data = fs.readFileSync(tasksFilePath, "utf-8");
        return JSON.parse(data);
    }
    return [];
}

function writeTasks(tasks) {
    fs.writeFileSync(tasksFilePath, JSON.stringify(tasks, null, 2), "utf-8");
}

function getNextId(tasks) {
    const ids = tasks.map((task) => task.id);
    ids.sort((a, b) => a - b);
    let nextId = 1;
    for (const id of ids) {
        if (id !== nextId) break;
        nextId += 1;
    }
    return nextId;
}

function listTask(status) {
    const tasks = readTasks();
    let filteredTasks = tasks;

    if (status) {
        if (status.toLowerCase() === "done") {
            filteredTasks = task.filter((task) => task.completed);
        } else if (status.toLowerCase() === "to-do") {
            filteredTasks = task.filter((task) => task.inProgress);
        } else if (status.toLowerCase() === "");
    }        

}