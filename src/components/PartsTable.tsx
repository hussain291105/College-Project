import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import EditPartDialog from "./EditPartDialog";

interface SparePart {
  id: string;
  gsm_number: string;
  category: string;
  manufacturer: string | null;
  price: number;
  cost_price: number | null;
  stock_quantity: number;
  minimum_stock: number;
  unit: string;
  location: string | null;
}

interface PartsTableProps {
  parts: SparePart[];
  onUpdate: () => void;
}

const PartsTable = ({ parts, onUpdate }: PartsTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPart, setEditingPart] = useState<SparePart | null>(null);

  const filteredParts = parts.filter(
    (part) =>
      part.gsm_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (part.manufacturer?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this part?")) return;

    try {
      const { error } = await supabase.from("spare_parts").delete().eq("id", id);
      if (error) throw error;
      toast.success("Part deleted successfully!");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete part");
    }
  };

  return (
    <div className="space-y-4">
      {/* 🔍 Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by GSM number, category, or manufacturer..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 📦 Table */}
      <div className="rounded-lg border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>GSM Number</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Manufacturer</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Cost Price</TableHead>
              <TableHead>Selling Price</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredParts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  No parts found
                </TableCell>
              </TableRow>
            ) : (
              filteredParts.map((part) => (
                <TableRow
                  key={part.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  {/* GSM Number */}
                  <TableCell className="font-mono font-medium">
                    {part.gsm_number}
                  </TableCell>

                  {/* Category */}
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {part.category}
                    </span>
                  </TableCell>

                  {/* Manufacturer */}
                  <TableCell className="text-muted-foreground">
                    {part.manufacturer || "-"}
                  </TableCell>

                  {/* Stock Column */}
                  <TableCell>
                    <span
                      className={`font-medium ${
                        part.stock_quantity <= part.minimum_stock
                          ? "text-destructive"
                          : "text-foreground"
                      }`}
                    >
                      {part.stock_quantity} {part.unit}
                    </span>
                  </TableCell>

                  {/* Cost Price */}
                  <TableCell className="font-semibold text-center">
                    ₹{(part.cost_price || 0).toFixed(2)}
                  </TableCell>

                  {/* Selling Price */}
                  <TableCell className="font-semibold text-center">
                    ₹{part.price.toFixed(2)}
                  </TableCell>

                  {/* Location */}
                  <TableCell className="text-muted-foreground">
                    {part.location || "-"}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingPart(part)}
                        className="hover:bg-primary/10 hover:text-primary"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(part.id)}
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ✏️ Edit Dialog */}
      {editingPart && (
        <EditPartDialog
          part={editingPart}
          open={!!editingPart}
          onOpenChange={(open) => !open && setEditingPart(null)}
          onPartUpdated={onUpdate}
        />
      )}
    </div>
  );
};

export default PartsTable;
