import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  MessageSquareText,
  Pencil,
  Repeat,
  SearchX,
  Trash2,
} from "lucide-react";

import {
  formatarData,
  formatarMoeda,
  DIRECAO_PADRAO,
} from "../../utils/Receitasutils";
import IconeCategoria from "./IconeCategoria";
import styles from "../../pages/Receitas/Receitas.module.css";

// Cabeçalho clicável: alterna crescente/decrescente e informa o estado ao leitor de tela
function CabecalhoOrdenavel({ campo, rotulo, ordenacao, onOrdenar, className }) {
  const ativo = ordenacao.campo === campo;
  const Seta = !ativo ? ArrowUpDown : ordenacao.direcao === "asc" ? ArrowUp : ArrowDown;

  function alternar() {
    onOrdenar(
      ativo
        ? { campo, direcao: ordenacao.direcao === "asc" ? "desc" : "asc" }
        : { campo, direcao: DIRECAO_PADRAO[campo] },
    );
  }

  return (
    <th
      className={className}
      aria-sort={
        ativo ? (ordenacao.direcao === "asc" ? "ascending" : "descending") : "none"
      }
    >
      <button
        type="button"
        className={`${styles["receitas-th-botao"]} ${
          ativo ? styles["receitas-th-ativo"] : ""
        }`}
        onClick={alternar}
      >
        {rotulo}
        <Seta size={14} aria-hidden="true" />
      </button>
    </th>
  );
}

export default function TabelaReceitas({
  receitas,
  quantidadeDoMes,
  filtrando,
  carregando,
  removendo,
  ordenacao,
  onOrdenar,
  onEditar,
  onExcluir,
  onComentario,
  onLimparFiltros,
  mesExtenso,
}) {
  if (carregando) {
    return (
      <div className={styles["receitas-esqueleto-lista"]} aria-busy="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={styles["receitas-esqueleto"]} />
        ))}
      </div>
    );
  }

  if (quantidadeDoMes === 0) {
    return (
      <div className={styles["receitas-vazio"]}>
        <span className={styles["receitas-vazio-icone"]} aria-hidden="true">
          💰
        </span>
        <h3>Nenhuma receita neste mês</h3>
        <p className="texto-secundario">
          Não há receitas em {mesExtenso}. Clique em “Adicionar Receita” para registrar a
          primeira.
        </p>
      </div>
    );
  }

  if (receitas.length === 0) {
    return (
      <div className={styles["receitas-vazio"]}>
        <SearchX size={36} aria-hidden="true" className={styles["receitas-vazio-svg"]} />
        <h3>Nenhuma receita encontrada</h3>
        <p className="texto-secundario">
          Nenhuma receita de {mesExtenso} combina com os filtros aplicados.
        </p>
        <button type="button" className="btn btn-secundario" onClick={onLimparFiltros}>
          Limpar filtros
        </button>
      </div>
    );
  }

  const somaVisivel = receitas.reduce((soma, receita) => soma + receita.valor, 0);

  return (
    <>
      <div className={styles["receitas-tabela-wrapper"]}>
        <table className={styles["receitas-tabela"]}>
          <thead>
            <tr>
              <th>Descrição</th>
              <CabecalhoOrdenavel
                campo="categoria"
                rotulo="Categoria"
                ordenacao={ordenacao}
                onOrdenar={onOrdenar}
              />
              <CabecalhoOrdenavel
                campo="carteira"
                rotulo="Carteira"
                ordenacao={ordenacao}
                onOrdenar={onOrdenar}
              />
              <CabecalhoOrdenavel
                campo="data"
                rotulo="Data"
                ordenacao={ordenacao}
                onOrdenar={onOrdenar}
              />
              <CabecalhoOrdenavel
                campo="valor"
                rotulo="Valor"
                ordenacao={ordenacao}
                onOrdenar={onOrdenar}
                className={styles["receitas-col-valor"]}
              />
              <th className={styles["receitas-col-acoes"]}>
                <span className={styles["receitas-sr-only"]}>Ações</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {receitas.map((receita, indice) => (
              <tr
                key={receita.id}
                className={`${styles["receitas-linha"]} ${
                  removendo.has(receita.id) ? styles["receitas-linha-saindo"] : ""
                }`}
                style={{ "--i": indice }}
              >
                <td data-label="Descrição" className={styles["receitas-celula-descricao"]}>
                  <span className={styles["receitas-descricao"]}>
                    <span>{receita.descricao}</span>

                    {receita.recorrenciaId && (
                      <span
                        className={styles["receitas-selo-recorrente"]}
                        title="Receita recorrente (repete todo mês)"
                      >
                        <Repeat size={13} aria-hidden="true" />
                        <span className={styles["receitas-sr-only"]}>Recorrente</span>
                      </span>
                    )}

                    {receita.comentario && (
                      <button
                        type="button"
                        className={styles["receitas-botao-comentario"]}
                        onClick={() => onComentario(receita)}
                        aria-label={`Ver comentário de ${receita.descricao}`}
                        title={receita.comentario}
                      >
                        <MessageSquareText size={16} aria-hidden="true" />
                      </button>
                    )}
                  </span>
                </td>

                <td data-label="Categoria">
                  <span className={styles["receitas-etiqueta"]}>
                    <IconeCategoria categoria={receita.categoria} />
                    {receita.categoria}
                  </span>
                </td>

                <td data-label="Carteira">{receita.carteira}</td>

                <td data-label="Data">{formatarData(receita.data)}</td>

                <td data-label="Valor" className={styles["receitas-col-valor"]}>
                  <span className={styles["receitas-valor"]}>
                    + {formatarMoeda(receita.valor)}
                  </span>
                </td>

                <td data-label="Ações" className={styles["receitas-col-acoes"]}>
                  <span className={styles["receitas-acoes"]}>
                    <button
                      type="button"
                      className={styles["receitas-botao-icone"]}
                      onClick={() => onEditar(receita)}
                      aria-label={`Editar receita ${receita.descricao}`}
                      title="Editar"
                    >
                      <Pencil size={16} aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      className={`${styles["receitas-botao-icone"]} ${styles["receitas-botao-excluir"]}`}
                      onClick={() => onExcluir(receita)}
                      aria-label={`Excluir receita ${receita.descricao}`}
                      title="Excluir"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className={styles["receitas-rodape"]}>
        <span className="texto-secundario texto-pequeno" aria-live="polite">
          {filtrando
            ? `${receitas.length} de ${quantidadeDoMes} ${quantidadeDoMes === 1 ? "receita" : "receitas"}`
            : `${receitas.length} ${receitas.length === 1 ? "receita" : "receitas"}`}
        </span>

        <span className={styles["receitas-total"]}>
          {filtrando ? "Total filtrado:" : "Total:"}{" "}
          <strong className={styles["receitas-valor"]}>+ {formatarMoeda(somaVisivel)}</strong>
        </span>
      </footer>
    </>
  );
}
