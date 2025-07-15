import { useState } from "react";
import { MenuItem } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, Clock, Leaf, Flame, IndianRupee, UtensilsCrossed } from "lucide-react";

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
    <Card className="overflow-hidden shadow-sm border-gray-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
      <CardContent className="p-0">
        <div className="flex">
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-medium text-secondary">{item.name}</h3>
              <div className="flex items-center space-x-1">
                {item.isVegetarian && (
                  <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                    <Leaf className="w-3 h-3 mr-1" />
                    Veg
                  </Badge>
                )}
                {item.isSpicy && (
                  <Badge variant="outline" className="bg-red-100 text-red-800 text-xs">
                    <Flame className="w-3 h-3 mr-1" />
                    Spicy
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">{item.description}</p>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center text-primary font-semibold">
                <IndianRupee className="w-4 h-4 mr-1" />
                {parseFloat(item.price).toFixed(0)}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                {item.preparationTime || 15} min
              </div>
            </div>
            <Button
              onClick={handleAddToCart}
              className={`w-full py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isAdded
                  ? 'bg-accent hover:bg-accent/90 text-white'
                  : 'bg-primary hover:bg-primary/90 text-white'
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Added to Cart
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1" />
                  Add to Cart
                </>
              )}
            </Button>
          </div>
          <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-accent/10 flex-shrink-0">
            <div className="w-full h-full bg-gradient-to-br from-orange-200 to-red-200 flex items-center justify-center">
              <UtensilsCrossed className="text-orange-600 text-lg" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
