import { useState } from "react";
import { Check, X } from "lucide-react";

import categoriasService from "../../service/categoriasService";
import { ICONES_DISPONIVEIS } from "../../data/categoriaIcones";
import SeletorIcone from "./SeletorIcone";
import styles from "./NovaCategoriaRapida.module.css";

/**
 * Cria uma categoria sem sair do lançamento: ícone + nome + confirmar.
 * Fica dentro do <form> do modal, então nenhum botão aqui é "submit" e o
 * Enter no campo cria a categoria em vez de salvar o lançamento.
 *
 * props: tipo ("gasto" | "receita"), onCriada(nome), onCancelar()
 */
export default function NovaCategoriaRapida({ tipo, onCriada, onCancelar }) {
  const [nome, setNome] = useState("");
  const [icone, setIcone] = useState(ICONES_DISPONIVEIS[0]);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function criar() {
    const limpo = nome.trim();
    if (!limpo) {
      setErro("Informe o nome da categoria.");
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      const criada = await categoriasService.criar(tipo, { nome: limpo, icone });
      await onCriada(criada.nome);
    } catch (e) {
      setErro(e.message || "Não foi possível criar a categoria.");
      setSalvando(false);
    }
  }

  return (
    <div className={styles.caixa}>
      <div className={styles.linha}>
        <SeletorIcone valor={icone} onEscolher={setIcone} desabilitado={salvando} />
        <input
          className={`form-input ${styles.nome}`}
          placeholder="Nome da nova categoria"
          aria-label="Nome da nova categoria"
          value={nome}
          maxLength={40}
          autoFocus
          disabled={salvando}
          onChange={(e) => {
            setNome(e.target.value);
            setErro("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              criar();
            }
            if (e.key === "Escape") {
              // Fecha só a criação rápida, sem fechar o modal.
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              onCancelar();
            }
          }}
        />
        <button
          type="button"
          className={styles.botao}
          onClick={criar}
          disabled={salvando || !nome.trim()}
          aria-label="Criar categoria"
          title="Criar categoria"
        >
          <Check size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={`${styles.botao} ${styles.cancelar}`}
          onClick={onCancelar}
          disabled={salvando}
          aria-label="Cancelar"
          title="Cancelar"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      {erro && (
        <span className={styles.erro} role="alert">
          {erro}
        </span>
      )}
    </div>
  );
}
