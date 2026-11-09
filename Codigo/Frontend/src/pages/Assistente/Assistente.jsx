import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Sparkles,
  Trash2,
  Info,
  Wallet,
  ChevronRight,
  ChartColumn,
  ChartPie,
  CalendarDays,
  TrendingUp,
  ArrowLeftRight,
  Target,
  PiggyBank,
} from "lucide-react";

import { assistenteApi } from "../../service/Api";
import { useAssistente } from "./AssistenteContext";
import JarvisAvatar from "./JarvisAvatar";
import MensagemAssistente from "./MensagemAssistente";
import styles from "./Assistente.module.css";

// ============================================================
// ASSISTENTE (perguntas prontas, sem IA)
// ------------------------------------------------------------
// Lista perguntas calculadas pelo back-end a partir dos dados do
// usuário. Perguntas sem parâmetro respondem ao clique; as com
// parâmetro "opcao" abrem um painel com <select>.
//
// A conversa vive no AssistenteProvider (acima do Layout), então
// persiste durante a navegação. Aqui fica só o estado de interface:
// lista de perguntas, seleção e a opção escolhida.
// ============================================================

// Ordem fixa de exibição; ids desconhecidos vão para o fim.
const ORDEM = [
  "orcamento_status",
  "gasto_por_dia",
  "gastos_por_categoria",
  "maior_gasto",
  "comparativo_mes",
  "meta_faltante",
  "metas_total_guardado",
];

// Interface de cada pergunta (ícone + rótulo curto do cartão). O texto
// completo da API vai no title/aria-label e no balão do usuário.
const PERGUNTAS_UI = {
  orcamento_status: { Icone: ChartColumn, rotulo: "Estou dentro do orçamento?" },
  gasto_por_dia: { Icone: CalendarDays, rotulo: "Quanto posso gastar por dia?" },
  gastos_por_categoria: { Icone: ChartPie, rotulo: "Onde gastei mais este mês?" },
  maior_gasto: { Icone: TrendingUp, rotulo: "Qual foi meu maior gasto do mês?" },
  comparativo_mes: { Icone: ArrowLeftRight, rotulo: "Como foi este mês comparado ao anterior?" },
  meta_faltante: { Icone: Target, rotulo: "Quanto falta para minha meta?" },
  metas_total_guardado: { Icone: PiggyBank, rotulo: "Quanto já guardei nas metas?" },
};

const AVISO_PADRAO = "Orientação educativa; não substitui um profissional.";

// Interface da pergunta: do mapa, ou um fallback com o texto da API.
function interfaceDe(pergunta) {
  return PERGUNTAS_UI[pergunta.id] ?? { Icone: Sparkles, rotulo: pergunta.texto };
}

function ordenarPerguntas(lista) {
  const indice = (id) => {
    const i = ORDEM.indexOf(id);
    return i === -1 ? ORDEM.length : i;
  };
  return [...lista].sort((a, b) => indice(a.id) - indice(b.id));
}

// Primeiro parâmetro do tipo "opcao" com opções; null se a pergunta não exige.
function parametroOpcao(pergunta) {
  return (
    pergunta.parametros?.find(
      (p) => p.tipo === "opcao" && Array.isArray(p.opcoes) && p.opcoes.length > 0,
    ) ?? null
  );
}

function Assistente() {
  // Conversa compartilhada (persiste entre páginas).
  const {
    mensagens,
    carregando: aguardando,
    estado,
    enviar,
    limpar,
    finalizarDigitacao,
  } = useAssistente();

  const [perguntas, setPerguntas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  // Pergunta selecionada (só faz sentido quando ela tem parâmetro).
  const [selecionadaId, setSelecionadaId] = useState(null);
  // Valor escolhido no <select> da pergunta selecionada.
  const [opcaoSelecionada, setOpcaoSelecionada] = useState("");

  const fimDaConversa = useRef(null);
  // Primeira renderização desta montagem: rola sem animação (há histórico).
  const primeiroScroll = useRef(true);

  // Busca a lista e atualiza os estados. `reiniciar` liga o "carregando".
  async function carregarPerguntas({ reiniciar = false } = {}) {
    if (reiniciar) {
      setCarregando(true);
      setErro("");
    }
    try {
      const lista = await assistenteApi.listarPerguntas();
      setPerguntas(ordenarPerguntas(lista));
      setErro("");
    } catch (e) {
      setErro(e.message || "Não foi possível carregar as perguntas.");
    } finally {
      setCarregando(false);
    }
  }

  // Recarrega a lista de perguntas a cada montagem.
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const lista = await assistenteApi.listarPerguntas();
        if (ativo) setPerguntas(ordenarPerguntas(lista));
      } catch (e) {
        if (ativo) setErro(e.message || "Não foi possível carregar as perguntas.");
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  // Rola até o fim: instantâneo ao montar (há histórico), suave nas mensagens
  // novas, no indicador "calculando" e ao terminar a digitação.
  useLayoutEffect(() => {
    if (mensagens.length === 0 && !aguardando) return;
    fimDaConversa.current?.scrollIntoView({
      behavior: primeiroScroll.current ? "auto" : "smooth",
      block: "end",
    });
    primeiroScroll.current = false;
  }, [mensagens, aguardando, estado]);

  // Seleciona a pergunta (destaque) e pré-seleciona a primeira opção.
  function selecionar(pergunta) {
    const param = parametroOpcao(pergunta);
    setSelecionadaId(pergunta.id);
    setOpcaoSelecionada(param ? param.opcoes[0].valor : "");
  }

  // Fecha o painel de parâmetros e reinicia a opção escolhida.
  function fecharPainel() {
    setSelecionadaId(null);
    setOpcaoSelecionada("");
  }

  // Clique no botão da pergunta:
  //  - sem parâmetro: fecha qualquer painel aberto e pergunta direto;
  //  - com parâmetro: alterna o painel (segundo clique fecha).
  function aoClicarPergunta(pergunta) {
    if (aguardando) return;
    const param = parametroOpcao(pergunta);
    if (param) {
      if (pergunta.id === selecionadaId) {
        fecharPainel();
      } else {
        selecionar(pergunta);
      }
    } else {
      fecharPainel();
      perguntar(pergunta, null);
    }
  }

  async function perguntar(pergunta, param) {
    const valor = param ? opcaoSelecionada : null;
    const opcao = param ? param.opcoes.find((o) => o.valor === valor) : null;
    const params = param ? { [param.nome]: valor } : {};

    fecharPainel();
    const resultado = await enviar(pergunta, params, opcao?.rotulo);

    // Dados podem ter mudado (meta excluída, etc.): recarrega a lista.
    if (!resultado.ok && (resultado.status === 400 || resultado.status === 404)) {
      carregarPerguntas({ reiniciar: true });
    }
  }

  function limparConversa() {
    limpar();
    fecharPainel();
  }

  const perguntaSelecionada = perguntas.find((p) => p.id === selecionadaId);
  const paramSelecionado = perguntaSelecionada
    ? parametroOpcao(perguntaSelecionada)
    : null;

  // Aviso fixo: o da última resposta do assistente; o padrão antes da primeira.
  const aviso =
    [...mensagens].reverse().find((m) => m.de === "assistente" && m.aviso)
      ?.aviso ?? AVISO_PADRAO;

  return (
    <div className={styles.assistente} data-jarvis-estado={estado}>
      {/* Hero: avatar + apresentação do Jarvis */}
      <header className={styles.hero}>
        <JarvisAvatar estado={estado} />
        <div className={styles.heroTexto}>
          <span className={styles.etiqueta}>
            <span className={styles.etiquetaBolinha} aria-hidden="true" />
            MeuBolso
          </span>
          <h1 className={styles.titulo}>
            Jarvis<span className={styles.cursor} aria-hidden="true">_</span>
          </h1>
          <p className={styles.subtitulo}>
            Seu assistente financeiro pessoal.
            <br />
            Pergunte, explore e tome decisões melhores.
          </p>
        </div>
      </header>

      {carregando ? (
        <div className={`card ${styles.estado}`}>
          <p className="texto-secundario">Carregando as perguntas...</p>
        </div>
      ) : erro ? (
        <div className={`card ${styles.estado}`} role="alert">
          <p className="texto-secundario">{erro}</p>
        </div>
      ) : perguntas.length === 0 ? (
        <div className={`card ${styles.estado}`}>
          <p className="texto-secundario">
            Ainda não há perguntas disponíveis. Registre gastos, defina um
            orçamento ou crie uma meta para liberar perguntas.
          </p>
        </div>
      ) : (
        <>
          <section className={styles.perguntas}>
            <div className={styles.perguntasCabecalho}>
              <h2 className={styles.perguntasTitulo}>
                <Sparkles size={18} aria-hidden="true" />
                Sugestões para começar
              </h2>
              <p className="texto-secundario texto-pequeno">
                As respostas são calculadas com os seus dados.
              </p>
            </div>

            <div className={styles.gradePerguntas}>
              {perguntas.map((pergunta) => {
                const ativa = pergunta.id === selecionadaId;
                const temParametro = Boolean(parametroOpcao(pergunta));
                const { Icone, rotulo } = interfaceDe(pergunta);
                return (
                  <button
                    key={pergunta.id}
                    type="button"
                    className={`${styles.cartao} ${
                      ativa ? styles.cartaoAtivo : ""
                    }`}
                    onClick={() => aoClicarPergunta(pergunta)}
                    disabled={aguardando}
                    aria-pressed={ativa}
                    aria-expanded={temParametro ? ativa : undefined}
                    title={pergunta.texto}
                    aria-label={pergunta.texto}
                  >
                    <span className={styles.cartaoIcone}>
                      <Icone size={20} aria-hidden="true" />
                    </span>
                    <span className={styles.cartaoRotulo}>{rotulo}</span>
                    <ChevronRight
                      size={18}
                      className={styles.cartaoSeta}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>

            {paramSelecionado && (
              <div
                className={`card ${styles.painelParametro}`}
                onKeyDown={(e) => {
                  if (e.key === "Escape") fecharPainel();
                }}
              >
                <label
                  className={styles.rotuloParametro}
                  htmlFor="assistente-opcao"
                >
                  {paramSelecionado.rotulo}
                </label>
                <div className={styles.linhaParametro}>
                  <select
                    id="assistente-opcao"
                    className={styles.select}
                    value={opcaoSelecionada}
                    onChange={(e) => setOpcaoSelecionada(e.target.value)}
                    disabled={aguardando}
                  >
                    {paramSelecionado.opcoes.map((o) => (
                      <option key={o.valor} value={o.valor}>
                        {o.rotulo}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-verde"
                    onClick={() =>
                      perguntar(perguntaSelecionada, paramSelecionado)
                    }
                    disabled={aguardando}
                  >
                    Perguntar
                  </button>
                  <button
                    type="button"
                    className={`btn btn-secundario ${styles.botaoCancelar}`}
                    onClick={fecharPainel}
                    disabled={aguardando}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </section>

          <section
            className={styles.conversa}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-label="Conversa com o assistente"
          >
            {mensagens.length === 0 && !aguardando ? (
              <div className={styles.vazioConversa}>
                <span className={styles.vazioIcone}>
                  <Wallet size={22} aria-hidden="true" />
                </span>
                <p className={styles.vazioTexto}>
                  Escolha uma das sugestões acima para começar a conversar com o
                  Jarvis.
                </p>
              </div>
            ) : (
              <div className={styles.baloes}>
                {mensagens.map((msg) => (
                  <MensagemAssistente
                    key={msg.id}
                    mensagem={msg}
                    finalizarDigitacao={finalizarDigitacao}
                  />
                ))}
                {aguardando && (
                  <div className={styles.calculando}>
                    <span className={styles.calculandoAvatar} aria-hidden="true">
                      J
                    </span>
                    <div className={styles.calculandoBalao}>
                      Calculando com os seus dados
                      <span className={styles.pontos} aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </span>
                    </div>
                  </div>
                )}
                <div ref={fimDaConversa} />
              </div>
            )}
          </section>

          <p className={styles.aviso}>
            <Info size={14} aria-hidden="true" />
            {aviso}
          </p>

          {mensagens.length > 0 && (
            <div className={styles.rodape}>
              <button
                type="button"
                className="btn btn-secundario"
                onClick={limparConversa}
                disabled={aguardando}
              >
                <Trash2 size={16} aria-hidden="true" />
                Limpar conversa
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Assistente;
