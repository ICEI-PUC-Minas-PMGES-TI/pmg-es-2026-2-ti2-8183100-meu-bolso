import { BANCOS, FUNDO_LOGO, bancoDe, chaveDoBanco } from "../../data/bancos";

// Mesma regra da página Carteiras: banco salvo e válido, senão deduz do texto.
function chaveDaConta(conta) {
  if (conta.banco && BANCOS[conta.banco]) return conta.banco;
  return chaveDoBanco(conta.instituicao || conta.nome);
}

/** Logo do banco da conta ({ nome, banco?, instituicao? }), com fallback genérico. */
export default function LogoBanco({ conta }) {
  const chave = chaveDaConta(conta);
  const banco = bancoDe(chave);
  const fundo = chave ? FUNDO_LOGO[chave] : null;

  return (
    <img
      src={banco.logo}
      alt=""
      style={
        fundo
          ? {
              backgroundColor: fundo.fundo,
              ...(fundo.anel ? { boxShadow: `inset 0 0 0 1.5px ${fundo.anel}` } : {}),
            }
          : { backgroundColor: "var(--cor-superficie-suave)" }
      }
      onError={(event) => {
        if (!event.currentTarget.dataset.fallback) {
          event.currentTarget.dataset.fallback = "1";
          event.currentTarget.src = "/bancos/padrao.png";
        }
      }}
    />
  );
}
