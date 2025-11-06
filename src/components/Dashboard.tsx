import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import PartsTable from "./PartsTable";
import AddPartDialog from "./AddPartDialog";

interface SparePart {
  id: string;
  part_number: string;
  part_name: string;
  category: string;
  manufacturer: string | null;
  description: string | null;
  selling_price: number;
  cost_price: number | null;
  stock_quantity: number;
  min_stock: number;
  unit: string;
  location: string | null;
}

const Dashboard = () => {
  const [parts, setParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch parts from Supabase
  const fetchParts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("spare_parts").select("*");

    if (error) {
      console.error("Error fetching parts:", error);
    } else {
      setParts(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchParts();
  }, []);

  // ✅ Calculations
  const totalParts = parts.length;

  const inventoryValue = parts.reduce(
    (sum, p) => sum + (p.cost_price || 0) * p.stock_quantity,
    0
  );

  const averagePrice =
    parts.length > 0
      ? parts.reduce((sum, p) => sum + (p.selling_price || 0), 0) / parts.length
      : 0;

  const lowStockCount = parts.filter((p) => p.stock_quantity < p.min_stock).length;

  return (
    <div className="space-y-8">
      {/* 🔹 Header Section */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">AutoParts Inventory</h1>
        <AddPartDialog onPartAdded={fetchParts} />
      </div>

      {/* 🔹 Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Parts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalParts}</p>
            <p className="text-muted-foreground">Active spare parts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{inventoryValue.toFixed(2)}</p>
            <p className="text-muted-foreground">Total stock value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Price</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{averagePrice.toFixed(2)}</p>
            <p className="text-muted-foreground">Per part average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{lowStockCount}</p>
            <p className="text-muted-foreground">Items need reorder</p>
          </CardContent>
        </Card>
      </div>

      {/* ✅ Single Parts Table */}
      {!loading && (
        <div>
          <h2 className="text-xl font-semibold mt-8 mb-4">All Spare Parts</h2>
          <PartsTable parts={parts} onUpdate={fetchParts} />
        </div>
      )}

      {loading && (
        <p className="text-center text-muted-foreground mt-4">
          Loading data...
        </p>
      )}
    </div>
  );
};

export default Dashboard;
