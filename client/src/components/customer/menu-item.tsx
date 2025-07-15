import { useState } from "react";
import { MenuItem } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Check } from "lucide-react";

interface MenuItemProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}

export default function MenuItemComponent({ item, onAddToCart }: MenuItemProps) {
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    onAddToCart(item);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1000);
  };

  return (
    <Card className="overflow-hidden shadow-sm border-gray-200">
      <CardContent className="p-0">
        <div className="flex">
          <div className="flex-1 p-4">
            <h3 className="font-medium text-secondary mb-1">{item.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{item.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-primary">
                ${parseFloat(item.price).toFixed(2)}
              </span>
              <Button
                onClick={handleAddToCart}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isAdded
                    ? 'bg-accent hover:bg-accent/90'
                    : 'bg-primary hover:bg-primary/90'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Added
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="w-24 h-24 bg-gray-200 flex-shrink-0">
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <span className="text-gray-500 text-xs">Image</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
