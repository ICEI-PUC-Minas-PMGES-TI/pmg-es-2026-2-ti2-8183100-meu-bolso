import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Sparkles, Trash2, Info } from "lucide-react";

import { assistenteApi } from "../../service/Api";
import { useAssistente } from "./AssistenteContext";
import styles from "./Assistente.module.css";

// ============================================================
// ASSISTENTE (perguntas prontas, sem IA)
// ------------------------------------------------------------
// Lista perguntas calculadas pelo back-end a partir dos dados do
// usuário. Perguntas sem parâmetro respondem ao clique; as com
// parâmetro "opcao" abrem um painel com <select>.
//
// A conversa vive no AssistenteProvider (acima do Layout), então
// persiste durante a navegação e some só ao recarregar a página,
// sair da conta ou limpar. Aqui fica só o estado de interface:
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

const AVISO_PADRAO = "Orientação educativa; não substitui um profissional.";

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
  const { mensagens, carregando: aguardando, enviar, limpar } = useAssistente();

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

  // Rola até a última mensagem: instantâneo ao montar (há histórico),
  // suave nas mensagens novas.
  useLayoutEffect(() => {
    if (mensagens.length === 0) return;
    fimDaConversa.current?.scrollIntoView({
      behavior: primeiroScroll.current ? "auto" : "smooth",
      block: "end",
    });
    primeiroScroll.current = false;
  }, [mensagens]);

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
    <div className={styles.assistente}>
      <div className={styles.cabecalho}>
        <h1>Assistente</h1>
        <p className="texto-secundario">
          Escolha uma pergunta. As respostas são calculadas com os seus dados.
        </p>
      </div>

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
            <div className={styles.gradePerguntas}>
              {perguntas.map((pergunta) => {
                const ativa = pergunta.id === selecionadaId;
                const temParametro = Boolean(parametroOpcao(pergunta));
                return (
                  <button
                    key={pergunta.id}
                    type="button"
                    className={`${styles.botaoPergunta} ${
                      ativa ? styles.botaoPerguntaAtivo : ""
                    }`}
                    onClick={() => aoClicarPergunta(pergunta)}
                    disabled={aguardando}
                    aria-pressed={ativa}
                    aria-expanded={temParametro ? ativa : undefined}
                  >
                    <Sparkles size={16} aria-hidden="true" />
                    {pergunta.texto}
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
            aria-live="polite"
            aria-label="Conversa com o assistente"
          >
            {mensagens.length === 0 ? (
              <p className={`texto-secundario ${styles.conversaVazia}`}>
                Nenhuma pergunta ainda. Escolha uma acima para começar.
              </p>
            ) : (
              <div className={styles.baloes}>
                {mensagens.map((msg, i) => (
                  <div
                    key={i}
                    className={`${styles.balao} ${
                      msg.de === "usuario"
                        ? styles.balaoUsuario
                        : styles.balaoAssistente
                    } ${msg.erro ? styles.balaoErro : ""}`}
                    role={msg.erro ? "alert" : undefined}
                  >
                    {msg.texto}
                    {msg.de === "assistente" && msg.horario && (
                      <span className={`texto-secundario texto-pequeno ${styles.horario}`}>
                        {msg.horario}
                      </span>
                    )}
                  </div>
                ))}
                {aguardando && (
                  <div className={`${styles.balao} ${styles.balaoAssistente}`}>
                    Calculando...
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
