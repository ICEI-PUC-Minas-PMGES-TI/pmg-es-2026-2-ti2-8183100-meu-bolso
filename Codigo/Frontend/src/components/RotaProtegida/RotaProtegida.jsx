import { Navigate, Outlet } from "react-router-dom";

import { estaLogado } from "../../service/Api";

// Envolve as páginas que só quem fez login pode ver.
// Sem login (ou com token expirado), volta para a tela de entrada.
function RotaProtegida() {
  return estaLogado() ? <Outlet /> : <Navigate to="/" replace />;
}

export default RotaProtegida;
