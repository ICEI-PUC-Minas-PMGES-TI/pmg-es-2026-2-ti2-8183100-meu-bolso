import Cartao from "../CarteiraVisual/Cartao";

/**
 * Visual do cartão, reutilizado pela página Carteiras e pelo bloco
 * "Meus cartões" do Dashboard. Encapsula o cartão canônico
 * (CarteiraVisual/Cartao) para garantir os mesmos elementos, cores,
 * fontes e proporção nos dois lugares.
 *
 * props:
 *  - cartao: item da carteira (apelido, banco, bandeira, tema,
 *    ultimosDigitos...)
 *  - compacto: versão reduzida (repassada ao Cartao)
 */
function CartaoVisual({ cartao, compacto = false }) {
  return (
    <Cartao
      apelido={cartao.apelido}
      banco={cartao.banco}
      bandeira={cartao.bandeira}
      tema={cartao.tema}
      ultimosDigitos={cartao.ultimosDigitos}
      compacto={compacto}
    />
  );
}

export default CartaoVisual;
