import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login/Login";
import Cadastro from "./pages/Login/Cadastro";
import Layout from "./components/Layout/Layout";
import RotaProtegida from "./components/RotaProtegida/RotaProtegida";

// Páginas que já existem
import Dashboard from "./pages/Dashboard/Dashboard";
import Gastos from "./pages/Gastos/Gastos";
import Carteiras from "./pages/Carteiras/Carteiras";
import Metas from "./pages/Metas/Metas";
import EvolucaoFinanceira from "./pages/EvolucaoFinanceira/EvolucaoFinanceira";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Páginas públicas, sem barra de navegação */}
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />

        {/* Páginas que exigem login */}
        <Route element={<RotaProtegida />}>
          {/* Páginas com barra de navegação superior */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/gastos" element={<Gastos />} />
            <Route path="/carteiras" element={<Carteiras />} />
            <Route path="/metas" element={<Metas />} />
            <Route
              path="/evolucao-financeira"
              element={<EvolucaoFinanceira />}
            />

            {/* Adicione quando criar as páginas:
            <Route path="/perfil" element={<Perfil />} />
            */}
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;