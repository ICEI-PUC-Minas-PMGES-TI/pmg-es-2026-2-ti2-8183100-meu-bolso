import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

import styles from "./SeletorOpcoes.module.css";

const ALTURA_MAXIMA = 288;
const MARGEM = 6;

/**
 * Substituto visual do <select> nativo: botão + lista suspensa com ícone,
 * rótulo e descrição opcional em cada opção.
 *
 * A lista é renderizada no <body> (portal) com posição fixa, para não ser
 * cortada por modais com rolagem. Teclado: setas, Home/End, Enter/Espaço,
 * Esc e busca pela primeira letra.
 *
 * props:
 *  - id: id do botão (para o <label htmlFor>)
 *  - valor: valor selecionado ("" = nenhum)
 *  - opcoes: [{ valor, rotulo, descricao?, icone? }]
 *  - onAlterar(valor)
 *  - placeholder, desabilitado, invalido
 */
export default function SeletorOpcoes({
  id,
  valor,
  opcoes,
  onAlterar,
  placeholder = "Selecione",
  desabilitado = false,
  invalido = false,
}) {
  const idLista = useId();
  const botaoRef = useRef(null);
  const listaRef = useRef(null);
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(-1);
  const [posicao, setPosicao] = useState(null);

  const selecionada = opcoes.find((opcao) => opcao.valor === valor) ?? null;

  function abrir() {
    if (desabilitado) return;
    const indice = opcoes.findIndex((opcao) => opcao.valor === valor);
    setAtivo(indice >= 0 ? indice : 0);
    setAberto(true);
  }

  function fechar(devolverFoco = true) {
    setAberto(false);
    if (devolverFoco) botaoRef.current?.focus();
  }

  function escolher(indice) {
    const opcao = opcoes[indice];
    if (!opcao) return;
    onAlterar(opcao.valor);
    fechar();
  }

  // Posição da lista: abaixo do botão; se não couber, acima.
  useLayoutEffect(() => {
    if (!aberto) return undefined;

    function calcular() {
      const caixa = botaoRef.current?.getBoundingClientRect();
      if (!caixa) return;
      const espacoAbaixo = window.innerHeight - caixa.bottom - MARGEM * 2;
      const espacoAcima = caixa.top - MARGEM * 2;
      const paraCima = espacoAbaixo < 200 && espacoAcima > espacoAbaixo;
      const altura = Math.min(ALTURA_MAXIMA, paraCima ? espacoAcima : espacoAbaixo);
      setPosicao({
        left: caixa.left,
        width: caixa.width,
        maxHeight: Math.max(altura, 120),
        ...(paraCima
          ? { bottom: window.innerHeight - caixa.top + MARGEM }
          : { top: caixa.bottom + MARGEM }),
      });
    }

    calcular();
    window.addEventListener("resize", calcular);
    window.addEventListener("scroll", calcular, true);
    return () => {
      window.removeEventListener("resize", calcular);
      window.removeEventListener("scroll", calcular, true);
    };
  }, [aberto]);

  // Clique fora fecha (sem roubar o foco de onde o usuário clicou).
  useEffect(() => {
    if (!aberto) return undefined;
    function aoClicar(event) {
      if (botaoRef.current?.contains(event.target)) return;
      if (listaRef.current?.contains(event.target)) return;
      setAberto(false);
    }
    document.addEventListener("mousedown", aoClicar);
    return () => document.removeEventListener("mousedown", aoClicar);
  }, [aberto]);

  // Mantém a opção ativa visível ao navegar com as setas.
  useEffect(() => {
    if (!aberto || ativo < 0) return;
    listaRef.current
      ?.querySelector(`[data-indice="${ativo}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [aberto, ativo, posicao]);

  function aoTeclar(event) {
    if (desabilitado) return;

    if (!aberto) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        abrir();
      }
      return;
    }

    switch (event.key) {
      case "Escape":
        // Não deixa o Esc fechar o modal por baixo.
        event.preventDefault();
        event.stopPropagation();
        event.nativeEvent.stopImmediatePropagation();
        fechar();
        break;
      case "ArrowDown":
        event.preventDefault();
        setAtivo((atual) => Math.min(atual + 1, opcoes.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setAtivo((atual) => Math.max(atual - 1, 0));
        break;
      case "Home":
        event.preventDefault();
        setAtivo(0);
        break;
      case "End":
        event.preventDefault();
        setAtivo(opcoes.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        escolher(ativo);
        break;
      case "Tab":
        fechar(false);
        break;
      default:
        // Primeira letra: pula para a próxima opção que começa com ela.
        if (event.key.length === 1) {
          const letra = event.key.toLocaleLowerCase("pt-BR");
          const total = opcoes.length;
          for (let passo = 1; passo <= total; passo += 1) {
            const indice = (ativo + passo) % total;
            if (opcoes[indice].rotulo.toLocaleLowerCase("pt-BR").startsWith(letra)) {
              setAtivo(indice);
              break;
            }
          }
        }
    }
  }

  return (
    <>
      <button
        ref={botaoRef}
        id={id}
        type="button"
        className={`${styles.gatilho} ${aberto ? styles["gatilho-aberto"] : ""} ${
          invalido ? styles["gatilho-invalido"] : ""
        }`}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={idLista}
        aria-activedescendant={aberto && ativo >= 0 ? `${idLista}-${ativo}` : undefined}
        aria-invalid={invalido || undefined}
        disabled={desabilitado}
        onClick={() => (aberto ? fechar() : abrir())}
        onKeyDown={aoTeclar}
      >
        {selecionada ? (
          <span className={styles.conteudo}>
            {selecionada.icone && <span className={styles.icone}>{selecionada.icone}</span>}
            <span className={styles.rotulo}>{selecionada.rotulo}</span>
          </span>
        ) : (
          <span className={styles.placeholder}>{placeholder}</span>
        )}
        <ChevronDown size={18} aria-hidden="true" className={styles.seta} />
      </button>

      {aberto &&
        posicao &&
        createPortal(
          <ul
            ref={listaRef}
            id={idLista}
            role="listbox"
            className={styles.lista}
            style={posicao}
            onMouseDown={(event) => event.preventDefault()}
          >
            {opcoes.length === 0 && <li className={styles.vazio}>Nenhuma opção</li>}
            {opcoes.map((opcao, indice) => {
              const marcada = opcao.valor === valor;
              return (
                <li
                  key={opcao.valor}
                  id={`${idLista}-${indice}`}
                  data-indice={indice}
                  role="option"
                  aria-selected={marcada}
                  className={`${styles.opcao} ${indice === ativo ? styles["opcao-ativa"] : ""} ${
                    marcada ? styles["opcao-marcada"] : ""
                  }`}
                  onMouseEnter={() => setAtivo(indice)}
                  onClick={() => escolher(indice)}
                >
                  {opcao.icone && <span className={styles.icone}>{opcao.icone}</span>}
                  <span className={styles.textos}>
                    <span className={styles.rotulo}>{opcao.rotulo}</span>
                    {opcao.descricao && (
                      <span className={styles.descricao}>{opcao.descricao}</span>
                    )}
                  </span>
                  {marcada && <Check size={16} aria-hidden="true" className={styles.check} />}
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </>
  );
}
