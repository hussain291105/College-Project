import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

interface EditPartDialogProps {
  part: SparePart;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPartUpdated: () => void;
}

const EditPartDialog = ({
  part,
  open,
  onOpenChange,
  onPartUpdated,
}: EditPartDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    gsm_number: part.gsm_number,
    category: part.category,
    manufacturer: part.manufacturer || "",
    price: part.price.toString(),
    cost_price: part.cost_price?.toString() || "",
    stock_quantity: part.stock_quantity.toString(),
    minimum_stock: part.minimum_stock.toString(),
    unit: part.unit,
    location: part.location || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("spare_parts")
        .update({
          gsm_number: formData.gsm_number.trim(),
          category: formData.category.trim(),
          manufacturer: formData.manufacturer || null,
          price: parseFloat(formData.price),
          cost_price: formData.cost_price
            ? parseFloat(formData.cost_price)
            : null,
          stock_quantity: parseInt(formData.stock_quantity),
          minimum_stock: parseInt(formData.minimum_stock),
          unit: formData.unit,
          location: formData.location || null,
        })
        .eq("id", part.id);

      if (error) throw error;

      toast.success("✅ Spare part updated successfully!");
      onOpenChange(false);
      onPartUpdated();
    } catch (error: any) {
      toast.error(error.message || "Failed to update spare part");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Stock</DialogTitle>
          <DialogDescription>
            Update the details of New Stock.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* GSM Number + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_gsm_number">GSM Number *</Label>
              <Input
                id="edit_gsm_number"
                required
                value={formData.gsm_number}
                onChange={(e) =>
                  setFormData({ ...formData, gsm_number: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_category">Category *</Label>
              <Input
                id="edit_category"
                required
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              />
            </div>
          </div>

          {/* Manufacturer */}
          <div className="space-y-2">
            <Label htmlFor="edit_manufacturer">Manufacturer</Label>
            <Input
              id="edit_manufacturer"
              value={formData.manufacturer}
              onChange={(e) =>
                setFormData({ ...formData, manufacturer: e.target.value })
              }
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_price">Selling Price *</Label>
              <Input
                id="edit_price"
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_cost_price">Cost Price</Label>
              <Input
                id="edit_cost_price"
                type="number"
                step="0.01"
                value={formData.cost_price}
                onChange={(e) =>
                  setFormData({ ...formData, cost_price: e.target.value })
                }
              />
            </div>
          </div>

          {/* Stock */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_stock_quantity">Stock Quantity *</Label>
              <Input
                id="edit_stock_quantity"
                type="number"
                required
                value={formData.stock_quantity}
                onChange={(e) =>
                  setFormData({ ...formData, stock_quantity: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_minimum_stock">Min. Stock</Label>
              <Input
                id="edit_minimum_stock"
                type="number"
                value={formData.minimum_stock}
                onChange={(e) =>
                  setFormData({ ...formData, minimum_stock: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_unit">Unit</Label>
              <Input
                id="edit_unit"
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="edit_location">Storage Location</Label>
            <Input
              id="edit_location"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="e.g., Warehouse A, Shelf 3"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Stock"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPartDialog;
