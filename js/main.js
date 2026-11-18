import { checkAllServices } from './monitor.js';

const form = document.getElementById('service-form');
const nameInput = document.getElementById('service-name');
const urlInput = document.getElementById('service-url');
const refreshButton = document.getElementById('refresh');
const list = document.getElementById('services');

const services = [];
let results = new Map();
let nextId = 1;
let checking = false;
let needsRefresh = false;

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

    card.append(info, status, latency);
    list.append(card);
  }
}

async function refresh() {
  if (checking || services.length === 0) return;

  checking = true;
  refreshButton.disabled = true;
  refreshButton.textContent = 'Atualizando...';

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
    }
  }
}

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
