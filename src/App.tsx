import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Orders from "@/pages/Orders";
import Customers from "@/pages/Customers";
import Categories from "@/pages/Categories";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";
import Manufacturer from "./pages/Manufacturer";
import FlashSale from "./pages/FlashSale";
import Tags from "./pages/Tags";
import SectionManager from "./pages/Sections";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/dang-nhap" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
}

function AppRoutes() {
  const { isLoggedIn } = useAuth();
  return (
    <Routes>
      <Route path="/dang-nhap" element={isLoggedIn ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/quan-ly-san-pham" element={<ProtectedRoute><Products /></ProtectedRoute>} />
      <Route path="/quan-ly-su-kien" element={<ProtectedRoute><FlashSale /></ProtectedRoute>} />
      <Route path="/quan-ly-don-hang" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
      <Route path="/danh-sach-nguoi-dung" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
      <Route path="/quan-ly-the" element={<ProtectedRoute><Tags /></ProtectedRoute>} />
      <Route path="/quan-ly-noi-dung" element={<ProtectedRoute><SectionManager /></ProtectedRoute>} />
      <Route path="/quan-ly-danh-muc" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
      <Route path="/quan-ly-nha-cung-cap" element={<ProtectedRoute><Manufacturer /></ProtectedRoute>} />
      <Route path="/cai-dat" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
