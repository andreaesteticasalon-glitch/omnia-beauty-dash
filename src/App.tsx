import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { DataProvider } from "@/contexts/DataContext";
import { AppLayout } from "@/components/AppLayout";

import Index from "./pages/Index";
import Calendar from "./pages/Calendar";
import Clients from "./pages/Clients";
import Services from "./pages/Services";
import Analytics from "./pages/Analytics";
import Bookings from "./pages/Bookings";
import QRCodePage from "./pages/QRCodePage";
import Caja from "./pages/Caja";
import Proveedores from "./pages/Proveedores";
import Pedidos from "./pages/Pedidos";
import Inventario from "./pages/Inventario";
import Seguimiento from "./pages/Seguimiento";
import Marketing from "./pages/Marketing";
import BookingPortal from "./pages/BookingPortal";
import BookingSuccess from "./pages/BookingSuccess";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="as-beauty-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <DataProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              {/* Rutas públicas — sin layout de admin */}
              <Route path="/book"         element={<BookingPortal />} />
              <Route path="/book/success" element={<BookingSuccess />} />

              {/* Rutas de admin — con sidebar + layout */}
              <Route element={<AppLayout />}>
                <Route path="/"           element={<Index />} />
                <Route path="/dashboard"  element={<Index />} />
                <Route path="/calendar"   element={<Calendar />} />
                <Route path="/clients"    element={<Clients />} />
                <Route path="/services"   element={<Services />} />
                <Route path="/analytics"  element={<Analytics />} />
                <Route path="/bookings"   element={<Bookings />} />
                <Route path="/caja"       element={<Caja />} />
                <Route path="/proveedores" element={<Proveedores />} />
                <Route path="/pedidos"    element={<Pedidos />} />
                <Route path="/inventario" element={<Inventario />} />
                <Route path="/seguimiento" element={<Seguimiento />} />
                <Route path="/marketing"  element={<Marketing />} />
                <Route path="/qr-code"    element={<QRCodePage />} />
                <Route path="*"           element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </DataProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
