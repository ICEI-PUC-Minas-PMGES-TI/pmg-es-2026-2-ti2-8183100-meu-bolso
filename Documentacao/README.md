# 💰 Meu Bolso 👨‍💻

> Aplicação web de **controle e educação financeira** para jovens que estão começando a lidar com dinheiro próprio (mesada, primeiro salário ou aumento de renda), com um **assistente de IA** que transforma os dados do usuário em orientações práticas e em linguagem acessível.

<table>
  <tr>
    <td width="800px">
      <div align="justify">
        O <b>Meu Bolso</b> é uma aplicação web de controle e educação financeira pessoal voltada a jovens que estão começando a lidar com dinheiro próprio. A proposta é oferecer um espaço simples para registrar o que se gasta, acompanhar o que se recebe e o que se guarda, definir metas e receber, por meio de um assistente baseado em inteligência artificial, orientações em linguagem acessível sobre os próprios hábitos financeiros. O projeto foi concebido na disciplina de <b>Trabalho Interdisciplinar</b> do Instituto de Ciências Exatas e Informática (ICEI) da PUC Minas, seguindo as etapas de <b>Design Thinking</b> (empatia, definição, ideação e prototipação), e está associado ao <b>ODS 8</b> (trabalho decente e crescimento econômico) da Agenda 2030 da ONU.
      </div>
    </td>
  </tr>
</table>

---

## 🚧 Status do Projeto

![Status](https://img.shields.io/badge/Status-Em%20concepção%20e%20início%20de%20desenvolvimento-yellow?style=for-the-badge)
![Etapa](https://img.shields.io/badge/Etapa-Design%20Thinking%20concluído-blue?style=for-the-badge)
![Disciplina](https://img.shields.io/badge/PUC%20Minas-Trabalho%20Interdisciplinar-007ec6?style=for-the-badge)

> As etapas de **Empatizar**, **Definir** e **Idear** estão concluídas. A **Prototipação** está em andamento e a **Implementação** do MVP está em início. As seções técnicas (tecnologias, instalação, execução) serão preenchidas conforme o desenvolvimento avançar.

---

## 📚 Índice

- [Integrantes e Orientador](#-integrantes-e-orientador)
- [1. Contexto do Projeto](#1-contexto-do-projeto)
- [2. Personas e Mapas de Empatia](#2-personas-e-mapas-de-empatia)
- [3. Especificação do Projeto](#3-especificação-do-projeto)
- [4. Priorização das Funcionalidades (Kanban)](#4-priorização-das-funcionalidades-kanban)
- [5. Metodologia](#5-metodologia)
- [6. Tecnologias (planejadas)](#6-tecnologias-planejadas)
- [7. Referências](#7-referências)

---

## 👥 Integrantes e Orientador

**Integrantes da equipe:**

- Arthur Moraes
- Daniel Eiji
- David Aurélio
- Gabriel Hermont
- Vinicius Eduardo

**Orientador(a):** 

- Rommel Vieira Carneiro
- Cleiton Silva Tavares
- Rafael Henrique Nogueira Diniz

# 1. Contexto do Projeto

## 1.1 Introdução

O **Meu Bolso** é uma aplicação web de controle e educação financeira pessoal voltada a jovens que estão começando a lidar com dinheiro próprio, seja pela mesada, pelo primeiro salário ou por um aumento de renda. A ideia central é oferecer ao jovem um espaço simples para registrar o que gasta, acompanhar o que recebe e o que guarda, definir metas e receber, por meio de um assistente baseado em inteligência artificial, retornos e orientações em linguagem acessível sobre os próprios hábitos financeiros.

## 1.2 Problema

Jovens que passam a ter renda própria, seja por mesada, primeiro salário ou aumento, têm dificuldade para controlar os gastos, guardar dinheiro e decidir o destino da renda, porque não dispõem de ferramentas simples e de orientação prática adequadas à sua realidade.

- **Quem sofre esse problema:** jovens de cerca de 15 a 20 anos, entre estudantes, estagiários e pessoas em início de carreira, que recebem mesada, o primeiro salário ou um aumento e ainda não construíram o hábito de planejar o dinheiro. De forma indireta, o problema também afeta pais e responsáveis.
- **Quando e onde acontece:** o problema surge quando a renda muda (primeiro recebimento ou após um aumento) e se repete no dia a dia, nas decisões de compra. Ele se intensifica em ambientes digitais — lojas online, aplicativos e redes sociais — nos quais promoções, parcelamentos e influenciadores digitais facilitam compras por impulso.

## 1.3 Objetivos

**Objetivo geral.** Desenvolver o Meu Bolso, uma aplicação web que ajude jovens de 15 a 20 anos a registrar, acompanhar e planejar seus gastos e objetivos financeiros, com o apoio de um assistente de inteligência artificial que oferece orientações educativas em linguagem acessível.

**Objetivos específicos.**

- Compreender o comportamento financeiro do público-alvo por meio de pesquisa qualitativa e das técnicas de Design Thinking.
- Definir personas, mapas de empatia e proposta de valor que orientem as decisões de projeto.
- Especificar os requisitos funcionais e não funcionais da aplicação.
- Implementar as funcionalidades prioritárias: registro de gastos, resumo financeiro, metas e reserva.
- Integrar um assistente de IA que analise os dados do usuário e devolva orientações claras e educativas.
- Garantir a segurança e a privacidade dos dados pessoais e financeiros dos usuários.
- Validar o protótipo e a versão inicial com pessoas do público-alvo e ajustar a solução a partir do retorno obtido.

## 1.4 Justificativa

O primeiro contato com renda própria é um momento de formação de hábitos, e a falta de preparo nessa fase tem reflexo mensurável. No PISA 2022, cerca de 45% dos estudantes brasileiros de 15 anos apresentaram baixo desempenho em alfabetização financeira, e a pontuação média do país (416 pontos) ficou abaixo da média da OCDE (498 pontos) (FOLHA VITÓRIA, 2024; OECD, 2024). A educação financeira também é política pública no Brasil, por meio da Estratégia Nacional de Educação Financeira (ENEF), instituída em 2020 (BRASIL, 2020).

A pesquisa qualitativa da equipe reforçou que o problema não é apenas falta de informação, mas a dificuldade de transformá-la em hábito. Por isso, o Meu Bolso propõe uma solução **simples**, de **linguagem acessível** e que usa **inteligência artificial** para transformar os dados do próprio usuário em orientação prática — e não em conteúdo genérico.

## 1.5 Público-alvo

- **Público primário:** jovens de 15 a 20 anos que recebem mesada, o primeiro salário ou um aumento e ainda têm pouco controle sobre os próprios gastos. As personas do projeto têm entre 19 e 22 anos e representam a extensão natural desse público para os primeiros anos de renda própria. São pessoas familiarizadas com smartphone e internet.
- **Público secundário:** pais e responsáveis, que acompanham a vida financeira dos jovens e podem incentivar o uso da ferramenta, e instituições de ensino interessadas em ações de educação financeira.

---

# 2. Personas e Mapas de Empatia

A partir das entrevistas e da Matriz CSD, a equipe construiu três personas que representam momentos diferentes do início da vida financeira. Apesar de estarem em momentos diferentes, elas compartilham a mesma raiz de problema: querem controlar melhor o dinheiro e começar a investir, mas têm insegurança sobre como decidir.

## 2.1 Visão geral das personas

| | Lucas Martins | Matheus Oliveira | Gabriel Santos |
|---|---|---|---|
| **Idade e renda** | 19 anos; R$ 1.800/mês | 21 anos; de R$ 2.500 para R$ 4.200/mês | 22 anos; R$ 2.000 a R$ 2.500/mês |
| **Local** | Contagem (MG) | Belo Horizonte (MG) | Belo Horizonte (MG) |
| **Momento de vida** | Primeiro salário, como estagiário | Primeira promoção, para analista | Início da carreira, recém-formado |
| **Valores** | Segurança financeira, organização e responsabilidade | Responsabilidade, crescimento, estabilidade e reconhecimento profissional | Independência, crescimento e objetivos de longo prazo |
| **Principal dor** | Não sabe onde investir e tem dificuldade para equilibrar consumo e economia | Comparação social e dificuldade para priorizar o uso do aumento | Excesso de informação e dificuldade de transformar conhecimento em hábito |
| **Principal objetivo** | Manter reserva, aprender a investir e controlar os gastos | Decidir com segurança como usar o aumento de renda | Construir reserva, investir e conquistar independência |

## 2.2 Lucas Martins — Mapa de Empatia

Lucas tem 19 anos, mora em Contagem (MG), está no início da graduação e faz estágio, com renda de R$ 1.800 por mês. Planeja os gastos antes de receber, acompanha o saldo pelo aplicativo do banco e mantém uma reserva para imprevistos, mas ainda não sabe como investir e tem dificuldade para controlar a vontade de gastar.

| Quadrante | Conteúdo |
|---|---|
| **Pensa e sente** | Quer ter controle sobre o dinheiro. Sente segurança quando consegue guardar. Tem dúvidas sobre como investir. Quer aproveitar o salário sem comprometer o futuro. |
| **Ouve** | Conselhos de familiares sobre economizar, conteúdos sobre investimentos e educação financeira, recomendações de amigos e informações da internet. |
| **Vê** | Pessoas consumindo, promoções e ofertas, conteúdos sobre investimentos nas redes sociais e diferentes opções para guardar ou investir. |
| **Diz e faz** | Planeja os gastos antes de receber, acompanha o saldo pelo app do banco e guarda dinheiro para imprevistos. |
| **Dores** | Não sabe onde investir. Tem medo de tomar uma decisão financeira errada. Dificuldade para equilibrar consumo e economia. |
| **Ganhos** | Aprender a investir, realizar seus objetivos e tomar decisões com mais confiança. |

## 2.3 Matheus Oliveira — Mapa de Empatia

Matheus tem 21 anos, mora em Belo Horizonte (MG) e foi promovido de estagiário a analista, com renda que passou de R$ 2.500 para R$ 4.200 por mês. Vê colegas aumentarem os gastos após promoções e não quer repetir o padrão, mas não sabe como equilibrar aproveitar a conquista com investir no futuro.

| Quadrante | Conteúdo |
|---|---|
| **Pensa e sente** | Quer aproveitar a conquista da promoção. Sente insegurança sobre a melhor forma de usar o dinheiro extra. Teme repetir o padrão de gastar tudo, como os colegas. |
| **Ouve** | Colegas comentando sobre compras novas depois de aumentos, família sugerindo que é hora de investir e influenciadores de finanças nas redes sociais. |
| **Vê** | Colegas trocando de carro ou mudando para apartamentos melhores após promoções, conteúdos sobre liberdade financeira e anúncios de produtos de status. |
| **Diz e faz** | Pesquisa opções de investimento, mas adia a decisão. Conversa com amigos e colegas e compara ofertas de bancos e corretoras sem chegar a uma conclusão. |
| **Dores** | Medo de tomar a decisão errada, comparação social constante e dificuldade para definir prioridades financeiras claras. |
| **Ganhos** | Aumentar o patrimônio no longo prazo, equilibrar qualidade de vida e segurança futura e sentir-se no controle das próprias finanças. |

## 2.4 Gabriel Santos — Mapa de Empatia

Gabriel tem 22 anos, mora em Belo Horizonte (MG), concluiu recentemente o ensino superior e trabalha como jovem profissional, com renda entre R$ 2.000 e R$ 2.500 por mês. Consome muita informação sobre finanças, mas percebe que saber não significa manter um planejamento.

| Quadrante | Conteúdo |
|---|---|
| **Pensa e sente** | Quer conquistar independência financeira, pensa bastante no futuro, quer melhorar a renda e tem dúvidas sobre investimentos. |
| **Ouve** | Conselhos de família e amigos sobre organização financeira e conteúdos de influenciadores e especialistas sobre investimentos e independência financeira. |
| **Vê** | Muitas informações sobre finanças na internet, diferentes formas de investir e pessoas falando sobre independência financeira. |
| **Diz e faz** | Pesquisa informações financeiras, compara alternativas, acompanha a própria situação financeira e pensa antes de tomar decisões importantes. |
| **Dores** | Insegurança sobre investimentos, medo de escolher errado e dificuldade para definir prioridades. |
| **Ganhos** | Conquistar independência financeira, construir uma reserva e investir melhor. |

---

# 3. Especificação do Projeto

## 3.1 Proposta de valor

Em vez de apenas informar, o Meu Bolso permite **testar decisões sem consequências reais** e **visualizar o impacto de cada escolha**, transformando os dados do próprio usuário em orientação prática.

## 3.2 Requisitos funcionais (RF)

| ID | Requisito | Descrição | Origem |
|---|---|---|---|
| **RF-01** | Registrar e categorizar gastos | Registrar os gastos realizados e organizá-los por categoria ao longo do mês. | Lucas, Matheus, Gabriel |
| **RF-02** | Definir metas financeiras | Criar objetivos de curto e longo prazo e acompanhar quanto falta para alcançá-los. | Lucas, Matheus |
| **RF-03** | Construir reserva financeira | Definir uma meta de reserva e acompanhar o progresso até atingi-la. | Gabriel |
| **RF-04** | Planejar a renda e os gastos mensais | Dividir a renda entre gastos, economia e objetivos, com valores previstos por categoria. | Lucas, Matheus |
| **RF-05** | Definir prioridades | Organizar os objetivos financeiros por importância e prazo. | Matheus, Gabriel |
| **RF-06** | Exibir resumo e evolução financeira | Mostrar quanto foi recebido, gasto e guardado e a evolução ao longo do tempo. | Lucas, Matheus, Gabriel |
| **RF-07** | Orientar sobre investimentos | Apresentar informações básicas e claras sobre como e onde investir. | Lucas, Gabriel |
| **RF-08** | Simular cenários e compras | Testar uma decisão (compra ou objetivo) e ver o impacto no orçamento futuro sem risco real. | Proposta de valor das três personas |
| **RF-09** | Receber orientações do assistente de IA | Analisar gastos e metas do usuário e devolver retornos e recomendações educativas em linguagem acessível. | Objetivo do projeto |
| **RF-10** | Gerenciar a conta do usuário | Cadastro e acesso com login, garantindo que cada usuário veja apenas os próprios dados. | Decorrente do RNF-04 |

## 3.3 Requisitos não funcionais (RNF)

| ID | Requisito | Descrição |
|---|---|---|
| **RNF-01** | Interface intuitiva e organizada | O sistema deve ser simples e fácil de usar, com informações claras e organizadas. |
| **RNF-02** | Linguagem acessível | As informações financeiras devem usar termos fáceis de compreender. |
| **RNF-03** | Responsividade | O sistema deve funcionar em celulares e computadores, adaptando-se a diferentes telas. |
| **RNF-04** | Segurança e privacidade | Dados pessoais e financeiros armazenados de forma segura e em conformidade com a LGPD. |
| **RNF-05** | Bom desempenho | O sistema deve responder rapidamente às ações do usuário. |
| **RNF-06** | Disponibilidade | O sistema deve estar disponível pela internet sempre que necessário. |
| **RNF-07** | Transparência da IA | Deixar claro que as orientações do assistente têm caráter educativo e não substituem consultoria financeira profissional. |

## 3.4 Rastreabilidade entre personas e requisitos funcionais

| Requisito | Lucas | Matheus | Gabriel |
|---|:---:|:---:|:---:|
| RF-01 Registrar e categorizar gastos | ● | ● | ● |
| RF-02 Definir metas financeiras | ● | ● | – |
| RF-03 Construir reserva financeira | – | – | ● |
| RF-04 Planejar a renda e os gastos mensais | ● | ● | – |
| RF-05 Definir prioridades | – | ● | ● |
| RF-06 Exibir resumo e evolução financeira | ● | ● | ● |
| RF-07 Orientar sobre investimentos | ● | – | ● |
| RF-08 Simular cenários e compras | ● | ● | ● |
| RF-09 Receber orientações do assistente de IA | ● | ● | ● |
| RF-10 Gerenciar a conta do usuário | ● | ● | ● |

---

# 4. Priorização das Funcionalidades (Kanban)

As funcionalidades foram agrupadas em sete entregas e classificadas em quatro níveis de prioridade, considerando três critérios: quantas personas a funcionalidade atende, se ela é pré-requisito para as demais e o esforço de implementação frente ao prazo da disciplina. Os **obrigatórios** e **importantes** compõem o **MVP**.

| 🔴 Obrigatórios | 🟠 Importantes | 🔵 Desejáveis | ⚪ Opcionais |
|---|---|---|---|
| **F1 — Conta e registro de gastos** <br> Cadastro com login seguro e registro de gastos por categoria. <br> `RF-10, RF-01` | **F3 — Resumo e evolução financeira** <br> Painel com o que foi recebido, gasto e guardado. <br> `RF-06` | **F5 — Planejamento mensal e prioridades** <br> Divisão da renda por categoria e organização dos objetivos por prazo. <br> `RF-04, RF-05` | **F7 — Simulador de cenários e compras** <br> Teste de decisões e impacto no orçamento futuro. <br> `RF-08` |
| **F2 — Assistente de IA** <br> Análise dos gastos do usuário com retorno e orientações em linguagem simples. <br> `RF-09` | **F4 — Metas e reserva** <br> Criação de metas e de reserva, com acompanhamento do progresso. <br> `RF-02, RF-03` | **F6 — Orientação sobre investimentos** <br> Conteúdo básico e claro sobre formas de investir. <br> `RF-07` | |

**Justificativa da priorização.**

- **F1 e F2 (obrigatórios)** formam o núcleo do produto: sem registro de gastos não há dados para analisar, e o assistente de IA é o que diferencia o Meu Bolso de uma planilha, transformando os dados em orientação prática (a lacuna apontada na pesquisa: informação sem hábito).
- **F3 e F4 (importantes)** respondem às necessidades que mais apareceram nas entrevistas: saber quanto foi gasto e guardado, ter reserva e ter objetivos claros.
- **F5 e F6 (desejáveis)** agregam valor, mas parte do benefício já é obtida com o painel, as metas e o assistente; podem ser entregues em uma segunda etapa.
- **F7 (opcional)** é a funcionalidade de maior esforço; uma versão simplificada pode ser atendida pelo assistente de IA (perguntas do tipo "e se eu comprar isto?").

---

# 5. Metodologia

## 5.1 Abordagem de trabalho

O projeto combina **Design Thinking** na concepção (compreender as pessoas antes de definir e testar soluções) e o método **Kanban** no desenvolvimento (quadro visual, limite de trabalho em andamento e melhoria contínua do fluxo). A escolha se justifica pelo tamanho da equipe, pelo prazo curto e pela necessidade de ajustar o escopo conforme o retorno dos testes com usuários.

| Etapa | O que foi ou será feito | Situação |
|---|---|---|
| Empatizar | Matriz CSD, mapa de stakeholders, roteiros de entrevista e entrevistas qualitativas. | ✅ Concluída |
| Definir | Enunciado do problema, personas, mapas de empatia e propostas de valor. | ✅ Concluída |
| Idear | Requisitos funcionais e não funcionais e priorização das funcionalidades. | ✅ Concluída |
| Prototipar | Wireframes, fluxo de navegação e protótipo interativo. | 🔄 Em andamento |
| Implementar | Desenvolvimento do MVP (F1 a F4), começando pelo repositório e pelo quadro de tarefas. | 🚧 Em início |
| Testar | Validação do protótipo e do MVP com o público-alvo e ajustes. | ⏳ Prevista |

## 5.2 Organização da equipe e divisão de papéis

A equipe é formada por cinco integrantes. Como o grupo é pequeno, os papéis podem ser acumulados, mas cada frente tem um responsável definido, para que toda tarefa do quadro tenha um dono.

| Papel | Responsabilidades | Responsável |
|---|---|---|
| Gestão do projeto | Manter o quadro Kanban atualizado, organizar reuniões e acompanhar prazos e entregas. | Daniel |
| UX e protótipo | Wireframes, fluxo de navegação, protótipo interativo e coerência visual das telas. | Vinicius |
| Front-end | Desenvolvimento das telas e da interface responsiva. | Arthur |
| Back-end e banco de dados | Regras de negócio, cadastro e login, armazenamento e segurança dos dados. | David |
| Inteligência artificial | Integração e configuração do assistente, definição das orientações e limites de resposta. | Gabriel |
| Qualidade e documentação | Testes, revisão de código, README, documentação e organização do repositório. | Daniel |

**Práticas de trabalho previstas.** Reunião semanal de alinhamento; toda tarefa registrada como issue, com responsável e critério de conclusão; commits pequenos e com mensagens claras; e revisão do trabalho por, pelo menos, outro integrante antes de concluir a tarefa.

## 5.3 Quadro de controle de tarefas (Kanban)

As tarefas do projeto são controladas no **GitHub Projects**, vinculado ao repositório. Cada tarefa é uma *issue* atribuída a um integrante e recebe etiquetas que indicam a frente (front-end, back-end, IA, design ou documentação) e a prioridade. As issues percorrem quatro colunas:

| A fazer | Em andamento | Em revisão | Concluído |
|---|---|---|---|
| Tarefas planejadas e ainda não iniciadas, ordenadas por prioridade. | Tarefas em execução, cada uma com um responsável. | Tarefas prontas, aguardando revisão de outro integrante. | Tarefas revisadas e que atendem ao critério de conclusão. |

## 5.4 Ferramentas

| Ferramenta | Uso no projeto | Link |
|---|---|---|
| GitHub (repositório) | Código-fonte, documentação, README e histórico de versões. | [Repositório](https://github.com/ICEI-PUC-Minas-PMGES-TI/pmg-es-2026-2-ti2-8183100-meu-bolso) |
| GitHub Projects (Kanban) | Quadro de tarefas, issues e responsáveis. | [Kanban](https://github.com/orgs/ICEI-PUC-Minas-PMGES-TI/projects/787/views/1) |
| Miro | Design Thinking: CSD, stakeholders, entrevistas, personas, mapas de empatia, propostas de valor e priorização. | [Miro](https://miro.com/app/board/uXjVHxiBGwc=/) |
| Protótipo interativo | Wireframes, fluxo de navegação e protótipo das telas. | [Figma](https://www.figma.com/make/Q8zHsaZnUu3KyRLcZcRIA0/MeuBolso-Wireframe-Desktop?p=f&t=n9PhvkrWvweEkrSG-0&fullscreen=1) |
| Comunicação da equipe | Alinhamento diário e aviso de reuniões. | Discord e WhatsApp |

---

# 6. Tecnologias (planejadas)

> [!NOTE]
> A stack tecnológica ainda **não foi definida** — essa é uma das primeiras issues do quadro de tarefas. Esta seção será preenchida na etapa de implementação com as tecnologias efetivamente adotadas (front-end, back-end, banco de dados, provedor de IA e infraestrutura), junto das instruções de instalação e execução.

| Camada | Tecnologia | Situação |
|---|---|---|
| Front-end | `<a definir>` | ⏳ A definir |
| Back-end | `<a definir>` | ⏳ A definir |
| Banco de dados | `<a definir>` | ⏳ A definir |
| Assistente de IA | `<a definir>` | ⏳ A definir |
| Infraestrutura / Deploy | `<a definir>` | ⏳ A definir |

---

# 7. Referências

- ANDERSON, David J. **Kanban: successful evolutionary change for your technology business.** Sequim: Blue Hole Press, 2010.
- BRASIL. **Decreto nº 10.393, de 9 de junho de 2020.** Institui a nova Estratégia Nacional de Educação Financeira – ENEF e o Fórum Brasileiro de Educação Financeira – FBEF. Diário Oficial da União, Brasília, DF, 10 jun. 2020. Disponível em: <https://www2.camara.leg.br/legin/fed/decret/2020/decreto-10393-9-junho-2020-790298-publicacaooriginal-160856-pe.html>. Acesso em: 24 set. 2026.
- BRASIL. **Lei nº 13.709, de 14 de agosto de 2018.** Lei Geral de Proteção de Dados Pessoais (LGPD). Diário Oficial da União, Brasília, DF, 15 ago. 2018. Disponível em: <https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm>. Acesso em: 24 set. 2026.
- BROWN, Tim. **Design thinking.** Harvard Business Review, Boston, v. 86, n. 6, 2008.
- FOLHA VITÓRIA. **OCDE indica déficit na educação financeira entre estudantes.** Vitória, jul. 2024. Disponível em: <https://www.folhavitoria.com.br/geral/noticia/07/2024/ocde-indica-deficit-na-educacao-financeira-entre-estudantes>. Acesso em: 24 set. 2026.
- OECD. **PISA 2022 results (Volume IV): factsheets: Brazil.** Paris: OECD Publishing, 2024. Disponível em: <https://www.oecd.org/en/publications/pisa-2022-results-volume-iv-factsheets_34d60137-en/brazil_1c815ef9-en.html>. Acesso em: 24 set. 2026.
- PUC MINAS. Instituto de Ciências Exatas e Informática. **Trabalho interdisciplinar: modelo de documento para concepção de projetos com Design Thinking.** Versão 5.0. Belo Horizonte, ago. 2026.
- UFMG. Espaço do Conhecimento. **Conheça o oitavo item da lista de Objetivos de Desenvolvimento Sustentável da ONU: trabalho decente e crescimento econômico.** Belo Horizonte, 22 jun. 2021. Disponível em: <https://www.ufmg.br/espacodoconhecimento/trabalho-decente-e-crescimento-economico/>. Acesso em: 24 set. 2026.

---

> Estrutura deste README inspirada no [template do Prof. Dr. João Paulo Aramuni](https://github.com/joaopauloaramuni/laboratorio-de-desenvolvimento-de-software/blob/main/TEMPLATES/template_README.md), adaptada à fase de concepção do Trabalho Interdisciplinar.
