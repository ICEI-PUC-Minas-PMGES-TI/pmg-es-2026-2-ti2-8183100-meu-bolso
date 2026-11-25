import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowDownLeft, ArrowUpRight, Check, Lock, Pencil, Plus, Repeat, Trash2, X } from "lucide-react";

import categoriasService, {
  TIPO_GASTO,
  TIPO_RECEITA,
  useCategorias,
} from "../../service/categoriasService";
import gastosService from "../../service/gastosService";
import receitasService from "../../service/receitasService";
import { ICONES_DISPONIVEIS, iconeDe } from "../../data/categoriaIcones";
import { NOMES_MESES, formatarMoeda, mesAtualChave } from "../../utils/Gastosutils";
import SeletorIcone from "../../components/Categorias/SeletorIcone";

import g from "../Gastos/Gastos.module.css";
import styles from "./Categorias.module.css";

// "Outros" recebe os lançamentos de categorias removidas: não pode sair.
const CATEGORIA_PROTEGIDA = "outros";

function plural(n, singular, formaPlural) {
  return `${n} ${n === 1 ? singular : formaPlural}`;
}

/**
 * Uso de cada categoria (por nome): lançamentos já feitos, total do mês atual
 * e regras recorrentes. Previstos (projetados) não contam como lançamento.
 */
function calcularUso(lancamentos = [], recorrencias = [], mes = mesAtualChave()) {
  const uso = new Map();
  const pegar = (nome) => {
    if (!uso.has(nome)) uso.set(nome, { quantidade: 0, totalMes: 0, recorrencias: 0 });
    return uso.get(nome);
  };
  for (const item of lancamentos) {
    if (item.projetado) continue;
    const u = pegar(item.categoria);
    u.quantidade += 1;
    if (item.data?.startsWith(mes)) u.totalMes += Number(item.valor) || 0;
  }
  for (const rec of recorrencias) {
    pegar(rec.categoria).recorrencias += 1;
  }
  return uso;
}

// Ex.: "12 lançamentos · R$ 340,00 em novembro"
function descreverUso(u, nomeDoMes) {
  if (!u || (u.quantidade === 0 && u.recorrencias === 0)) return "Ainda não usada";
  const partes = [plural(u.quantidade, "lançamento", "lançamentos")];
  if (u.totalMes > 0) partes.push(`${formatarMoeda(u.totalMes)} em ${nomeDoMes}`);
  return partes.join(" · ");
}

/**
 * Card com a biblioteca de um tipo (gasto ou receita): criar, renomear,
 * trocar ícone e remover. No desktop os dois cards ficam lado a lado; no
 * celular a página mostra um de cada vez, escolhido pelas abas.
 */
function PainelCategorias({ tipo, uso, nomeDoMes, onAlterado, oculto }) {
  const ehReceita = tipo === TIPO_RECEITA;
  const categorias = useCategorias(tipo);

  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoIcone, setNovoIcone] = useState(ICONES_DISPONIVEIS[0]);
  // Edição na própria linha: { id, nome, icone } ou null
  const [editando, setEditando] = useState(null);

  async function executar(acao, recarregarUso = false) {
    setOcupado(true);
    setErro("");
    try {
      await acao();
      if (recarregarUso) await onAlterado();
    } catch (e) {
      setErro(e.message || "Não foi possível concluir a ação.");
    } finally {
      setOcupado(false);
    }
  }

  async function adicionar(event) {
    event.preventDefault();
    const nome = novoNome.trim();
    if (!nome) return;
    await executar(async () => {
      await categoriasService.criar(tipo, { nome, icone: novoIcone });
      setNovoNome("");
      setNovoIcone(ICONES_DISPONIVEIS[0]);
    });
  }

  async function salvarEdicao() {
    const nome = editando.nome.trim();
    if (!nome) {
      setErro("Informe o nome da categoria.");
      return;
    }
    await executar(async () => {
      await categoriasService.atualizar(tipo, editando.id, { nome, icone: editando.icone });
      setEditando(null);
    }, true);
  }

  async function remover(categoria) {
    const u = uso?.get(categoria.nome);
    const afetados = [];
    if (u?.quantidade) afetados.push(plural(u.quantidade, "lançamento", "lançamentos"));
    if (u?.recorrencias) afetados.push(plural(u.recorrencias, "recorrência", "recorrências"));
    const aviso = afetados.length
      ? `\n\nVão para "Outros": ${afetados.join(" e ")}.`
      : "\n\nNenhum lançamento usa esta categoria.";

    if (!window.confirm(`Remover a categoria "${categoria.nome}"?${aviso}`)) return;
    await executar(() => categoriasService.excluir(tipo, categoria.id), true);
  }

  const IconeTitulo = ehReceita ? ArrowDownLeft : ArrowUpRight;

  return (
    <section
      className={`${g["gastos-card"]} ${styles.painel} ${oculto ? styles["oculto-celular"] : ""}`}
      aria-labelledby={`titulo-${tipo}`}
    >
      <header className={styles["painel-topo"]}>
        <span className={`${styles["painel-icone"]} ${ehReceita ? styles["painel-icone-receita"] : ""}`}>
          <IconeTitulo size={18} aria-hidden="true" />
        </span>
        <div>
          <h2 id={`titulo-${tipo}`} className={styles["painel-titulo"]}>
            {ehReceita ? "Categorias de receita" : "Categorias de gasto"}
          </h2>
          <p className={styles["painel-legenda"]}>
            {categorias ? plural(categorias.length, "categoria", "categorias") : "Carregando…"}
          </p>
        </div>
      </header>

      <form className={styles.novo} onSubmit={adicionar}>
        <SeletorIcone valor={novoIcone} onEscolher={setNovoIcone} desabilitado={ocupado} />
        <input
          className={`form-input ${styles["novo-nome"]}`}
          placeholder={ehReceita ? "Nova categoria de receita" : "Nova categoria de gasto"}
          aria-label={ehReceita ? "Nome da nova categoria de receita" : "Nome da nova categoria de gasto"}
          value={novoNome}
          maxLength={40}
          onChange={(e) => setNovoNome(e.target.value)}
          disabled={ocupado}
        />
        <button
          type="submit"
          className={`btn btn-primario ${styles["novo-botao"]}`}
          disabled={ocupado || !novoNome.trim()}
          aria-label="Adicionar categoria"
        >
          <Plus size={16} aria-hidden="true" />
          <span className={styles["novo-botao-texto"]}>Adicionar</span>
        </button>
      </form>

      {erro && (
        <p className={`mensagem mensagem-erro ${styles.erro}`} role="alert">
          {erro}
        </p>
      )}

      {categorias === null ? (
        <div className={g["gastos-esqueleto-lista"]} aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={g["gastos-esqueleto"]} />
          ))}
        </div>
      ) : (
        <ul className={styles.lista}>
          {categorias.map((cat) => {
            const emEdicao = editando?.id === cat.id;
            const protegida = cat.nome.toLowerCase() === CATEGORIA_PROTEGIDA;
            const u = uso?.get(cat.nome);

            if (emEdicao) {
              return (
                <li key={cat.id} className={`${styles.item} ${styles["item-editando"]}`}>
                  <SeletorIcone
                    valor={editando.icone}
                    onEscolher={(icone) => setEditando((e) => ({ ...e, icone }))}
                    desabilitado={ocupado}
                  />
                  <input
                    className={`form-input ${styles["editar-nome"]}`}
                    aria-label="Nome da categoria"
                    value={editando.nome}
                    maxLength={40}
                    autoFocus
                    disabled={ocupado || protegida}
                    onChange={(e) => setEditando((ed) => ({ ...ed, nome: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        salvarEdicao();
                      }
                      if (e.key === "Escape") setEditando(null);
                    }}
                  />
                  <div className={styles.acoes}>
                    <button
                      type="button"
                      className={g["gastos-botao-icone"]}
                      onClick={salvarEdicao}
                      disabled={ocupado}
                      aria-label="Salvar"
                      title="Salvar"
                    >
                      <Check size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={g["gastos-botao-icone"]}
                      onClick={() => setEditando(null)}
                      disabled={ocupado}
                      aria-label="Cancelar"
                      title="Cancelar"
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            }

            return (
              <li key={cat.id} className={styles.item}>
                <span className={`${styles.icone} ${ehReceita ? styles["icone-receita"] : ""}`}>
                  {createElement(iconeDe(cat.icone), { size: 18, "aria-hidden": true })}
                </span>
                <span className={styles.textos}>
                  <span className={styles.nome}>
                    <span className={styles["nome-texto"]}>{cat.nome}</span>
                    {protegida && (
                      <span className={styles.selo} title="Recebe os lançamentos de categorias removidas">
                        <Lock size={11} aria-hidden="true" /> Fixa
                      </span>
                    )}
                  </span>
                  <span className={styles.uso}>
                    {uso ? descreverUso(u, nomeDoMes) : "…"}
                    {u?.recorrencias > 0 && (
                      <span className={styles.recorrentes}>
                        <Repeat size={11} aria-hidden="true" />
                        {plural(u.recorrencias, "recorrência", "recorrências")}
                      </span>
                    )}
                  </span>
                </span>
                <div className={styles.acoes}>
                  <button
                    type="button"
                    className={g["gastos-botao-icone"]}
                    onClick={() => setEditando({ id: cat.id, nome: cat.nome, icone: cat.icone })}
                    disabled={ocupado}
                    aria-label={protegida ? `Trocar ícone de ${cat.nome}` : `Editar ${cat.nome}`}
                    title={protegida ? "Trocar ícone" : "Editar"}
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </button>
                  {/* "Outros" fica com um espaço vazio no lugar da lixeira, para alinhar. */}
                  {protegida ? (
                    <span className={styles["acao-vazia"]} aria-hidden="true" />
                  ) : (
                    <button
                      type="button"
                      className={`${g["gastos-botao-icone"]} ${g["gastos-botao-excluir"]}`}
                      onClick={() => remover(cat)}
                      disabled={ocupado}
                      aria-label={`Remover ${cat.nome}`}
                      title="Remover"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default function Categorias() {
  const [searchParams, setSearchParams] = useSearchParams();
  // Aba ativa no celular (no desktop os dois tipos aparecem lado a lado).
  const aba = searchParams.get("tipo") === TIPO_RECEITA ? TIPO_RECEITA : TIPO_GASTO;

  const [dados, setDados] = useState({ gastos: null, receitas: null });

  const carregarUso = useCallback(async () => {
    try {
      const [gastos, receitas] = await Promise.all([
        gastosService.carregarTudo(),
        receitasService.carregarTudo(),
      ]);
      setDados({ gastos, receitas });
    } catch {
      setDados({ gastos: { gastos: [], recorrencias: [] }, receitas: { receitas: [], recorrencias: [] } });
    }
  }, []);

  // Lançamentos e recorrências, só para mostrar o uso de cada categoria.
  useEffect(() => {
    let ativo = true;
    Promise.all([gastosService.carregarTudo(), receitasService.carregarTudo()])
      .then(([gastos, receitas]) => {
        if (ativo) setDados({ gastos, receitas });
      })
      .catch(() => {
        if (ativo) setDados({ gastos: { gastos: [], recorrencias: [] }, receitas: { receitas: [], recorrencias: [] } });
      });
    return () => {
      ativo = false;
    };
  }, []);

  const mes = mesAtualChave();
  const nomeDoMes = NOMES_MESES[Number(mes.slice(5, 7)) - 1].toLowerCase();

  const usoGastos = useMemo(
    () => (dados.gastos ? calcularUso(dados.gastos.gastos, dados.gastos.recorrencias, mes) : null),
    [dados.gastos, mes],
  );
  const usoReceitas = useMemo(
    () => (dados.receitas ? calcularUso(dados.receitas.receitas, dados.receitas.recorrencias, mes) : null),
    [dados.receitas, mes],
  );

  function trocarAba(novo) {
    setSearchParams(novo === TIPO_RECEITA ? { tipo: TIPO_RECEITA } : {}, { replace: true });
  }

  return (
    <section className={g["gastos-pagina"]}>
      <header className={g["gastos-topo"]}>
        <div>
          <h1 className={g["gastos-titulo"]}>Categorias</h1>
          <p className={g["gastos-subtitulo"]}>
            Organize as categorias dos seus gastos e receitas. As mudanças valem no site e no WhatsApp.
          </p>
        </div>
        <Link to="/movimentacoes" className={`btn btn-secundario ${styles["link-movimentacoes"]}`}>
          Ver movimentações
        </Link>
      </header>

      {/* Só no celular: escolhe qual dos dois cards aparece. */}
      <div className={styles.abas} role="tablist" aria-label="Tipo de categoria">
        <button
          type="button"
          role="tab"
          aria-selected={aba === TIPO_GASTO}
          className={aba === TIPO_GASTO ? styles["aba-ativa"] : ""}
          onClick={() => trocarAba(TIPO_GASTO)}
        >
          Gastos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={aba === TIPO_RECEITA}
          className={aba === TIPO_RECEITA ? styles["aba-ativa"] : ""}
          onClick={() => trocarAba(TIPO_RECEITA)}
        >
          Receitas
        </button>
      </div>

      <div className={styles.grade}>
        <PainelCategorias
          tipo={TIPO_GASTO}
          uso={usoGastos}
          nomeDoMes={nomeDoMes}
          onAlterado={carregarUso}
          oculto={aba !== TIPO_GASTO}
        />
        <PainelCategorias
          tipo={TIPO_RECEITA}
          uso={usoReceitas}
          nomeDoMes={nomeDoMes}
          onAlterado={carregarUso}
          oculto={aba !== TIPO_RECEITA}
        />
      </div>
    </section>
  );
}
