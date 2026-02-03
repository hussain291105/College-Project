import { useEffect, useState } from "react";
import { getStock } from "@/api/stock";
import { SparePart } from "@/types/SparePart";

const LowStock = () => {
  const [stock, setStock] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStock().then((data) => {
      setStock(data);
      setLoading(false);
    });
  }, []);

  const lowStockParts = stock.filter(
    (p) => Number(p.stock) < (p.minimum_stock ?? 10)
  );

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Low Stock Items</h1>

      {loading ? (
        <p>Loading...</p>
      ) : lowStockParts.length === 0 ? (
        <p className="text-green-600">No low stock items 🎉</p>
      ) : (
        <table className="w-full border rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">GSM</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Stock</th>
              <th className="p-3 text-left">Min</th>
            </tr>
          </thead>
          <tbody>
            {lowStockParts.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{p.gsm_number}</td>
                <td className="p-3">{p.category}</td>
                <td className="p-3 text-red-600 font-bold">{p.stock}</td>
                <td className="p-3">{p.minimum_stock ?? 10}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default LowStock;
