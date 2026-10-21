import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login/Login";
import Layout from "./components/Layout/Layout";
import Cadastro from "./pages/Login/Cadastro";

// Importe somente as páginas que já existem
import Dashboard from "./pages/Dashboard/Dashboard";
import Gastos from "./pages/Gastos/Gastos"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Páginas sem barra de navegação */}
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />

        {/* Páginas com barra de navegação superior */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/gastos" element={<Gastos/>}/>

          /* Adicione quando criar as páginas:
          <Route path="/gastos" element={<Gastos />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
