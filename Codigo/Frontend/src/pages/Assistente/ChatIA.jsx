import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Send, Trash2 } from "lucide-react";

import MensagemAssistente from "./MensagemAssistente";
import { assistenteApi } from "../../service/Api";
import styles from "./ChatIA.module.css";

// ============================================================
// CHAT IA
// ------------------------------------------------------------
// Aba "Conversar com o Jarvis": chat com estado LOCAL que fala com
// POST /api/assistente/chat. Não usa o AssistenteProvider nem a aba
// de perguntas rápidas.
// ============================================================

// Sugestões do estado vazio: ao clicar, preenchem o campo de texto.
const CHIPS_INICIAIS = [
  "Quanto sobrou este mês?",
  "Onde estou gastando mais?",
  "Quais gastos fixos tenho?",
];

const ERRO_PADRAO = "Não foi possível falar com o Jarvis. Tente novamente.";

const LIMITE_CARACTERES = 500;
const MAX_HISTORICO = 10;
const ALTURA_LINHA = 24;
const MAX_LINHAS = 4;

function prefereMenosMovimento() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

let proximoId = 0;
function novoId() {
  proximoId += 1;
  return `chat-${proximoId}`;
}

function horaAgora() {
  return new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ChatIA({ onEstadoChange }) {
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState("");
  const [aguardando, setAguardando] = useState(false);
  const [restantesHoje, setRestantesHoje] = useState(null);
  const [digitandoId, setDigitandoId] = useState(null);

  const areaRef = useRef(null);
  const fimRef = useRef(null);
  const textareaRef = useRef(null);
  const timeoutSeguranca = useRef(null);

  // Foco no campo ao montar (troca para esta aba).
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Rola ao enviar/receber, no indicador "calculando" e ao terminar de digitar.
  useLayoutEffect(() => {
    if (mensagens.length === 0 && !aguardando) return;
    fimRef.current?.scrollIntoView({
      behavior: prefereMenosMovimento() ? "auto" : "smooth",
      block: "end",
    });
  }, [mensagens, aguardando, digitandoId]);

  // Limpa o timeout de segurança ao desmontar.
  useEffect(() => {
    return () => {
      if (timeoutSeguranca.current) clearTimeout(timeoutSeguranca.current);
    };
  }, []);

  // Estado do orbe (mesma regra do AssistenteProvider): avisa o pai a cada
  // mudança e volta a "parado" ao desmontar (troca de aba).
  const estadoChat = aguardando
    ? "pensando"
    : digitandoId !== null
      ? "falando"
      : "parado";

  useEffect(() => {
    onEstadoChange?.(estadoChat);
    return () => onEstadoChange?.("parado");
  }, [estadoChat, onEstadoChange]);

  // Marca a resposta como já animada e libera o "digitando" (idempotente).
  const finalizarDigitacao = useCallback((id) => {
    if (timeoutSeguranca.current) {
      clearTimeout(timeoutSeguranca.current);
      timeoutSeguranca.current = null;
    }
    setMensagens((atual) =>
      atual.map((m) => (m.id === id ? { ...m, animada: true } : m)),
    );
    setDigitandoId((atual) => (atual === id ? null : atual));
  }, []);

  // Monta o histórico para a API: últimas MAX_HISTORICO mensagens (sem balões
  // de erro). Respostas de ferramenta viram "Consultei: <ferramenta>" para não
  // reenviar valores; tudo truncado a LIMITE_CARACTERES.
  function montarHistorico(lista) {
    return lista
      .filter((m) => !m.erro)
      .slice(-MAX_HISTORICO)
      .map((m) => {
        const papel = m.de === "usuario" ? "user" : "assistant";
        const texto = m.ferramenta ? `Consultei: ${m.ferramenta}` : m.texto;
        return { papel, texto: texto.slice(0, LIMITE_CARACTERES) };
      });
  }

  async function enviarMensagem(pergunta) {
    const conteudo = pergunta.trim();
    if (!conteudo || aguardando) return;

    // Se uma resposta ainda está digitando, conclui antes de seguir.
    if (digitandoId != null) finalizarDigitacao(digitandoId);

    const mensagemUsuario = {
      id: novoId(),
      de: "usuario",
      texto: conteudo,
      animada: true,
      horario: horaAgora(),
    };
    const comUsuario = [...mensagens, mensagemUsuario];
    setMensagens(comUsuario);
    setTexto("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setAguardando(true);

    try {
      const resposta = await assistenteApi.conversar(montarHistorico(comUsuario));
      const id = novoId();
      setMensagens((atual) => [
        ...atual,
        {
          id,
          de: "assistente",
          texto: resposta.resposta,
          ferramenta: resposta.ferramenta ?? null,
          animada: false,
          horario: horaAgora(),
        },
      ]);
      setRestantesHoje(resposta.restantesHoje);
      setDigitandoId(id);
      // Rede de segurança: finaliza a digitação em ~3s se ela não concluir
      // (ex.: usuário troca de aba). finalizarDigitacao é idempotente.
      if (timeoutSeguranca.current) clearTimeout(timeoutSeguranca.current);
      timeoutSeguranca.current = setTimeout(() => finalizarDigitacao(id), 3000);
    } catch (error) {
      setMensagens((atual) => [
        ...atual,
        {
          id: novoId(),
          de: "assistente",
          texto: error?.message || ERRO_PADRAO,
          erro: true,
          animada: true,
          horario: horaAgora(),
        },
      ]);
    } finally {
      setAguardando(false);
    }
  }

  function aoDigitar(e) {
    const el = e.target;
    setTexto(el.value);
    // Cresce até MAX_LINHAS; depois rola internamente.
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, ALTURA_LINHA * MAX_LINHAS + 20)}px`;
  }

  // Enter envia; Shift+Enter quebra linha.
  function aoTeclar(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem(texto);
    }
  }

  function limparConversa() {
    if (timeoutSeguranca.current) {
      clearTimeout(timeoutSeguranca.current);
      timeoutSeguranca.current = null;
    }
    setMensagens([]);
    setTexto("");
    setAguardando(false);
    setRestantesHoje(null);
    setDigitandoId(null);
    textareaRef.current?.focus();
  }

  // Linha de restantes após a primeira resposta (singular/zero tratados).
  function textoRestantes() {
    if (restantesHoje == null) return "";
    if (restantesHoje <= 0) return " · Limite de hoje atingido";
    if (restantesHoje === 1) return " · 1 mensagem restante hoje";
    return ` · ${restantesHoje} mensagens restantes hoje`;
  }

  const vazio = mensagens.length === 0;
  const podeEnviar = texto.trim().length > 0 && !aguardando;

  return (
    <div className={styles.chat}>
      <div className={styles.janela}>
        <div
          ref={areaRef}
          className={styles.mensagens}
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label="Conversa com o Jarvis"
        >
          {vazio && !aguardando ? (
            <div className={styles.vazio}>
              <p className={styles.vazioTexto}>
                Pergunte ao Jarvis sobre seus gastos, receitas, metas e gastos
                fixos.
              </p>
              <div className={styles.chips}>
                {CHIPS_INICIAIS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className={styles.chip}
                    onClick={() => {
                      setTexto(chip);
                      textareaRef.current?.focus();
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.baloes}>
              {mensagens.map((msg) => (
                <div key={msg.id} className={styles.grupo}>
                  <MensagemAssistente
                    mensagem={msg}
                    finalizarDigitacao={finalizarDigitacao}
                  />
                </div>
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
              <div ref={fimRef} />
            </div>
          )}
        </div>

        <div className={styles.barraEntrada}>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            rows={1}
            value={texto}
            onChange={aoDigitar}
            onKeyDown={aoTeclar}
            placeholder="Pergunte algo ao Jarvis sobre suas finanças..."
            maxLength={LIMITE_CARACTERES}
            disabled={aguardando}
          />
          <button
            type="button"
            className={styles.enviar}
            onClick={() => enviarMensagem(texto)}
            disabled={!podeEnviar}
            aria-label="Enviar mensagem ao Jarvis"
          >
            <Send size={18} aria-hidden="true" />
          </button>
        </div>

        <p className={styles.dica}>
          Não digite senhas, CPF ou dados de cartão.
          {textoRestantes()}
        </p>
      </div>

      {!vazio && (
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
    </div>
  );
}

export default ChatIA;
