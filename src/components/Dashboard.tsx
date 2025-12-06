import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

import PartsTable from "./PartsTable";
import AddPartDialog from "./AddPartDialog";

import { SparePart } from "@/types/SparePart";
import { getStock } from "@/api/stock";

const Dashboard = () => {
  const navigate = useNavigate();

  const [stock, setStock] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);

  /* --------------------------------------------------------
     FETCH STOCK FROM MYSQL
  -------------------------------------------------------- */
  const loadStock = async () => {
    try {
      setLoading(true);
      const data = await getStock();
      setStock(data);
    } catch (err) {
      console.error("Error fetching stock:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStock();
  }, []);

  /* --------------------------------------------------------
     CALCULATIONS
  -------------------------------------------------------- */

  const totalParts = stock.length;

  const inventoryValue = stock.reduce(
    (sum, p) => sum + Number(p.cost_price || 0) * Number(p.stock || 0),
    0
  );

  const totalProfit = stock.reduce((sum, p) => {
    const cost = Number(p.cost_price);
    const sell = Number(p.selling_price);
    return sum + (sell - cost) * Number(p.stock);
  }, 0);

  const lowStockParts = stock.filter(
    (p) => Number(p.stock) < (p.minimum_stock ?? 10)
  );

  const lowStockCount = lowStockParts.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Stock Inventory</h1>

        {/* Add Stock */}
        <AddPartDialog onPartAdded={loadStock} />
      </div>

      {/* Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">

        {/* Total Items */}
        <Card>
          <CardHeader>
            <CardTitle>Total Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalParts}</p>
            <p className="text-muted-foreground">Items in inventory</p>
          </CardContent>
        </Card>

        {/* Inventory Value */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{inventoryValue.toFixed(2)}</p>
            <p className="text-muted-foreground">Total value</p>
          </CardContent>
        </Card>

        {/* Profit */}
        <div
          className="cursor-pointer"
          onClick={() => navigate("/profit")}
        >
          <Card className="hover:shadow-lg transition rounded-lg border hover:border-green-500">
            <CardHeader>
              <CardTitle>Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                ₹{totalProfit.toFixed(2)}
              </p>
              <p className="text-muted-foreground">Estimated total profit</p>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        <Card className="cursor-pointer hover:shadow-lg transition rounded-lg">
          <CardHeader className="flex items-center space-x-2">
            <AlertTriangle className="text-yellow-500 w-5 h-5" />
            <CardTitle>Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{lowStockCount}</p>
            <p className="text-muted-foreground">Items below threshold</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock List */}
      {lowStockCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-3">
            Items That Need Reordering
          </h2>
          <ul className="list-disc pl-5 text-gray-700">
            {lowStockParts.map((p) => (
              <li key={p.id}>
                {p.category} — GSM {p.gsm_number}  
                (Stock: {p.stock}, Min: {p.minimum_stock ?? 10})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stock Table */}
      <div>
        <h2 className="text-xl font-semibold mt-8 mb-4">All Stock Data</h2>
        {loading ? (
          <p className="text-center text-muted-foreground py-4">
            Loading stock...
          </p>
        ) : (
          <PartsTable parts={stock} onUpdate={loadStock} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
