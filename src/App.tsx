// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner"; // ✅ For Sonner toast notifications

// Pages
import Index from "@/pages/Index";
import BillingList from "@/pages/BillingList";   // ✅ Page for saved bills
import BillingForm from "@/pages/BillingForm";   // ✅ Page for adding new bills
import BillingView from "@/pages/BillingView";   // ✅ Page for viewing bill details
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import InvoiceForm from "@/pages/InvoiceForm";

// Components
import ProtectedRoute from "@/components/ProtectedRoute";
import SidebarLayout from "@/components/SidebarLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* ✅ Global Toasts */}
      <Toaster />
      <Sonner position="top-right" richColors closeButton />

      <BrowserRouter>
        <Routes>
          {/* ---------- PUBLIC ROUTES ---------- */}
          <Route path="/login" element={<Login />} />

          {/* ---------- PROTECTED ROUTES ---------- */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <SidebarLayout>
                  <Index />
                </SidebarLayout>
              </ProtectedRoute>
            }
          />

          {/* ✅ Billing List Page */}
          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <SidebarLayout>
                  <BillingList />
                </SidebarLayout>
              </ProtectedRoute>
            }
          />

          {/* ✅ New Bill Form Page */}
          <Route
            path="/billing/new"
            element={
              <ProtectedRoute>
                <SidebarLayout>
                  <BillingForm />
                </SidebarLayout>
              </ProtectedRoute>
            }
          />

          {/* ✅ Bill Details / Show Bill Page */}
          <Route
            path="/billing/:id"
            element={
              <ProtectedRoute>
                <SidebarLayout>
                  <BillingView />
                </SidebarLayout>
              </ProtectedRoute>
            }
          />

          {/* Existing Invoice Form */}
          <Route
            path="/invoice"
            element={
              <ProtectedRoute>
                <SidebarLayout>
                  <InvoiceForm />
                </SidebarLayout>
              </ProtectedRoute>
            }
          />

          {/* ---------- 404 FALLBACK ---------- */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
