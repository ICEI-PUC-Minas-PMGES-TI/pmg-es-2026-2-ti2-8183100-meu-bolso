import { useEffect, useId, useRef, useState } from "react";
import { X, Plus, Pencil, Trash2, Check, Library } from "lucide-react";

import categoriasService from "../../service/categoriasService";
import { CATALOGO, ICONES_DISPONIVEIS, buscarIcones, iconeDe } from "../../data/categoriaIcones";
import styles from "./GerenciarCategorias.module.css";

/**
 * Modal reutilizável da "biblioteca de categorias".
 *
 * Serve tanto para gastos quanto para receitas (prop `tipo` = "gasto" |
 * "receita"). Permite adicionar, renomear, trocar o ícone e remover
 * categorias. Tudo é salvo no back-end; ao fechar, avisa o pai via
 * `onAlterado` para que a lista de categorias da tela seja recarregada.
 */
export default function GerenciarCategorias({ tipo, onFechar, onAlterado }) {
  const idTitulo = useId();
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [houveMudanca, setHouveMudanca] = useState(false);

  // Formulário de criação
  const [novoNome, setNovoNome] = useState("");
  const [novoIcone, setNovoIcone] = useState(ICONES_DISPONIVEIS[0]);

  // Edição inline: { id, nome, icone } ou null
  const [editando, setEditando] = useState(null);

  const titulo = tipo === "receita" ? "Categorias de receita" : "Categorias de gasto";

  const carregar = useRef(null);
  carregar.current = async () => {
    try {
      setCategorias(await categoriasService.listar(tipo));
      setErro("");
    } catch (e) {
      setErro(e.message || "Não foi possível carregar as categorias.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar.current();
  }, [tipo]);

  // Fecha com Esc e devolve o foco ao abrir.
  useEffect(() => {
    function aoTeclar(e) {
      if (e.key === "Escape") fechar();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function fechar() {
    if (houveMudanca) onAlterado?.();
    onFechar();
  }

  async function executar(acao) {
    setOcupado(true);
    setErro("");
    try {
      await acao();
      await carregar.current();
      setHouveMudanca(true);
    } catch (e) {
      setErro(e.message || "Não foi possível concluir a ação.");
    } finally {
      setOcupado(false);
    }
  }

  async function adicionar(event) {
    event.preventDefault();
    const nome = novoNome.trim();
    if (!nome) {
      setErro("Informe o nome da categoria.");
      return;
    }
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
      await categoriasService.atualizar(tipo, editando.id, {
        nome,
        icone: editando.icone,
      });
      setEditando(null);
    });
  }

  async function remover(categoria) {
    if (categoria.nome.toLowerCase() === "outros") {
      setErro('A categoria "Outros" não pode ser removida.');
      return;
    }
    if (
      !window.confirm(
        `Remover a categoria "${categoria.nome}"? Os lançamentos que a usavam passam para "Outros".`,
      )
    ) {
      return;
    }
    await executar(() => categoriasService.excluir(tipo, categoria.id));
  }

  return (
    <div
      className={styles.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) fechar();
      }}
    >
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
      >
        <div className={styles.cabecalho}>
          <h2 id={idTitulo} className={styles.titulo}>
            <Library size={20} aria-hidden="true" />
            {titulo}
          </h2>
          <button
            type="button"
            className={styles.fechar}
            onClick={fechar}
            aria-label="Fechar"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <p className={`texto-secundario texto-pequeno ${styles.intro}`}>
          Monte sua biblioteca: adicione, renomeie ou remova categorias. As
          mudanças valem para os próximos lançamentos e para os já registrados.
        </p>

        {erro && (
          <p className="mensagem mensagem-erro" role="alert">
            {erro}
          </p>
        )}

        {/* Formulário de nova categoria */}
        <form className={styles.novo} onSubmit={adicionar}>
          <SeletorIcone
            valor={novoIcone}
            onEscolher={setNovoIcone}
            desabilitado={ocupado}
          />
          <input
            className={`form-input ${styles.novoNome}`}
            placeholder="Nova categoria"
            value={novoNome}
            maxLength={40}
            onChange={(e) => setNovoNome(e.target.value)}
            disabled={ocupado}
          />
          <button
            type="submit"
            className="btn btn-primario"
            disabled={ocupado || !novoNome.trim()}
          >
            <Plus size={16} aria-hidden="true" />
            Adicionar
          </button>
        </form>

        {/* Lista de categorias */}
        {carregando ? (
          <p className="texto-secundario">Carregando...</p>
        ) : (
          <ul className={styles.lista}>
            {categorias.map((cat) => {
              const emEdicao = editando?.id === cat.id;
              const Icone = iconeDe(emEdicao ? editando.icone : cat.icone);

              return (
                <li key={cat.id} className={styles.item}>
                  {emEdicao ? (
                    <>
                      <SeletorIcone
                        valor={editando.icone}
                        onEscolher={(ic) => setEditando((e) => ({ ...e, icone: ic }))}
                        desabilitado={ocupado}
                      />
                      <input
                        className={`form-input ${styles.editNome}`}
                        value={editando.nome}
                        maxLength={40}
                        autoFocus
                        onChange={(e) =>
                          setEditando((ed) => ({ ...ed, nome: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            salvarEdicao();
                          }
                        }}
                        disabled={ocupado}
                      />
                      <div className={styles.acoes}>
                        <button
                          type="button"
                          className={styles.iconeBtn}
                          onClick={salvarEdicao}
                          disabled={ocupado}
                          aria-label="Salvar"
                          title="Salvar"
                        >
                          <Check size={16} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className={styles.iconeBtn}
                          onClick={() => setEditando(null)}
                          disabled={ocupado}
                          aria-label="Cancelar"
                          title="Cancelar"
                        >
                          <X size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className={styles.itemIcone}>
                        <Icone size={18} aria-hidden="true" />
                      </span>
                      <span className={styles.itemNome}>{cat.nome}</span>
                      <div className={styles.acoes}>
                        <button
                          type="button"
                          className={styles.iconeBtn}
                          onClick={() =>
                            setEditando({ id: cat.id, nome: cat.nome, icone: cat.icone })
                          }
                          disabled={ocupado}
                          aria-label={`Editar ${cat.nome}`}
                          title="Editar"
                        >
                          <Pencil size={16} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className={`${styles.iconeBtn} ${styles.iconeExcluir}`}
                          onClick={() => remover(cat)}
                          disabled={ocupado}
                          aria-label={`Remover ${cat.nome}`}
                          title="Remover"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className={styles.rodape}>
          <button type="button" className="btn btn-primario" onClick={fechar}>
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Seletor de ícone: um botão com o ícone atual que abre um painel com busca e
 * uma grade com todos os ícones disponíveis. Dá para digitar ("cafe", "carro",
 * "saude"...) para filtrar, ou rolar a grade e escolher.
 */
function SeletorIcone({ valor, onEscolher, desabilitado }) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const ref = useRef(null);
  const Atual = iconeDe(valor);

  const resultados = buscarIcones(busca);

  useEffect(() => {
    if (!aberto) return;
    function aoClicarFora(e) {
      if (ref.current && !ref.current.contains(e.target)) setAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [aberto]);

  // Ao fechar, limpa a busca para a próxima abertura começar do zero.
  useEffect(() => {
    if (!aberto) setBusca("");
  }, [aberto]);

  function escolher(nome) {
    onEscolher(nome);
    setAberto(false);
  }

  return (
    <div className={styles.seletor} ref={ref}>
      <button
        type="button"
        className={styles.seletorBotao}
        onClick={() => setAberto((v) => !v)}
        disabled={desabilitado}
        aria-label="Escolher ícone"
        aria-haspopup="true"
        aria-expanded={aberto}
        title="Escolher ícone"
      >
        <Atual size={18} aria-hidden="true" />
      </button>

      {aberto && (
        <div className={styles.seletorPainel} role="dialog" aria-label="Escolher ícone">
          <input
            type="search"
            className={`form-input ${styles.seletorBusca}`}
            placeholder="Buscar ícone (ex.: comida, carro...)"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            autoFocus
          />

          {resultados.length === 0 ? (
            <p className={styles.seletorVazio}>Nenhum ícone encontrado.</p>
          ) : (
            <div className={styles.seletorGrade} role="listbox">
              {resultados.map((nome) => {
                const Ic = iconeDe(nome);
                return (
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
                    <Ic size={18} aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
