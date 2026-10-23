/* ─────────────────────────────────────────
   app.js — Personal Dashboard
   Features:
     ✅ Greeting with time & date
     ✅ Focus Timer (25 min default, configurable)
     ✅ To-Do List (add, edit, done, delete, localStorage)
     ✅ Quick Links (add, delete, localStorage)
   Challenges (3/5):
     ✅ Light / Dark mode
     ✅ Custom name in greeting
     ✅ Change Pomodoro time
     ✅ Prevent duplicate tasks
     ✅ Sort tasks
───────────────────────────────────────── */

'use strict';

/* ── Utility helpers ── */

function $(id) { return document.getElementById(id); }

function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2800);
}

/* ══════════════════════════════════════════
   1. GREETING — time, date, name
══════════════════════════════════════════ */
const greetingText = $('greeting-text');
const datetimeText = $('datetime-text');

function getGreeting(hour) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  });
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', {
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function updateClock() {
  const now  = new Date();
  const hour = now.getHours();
  const name = localStorage.getItem('userName') || '';
  const nameStr = name ? `, ${name}` : '';

  greetingText.textContent = `${getGreeting(hour)}${nameStr} 👋`;
  datetimeText.textContent = `${formatDate(now)} · ${formatTime(now)}`;
}

updateClock();
setInterval(updateClock, 1000);

/* ── Custom Name Modal ── */
const nameModal      = $('name-modal');
const nameInput      = $('name-input');
const nameSaveBtn    = $('name-save-btn');
const nameCancelBtn  = $('name-cancel-btn');
const nameBtn        = $('name-btn');

function openNameModal() {
  nameInput.value = localStorage.getItem('userName') || '';
  nameModal.classList.remove('hidden');
  nameInput.focus();
}

function closeNameModal() {
  nameModal.classList.add('hidden');
}

nameBtn.addEventListener('click', openNameModal);

nameSaveBtn.addEventListener('click', () => {
  const val = nameInput.value.trim();
  if (val) {
    localStorage.setItem('userName', val);
  } else {
    localStorage.removeItem('userName');
  }
  closeNameModal();
  updateClock();
});

nameCancelBtn.addEventListener('click', closeNameModal);

nameModal.addEventListener('click', (e) => {
  if (e.target === nameModal) closeNameModal();
});

nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') nameSaveBtn.click();
  if (e.key === 'Escape') closeNameModal();
});

/* ══════════════════════════════════════════
   2. LIGHT / DARK MODE
══════════════════════════════════════════ */
const themeBtn  = $('theme-btn');
const htmlEl    = document.documentElement;

function applyTheme(theme) {
  htmlEl.setAttribute('data-theme', theme);
  themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
  themeBtn.title       = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
}

// Load saved theme (default: light)
const savedTheme = localStorage.getItem('theme') || 'light';
applyTheme(savedTheme);

themeBtn.addEventListener('click', () => {
  const current = htmlEl.getAttribute('data-theme');
  const next    = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', next);
  applyTheme(next);
});

/* ══════════════════════════════════════════
   3. FOCUS TIMER (Challenge: change duration)
══════════════════════════════════════════ */
const timerDisplay   = $('timer-display');
const timerStart     = $('timer-start');
const timerStop      = $('timer-stop');
const timerReset     = $('timer-reset');
const durationSelect = $('duration-select');

let timerInterval  = null;
let timerSeconds   = 25 * 60;
let isRunning      = false;

function getSelectedSeconds() {
  return parseInt(durationSelect.value, 10) * 60;
}

function formatTimer(s) {
  const m = String(Math.floor(s / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${m}:${sec}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTimer(timerSeconds);
}

function updateTimerButtons() {
  timerStart.disabled = isRunning;
  timerStop.disabled  = !isRunning;
  durationSelect.disabled = isRunning;
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  updateTimerButtons();

  timerInterval = setInterval(() => {
    timerSeconds--;
    renderTimer();

    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      isRunning = false;
      timerDisplay.textContent = '🎉 Done!';
      updateTimerButtons();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  updateTimerButtons();
}

function resetTimer() {
  stopTimer();
  timerSeconds = getSelectedSeconds();
  renderTimer();
}

// Change duration resets timer automatically
durationSelect.addEventListener('change', () => {
  if (!isRunning) resetTimer();
});

timerStart.addEventListener('click', startTimer);
timerStop.addEventListener('click', stopTimer);
timerReset.addEventListener('click', resetTimer);

// Init
timerSeconds = getSelectedSeconds();
renderTimer();
updateTimerButtons();

/* ══════════════════════════════════════════
   4. TO-DO LIST
   Challenges: prevent duplicates, sort tasks
══════════════════════════════════════════ */
const todoInput  = $('todo-input');
const todoAddBtn = $('todo-add-btn');
const todoList   = $('todo-list');
const todoEmpty  = $('todo-empty');
const sortSelect = $('sort-select');

// Tasks schema: [{ id, text, done }]
function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem('tasks')) || [];
  } catch {
    return [];
  }
}

function saveTasks(tasks) {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function getSortedTasks(tasks) {
  const arr = [...tasks];
  switch (sortSelect.value) {
    case 'az':   return arr.sort((a, b) => a.text.localeCompare(b.text));
    case 'za':   return arr.sort((a, b) => b.text.localeCompare(a.text));
    case 'done': return arr.sort((a, b) => Number(a.done) - Number(b.done));
    default:     return arr; // insertion order
  }
}

function renderTasks() {
  const tasks  = loadTasks();
  const sorted = getSortedTasks(tasks);

  todoList.innerHTML = '';
  todoEmpty.style.display = tasks.length === 0 ? 'block' : 'none';

  sorted.forEach((task) => {
    const li = document.createElement('li');
    li.className = `todo-item${task.done ? ' done' : ''}`;
    li.dataset.id = task.id;

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type    = 'checkbox';
    checkbox.checked = task.done;
    checkbox.setAttribute('aria-label', `Mark "${task.text}" as done`);
    checkbox.addEventListener('change', () => toggleTask(task.id));

    // Label (double-click to edit)
    const label = document.createElement('span');
    label.className   = 'todo-label';
    label.textContent = task.text;
    label.title       = 'Double-click to edit';
    label.addEventListener('dblclick', () => startEditTask(task.id, li, label));

    // Actions
    const actions = document.createElement('div');
    actions.className = 'todo-item-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-secondary';
    editBtn.style.fontSize = '0.78rem';
    editBtn.style.padding  = '4px 8px';
    editBtn.textContent    = 'Edit';
    editBtn.setAttribute('aria-label', `Edit task "${task.text}"`);
    editBtn.addEventListener('click', () => startEditTask(task.id, li, label));

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-danger';
    delBtn.textContent = 'Delete';
    delBtn.setAttribute('aria-label', `Delete task "${task.text}"`);
    delBtn.addEventListener('click', () => deleteTask(task.id));

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    li.appendChild(checkbox);
    li.appendChild(label);
    li.appendChild(actions);
    todoList.appendChild(li);
  });
}

function addTask(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  // Challenge: Prevent duplicate tasks (case-insensitive)
  const tasks = loadTasks();
  const isDuplicate = tasks.some(
    (t) => t.text.toLowerCase() === trimmed.toLowerCase()
  );
  if (isDuplicate) {
    showToast('⚠️ Task already exists!');
    return;
  }

  tasks.push({ id: Date.now(), text: trimmed, done: false });
  saveTasks(tasks);
  renderTasks();
}

function toggleTask(id) {
  const tasks = loadTasks().map((t) =>
    t.id === id ? { ...t, done: !t.done } : t
  );
  saveTasks(tasks);
  renderTasks();
}

function deleteTask(id) {
  const tasks = loadTasks().filter((t) => t.id !== id);
  saveTasks(tasks);
  renderTasks();
}

function startEditTask(id, li, label) {
  // Avoid double edit inputs
  if (li.querySelector('.todo-edit-input')) return;

  const tasks   = loadTasks();
  const task    = tasks.find((t) => t.id === id);
  if (!task) return;

  const editInput = document.createElement('input');
  editInput.className   = 'todo-edit-input';
  editInput.type        = 'text';
  editInput.value       = task.text;
  editInput.maxLength   = 100;
  editInput.setAttribute('aria-label', 'Edit task text');

  label.replaceWith(editInput);
  editInput.focus();
  editInput.select();

  function commitEdit() {
    const newText = editInput.value.trim();
    if (!newText) {
      editInput.replaceWith(label); // cancel if empty
      return;
    }

    // Check duplicate (excluding self)
    const duplicate = tasks.some(
      (t) => t.id !== id && t.text.toLowerCase() === newText.toLowerCase()
    );
    if (duplicate) {
      showToast('⚠️ Another task with this name already exists!');
      editInput.focus();
      return;
    }

    const updated = tasks.map((t) =>
      t.id === id ? { ...t, text: newText } : t
    );
    saveTasks(updated);
    renderTasks();
  }

  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  commitEdit();
    if (e.key === 'Escape') editInput.replaceWith(label);
  });
  editInput.addEventListener('blur', commitEdit);
}

// Wiring
todoAddBtn.addEventListener('click', () => {
  addTask(todoInput.value);
  todoInput.value = '';
  todoInput.focus();
});

todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') todoAddBtn.click();
});

sortSelect.addEventListener('change', renderTasks);

// Initial render
renderTasks();

/* ══════════════════════════════════════════
   5. QUICK LINKS
══════════════════════════════════════════ */
const linkNameInput = $('link-name-input');
const linkUrlInput  = $('link-url-input');
const linkAddBtn    = $('link-add-btn');
const linksGrid     = $('links-grid');
const linksEmpty    = $('links-empty');

// Links schema: [{ id, name, url }]
function loadLinks() {
  try {
    return JSON.parse(localStorage.getItem('quickLinks')) || [];
  } catch {
    return [];
  }
}

function saveLinks(links) {
  localStorage.setItem('quickLinks', JSON.stringify(links));
}

function getFavicon(url) {
  try {
    const host = new URL(url).hostname;
    // Simple emoji mapping for popular sites; fallback to 🌐
    const map = {
      'youtube.com':    '▶️',
      'www.youtube.com':'▶️',
      'github.com':     '🐙',
      'www.github.com': '🐙',
      'google.com':     '🔍',
      'www.google.com': '🔍',
      'twitter.com':    '🐦',
      'x.com':          '🐦',
      'instagram.com':  '📸',
      'reddit.com':     '🟠',
      'www.reddit.com': '🟠',
      'netflix.com':    '🎬',
      'www.netflix.com':'🎬',
      'spotify.com':    '🎵',
      'open.spotify.com':'🎵',
      'wikipedia.org':  '📖',
      'en.wikipedia.org':'📖',
      'stackoverflow.com':'💬',
      'www.stackoverflow.com':'💬',
      'gmail.com':      '📧',
      'mail.google.com':'📧',
    };
    return map[host] || '🌐';
  } catch {
    return '🌐';
  }
}

function renderLinks() {
  const links = loadLinks();
  linksGrid.innerHTML  = '';
  linksEmpty.style.display = links.length === 0 ? 'block' : 'none';

  links.forEach((link) => {
    const chip = document.createElement('div');
    chip.className = 'link-chip';

    const favicon = document.createElement('span');
    favicon.className   = 'link-favicon';
    favicon.textContent = getFavicon(link.url);
    favicon.setAttribute('aria-hidden', 'true');

    const anchor = document.createElement('a');
    anchor.href   = link.url;
    anchor.target = '_blank';
    anchor.rel    = 'noopener noreferrer';
    anchor.textContent = link.name;

    const delBtn = document.createElement('button');
    delBtn.className = 'link-delete';
    delBtn.textContent = '✕';
    delBtn.setAttribute('aria-label', `Remove link "${link.name}"`);
    delBtn.addEventListener('click', (e) => {
      e.preventDefault();
      deleteLink(link.id);
    });

    chip.appendChild(favicon);
    chip.appendChild(anchor);
    chip.appendChild(delBtn);
    linksGrid.appendChild(chip);
  });
}

function addLink(name, url) {
  name = name.trim();
  url  = url.trim();
  if (!name || !url) return;

  // Prepend https:// if missing
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  const links = loadLinks();
  links.push({ id: Date.now(), name, url });
  saveLinks(links);
  renderLinks();
}

function deleteLink(id) {
  const links = loadLinks().filter((l) => l.id !== id);
  saveLinks(links);
  renderLinks();
}

linkAddBtn.addEventListener('click', () => {
  addLink(linkNameInput.value, linkUrlInput.value);
  linkNameInput.value = '';
  linkUrlInput.value  = '';
  linkNameInput.focus();
});

linkUrlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') linkAddBtn.click();
});

linkNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') linkUrlInput.focus();
});

// Initial render
renderLinks();
