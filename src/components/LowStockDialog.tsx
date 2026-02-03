import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SparePart } from "@/types/SparePart";

interface Props {
  open: boolean;
  onClose: () => void;
  lowStockParts: SparePart[];
  onEdit?: (part: SparePart) => void;
  onReorder?: (part: SparePart) => void;
}

const LowStockDialog = ({
  open,
  onClose,
  lowStockParts,
  onEdit,
  onReorder,
}: Props) => {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose(); // ✅ ESC + backdrop click
      }}
    >
      <DialogContent
        className="
          max-w-4xl
          animate-in fade-in zoom-in-95
          data-[state=closed]:animate-out
          data-[state=closed]:fade-out
          data-[state=closed]:zoom-out-95
        "
      >
        <DialogHeader>
          <DialogTitle>Low Stock Items</DialogTitle>
        </DialogHeader>

        {lowStockParts.length === 0 ? (
          <p className="text-green-600 text-center py-6">
            No low stock items 🎉
          </p>
        ) : (
          <table className="w-full border rounded-lg overflow-hidden mt-4">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">GSM</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Stock</th>
                <th className="p-3 text-left">Min</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lowStockParts.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3">{p.gsm_number}</td>
                  <td className="p-3">{p.category}</td>
                  <td className="p-3 text-red-600 font-bold">
                    {p.stock}
                  </td>
                  <td className="p-3">{p.minimum_stock ?? 10}</td>
                  <td className="p-3 space-x-2">
                    <button
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
                      onClick={() => onEdit?.(p)}
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      onClick={() => onReorder?.(p)}
                    >
                      Reorder
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded border hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LowStockDialog;
