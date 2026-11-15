# MeuBolso

O Meu Bolso tem como objetivo auxiliar jovens que estão começando a administrar o próprio dinheiro, especialmente após receberem seus primeiros salários. O projeto busca ajudá-los a desenvolver melhores hábitos financeiros, facilitando o planejamento da renda, o controle de gastos, a criação de reservas e a definição de metas e prioridades.

## Alunos integrantes da equipe

* Arthur Moraes Braga Araujo
* Daniel Eiji Serra Tsuruga
* David Aurelio Pedrosa
* Gabriel de Souza Junqueira Hermont
* Vinicius Eduardo de Souza Matos Silva

## Professores responsáveis

* Rommel Vieira Carneiro
* Cleiton Silva Tavares
* Rafael Henrique Nogueira Diniz

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Front-end | React 19, Vite, React Router, lucide-react |
| Back-end | Java 21, Spring Boot 3.3, Spring Security, JWT (jjwt) |
| Banco de dados | MongoDB 7 |
| Infraestrutura | Docker / Docker Compose |

## Estrutura do repositório

```
Codigo/
  Backend/    API REST em Spring Boot (autenticação JWT, MongoDB)
  Frontend/   Aplicação web em React + Vite
Documentacao/ Documento do projeto, modelo de dados e artefatos
Artefatos/    Índice dos artefatos de Design Thinking e protótipos
Divulgacao/   Vídeo e apresentação
```

## Instruções de utilização

Pré-requisitos: **Java 21**, **Node.js 20+** e **Docker** (para o MongoDB). Como alternativa ao Docker, é possível usar um MongoDB local na porta `27017`.

### 1. Banco de dados e back-end

```bash
cd Codigo/Backend
cp .env.example .env          # defina APP_JWT_SECRET (32+ caracteres)
docker compose up -d          # sobe MongoDB (e o back-end, se desejar)
```

Para rodar apenas o MongoDB no Docker e o back-end localmente:

```bash
docker compose up -d mongodb
./mvnw spring-boot:run        # Windows: mvnw.cmd spring-boot:run
```

A API sobe em `http://localhost:8080`.

### 2. Front-end

```bash
cd Codigo/Frontend
cp .env.example .env          # ajuste as variáveis, se necessário
npm install
npm run dev
```

A aplicação abre em `http://localhost:5173`.

### 3. Chatbot do WhatsApp (opcional)

O chatbot precisa do back-end e do [WAHA](https://waha.devlike.pro/) (em container Docker) rodando no mesmo ambiente. Passo a passo em [`Documentacao/ChatbotWhatsApp.md`](Documentacao/ChatbotWhatsApp.md).

### 4. Chat com IA do assistente (opcional)

O chat **"Conversar com o Jarvis"** da página do assistente usa o **Gemini** do Google. Só quem executa o back-end precisa de uma chave; os usuários do site não precisam de nada. Sem chave, o chat mostra um aviso de indisponível e o resto do app funciona normalmente.

1. Crie uma chave no [Google AI Studio](https://aistudio.google.com).
2. Coloque-a em `GEMINI_API_KEY` no `Codigo/Backend/.env` (nunca versione a chave; nunca a coloque no `.env.example`). Opcionalmente, defina `GEMINI_MODELO` com um modelo liberado na sua conta.

```bash
GEMINI_API_KEY=sua-chave-aqui
GEMINI_MODELO=nome-do-modelo
```

3. Reinicie o back-end.

> A cota gratuita é compartilhada por todos os usuários do servidor, por isso há limites de mensagens por usuário e por dia. No nível gratuito, o Google pode usar prompts e respostas para melhorar seus produtos — não digite dados pessoais no chat.

Detalhes de variáveis, limites, privacidade e ferramentas em [Assistente com IA (Jarvis)](Codigo/Backend/Readme.md#assistente-com-ia-jarvis).

> Detalhes de variáveis de ambiente e endpoints estão nos READMEs de [`Codigo/Backend`](Codigo/Backend/Readme.md) e [`Codigo/Frontend`](Codigo/Frontend/README.md) — incluindo o chat com IA do assistente.
