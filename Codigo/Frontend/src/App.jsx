import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login/Login";
import Layout from "./components/Layout/Layout";

// Importe somente as páginas que já existem
import Dashboard from "./pages/Dashboard/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Páginas sem Sidebar e Header */}
        <Route path="/" element={<Login />} />

        {/* Páginas com Sidebar e Header */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Adicione quando criar as páginas:
          <Route path="/gastos" element={<Gastos />} />
          <Route path="/carteiras" element={<Carteiras />} />
          <Route path="/metas" element={<Metas />} />
          <Route path="/perfil" element={<Perfil />} />
          */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;