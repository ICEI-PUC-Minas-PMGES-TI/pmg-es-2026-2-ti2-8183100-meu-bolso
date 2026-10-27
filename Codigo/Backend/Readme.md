# Meu Bolso — Back-end

API REST do **Meu Bolso**: autenticação de usuários com JWT e persistência em MongoDB.

## Tecnologias

- **Java 21** e **Spring Boot 3.3**
- **Spring Web** (API REST) e **Spring Security** (autenticação)
- **Spring Data MongoDB** (persistência)
- **JWT** com [jjwt](https://github.com/jwtk/jjwt) 0.12
- **spring-dotenv** (lê o `.env` em desenvolvimento local)
- **Bean Validation** (validação dos dados de entrada)

## Pré-requisitos

- Java 21 (JDK)
- Docker (para o MongoDB) ou um MongoDB local na porta `27017`
- O wrapper do Maven (`mvnw` / `mvnw.cmd`) já acompanha o projeto — não é preciso instalar o Maven.

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha. O `.env` **não** é versionado.

| Variável | Obrigatória | Padrão (dev) | Descrição |
|---|---|---|---|
| `APP_JWT_SECRET` | Sim | — | Segredo de assinatura do JWT (mínimo **32 caracteres**). |
| `MONGODB_URI` | Não | `mongodb://localhost:27017/meubolso` | String de conexão do MongoDB. |
| `APP_JWT_EXPIRATION_MS` | Não | `86400000` (24h) | Validade do token, em milissegundos. |
| `APP_FRONTEND_URL` | Não | `http://localhost:5173` | URL do front-end. |

## Como executar

### Opção A — tudo no Docker

```bash
cp .env.example .env     # defina APP_JWT_SECRET
docker compose up -d     # sobe MongoDB + back-end
```

### Opção B — MongoDB no Docker, back-end local

```bash
cp .env.example .env
docker compose up -d mongodb
./mvnw spring-boot:run   # Windows: mvnw.cmd spring-boot:run
```

A API fica disponível em `http://localhost:8080`.

### Testes

```bash
./mvnw test              # Windows: mvnw.cmd test
```

## Autenticação

A API usa **JWT Bearer**. As rotas em `/api/auth/**` são públicas; todas as
demais exigem o cabeçalho:

```
Authorization: Bearer <token>
```

O token é obtido no login e identifica o usuário pelo e-mail.

## Endpoints

### Autenticação — `/api/auth` (público)

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/auth/register` | Cadastra um usuário (nome, e-mail, telefone, senha). |
| `POST` | `/api/auth/login` | Autentica e retorna o token JWT. |

### Usuário autenticado — `/api/usuarios` (requer token)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/usuarios/me` | Dados do usuário logado. |
| `PUT` | `/api/usuarios/me` | Atualiza nome, telefone e e-mail (reemite o token). |
| `PUT` | `/api/usuarios/me/senha` | Troca a senha (exige a senha atual). |

### Metas — `/api/metas` (requer token)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/metas` | Lista as metas do usuário. |
| `POST` | `/api/metas` | Cria uma meta (nome, valorAlvo, prazo, prioridade). |
| `PUT` | `/api/metas/{id}` | Edita os dados da meta (não altera o valor acumulado). |
| `DELETE` | `/api/metas/{id}` | Exclui a meta. |

## Estrutura do código

```
src/main/java/Projeto/MeuBolso/
  Config/        Configuração de segurança (SecurityConfig)
  controller/    Endpoints REST (Auth, Usuario, Meta)
  model/         Entidades e DTOs (Usuario, Meta, *Dtos)
  repository/    Repositórios Spring Data MongoDB
  security/      Filtro de autenticação JWT
  service/       Geração de token e UserDetailsService
```
