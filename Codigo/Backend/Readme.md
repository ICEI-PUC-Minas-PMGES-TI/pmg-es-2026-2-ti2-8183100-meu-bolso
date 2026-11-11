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

### Carteira — `/api/carteiras` (requer token)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/carteiras` | Retorna a carteira do usuário (vazia se ainda não existir). |
| `PUT` | `/api/carteiras` | Substitui as listas. Exige a `versao` atual (409 se desatualizada) e valida os itens (400). |

### Gastos — `/api/gastos` (requer token)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/gastos` | Lista os gastos; antes gera as recorrências vencidas. |
| `POST` | `/api/gastos` | Cria um gasto (opcionalmente recorrente) e ajusta o saldo da carteira. |
| `PUT` | `/api/gastos/{id}` | Edita o gasto e reajusta o saldo. |
| `PATCH` | `/api/gastos/{id}/comentario` | Atualiza só o comentário. |
| `DELETE` | `/api/gastos/{id}` | Exclui o gasto e estorna o saldo. |
| `GET` | `/api/gastos/recorrentes` | Lista as regras de recorrência. |
| `PUT` | `/api/gastos/recorrentes/{id}` | Edita uma regra. |
| `DELETE` | `/api/gastos/recorrentes/{id}` | Exclui uma regra. |

### Orçamento — `/api/orcamento` (requer token)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/orcamento` | Retorna o teto mensal. |
| `PUT` | `/api/orcamento` | Define o teto mensal. |

### Assistente — `/api/assistente` (requer token)

Perguntas prontas respondidas pelo próprio back-end a partir dos dados do
usuário (sem IA nesta versão).

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/assistente/perguntas` | Lista **apenas as perguntas disponíveis** para o usuário, cada uma com seus `parametros`. |
| `POST` | `/api/assistente/perguntas/{id}` | Responde a pergunta. Body `{ "params": { ... } }` (opcional). `404` id inexistente; `400` pergunta indisponível, parâmetro obrigatório ausente ou valor de opção inválido. |

Exemplo — `GET /api/assistente/perguntas`:

```json
[
  { "id": "orcamento_status", "texto": "Estou dentro do orçamento?", "parametros": [] },
  {
    "id": "meta_faltante",
    "texto": "Quanto falta para minha meta?",
    "parametros": [
      {
        "nome": "metaId",
        "rotulo": "Qual meta?",
        "tipo": "opcao",
        "opcoes": [
          { "valor": "663f...", "rotulo": "Viagem" },
          { "valor": "664a...", "rotulo": "Carro" }
        ]
      }
    ]
  }
]
```

Exemplo — `POST /api/assistente/perguntas/meta_faltante` com body `{ "params": { "metaId": "663f..." } }`:

```json
{
  "texto": "Para a meta \"Viagem\" faltam R$ 600,00 (40% já guardado: R$ 400,00 de R$ 1.000,00). Até 20/12 são 1 mês: guarde R$ 600,00 por mês.",
  "dados": {
    "nome": "Viagem",
    "valorAlvo": 1000,
    "valorAtual": 400,
    "faltante": 600,
    "percentual": 40,
    "prazo": "2026-12-20",
    "mesesRestantes": 1,
    "porMes": 600.00,
    "situacao": "em_andamento"
  },
  "aviso": "Orientação educativa; não substitui um profissional."
}
```

#### Perguntas disponíveis

| id | texto | parâmetro | disponível quando | o que responde |
|---|---|---|---|---|
| `gastos_por_categoria` | Onde gastei mais este mês? | — | há ≥ 1 gasto no mês atual | as 3 maiores categorias do mês, com valor e % do total |
| `orcamento_status` | Estou dentro do orçamento? | — | há orçamento mensal > 0 | quanto já usou do orçamento e a situação (dentro / atenção / estourou) |
| `gasto_por_dia` | Quanto posso gastar por dia até o fim do mês? | — | há orçamento mensal > 0 | o valor livre por dia até o fim do mês |
| `maior_gasto` | Qual foi meu maior gasto do mês? | — | há ≥ 1 gasto no mês atual | o maior gasto do mês e seu % do total (empate: data mais recente) |
| `comparativo_mes` | Como foi este mês comparado ao anterior? | — | há ≥ 1 gasto no mês atual | gasto acumulado vs. o mesmo período do mês anterior, e a categoria que mais subiu |
| `meta_faltante` | Quanto falta para minha meta? | `metaId` (opcao) | há ≥ 1 meta | quanto falta para a meta escolhida e, com prazo, quanto guardar por mês |
| `metas_total_guardado` | Quanto já guardei nas metas? | — | há ≥ 1 meta | total guardado e alvo somados, % geral e a meta mais avançada |

**Notas**

- As respostas são calculadas por código — **não há IA** nesta versão.
- Nada é gravado no banco: cada chamada só lê os dados do usuário e calcula a resposta.
- O campo `aviso` traz um texto educativo fixo (RNF-07) em toda resposta.
- Perguntas que dependem de **receitas** e de **fatura de cartão** virão junto com essas funcionalidades; a **pergunta livre com IA** é planejada para uma etapa futura.

#### Como adicionar uma pergunta nova

1. **Crie a classe** em `assistente/` implementando `PerguntaPronta` (`id`, `texto`, `disponivel`, `responder`; sobrescreva `parametros` só se precisar de um seletor):

   ```java
   @Component
   public class MinhaPergunta implements PerguntaPronta {
       private final GastosDoMes gastosDoMes;
       private final Clock clock;

       public MinhaPergunta(GastosDoMes gastosDoMes, Clock clock) {
           this.gastosDoMes = gastosDoMes;
           this.clock = clock;
       }

       @Override public String id() { return "minha_pergunta"; }
       @Override public String texto() { return "Minha pergunta?"; }
       @Override public boolean disponivel(String usuarioId) { return true; }

       @Override
       public RespostaPronta responder(String usuarioId, Map<String, String> params) {
           BigDecimal total = gastosDoMes.total(usuarioId);
           return new RespostaPronta("Gastou " + FormatoBRL.moeda(total) + ".", Map.of("total", total));
       }
   }
   ```

2. **Faça os cálculos em Java**, reaproveitando `GastosDoMes`, `FormatoBRL` e o `Clock` injetado — nunca `LocalDate.now()` direto (impede testar com data fixa).
3. **Não precisa registrar nada**: a classe é um bean do Spring e o `AssistenteService` a descobre sozinho por injeção de lista.
4. **Escreva o teste unitário** com Mockito e `Clock.fixed`, comparando valores monetários com `FormatoBRL.moeda(...)` (o `NumberFormat` pt-BR usa espaço não separável após "R$").
5. **Inclua o id na constante `ORDEM`** de `Codigo/Frontend/src/pages/Assistente/Assistente.jsx`; sem isso o botão aparece no fim da lista.

## Testes

Testes unitários (JUnit 5 + Mockito + AssertJ) das regras de saldo e de metas. Não precisam de MongoDB nem do back-end no ar.

| Classe | O que cobre |
|---|---|
| `CarteiraServiceTest` | Gasto em conta, crédito e débito, estorno, dinheiro físico intocado, entradas inválidas, `saldoDe` e `ajustarSaldo` |
| `MetaServiceTest` | Depósito e retirada de meta, saldo insuficiente, carteira inválida, falha ao ajustar a carteira, meta de outro usuário (404) |
| `AssistenteServiceTest` | Lista só perguntas disponíveis com `parametros`; ordem de validação (404, 400 indisponível, 400 parâmetro ausente/inválido) |
| `GastosDoMesTest` | Soma dos gastos do mês e busca por período (limites inclusivos) |
| `GastosPorCategoriaPerguntaTest` | Top 3 categorias, percentuais, indisponível sem gastos, só o mês atual |
| `OrcamentoStatusPerguntaTest` | Situação dentro / atenção / estourou por comparação exata; indisponível sem orçamento |
| `GastoPorDiaPerguntaTest` | Valor livre por dia, arredondamento para baixo, orçamento estourado |
| `MaiorGastoPerguntaTest` | Maior gasto do mês, empate pela data mais recente, % do total |
| `ComparativoMesPerguntaTest` | Mais/menos/igual, período anterior vazio, virada de ano, categoria que mais subiu |
| `MetaFaltantePerguntaTest` | Situações da meta (em andamento, sem prazo, atingida, vencida), parâmetro `metaId` |
| `MetasTotalGuardadoPerguntaTest` | Soma e % geral, meta mais avançada (desempate alfabético), alvo zero |

### Como executar

Pré-requisito: JDK 21. No PowerShell, a partir da raiz do repositório:

```powershell
cd Codigo\Backend
.\mvnw.cmd test "-Dtest=*ServiceTest,*PerguntaTest,GastosDoMesTest"
```

As aspas são obrigatórias no PowerShell por causa da vírgula. No Linux/macOS: `./mvnw test -Dtest=*ServiceTest,*PerguntaTest,GastosDoMesTest`.

Resultado esperado (assistente + `CarteiraServiceTest`):

```
Tests run: 72, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

> Em JDK muito recente (ex.: 25), `MetaServiceTest` falha ao criar mocks da classe concreta `CarteiraService` — limitação do Mockito/ByteBuddy, não do código. Nesse caso rode com JDK 21 ou exclua essa classe do filtro.

Em caso de falha, o Maven mostra o nome do teste e o valor esperado contra o obtido.

> `.\mvnw.cmd test` sem filtro também roda `MeuBolsoApplicationTests`, que sobe o Spring e exige MongoDB e as variáveis do `.env` disponíveis.

## Estrutura do código

```
src/main/java/Projeto/MeuBolso/
  Config/        Configuração de segurança e do Clock (SecurityConfig, ClockConfig)
  assistente/    Perguntas prontas do assistente (PerguntaPronta, AssistenteService/Controller, GastosDoMes, FormatoBRL e as *Pergunta)
  controller/    Endpoints REST (Auth, Usuario, Meta, Gasto, Orcamento, Carteira)
  model/         Entidades e DTOs (Usuario, Meta, Gasto, Recorrencia, Orcamento, CarteiraUsuario, *Dtos)
  repository/    Repositórios Spring Data MongoDB
  security/      Filtro de autenticação JWT
  service/       Token, UserDetailsService, recorrência de gastos e ajuste de saldos da carteira
```
