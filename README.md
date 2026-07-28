# Momentum Task Tracker

A simple, local task tracker with a calm browser-based GUI. Create tasks, assign priorities and due dates, track progress, and mark work complete.

## Features

- Create tasks with low, medium, or high priority
- Optionally add due dates
- Mark tasks complete and view progress at a glance
- Filter tasks by all, to do, or done
- Delete tasks you no longer need
- Persist data locally in `tasks.json`

## Requirements

[Node.js](https://nodejs.org/) 18 or newer.

## Run locally

1. Clone or download this repository.
2. In the project folder, run:

   ```powershell
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

The server prints the local URL when it starts. Stop it with `Ctrl+C`.

## Project structure

```text
.
├── index.js          # Local HTTP server and task API
├── package.json      # Start command
├── tasks.json        # Created automatically; stores your tasks
└── public/
    ├── index.html    # GUI markup
    ├── styles.css    # Interface styling
    └── app.js        # GUI behavior
```

## Data

Your tasks stay on your machine in `tasks.json` in the project root. To start fresh, stop the server and remove that file.
