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

import { DIRECAO_PADRAO, formatarData, formatarMoeda } from "../../utils/Gastosutils";
import {
  TIPO_RECEITA,
  agruparPorDia,
  totaisPorTipo,
} from "../../utils/Movimentacoesutils";
import IconeGasto from "../Gastos/IconeCategoria";
import IconeReceita from "../Receitas/IconeCategoria";
import g from "../../pages/Gastos/Gastos.module.css";
import styles from "../../pages/Movimentacoes/Movimentacoes.module.css";

const CAMPOS_ORDENACAO = [
  { campo: "data", rotulo: "Data" },
  { campo: "valor", rotulo: "Valor" },
  { campo: "categoria", rotulo: "Categoria" },
  { campo: "carteira", rotulo: "Carteira" },
];

function plural(quantidade, singular, formaPlural) {
  return quantidade === 1 ? singular : formaPlural;
}

function comSinal(valor) {
  if (valor > 0) return `+ ${formatarMoeda(valor)}`;
  if (valor < 0) return `− ${formatarMoeda(Math.abs(valor))}`;
  return formatarMoeda(0);
}

// Mesmo comportamento dos cabeçalhos clicáveis da tabela antiga:
// clicar de novo no campo ativo inverte a direção.
function BarraOrdenacao({ ordenacao, onOrdenar }) {
  return (
    <div className={styles.ordenacao} role="group" aria-label="Ordenar lista">
      <span className={styles["ordenacao-rotulo"]}>Ordenar:</span>
      {CAMPOS_ORDENACAO.map(({ campo, rotulo }) => {
        const ativo = ordenacao.campo === campo;
        const Seta = !ativo ? ArrowUpDown : ordenacao.direcao === "asc" ? ArrowUp : ArrowDown;
        return (
          <button
            key={campo}
            type="button"
            className={`${styles["ordenacao-botao"]} ${ativo ? styles["ordenacao-ativa"] : ""}`}
            aria-pressed={ativo}
            onClick={() =>
              onOrdenar(
                ativo
                  ? { campo, direcao: ordenacao.direcao === "asc" ? "desc" : "asc" }
                  : { campo, direcao: DIRECAO_PADRAO[campo] },
              )
            }
          >
            {rotulo}
            <Seta size={13} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

function Linha({ item, indice, mostrarData, saindo, onAbrir, onEditar, onExcluir, onComentario }) {
  const receita = item.tipo === TIPO_RECEITA;
  const Icone = receita ? IconeReceita : IconeGasto;
  const nomeTipo = receita ? "receita" : "gasto";

  return (
    <li
      className={`${styles.linha} ${g["gastos-linha"]} ${item.projetado ? styles["linha-prevista"] : ""} ${
        saindo ? g["gastos-linha-saindo"] : ""
      }`}
      style={{ "--i": indice }}
    >
      <button
        type="button"
        className={styles["linha-principal"]}
        onClick={() => onAbrir(item)}
        aria-label={`Ver detalhes de ${item.descricao}`}
      >
        <span className={`${styles["linha-icone"]} ${receita ? styles["linha-icone-entrada"] : ""}`}>
          <Icone categoria={item.categoria} />
        </span>

        <span className={styles["linha-meio"]}>
          <span className={styles["linha-titulo"]}>
            <span>{item.descricao}</span>
            {item.recorrenciaId && (
              <span
                className={g["gastos-selo-recorrente"]}
                title={`${receita ? "Receita recorrente" : "Gasto recorrente"} (repete todo mês)`}
              >
                <Repeat size={13} aria-hidden="true" />
                <span className={g["gastos-sr-only"]}>Recorrente</span>
              </span>
            )}
            {item.projetado && (
              <span
                className={g["gastos-selo-previsto"]}
                title="Lançamento previsto: ainda não aconteceu"
              >
                Previsto
              </span>
            )}
            {(mostrarData || item.projetado) && (
              <span className={styles["linha-data"]}>{formatarData(item.data)}</span>
            )}
          </span>
          <span className={styles["linha-sub"]}>
            {item.categoria} · {item.carteira}
          </span>
        </span>

        <span className={`${styles["linha-valor"]} ${receita ? styles["valor-entrada"] : styles["valor-saida"]}`}>
          {receita ? "+" : "−"} {formatarMoeda(item.valor)}
        </span>
      </button>

      <span className={styles["linha-acoes"]}>
        {item.comentario && !item.projetado && (
          <button
            type="button"
            className={g["gastos-botao-comentario"]}
            onClick={() => onComentario(item)}
            aria-label={`Ver comentário de ${item.descricao}`}
            title={item.comentario}
          >
            <MessageSquareText size={16} aria-hidden="true" />
          </button>
        )}

        {/* Previstos ainda não existem: só permitem excluir (remover a recorrência). */}
        {!item.projetado && (
          <button
            type="button"
            className={g["gastos-botao-icone"]}
            onClick={() => onEditar(item)}
            aria-label={`Editar ${nomeTipo} ${item.descricao}`}
            title="Editar"
          >
            <Pencil size={16} aria-hidden="true" />
          </button>
        )}

        <button
          type="button"
          className={`${g["gastos-botao-icone"]} ${g["gastos-botao-excluir"]}`}
          onClick={() => onExcluir(item)}
          aria-label={`Excluir ${nomeTipo} ${item.descricao}`}
          title={item.projetado ? "Remover recorrência" : "Excluir"}
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </span>
    </li>
  );
}

export default function ListaMovimentacoes({
  itens,
  quantidadeDoMes,
  filtrando,
  carregando,
  removendo,
  ordenacao,
  onOrdenar,
  onAbrir,
  onEditar,
  onExcluir,
  onComentario,
  onLimparFiltros,
  mesExtenso,
}) {
  if (carregando) {
    return (
      <div className={g["gastos-esqueleto-lista"]} aria-busy="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={g["gastos-esqueleto"]} />
        ))}
      </div>
    );
  }

  if (quantidadeDoMes === 0) {
    return (
      <div className={g["gastos-vazio"]}>
        <span className={g["gastos-vazio-icone"]} aria-hidden="true">
          🧾
        </span>
        <h3>Nenhuma movimentação neste mês</h3>
        <p className="texto-secundario">
          Não há gastos nem receitas em {mesExtenso}. Clique em “Nova movimentação” para registrar a
          primeira.
        </p>
      </div>
    );
  }

  if (itens.length === 0) {
    return (
      <div className={g["gastos-vazio"]}>
        <SearchX size={36} aria-hidden="true" className={g["gastos-vazio-svg"]} />
        <h3>Nenhuma movimentação encontrada</h3>
        <p className="texto-secundario">
          Nenhuma movimentação de {mesExtenso} combina com os filtros aplicados.
        </p>
        <button type="button" className="btn btn-secundario" onClick={onLimparFiltros}>
          Limpar filtros
        </button>
      </div>
    );
  }

  // Ordenado por data: agrupa por dia (com o total do dia). Nas outras
  // ordenações a lista é corrida, mostrando a data em cada linha.
  const porDia = ordenacao.campo === "data";
  const grupos = porDia
    ? agruparPorDia(itens, ordenacao.direcao)
    : [{ chave: "todos", itens, total: null }];

  const { entradas, saidas } = totaisPorTipo(itens);
  let indice = 0;

  return (
    <>
      <BarraOrdenacao ordenacao={ordenacao} onOrdenar={onOrdenar} />

      <div className={styles.lista}>
        {grupos.map((grupo) => (
          <section key={grupo.chave} aria-label={grupo.rotulo ?? "Movimentações"}>
            {grupo.rotulo && (
              <div className={styles.dia}>
                <span>{grupo.rotulo}</span>
                <span>{comSinal(grupo.total)}</span>
              </div>
            )}
            <ul className={styles["dia-itens"]}>
              {grupo.itens.map((item) => (
                <Linha
                  key={item.chave}
                  item={item}
                  indice={indice++}
                  mostrarData={!porDia}
                  saindo={removendo.has(item.chave)}
                  onAbrir={onAbrir}
                  onEditar={onEditar}
                  onExcluir={onExcluir}
                  onComentario={onComentario}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>

      <footer className={g["gastos-rodape"]}>
        <span className="texto-secundario texto-pequeno" aria-live="polite">
          {filtrando
            ? `${itens.length} de ${quantidadeDoMes} ${plural(quantidadeDoMes, "movimentação", "movimentações")}`
            : `${itens.length} ${plural(itens.length, "movimentação", "movimentações")}`}
        </span>

        <span className={g["gastos-total"]}>
          {filtrando ? "Total filtrado:" : "Total:"}{" "}
          <strong className={styles["valor-entrada"]}>+ {formatarMoeda(entradas)}</strong>
          {" · "}
          <strong className={styles["valor-saida"]}>− {formatarMoeda(saidas)}</strong>
        </span>
      </footer>
    </>
  );
}
