import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login/Login";
import Layout from "./components/Layout/Layout";
import RotaProtegida from "./components/RotaProtegida/RotaProtegida";
import Cadastro from "./pages/Login/Cadastro";

// Importe somente as páginas que já existem
import Dashboard from "./pages/Dashboard/Dashboard";

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

            {/* Adicione quando criar as páginas (dentro desta rota protegida):
            <Route path="/gastos" element={<Gastos />} />
            <Route path="/carteiras" element={<Carteiras />} />
            <Route path="/metas" element={<Metas />} />
            <Route path="/perfil" element={<Perfil />} />
            */}
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
