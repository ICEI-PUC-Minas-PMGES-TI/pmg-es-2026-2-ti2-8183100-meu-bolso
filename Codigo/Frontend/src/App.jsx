import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Gastos from "./pages/Gastos/Gastos";
import Layout from "./components/Layout/Layout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login sem Sidebar e Header */}
        <Route path="/" element={<Login />} />

        {/* Páginas com Sidebar e Header */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/gastos" element={<Gastos />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;