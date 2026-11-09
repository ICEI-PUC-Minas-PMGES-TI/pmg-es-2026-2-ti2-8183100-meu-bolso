import { memo, useEffect, useState } from "react";

import styles from "./MensagemAssistente.module.css";

// Uma mensagem da conversa (usuário, assistente ou erro). As respostas do
// assistente que ainda não foram animadas aparecem com efeito de digitação.

const INTERVALO_MS = 22;

function prefereMenosMovimento() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

function MensagemAssistente({ mensagem, finalizarDigitacao }) {
  const { id, de, texto, erro, horario, animada } = mensagem;
  const ehAssistente = de === "assistente";

  // Só a resposta de sucesso ainda não animada digita.
  const deveAnimar = ehAssistente && !erro && animada === false;

  // Quantos caracteres já estão visíveis. Começa completo se não for animar.
  const [visiveis, setVisiveis] = useState(() => (deveAnimar ? 0 : texto.length));

  useEffect(() => {
    if (!deveAnimar) return;

    // Respeita a preferência de menos movimento: completa na hora, de forma
    // assíncrona (sem setState síncrono dentro do efeito).
    if (prefereMenosMovimento()) {
      const t = setTimeout(() => {
        setVisiveis(texto.length);
        finalizarDigitacao(id);
      }, 0);
      return () => clearTimeout(t);
    }

    const passo = Math.max(2, Math.ceil(texto.length / 100));
    const intervalo = setInterval(() => {
      setVisiveis((atual) => {
        const proximo = atual + passo;
        if (proximo >= texto.length) {
          clearInterval(intervalo);
          // Finaliza só no último tick (digitação concluída de verdade).
          finalizarDigitacao(id);
          return texto.length;
        }
        return proximo;
      });
    }, INTERVALO_MS);

    // No StrictMode o efeito é desmontado e remontado logo após a 1ª montagem.
    // O cleanup SÓ limpa o intervalo — não finaliza —, senão a mensagem seria
    // marcada como animada antes de digitar e a remontagem não animaria.
    return () => clearInterval(intervalo);
  }, [deveAnimar, texto, id, finalizarDigitacao]);

  // Usuário
  if (!ehAssistente) {
    return (
      <div className={`${styles.linha} ${styles.linhaUsuario}`}>
        <div className={`${styles.balao} ${styles.balaoUsuario}`}>{texto}</div>
      </div>
    );
  }

  // Erro (nunca digita)
  if (erro) {
    return (
      <div className={styles.linha}>
        <span className={styles.avatar} aria-hidden="true">J</span>
        <div className={styles.coluna}>
          <div className={`${styles.balao} ${styles.balaoErro}`} role="alert">
            {texto}
          </div>
          {horario && <span className={styles.horario}>{horario}</span>}
        </div>
      </div>
    );
  }

  // Resposta do assistente (possivelmente digitando)
  const textoParcial = texto.slice(0, visiveis);
  return (
    <div className={styles.linha}>
      <span className={styles.avatar} aria-hidden="true">J</span>
      <div className={styles.coluna}>
        <div className={`${styles.balao} ${styles.balaoAssistente}`}>
          {/* Texto completo só para leitor de tela (não lê letra por letra). */}
          <span className={styles.srOnly}>{texto}</span>
          <span aria-hidden="true">{textoParcial}</span>
        </div>
        {horario && <span className={styles.horario}>{horario}</span>}
      </div>
    </div>
  );
}

// Memo: durante a digitação (a cada ~22ms) só o balão em digitação, cujo
// estado local muda, re-renderiza; os demais ficam estáveis.
export default memo(MensagemAssistente);
