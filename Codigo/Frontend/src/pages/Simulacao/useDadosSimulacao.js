import { useEffect, useState } from "react";

import { listarMetas } from "../../service/Api";
import { listarCarteirasComSaldo } from "../../service/carteirasStorage";

// Carrega os dados que a simulação usa: saldo das carteiras e metas
// atuais do usuário. Expõe os estados de carregamento e erro.
export function useDadosSimulacao() {
  const [carteiras, setCarteiras] = useState([]);
  const [metas, setMetas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    (async () => {
      try {
        const [listaCarteiras, listaMetas] = await Promise.all([
          listarCarteirasComSaldo(),
          listarMetas(),
        ]);
        if (!ativo) return;
        setCarteiras(listaCarteiras ?? []);
        setMetas(listaMetas ?? []);
      } catch (e) {
        if (ativo) setErro(e?.message ?? "Não foi possível carregar seus dados.");
      } finally {
        if (ativo) setCarregando(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, []);

  return { carteiras, metas, carregando, erro };
}
