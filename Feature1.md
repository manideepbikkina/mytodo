# Prompt for Minimal To-Do (tasks + subtasks) — vanilla JS

Create a single-page web app using only HTML, CSS, and JS (no frameworks, no build step).

Files

- index.html, styles.css, app.js, storage.js, ai.js

Data

- // in app.js
- // SubTask: { id: string, title: string, done: boolean }
- // Task:    { id: string, title: string, done: boolean, subtasks: SubTask[] }

Features

- Add/rename/delete tasks/subtasks; toggle done.
- Each task row shows: checkbox, title, “[+] Add a New Sub Task” button, and a PlanForMe button.
- Persist entire state in localStorage key todo.v1.
- Keyboard: Enter to add; Space toggles checkbox; Esc cancels edit.
- Accessible labels and focus styles.

UI

- Simple, responsive layout; use styles.css only (no Tailwind).
- Attached image for reference

Acceptance

- Open index.html directly in a browser and everything works (no server).