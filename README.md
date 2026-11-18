# NetPulse

Monitor de disponibilidade de sites e APIs direto no navegador, sem dependências e sem build.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)

Cadastre serviços, acompanhe o status de cada um em tempo real e veja o tempo de resposta em milissegundos. Os serviços ficam salvos no navegador e são verificados automaticamente a cada 30 segundos.

## Funcionalidades

- Cadastro de serviços com nome e URL (aceita links sem protocolo, como `exemplo.com`).
- Remoção de serviços com um clique.
- Status visual por serviço: **Online** (verde), **Offline** (vermelho) ou pendente.
- Tempo de resposta em milissegundos.
- Fallback automático com `mode: 'no-cors'` para sites que bloqueiam CORS — nesse caso o status aparece como **Online (sem CORS)**.
- Atualização automática a cada 30 segundos usando `setTimeout` recursivo (sem `setInterval`).
- Contagem regressiva para a próxima atualização e botão para pausar/retomar o monitoramento.
- Botão **Atualizar Agora** para disparar uma checagem manual.
- Persistência dos serviços no `localStorage`.
- Dois serviços padrão na primeira abertura: GitHub API e JSONPlaceholder.

## Como rodar

O projeto usa ES Modules (`import`/`export`), então precisa ser servido via HTTP — abrir o `index.html` diretamente com `file://` não funciona na maioria dos navegadores.

```bash
# na raiz do projeto
python3 -m http.server 8000
```

Depois acesse [http://localhost:8000](http://localhost:8000).

Também funciona com qualquer servidor estático, como `npx serve` ou a extensão Live Server do VS Code.

## Estrutura do projeto

```
NetPulse/
├── index.html      # Estrutura da interface
├── style.css       # Estilos
└── js/
    ├── main.js     # Estado, renderização, formulário e ciclo automático
    └── monitor.js  # Checagem de disponibilidade (HTTP)
```

## Como funciona

### Checagem de disponibilidade

`checkService(url, timeoutMs = 5000)` faz um `fetch` com `AbortController` e timeout de 5 segundos. Se a requisição falhar por rede ou CORS, uma segunda tentativa é feita com `mode: 'no-cors'` dentro do mesmo timeout. Respostas opacas resolvem sem erro, mas não permitem ler status HTTP — por isso são exibidas como **Online (sem CORS)**.

`checkAllServices(servicesList)` dispara todas as checagens em paralelo com `.map()` e aguarda com `Promise.allSettled()`, retornando um array consolidado com os dados do serviço, o resultado da checagem e um `checkedAt` em ISO 8601.

### Persistência

Os serviços são serializados em JSON e armazenados no `localStorage` sob a chave `netpulse_services`. Ao abrir a página, o app carrega os dados salvos; se não houver nada, usa e salva a lista padrão. Novos IDs são sempre maiores que o maior ID existente, evitando colisões.

### Atualização automática

O próximo ciclo de 30 segundos só é agendado depois que a checagem atual termina. O botão **Pausar Auto** cancela o `setTimeout` pendente, e o **Retomar Auto** reinicia o ciclo. Uma checagem manual também reinicia a contagem para 30 segundos ao final.

## Limitações

- Respostas `no-cors` são opacas: não é possível distinguir um HTTP 200 de um 500, apenas confirmar que o host respondeu.
- Sites com proteção a requisições de terceiros podem falhar mesmo com o fallback.
- A precisão do tempo de resposta depende do navegador e da rede; quando o fallback é usado, a latência inclui as duas tentativas.

## Tecnologias

HTML5, CSS3 e JavaScript puro — sem frameworks, sem gerenciador de pacotes e sem etapa de build.
