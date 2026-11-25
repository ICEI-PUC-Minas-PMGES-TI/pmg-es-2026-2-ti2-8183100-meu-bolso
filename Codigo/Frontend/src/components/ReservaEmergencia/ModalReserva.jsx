import { useEffect, useState } from "react";
import { X, Trash2, TriangleAlert } from "lucide-react";

import { obterSugestaoReserva } from "../../service/Api";
import {
  HORIZONTES,
  HORIZONTE_PADRAO,
  NOME_PADRAO,
  TEXTO_BASE,
  TIPO_RESERVA,
  converterValor,
  formatarMoeda,
  rotuloHorizonte,
  textoCobertura,
} from "./reserva";
import styles from "./ReservaEmergencia.module.css";

/**
 * Configuração (criação) e edição da reserva de emergência.
 *
 * Ordem do formulário:
 *  1. nome (padrão "Reserva de emergência");
 *  2. "quanto você gasta por mês?" — só quando não há dados para estimar;
 *  3. como definir o mínimo:
 *     - automático: escolhe por quanto tempo a reserva deve sustentar
 *       (3, 6 meses ou 1 ano), vendo o mínimo de cada opção lado a lado;
 *     - definir eu mesmo: digita o valor. O período some (o mínimo não
 *       depende dele), e a tela mostra a sugestão para comparar, quanto o
 *       valor cobre de gastos e um aviso se ele cobrir menos de 3 meses.
 *
 * O valor guardado não é editável aqui: só muda por depósito e retirada.
 *
 * props:
 *  - reserva: meta existente (edição) ou null (configuração)
 *  - onFechar: fecha o modal
 *  - onSalvar: async (corpo) => void — corpo pronto para a API; erros
 *    lançados aparecem no próprio modal
 *  - onExcluir: (reserva) => void — só na edição
 */
function ModalReserva({ reserva, onFechar, onSalvar, onExcluir }) {
  const editando = Boolean(reserva);

  const [nome, setNome] = useState(reserva?.nome ?? NOME_PADRAO);
  const [horizonte, setHorizonte] = useState(reserva?.horizonteMeses ?? HORIZONTE_PADRAO);
  const [automatico, setAutomatico] = useState(reserva ? reserva.minimoAutomatico !== false : true);
  const [valorMinimo, setValorMinimo] = useState(
    reserva && reserva.minimoAutomatico === false && reserva.valorMinimo != null
      ? String(reserva.valorMinimo)
      : "",
  );
  const [custoTexto, setCustoTexto] = useState(
    reserva?.custoMensalInformado != null ? String(reserva.custoMensalInformado) : "",
  );
  // Custo informado já aplicado na sugestão (o campo só recalcula ao confirmar).
  const [custoAplicado, setCustoAplicado] = useState(
    reserva?.custoMensalInformado != null ? Number(reserva.custoMensalInformado) : undefined,
  );

  const [sugestao, setSugestao] = useState(null);
  const [erroSugestao, setErroSugestao] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  // Busca a sugestão ao abrir e sempre que o custo informado muda.
  useEffect(() => {
    let ativo = true;
    obterSugestaoReserva(custoAplicado)
      .then((s) => {
        if (!ativo) return;
        setSugestao(s);
        setErroSugestao("");
      })
      .catch((e) => {
        if (ativo) setErroSugestao(e.message || "Não foi possível calcular a sugestão.");
      });
    return () => {
      ativo = false;
    };
  }, [custoAplicado]);

  const semDados = sugestao?.base === "sem_dados";
  const pedirCusto = semDados || sugestao?.base === "informado";
  const valorDaOpcao = (meses) => sugestao?.opcoes?.find((o) => o.meses === meses)?.valor;

  // Modo manual: prévia de cobertura e aviso abaixo de 3 meses.
  const minimoDigitado = converterValor(valorMinimo);
  const custoMensal = Number(sugestao?.custoMensal ?? 0);
  const coberturaManual = textoCobertura(minimoDigitado, custoMensal);
  const minimoTresMeses = valorDaOpcao(3);
  const abaixoDeTresMeses =
    minimoDigitado > 0 && minimoTresMeses != null && minimoDigitado < Number(minimoTresMeses);

  function aplicarCusto() {
    const valor = converterValor(custoTexto);
    if (valor == null || valor <= 0) {
      setErro("Informe quanto você gasta por mês, mais ou menos.");
      return;
    }
    setErro("");
    setCustoAplicado(valor);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) {
      setErro("Dê um nome para a reserva.");
      return;
    }

    if (!automatico && !(minimoDigitado > 0)) {
      setErro("Informe o valor mínimo da reserva.");
      return;
    }
    // Automático sem nenhuma base: não há como calcular o mínimo.
    if (automatico && semDados) {
      setErro("Informe quanto você gasta por mês (e clique em Calcular) ou defina o mínimo você mesmo.");
      return;
    }

    setErro("");
    setSalvando(true);
    try {
      await onSalvar({
        nome: nomeLimpo,
        prioridade: "alta",
        tipo: TIPO_RESERVA,
        horizonteMeses: horizonte,
        minimoAutomatico: automatico,
        valorMinimo: automatico ? null : minimoDigitado,
        custoMensalInformado: custoAplicado ?? null,
      });
    } catch (err) {
      setErro(err.message || "Não foi possível salvar a reserva.");
      setSalvando(false);
    }
  }

  function handleExcluir() {
    const confirmado = window.confirm(
      `Excluir a reserva "${reserva.nome}"? O convite para configurar volta a aparecer.`,
    );
    if (confirmado) onExcluir(reserva);
  }

  const temSaldo = Number(reserva?.valorAtual ?? 0) > 0;

  return (
    <div className={styles.overlay} onClick={onFechar}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-reserva"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.cabecalho}>
          <div>
            <h2 id="titulo-modal-reserva">
              {editando ? "Editar reserva de emergência" : "Configurar reserva de emergência"}
            </h2>
            <p>O dinheiro para imprevistos, como perder a renda ou um conserto urgente.</p>
          </div>
          <button className={styles.botaoFechar} type="button" onClick={onFechar} aria-label="Fechar">
            <X size={20} />
          </button>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.campo}>
            <label htmlFor="nome-reserva">Nome</label>
            <input
              id="nome-reserva"
              type="text"
              maxLength={120}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          {pedirCusto && (
            <div className={styles.campo}>
              <label htmlFor="custo-reserva">Quanto você gasta por mês, mais ou menos?</label>
              <div className={styles.linhaInline}>
                <input
                  id="custo-reserva"
                  type="text"
                  inputMode="decimal"
                  placeholder="R$ 0,00"
                  value={custoTexto}
                  onChange={(e) => setCustoTexto(e.target.value)}
                />
                <button type="button" className="btn btn-secundario" onClick={aplicarCusto}>
                  Calcular
                </button>
              </div>
              <span className={styles.ajuda}>
                Ainda não temos gastos suficientes para estimar. Quando você registrar gastos,
                o cálculo passa a usar os dados reais.
              </span>
            </div>
          )}

          <fieldset className={styles.campo}>
            <legend className={styles.legenda}>Como definir o valor mínimo?</legend>
            <div className={styles.modos}>
              <label className={styles.modo}>
                <input
                  type="radio"
                  name="modo-minimo"
                  checked={automatico}
                  onChange={() => setAutomatico(true)}
                />
                <span>
                  Automático
                  <small>Calculado pelos seus gastos e atualizado sozinho.</small>
                </span>
              </label>
              <label className={styles.modo}>
                <input
                  type="radio"
                  name="modo-minimo"
                  checked={!automatico}
                  onChange={() => setAutomatico(false)}
                />
                <span>
                  Definir eu mesmo
                  <small>Um valor fixo, que só muda quando você editar.</small>
                </span>
              </label>
            </div>
          </fieldset>

          {automatico ? (
            <fieldset className={styles.campo}>
              <legend className={styles.legenda}>Por quanto tempo sua reserva deve te sustentar?</legend>
              <div className={styles.opcoes}>
                {HORIZONTES.map((h) => {
                  const valor = valorDaOpcao(h.meses);
                  return (
                    <label key={h.meses} className={styles.opcao}>
                      <input
                        type="radio"
                        name="horizonte"
                        value={h.meses}
                        checked={horizonte === h.meses}
                        onChange={() => setHorizonte(h.meses)}
                      />
                      <span className={styles.opcaoRotulo}>{h.rotulo}</span>
                      <span className={styles.opcaoValor}>
                        {valor != null ? formatarMoeda(valor) : "—"}
                      </span>
                      <span className={styles.opcaoDica}>{h.dica}</span>
                    </label>
                  );
                })}
              </div>
              {erroSugestao ? (
                <span className={styles.ajuda}>{erroSugestao}</span>
              ) : sugestao && !semDados ? (
                <span className={styles.ajuda}>
                  Calculado com {TEXTO_BASE[sugestao.base]}
                  {sugestao.custoMensal != null &&
                    ` (cerca de ${formatarMoeda(sugestao.custoMensal)} por mês)`}
                  .
                </span>
              ) : null}
            </fieldset>
          ) : (
            <div className={styles.campo}>
              <label htmlFor="minimo-reserva">Valor mínimo</label>
              <input
                id="minimo-reserva"
                type="text"
                inputMode="decimal"
                placeholder="R$ 0,00"
                value={valorMinimo}
                onChange={(e) => setValorMinimo(e.target.value)}
              />
              {valorDaOpcao(HORIZONTE_PADRAO) != null && (
                <span className={styles.ajuda}>
                  Sugestão para {rotuloHorizonte(HORIZONTE_PADRAO)}:{" "}
                  {formatarMoeda(valorDaOpcao(HORIZONTE_PADRAO))}
                  {coberturaManual && ` · esse valor cobre cerca de ${coberturaManual} de gastos`}
                </span>
              )}
              {abaixoDeTresMeses && (
                <p className={`${styles.aviso} ${styles["aviso-alerta"]}`} role="status">
                  <TriangleAlert size={18} aria-hidden="true" />
                  <span>
                    Esse valor cobre menos de 3 meses
                    {coberturaManual ? ` (só ${coberturaManual})` : ""}. Recomendamos pelo menos{" "}
                    {formatarMoeda(minimoTresMeses)}.
                  </span>
                </p>
              )}
            </div>
          )}

          {erro && <p className={styles.erro}>{erro}</p>}

          {editando && temSaldo && (
            <span className={styles.ajuda}>
              Para excluir a reserva, retire antes o dinheiro guardado nela (botão Movimentar).
            </span>
          )}

          <div className={styles.rodapeModal}>
            {editando && onExcluir && (
              <button
                type="button"
                className={styles.btnExcluir}
                onClick={handleExcluir}
                disabled={temSaldo}
                title={temSaldo ? "Retire o dinheiro guardado antes de excluir." : undefined}
              >
                <Trash2 size={16} aria-hidden="true" />
                Excluir
              </button>
            )}
            <div className={styles.rodapeDireita}>
              <button type="button" className="btn btn-secundario" onClick={onFechar}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primario" disabled={salvando}>
                {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Criar reserva"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalReserva;
