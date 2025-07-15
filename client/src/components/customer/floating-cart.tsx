import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";

interface FloatingCartProps {
  itemCount: number;
  total: number;
  onOpenCart: () => void;
}

export default function FloatingCart({ itemCount, total, onOpenCart }: FloatingCartProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Badge className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
            {itemCount}
          </Badge>
          <span className="font-medium text-secondary">
            ${total.toFixed(2)}
          </span>
        </div>
        <Button
          onClick={onOpenCart}
          className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-medium"
        >
          View Cart
          <ShoppingCart className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
