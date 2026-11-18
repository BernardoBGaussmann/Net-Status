import { checkAllServices } from './monitor.js';

const STORAGE_KEY = 'netpulse_services';
const DEFAULT_SERVICES = [
  { id: 1, name: 'GitHub API', url: 'https://api.github.com' },
  { id: 2, name: 'JSONPlaceholder', url: 'https://jsonplaceholder.typicode.com/posts/1' }
];

const form = document.getElementById('service-form');
const nameInput = document.getElementById('service-name');
const urlInput = document.getElementById('service-url');
const refreshButton = document.getElementById('refresh');
const autoButton = document.getElementById('toggle-auto');
const autoStatus = document.getElementById('auto-status');
const list = document.getElementById('services');

const AUTO_REFRESH_MS = 30000;
const AUTO_REFRESH_SECONDS = AUTO_REFRESH_MS / 1000;

function loadServices() {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Conteúdo inválido: recomeça com os serviços padrão.
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SERVICES));
  return [...DEFAULT_SERVICES];
}

function saveServices() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
}

const services = loadServices();
let results = new Map();
let nextId = services.reduce((max, service) => Math.max(max, service.id), 0) + 1;
let checking = false;
let needsRefresh = false;
let autoEnabled = true;
let autoTimer = null;
let countdown = AUTO_REFRESH_SECONDS;
let countdownTimer = null;

function render() {
  list.replaceChildren();

  if (services.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'Nenhum serviço cadastrado.';
    list.append(empty);
    return;
  }

  for (const service of services) {
    const result = results.get(service.id);

    const card = document.createElement('div');
    card.className = 'card';

    const info = document.createElement('div');
    const name = document.createElement('h2');
    name.textContent = service.name;
    const url = document.createElement('p');
    url.className = 'url';
    url.textContent = service.url;
    info.append(name, url);

    const status = document.createElement('span');
    if (!result) {
      status.className = 'status pending';
      status.textContent = '—';
    } else if (result.online) {
      status.className = 'status online';
      status.textContent = 'Online';
    } else {
      status.className = 'status offline';
      status.textContent = 'Offline';
    }

    const latency = document.createElement('span');
    latency.className = 'latency';
    latency.textContent = result && result.latency != null ? `${result.latency} ms` : '—';

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'remove';
    removeButton.textContent = 'Remover';
    removeButton.addEventListener('click', () => removeService(service.id));

    card.append(info, status, latency, removeButton);
    list.append(card);
  }
}

function removeService(id) {
  const index = services.findIndex((service) => service.id === id);
  if (index === -1) return;

  services.splice(index, 1);
  results.delete(id);
  saveServices();
  render();
}

async function refresh() {
  if (checking) return;

  checking = true;
  stopCountdown();
  refreshButton.disabled = true;
  refreshButton.textContent = 'Atualizando...';
  renderAutoStatus();

  try {
    const checked = await checkAllServices([...services]);
    results = new Map(checked.map((item) => [item.id, item]));
    render();
  } finally {
    checking = false;
    refreshButton.disabled = false;
    refreshButton.textContent = 'Atualizar Agora';

    if (needsRefresh) {
      needsRefresh = false;
      refresh();
    } else {
      beginAutoCycle();
    }
  }
}

function renderAutoStatus() {
  if (!autoEnabled) {
    autoStatus.textContent = 'Auto-refresh pausado';
  } else if (checking) {
    autoStatus.textContent = 'Atualizando agora...';
  } else {
    autoStatus.textContent = `Próxima atualização em ${countdown}s`;
  }
}

function stopCountdown() {
  clearTimeout(countdownTimer);
  countdownTimer = null;
}

function tickCountdown() {
  countdownTimer = setTimeout(() => {
    countdown = Math.max(0, countdown - 1);
    renderAutoStatus();

    if (countdown > 0) tickCountdown();
  }, 1000);
}

function startCountdown() {
  stopCountdown();

  if (!autoEnabled) {
    renderAutoStatus();
    return;
  }

  countdown = AUTO_REFRESH_SECONDS;
  renderAutoStatus();

  if (checking) return;

  tickCountdown();
}

function beginAutoCycle() {
  if (!autoEnabled) {
    stopCountdown();
    renderAutoStatus();
    return;
  }

  scheduleAutoRefresh();
  startCountdown();
}

function scheduleAutoRefresh() {
  if (!autoEnabled) return;

  clearTimeout(autoTimer);
  autoTimer = setTimeout(async () => {
    autoTimer = null;
    await refresh();
  }, AUTO_REFRESH_MS);
}

autoButton.addEventListener('click', () => {
  autoEnabled = !autoEnabled;

  if (autoEnabled) {
    autoButton.textContent = 'Pausar Auto';
    beginAutoCycle();
  } else {
    autoButton.textContent = 'Retomar Auto';
    clearTimeout(autoTimer);
    autoTimer = null;
    stopCountdown();
    renderAutoStatus();
  }
});

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const rawUrl = urlInput.value.trim();
  if (!name || !rawUrl) return;

  let url;
  try {
    url = new URL(rawUrl).href;
  } catch {
    urlInput.setCustomValidity('Informe uma URL válida (ex: https://exemplo.com)');
    urlInput.reportValidity();
    return;
  }
  urlInput.setCustomValidity('');

  services.push({ id: nextId++, name, url });
  saveServices();
  form.reset();
  nameInput.focus();
  render();

  if (checking) {
    needsRefresh = true;
  } else {
    refresh();
  }
});

urlInput.addEventListener('input', () => urlInput.setCustomValidity(''));
refreshButton.addEventListener('click', refresh);

render();
refresh();
