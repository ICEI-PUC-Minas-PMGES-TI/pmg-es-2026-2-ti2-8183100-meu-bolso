# Meu Bolso — Front-end

Aplicação web do **Meu Bolso** construída com **React + Vite**. Consome a API
REST do back-end e entrega as telas de autenticação, dashboard, gastos,
carteiras, metas e evolução financeira.

## Tecnologias

- **React 19** com **Vite** (dev server e build)
- **React Router** (navegação entre páginas)
- **lucide-react** (ícones)
- **ESLint** (padronização de código)

## Pré-requisitos

- Node.js 20+ e npm
- O back-end em execução (ver [`Codigo/Backend`](../Backend/Readme.md)) para as telas que dependem de dados.

## Variáveis de ambiente

Copie `.env.example` para `.env`. Variáveis do Vite precisam do prefixo `VITE_`.

| Variável | Descrição |
|---|---|
| `VITE_EMAIL_TESTE` | E-mail usado para preencher o login em desenvolvimento. |
| `VITE_SENHA_TESTE` | Senha usada para preencher o login em desenvolvimento. |
| `VITE_GASTOS_API` | `true` faz a página de Gastos usar a API; sem ela, usa o `localStorage`. |

## Como executar

```bash
npm install
npm run dev      # ambiente de desenvolvimento em http://localhost:5173
```

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Sobe o servidor de desenvolvimento com HMR. |
| `npm run build` | Gera o build de produção em `dist/`. |
| `npm run preview` | Serve localmente o build de produção. |
| `npm run lint` | Executa o ESLint. |

## Estrutura do código

```
src/
  App.jsx        Rotas e layout principal
  main.jsx       Ponto de entrada
  pages/         Telas: Login, Dashboard, Gastos, Carteiras, Metas, EvolucaoFinanceira, Simulacao, Assistente (/assistente — perguntas prontas e chat com IA)
  components/    Componentes reutilizáveis (modais, painéis, cartões)
  data/          Dados e mapas de apoio (ex.: bancos, posição de contas)
  service/       Integração com a API (cliente HTTP)
  style/         Estilos globais
```

> Observação: carteira, gastos e metas são persistidos via API; o `localStorage` guarda apenas a sessão (token e usuário).

## Página do assistente

A tela (`/assistente`) tem duas abas sob o mesmo hero com o orbe do Jarvis:
**Perguntas rápidas** (cartões calculados pelo back-end, sem IA) e
**Conversar com o Jarvis** (chat com IA).

Arquivos em `src/pages/Assistente/`:

- `Assistente.jsx` — a tela: hero, abas, cartões de sugestão, painel de parâmetros e a conversa das perguntas rápidas. O mapa `PERGUNTAS_UI` liga cada `id` de pergunta a um ícone (lucide) e a um rótulo curto do cartão; `ORDEM` fixa a ordem de exibição dos cartões.
- `ChatIA.jsx` — a aba de chat com IA (ver abaixo).
- `MensagemAssistente.jsx` — um balão; a resposta do assistente é "digitada" progressivamente. O estado do texto digitado vive só aqui (componente em `memo`). Usado pelas duas abas.
- `OrbeJarvis.jsx` — o orbe do hero; recebe a prop `estado`.
- `AssistenteContext.js` — o contexto e o hook `useAssistente()`.
- `AssistenteProvider.jsx` — provê a conversa das perguntas rápidas. Fica acima do `Layout` (dentro da rota protegida), então a conversa persiste ao navegar e some ao sair. Ela vive **só em memória** (sem `localStorage`).
- `Assistente.module.css` / `ChatIA.module.css` / `MensagemAssistente.module.css` / `OrbeJarvis.module.css` — estilos (só variáveis do `global.css`).

### Aba "Perguntas rápidas"

Cartões de perguntas prontas calculadas pelo back-end. Perguntas sem parâmetro
respondem ao clique; as com parâmetro `opcao` abrem um painel com `<select>`.
A conversa é persistida pelo `AssistenteProvider` (só em memória). `PERGUNTAS_UI`
define ícone e rótulo de cada `id`; `ORDEM` define a ordem dos cartões.

### Aba "Conversar com o Jarvis" (`ChatIA.jsx`)

Chat com IA de **estado local**: não persiste ao sair da página nem passa pelo
`AssistenteProvider`. Detalhes:

- Campo com limite de **500 caracteres**.
- Histórico enviado à API: as **últimas 10 mensagens** (sem balões de erro). Respostas que vieram de uma ferramenta vão só como a etiqueta `Consultei: <ferramenta>`, nunca com os valores; todo texto é truncado a 500 caracteres.
- Erros viram balões com a mensagem amigável devolvida pela API (ou um texto padrão).
- Contador de **mensagens restantes do dia** na dica abaixo do campo (singular/zero tratados), preenchido após a primeira resposta.
- Chips de sugestão só no estado inicial (conversa vazia); ao clicar, preenchem o campo.
- Botão **"Limpar conversa"** (aparece quando há mensagens) zera o chat.

### Animações (iguais nas duas abas)

A resposta do assistente é digitada progressivamente via `MensagemAssistente`, e o
orbe tem os estados `"parado"`, `"pensando"` (aguardando a API) e `"falando"`
(digitando a resposta). Nas perguntas rápidas o estado vem do `useAssistente()`;
no chat, o `ChatIA` informa o estado ao `Assistente.jsx` pela prop `onEstadoChange`,
e a tela usa esse estado quando a aba do chat está ativa.

### Chamada de API do chat

`assistenteApi.conversar(mensagens)` → `POST /api/assistente/chat`.

- Requisição: `{ mensagens: [{ papel, texto }] }`, onde `papel` é `"user"` ou `"assistant"`.
- Resposta: `{ resposta, ferramenta, restantesHoje }` — `ferramenta` é o id da consulta usada (ou nulo) e `restantesHoje` alimenta o contador do dia.
- Erros esperados: `401` (sessão expirada — o cliente encerra a sessão local), `429` (limite diário atingido) e `503` (IA indisponível). Em todos, a tela mostra um balão de erro com a mensagem amigável da API.

Para adicionar uma pergunta nova nos cards, inclua uma entrada em `PERGUNTAS_UI`
(`id: { Icone, rotulo }`) e, se quiser controlar a ordem, acrescente o `id` em
`ORDEM`. Sem entrada no mapa, a pergunta usa o ícone `Sparkles` e o texto da API.
