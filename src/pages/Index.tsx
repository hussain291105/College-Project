import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Wrench } from "lucide-react";
import Dashboard from "@/components/Dashboard";
import PartsTable from "@/components/PartsTable";
import AddPartDialog from "@/components/AddPartDialog";

interface SparePart {
  id: string;
  part_number: string;
  part_name: string;
  category: string;
  manufacturer: string | null;
  description: string | null;
  price: number;
  cost_price: number | null;
  stock_quantity: number;
  minimum_stock: number;
  unit: string;
  location: string | null;
}

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-8 space-y-8">
        <Dashboard />
      </main>
    </div>
  );
};

export default Index;