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
  pages/         Telas: Login, Dashboard, Gastos, Carteiras, Metas, EvolucaoFinanceira
  components/    Componentes reutilizáveis (modais, painéis, cartões)
  data/          Dados e mapas de apoio (ex.: bancos, posição de contas)
  service/       Integração com a API (cliente HTTP)
  style/         Estilos globais
```

> Observação: parte dos dados da carteira ainda é mantida no `localStorage` do
> navegador (sem back-end nesta etapa). As metas já são persistidas via API.
