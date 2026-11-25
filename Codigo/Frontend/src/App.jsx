import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login/Login";
import Cadastro from "./pages/Login/Cadastro";
import Layout from "./components/Layout/Layout";
import RotaProtegida from "./components/RotaProtegida/RotaProtegida";
import EsqueciSenha from "./pages/Login/EsqueciSenha";
import RedefinirSenha from "./pages/Login/RedefinirSenha";
import CancelarResumo from "./pages/ResumoSemanal/CancelarResumo";

// Páginas que já existem
import Dashboard from "./pages/Dashboard/Dashboard";
import Movimentacoes from "./pages/Movimentacoes/Movimentacoes";
import Categorias from "./pages/Categorias/Categorias";
import Carteiras from "./pages/Carteiras/Carteiras";
import Metas from "./pages/Metas/Metas";
import Simulacao from "./pages/Simulacao/Simulacao";
import Assistente from "./pages/Assistente/Assistente";
import AssistenteProvider from "./pages/Assistente/AssistenteProvider";
import ComoUsarWhatsApp from "./pages/ComoUsarWhatsApp/ComoUsarWhatsApp";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Páginas públicas, sem barra de navegação */}
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
        <Route path="/resumo-semanal/cancelar" element={<CancelarResumo />} />

        {/* Páginas que exigem login */}
        <Route element={<RotaProtegida />}>
          {/* Páginas com barra de navegação superior. O AssistenteProvider fica
              dentro da RotaProtegida para que a conversa seja descartada ao sair. */}
          <Route
            element={
              <AssistenteProvider>
                <Layout />
              </AssistenteProvider>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/movimentacoes" element={<Movimentacoes />} />
            <Route path="/categorias" element={<Categorias />} />
            {/* Gastos e Receitas agora são uma página só; os links antigos abrem o chip certo */}
            <Route
              path="/gastos"
              element={<Navigate to="/movimentacoes?tipo=saidas" replace />}
            />
            <Route
              path="/receitas"
              element={<Navigate to="/movimentacoes?tipo=entradas" replace />}
            />
            <Route path="/carteiras" element={<Carteiras />} />
            <Route path="/metas" element={<Metas />} />
            {/* A evolução financeira agora fica na Visão geral */}
            <Route
              path="/evolucao-financeira"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route path="/simulador" element={<Simulacao />} />
            <Route path="/assistente" element={<Assistente />} />
            <Route path="/whatsapp" element={<ComoUsarWhatsApp />} />

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
