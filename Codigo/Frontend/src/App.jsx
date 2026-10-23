import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login/Login";
import Cadastro from "./pages/Login/Cadastro";
import Layout from "./components/Layout/Layout";
import RotaProtegida from "./components/RotaProtegida/RotaProtegida";

// Importe somente as páginas que já existem
import Dashboard from "./pages/Dashboard/Dashboard";
import Carteiras from "./pages/Carteiras/Carteiras";
import Gastos from "./pages/Gastos/Gastos";
import Metas from "./pages/Metas/Metas";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Páginas públicas (sem barra de navegação) */}
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />

        {/* Páginas protegidas: exigem login (token válido) */}
        <Route element={<RotaProtegida />}>
          {/* Páginas com barra de navegação superior */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/carteiras" element={<Carteiras />} />
            <Route path="/gastos" element={<Gastos />} />
            <Route path="/metas" element={<Metas />} />

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
