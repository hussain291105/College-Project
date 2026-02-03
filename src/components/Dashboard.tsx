import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

import PartsTable from "./PartsTable";
import AddPartDialog from "./AddPartDialog";

import { SparePart } from "@/types/SparePart";
import { getStock } from "@/api/stock";
import LowStockDialog from "./LowStockDialog";
import EditPartDialog from "./EditPartDialog";
import { Toaster } from "./ui/toaster";

const Dashboard = () => {
  const navigate = useNavigate();

  const [stock, setStock] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLowStock, setShowLowStock] = useState(false);
  const [editPart, setEditPart] = useState<SparePart | null>(null);
  const [reorderPart, setReorderPart] = useState<SparePart | null>(null);

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

  const handleEditPart = (part: SparePart) => {
    setEditPart(part);
  };

  const handleReorderPart = (part: SparePart) => {
    setShowLowStock(false); 
    setReorderPart(part);
  };

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
        <div
          onClick={() => {
            if (lowStockCount > 0) {
              setShowLowStock(true);
            }
          }}
          className={lowStockCount === 0 ? "opacity-50 cursor-not-allowed" : ""}
        >
          <Card className="cursor-pointer hover:shadow-lg transition rounded-lg border hover:border-yellow-400">
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
      </div>

      {/* Low Stock List */}

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

      {/* Low Stock Dialog */}
      <LowStockDialog
        open={showLowStock}
        onClose={() => setShowLowStock(false)}
        lowStockParts={lowStockParts}
        onEdit={handleEditPart}
        onReorder={handleReorderPart}
      />

      {/* Edit Part Dialog */}
      {editPart && (
        <EditPartDialog
          part={editPart}
          open={!!editPart}
          onOpenChange={(open) => {
            if (!open) setEditPart(null);
          }}
          onPartUpdated={() => {
            loadStock();
            setEditPart(null);
          }}
        />
      )}

      {/* Reorder Part Dialog */}
      {reorderPart && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-semibold mb-4">Reorder Part</h2>

            <p className="mb-4">
              Reorder <strong>{reorderPart.category}</strong> (GSM {reorderPart.gsm_number})
            </p>

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
                onClick={() => setReorderPart(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                onClick={() => {
                  toast.success("Reorder placed successfully!");
                  setReorderPart(null);
                }}
              >
                Confirm Reorder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
