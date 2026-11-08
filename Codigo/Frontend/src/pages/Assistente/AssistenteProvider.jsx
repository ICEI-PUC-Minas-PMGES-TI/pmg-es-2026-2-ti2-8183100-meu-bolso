import { useCallback, useMemo, useRef, useState } from "react";

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

  // Contador de geração: toda vez que limpamos, ele muda. Respostas de
  // perguntas em andamento conferem o valor e se descartam se mudou.
  const geracao = useRef(0);

  const enviar = useCallback(async (pergunta, params, rotuloOpcao) => {
    const textoUsuario = rotuloOpcao
      ? `${pergunta.texto} (${rotuloOpcao})`
      : pergunta.texto;

    const geracaoAtual = geracao.current;

    setMensagens((atual) =>
      limitar([...atual, { de: "usuario", texto: textoUsuario }]),
    );
    setCarregando(true);

    try {
      const resposta = await assistenteApi.responder(pergunta.id, params ?? {});
      // Conversa foi limpa enquanto esperávamos: descarta a resposta.
      if (geracao.current !== geracaoAtual) return { ok: true };
      setMensagens((atual) =>
        limitar([
          ...atual,
          {
            de: "assistente",
            texto: resposta.texto,
            aviso: resposta.aviso,
            horario: horaAgora(),
          },
        ]),
      );
      setCarregando(false);
      return { ok: true };
    } catch (e) {
      if (geracao.current !== geracaoAtual) return { ok: false };
      setMensagens((atual) =>
        limitar([
          ...atual,
          {
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

  const limpar = useCallback(() => {
    geracao.current += 1;
    setMensagens([]);
    setCarregando(false);
  }, []);

  const valor = useMemo(
    () => ({ mensagens, carregando, enviar, limpar }),
    [mensagens, carregando, enviar, limpar],
  );

  return (
    <AssistenteContext.Provider value={valor}>
      {children}
    </AssistenteContext.Provider>
  );
}

export default AssistenteProvider;
