import { useCallback, useEffect, useState } from "react";

// Chave usada também pelo script inline do index.html (evita o "flash"
// do tema claro antes do React carregar). Se mudar aqui, mude lá também.
export const CHAVE_TEMA = "meubolso-tema";

const TEMAS = ["claro", "escuro"];

// Lê o tema já aplicado no <html> pelo script do index.html.
// Padrão: claro.
function temaInicial() {
  const atual = document.documentElement.dataset.tema;
  return TEMAS.includes(atual) ? atual : "claro";
}

// Aplica o tema no <html>. O tema claro é o padrão do :root, então
// basta remover o atributo.
function aplicarTema(tema) {
  const raiz = document.documentElement;
  if (tema === "escuro") {
    raiz.dataset.tema = "escuro";
  } else {
    delete raiz.dataset.tema;
  }
}

/**
 * Tema do site (claro/escuro), salvo no localStorage.
 * O CSS reage ao atributo data-tema="escuro" no <html> (ver global.css).
 */
export default function useTema() {
  const [tema, setTema] = useState(temaInicial);

  useEffect(() => {
    aplicarTema(tema);
    try {
      localStorage.setItem(CHAVE_TEMA, tema);
    } catch {
      // localStorage indisponível (modo privado, etc.): só não persiste.
    }
  }, [tema]);

  const alternarTema = useCallback(() => {
    setTema((atual) => (atual === "escuro" ? "claro" : "escuro"));
  }, []);

  return { tema, alternarTema };
}
