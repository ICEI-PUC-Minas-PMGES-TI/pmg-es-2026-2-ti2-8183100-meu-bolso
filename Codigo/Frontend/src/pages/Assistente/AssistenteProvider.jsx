import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { assistenteApi, ApiError } from "../../service/Api";
import { AssistenteContext } from "./AssistenteContext";

// Mantém a conversa do assistente viva durante a navegação. Fica dentro da
// RotaProtegida, então é desmontado (e a conversa some) ao sair da conta.
// Só em memória: nada de localStorage/sessionStorage.

const MAX_MENSAGENS = 50;

// Hora atual no formato HH:mm (pt-BR).
function horaAgora() {
  return new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Mantém só as últimas MAX_MENSAGENS mensagens.
function limitar(lista) {
  return lista.length > MAX_MENSAGENS ? lista.slice(-MAX_MENSAGENS) : lista;
}

function AssistenteProvider({ children }) {
  const [mensagens, setMensagens] = useState([]);
  const [carregando, setCarregando] = useState(false);
  // Id da resposta que está sendo digitada (null quando nenhuma).
  const [digitandoId, setDigitandoId] = useState(null);

  // Contador de geração: toda vez que limpamos, ele muda. Respostas de
  // perguntas em andamento conferem o valor e se descartam se mudou.
  const geracao = useRef(0);
  // Id incremental das mensagens (sem Date.now, estável entre renders).
  const proximoId = useRef(0);
  // Timeout de segurança: garante que uma resposta seja finalizada mesmo que o
  // componente da mensagem desmonte no meio da digitação (troca de página).
  const timeoutSeguranca = useRef(null);

  const enviar = useCallback(async (pergunta, params, rotuloOpcao) => {
    const textoUsuario = rotuloOpcao
      ? `${pergunta.texto} (${rotuloOpcao})`
      : pergunta.texto;

    const geracaoAtual = geracao.current;

    setMensagens((atual) =>
      limitar([
        ...atual,
        { id: proximoId.current++, de: "usuario", texto: textoUsuario },
      ]),
    );
    setCarregando(true);

    try {
      const resposta = await assistenteApi.responder(pergunta.id, params ?? {});
      // Conversa foi limpa enquanto esperávamos: descarta a resposta.
      if (geracao.current !== geracaoAtual) return { ok: true };
      const id = proximoId.current++;
      setMensagens((atual) =>
        limitar([
          ...atual,
          {
            id,
            de: "assistente",
            texto: resposta.texto,
            aviso: resposta.aviso,
            horario: horaAgora(),
            animada: false,
          },
        ]),
      );
      setCarregando(false);
      setDigitandoId(id);
      // Rede de segurança: se a digitação não terminar (ex.: usuário saiu da
      // página no meio), finaliza esta resposta em ~3s. finalizarDigitacao é
      // idempotente, então não há problema se a digitação já tiver concluído.
      if (timeoutSeguranca.current) clearTimeout(timeoutSeguranca.current);
      timeoutSeguranca.current = setTimeout(() => finalizarDigitacaoRef.current(id), 3000);
      return { ok: true };
    } catch (e) {
      if (geracao.current !== geracaoAtual) return { ok: false };
      setMensagens((atual) =>
        limitar([
          ...atual,
          {
            id: proximoId.current++,
            de: "assistente",
            texto: e.message || "Não foi possível responder agora.",
            erro: true,
            horario: horaAgora(),
          },
        ]),
      );
      setCarregando(false);
      return {
        ok: false,
        status: e instanceof ApiError ? e.status : undefined,
      };
    }
  }, []);

  // Marca a resposta como já animada e libera o estado "falando" (idempotente).
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

  // Ref sempre com a versão atual, para o timeout de segurança criado dentro
  // do `enviar` chamar a finalização sem depender da ordem de declaração.
  const finalizarDigitacaoRef = useRef(finalizarDigitacao);
  finalizarDigitacaoRef.current = finalizarDigitacao;

  const limpar = useCallback(() => {
    if (timeoutSeguranca.current) {
      clearTimeout(timeoutSeguranca.current);
      timeoutSeguranca.current = null;
    }
    geracao.current += 1;
    setMensagens([]);
    setCarregando(false);
    setDigitandoId(null);
  }, []);

  // Ao desmontar o provedor (ex.: sair da conta), limpa o timeout pendente.
  useEffect(() => {
    return () => {
      if (timeoutSeguranca.current) clearTimeout(timeoutSeguranca.current);
    };
  }, []);

  // Estado do assistente: pensando enquanto espera a API, falando enquanto
  // digita a resposta, parado no resto do tempo.
  const estado = carregando ? "pensando" : digitandoId !== null ? "falando" : "parado";

  const valor = useMemo(
    () => ({ mensagens, carregando, digitandoId, estado, enviar, limpar, finalizarDigitacao }),
    [mensagens, carregando, digitandoId, estado, enviar, limpar, finalizarDigitacao],
  );

  return (
    <AssistenteContext.Provider value={valor}>
      {children}
    </AssistenteContext.Provider>
  );
}

export default AssistenteProvider;
