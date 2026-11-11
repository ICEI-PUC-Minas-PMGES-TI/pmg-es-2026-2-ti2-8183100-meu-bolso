import { useEffect, useState } from "react";
import { Mail, Eye, Send, CheckCircle2, Info } from "lucide-react";

import { resumoSemanalApi } from "../../service/Api";
import styles from "./ResumoSemanalConfig.module.css";

// O resumo reflete os gastos da API. Com localStorage, ele sairia vazio.
const SINCRONIZACAO_ATIVA = import.meta.env.VITE_GASTOS_API === "true";

function formatarMoeda(valor) {
  return Number(valor ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// "2026-11-07" -> "07/11/2026"
function formatarData(iso) {
  if (!iso) return "";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function Previa({ resumo }) {
  const { orcamento } = resumo;
  return (
    <div className={styles.previa}>
      <p>
        <strong>Últimos 7 dias:</strong> {formatarMoeda(resumo.totalSemana)} em{" "}
        {resumo.quantidadeSemana} lançamento(s)
      </p>

      <p>Categorias que mais pesaram:</p>
      {resumo.categorias.length === 0 ? (
        <p>Nenhum gasto nesta semana.</p>
      ) : (
        <ul>
          {resumo.categorias.map((c) => (
            <li key={c.nome}>
              {c.nome}: {formatarMoeda(c.valor)}
            </li>
          ))}
        </ul>
      )}

      <p>
        <strong>Orçamento do mês:</strong>{" "}
        {orcamento.limite > 0
          ? `${formatarMoeda(orcamento.gastoNoMes)} de ${formatarMoeda(orcamento.limite)} (${orcamento.percentual}%)`
          : "defina um valor mensal na página de Gastos."}
      </p>

      <p>Metas:</p>
      {resumo.metas.length === 0 ? (
        <p>Nenhuma meta cadastrada.</p>
      ) : (
        <ul>
          {resumo.metas.map((m) => (
            <li key={m.nome}>
              {m.nome}: {formatarMoeda(m.valorAtual)} de {formatarMoeda(m.valorAlvo)} ({m.percentual}%)
            </li>
          ))}
        </ul>
      )}

      <p>Contas a vencer nos próximos 7 dias:</p>
      {resumo.contasAVencer.length === 0 ? (
        <p>Nenhuma conta recorrente a vencer.</p>
      ) : (
        <ul>
          {resumo.contasAVencer.map((c) => (
            <li key={`${c.descricao}-${c.vencimento}`}>
              {c.descricao}: {formatarMoeda(c.valor)} em {formatarData(c.vencimento)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ResumoSemanalConfig() {
  const [carregando, setCarregando] = useState(true);
  const [ativo, setAtivo] = useState(false);
  const [email, setEmail] = useState("");
  const [ultimoEnvio, setUltimoEnvio] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [previa, setPrevia] = useState(null);

  useEffect(() => {
    let ativoEfeito = true;
    resumoSemanalApi
      .obterPreferencia()
      .then((p) => {
        if (!ativoEfeito) return;
        setAtivo(p.ativo);
        setEmail(p.email ?? "");
        setUltimoEnvio(p.ultimoEnvio ?? null);
      })
      .catch((e) => {
        if (ativoEfeito) setErro(e.message || "Não foi possível carregar o resumo.");
      })
      .finally(() => {
        if (ativoEfeito) setCarregando(false);
      });
    return () => {
      ativoEfeito = false;
    };
  }, []);

  async function alternarEnvio() {
    setErro("");
    setAviso("");
    setOcupado(true);
    try {
      const p = await resumoSemanalApi.definirPreferencia(!ativo);
      setAtivo(p.ativo);
    } catch (e) {
      setErro(e.message);
    } finally {
      setOcupado(false);
    }
  }

  async function alternarPrevia() {
    if (previa) {
      setPrevia(null);
      return;
    }
    setErro("");
    setAviso("");
    setOcupado(true);
    try {
      setPrevia(await resumoSemanalApi.previa());
    } catch (e) {
      setErro(e.message);
    } finally {
      setOcupado(false);
    }
  }

  async function enviarAgora() {
    setErro("");
    setAviso("");
    setOcupado(true);
    try {
      const r = await resumoSemanalApi.enviarAgora();
      setAviso(r.mensagem);
      setUltimoEnvio(new Date().toISOString().slice(0, 10));
    } catch (e) {
      setErro(e.message);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section className={styles.cartao}>
      <div className={styles.cartaoCabecalho}>
        <span className={styles.cartaoIcone}>
          <Mail size={18} aria-hidden="true" />
        </span>
        <div>
          <h3 className={styles.cartaoTitulo}>Resumo semanal por e-mail</h3>
          <p className={styles.cartaoDescricao}>
            Receba toda segunda-feira um resumo dos seus gastos e metas.
          </p>
        </div>
      </div>

      {carregando ? (
        <div className={styles.esqueleto} aria-busy="true" />
      ) : (
        <div className={styles.cartaoCorpo}>
          {/* Linha do switch: estado + controle */}
          <div className={styles.switchLinha}>
            <div className={styles.switchInfo}>
              <span
                className={`${styles.badge} ${ativo ? styles.badgeAtivo : styles.badgeInativo}`}
              >
                {ativo ? "Ativado" : "Desativado"}
              </span>
              <span className={styles.switchTexto}>
                {ativo
                  ? `Próximo envio: segunda-feira, 8h${email ? ` · ${email}` : ""}`
                  : "Você não está recebendo o resumo semanal."}
              </span>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={ativo}
              aria-label="Receber resumo semanal"
              className={`${styles.switch} ${ativo ? styles.switchOn : ""}`}
              onClick={alternarEnvio}
              disabled={ocupado}
            >
              <span className={styles.switchBolinha} />
            </button>
          </div>

          {ultimoEnvio && (
            <p className={styles.ultimoEnvio}>
              Último envio em {formatarData(ultimoEnvio)}
            </p>
          )}

          {!SINCRONIZACAO_ATIVA && (
            <p className={styles.aviso}>
              <Info size={15} aria-hidden="true" />
              <span>
                Os gastos só aparecem no resumo quando a sincronização com o
                servidor está ativa.
              </span>
            </p>
          )}

          <div className={styles.acoes}>
            <button
              type="button"
              className={styles.botaoSecundario}
              onClick={alternarPrevia}
              disabled={ocupado}
            >
              <Eye size={15} aria-hidden="true" />
              {previa ? "Ocultar prévia" : "Ver prévia"}
            </button>
            <button
              type="button"
              className={styles.botaoSecundario}
              onClick={enviarAgora}
              disabled={ocupado}
            >
              <Send size={15} aria-hidden="true" />
              Enviar agora
            </button>
          </div>

          {erro && (
            <p className={styles.erro} role="alert">
              {erro}
            </p>
          )}
          {aviso && (
            <p className={styles.sucesso}>
              <CheckCircle2 size={15} aria-hidden="true" />
              {aviso}
            </p>
          )}
          {previa && <Previa resumo={previa} />}
        </div>
      )}
    </section>
  );
}
