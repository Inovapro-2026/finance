import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Calculadora from "./pages/Calculadora";
import Mercado from "./pages/Mercado";
import Atividades from "./pages/Atividades";
import ChatIA from "./pages/ChatIA";
import ChatEquipe from "./pages/ChatEquipe";
import Produtos from "./pages/Produtos";
import Alertas from "./pages/Alertas";
import Integracao from "./pages/Integracao";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/app" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="calculadora" element={<Calculadora />} />
              <Route path="mercado" element={<Mercado />} />
              <Route path="produtos" element={<Produtos />} />
              <Route path="atividades" element={<Atividades />} />
              <Route path="ia" element={<ChatIA />} />
              <Route path="equipe" element={<ChatEquipe />} />
              <Route path="alertas" element={<Alertas />} />
              <Route path="integracao" element={<Integracao />} />
              <Route path="configuracoes" element={<Configuracoes />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
