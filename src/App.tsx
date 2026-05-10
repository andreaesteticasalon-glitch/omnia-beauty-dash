import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { DataProvider } from "@/contexts/DataContext";
import { BottomNav } from "@/components/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LeftAction } from "@/components/LeftAction";

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
import BookingPortal from "./pages/BookingPortal";
import BookingSuccess from "./pages/BookingSuccess";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

// Bottom nav is hidden on public booking routes
function AppShell() {
  const { pathname } = useLocation();
  const isPublic = pathname.startsWith('/book');

  return (
    <>
      <Routes>
        {/* Public booking portal — no admin chrome */}
        <Route path="/book" element={<BookingPortal />} />
        <Route path="/book/success" element={<BookingSuccess />} />

        {/* Admin routes */}
        <Route path="/" element={<Index />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/services" element={<Services />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/caja" element={<Caja />} />
        <Route path="/proveedores" element={<Proveedores />} />
        <Route path="/pedidos" element={<Pedidos />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/qr-code" element={<QRCodePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isPublic && <BottomNav />}
      {/* Controles fijos — visibles en todas las pantallas */}
      <LeftAction />
      <ThemeToggle />
    </>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="as-beauty-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <DataProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppShell />
          </BrowserRouter>
        </DataProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
