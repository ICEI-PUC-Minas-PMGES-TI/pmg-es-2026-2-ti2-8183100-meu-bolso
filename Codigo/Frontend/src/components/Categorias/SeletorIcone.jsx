import { createElement, useEffect, useRef, useState } from "react";

import { CATALOGO, buscarIcones, iconeDe } from "../../data/categoriaIcones";
import styles from "./GerenciarCategorias.module.css";

/**
 * Seletor de ícone: um botão com o ícone atual que abre um painel com busca e
 * uma grade com todos os ícones disponíveis. Dá para digitar ("cafe", "carro",
 * "saude"...) para filtrar, ou rolar a grade e escolher.
 *
 * Usado no "Gerenciar categorias", na página Categorias e na criação rápida
 * de categoria dentro do lançamento.
 */
export default function SeletorIcone({ valor, onEscolher, desabilitado }) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const ref = useRef(null);

  const resultados = buscarIcones(busca);

  // Fecha o painel e limpa a busca, para a próxima abertura começar do zero.
  function fechar() {
    setAberto(false);
    setBusca("");
  }

  useEffect(() => {
    if (!aberto) return undefined;
    function aoClicarFora(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setAberto(false);
        setBusca("");
      }
    }
    function aoTeclar(e) {
      // Esc fecha só o painel de ícones, sem fechar o modal por baixo.
      if (e.key === "Escape") {
        e.stopPropagation();
        e.stopImmediatePropagation();
        setAberto(false);
        setBusca("");
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar, true);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar, true);
    };
  }, [aberto]);

  function escolher(nome) {
    onEscolher(nome);
    fechar();
  }

  return (
    <div className={styles.seletor} ref={ref}>
      <button
        type="button"
        className={styles.seletorBotao}
        onClick={() => (aberto ? fechar() : setAberto(true))}
        disabled={desabilitado}
        aria-label="Escolher ícone"
        aria-haspopup="true"
        aria-expanded={aberto}
        title="Escolher ícone"
      >
        {/* iconeDe busca o componente num mapa fixo; createElement evita
            declarar um "componente" dentro da renderização. */}
        {createElement(iconeDe(valor), { size: 18, "aria-hidden": true })}
      </button>

      {aberto && (
        <div className={styles.seletorPainel} role="dialog" aria-label="Escolher ícone">
          <input
            type="search"
            className={`form-input ${styles.seletorBusca}`}
            placeholder="Buscar ícone (ex.: comida, carro...)"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => {
              // Enter na busca não envia o formulário em volta.
              if (e.key === "Enter") e.preventDefault();
            }}
            autoFocus
          />

          {resultados.length === 0 ? (
            <p className={styles.seletorVazio}>Nenhum ícone encontrado.</p>
          ) : (
            <div className={styles.seletorGrade} role="listbox">
              {resultados.map((nome) => (
                <button
                  key={nome}
                  type="button"
                  role="option"
                  aria-selected={nome === valor}
                  className={`${styles.seletorOpcao} ${
                    nome === valor ? styles.seletorOpcaoAtiva : ""
                  }`}
                  onClick={() => escolher(nome)}
                  aria-label={CATALOGO[nome]?.rotulo || nome}
                  title={CATALOGO[nome]?.rotulo || nome}
                >
                  {createElement(iconeDe(nome), { size: 18, "aria-hidden": true })}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
