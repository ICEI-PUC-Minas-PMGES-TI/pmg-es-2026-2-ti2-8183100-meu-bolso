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
  pages/         Telas: Login, Dashboard, Gastos, Carteiras, Metas, EvolucaoFinanceira, Simulacao, Assistente (/assistente — perguntas prontas calculadas pelo back-end)
  components/    Componentes reutilizáveis (modais, painéis, cartões)
  data/          Dados e mapas de apoio (ex.: bancos, posição de contas)
  service/       Integração com a API (cliente HTTP)
  style/         Estilos globais
```

> Observação: carteira, gastos e metas são persistidos via API; o `localStorage` guarda apenas a sessão (token e usuário).

## Página do assistente

Arquivos em `src/pages/Assistente/`:

- `Assistente.jsx` — a tela: hero, cartões de sugestão, painel de parâmetros e a conversa. O mapa `PERGUNTAS_UI` liga cada `id` de pergunta a um ícone (lucide) e a um rótulo curto do cartão.
- `Assistente.module.css` / `JarvisAvatar.module.css` / `MensagemAssistente.module.css` — estilos (só variáveis do `global.css`).
- `AssistenteContext.js` — o contexto e o hook `useAssistente()`.
- `AssistenteProvider.jsx` — provê a conversa. Fica acima do `Layout` (dentro da rota protegida), então a conversa persiste ao navegar e some ao sair. Ela vive **só em memória** (sem `localStorage`).
- `MensagemAssistente.jsx` — um balão; a resposta do assistente é "digitada" progressivamente. O estado do texto digitado vive só aqui (componente em `memo`).
- `JarvisAvatar.jsx` — o avatar; recebe a prop `estado`.

`useAssistente()` expõe o estado derivado `estado`: `"parado"`, `"pensando"` (aguardando a API) ou `"falando"` (digitando a resposta). O `JarvisAvatar` reage a esse `estado` via prop — é o ponto onde o orbe animado será encaixado numa etapa futura.

Para adicionar uma pergunta nova no visual, inclua uma entrada em `PERGUNTAS_UI` (`id: { Icone, rotulo }`) e, se quiser controlar a ordem, acrescente o `id` em `ORDEM`. Sem entrada no mapa, a pergunta usa o ícone `Sparkles` e o texto da API.
