import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Minus, Plus, X, Check, IndianRupee, Loader2, Clock, User, Phone } from "lucide-react";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (id: number, quantity: number) => void;
  tableNumber: number;
}

export default function CartModal({ isOpen, onClose, cart, onUpdateQuantity, tableNumber }: CartModalProps) {
  const [notes, setNotes] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const orderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest("POST", "/api/order", orderData);
      return response.json();
    },
    onSuccess: (data) => {
      setOrderNumber(`#${data.id}`);
      setIsSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order placed successfully!",
        description: `Your order #${data.id} has been sent to the kitchen.`,
      });
    },
    onError: (error) => {
      console.error("Order failed:", error);
      toast({
        title: "Order failed",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePlaceOrder = () => {
    const orderData = {
      tableId: tableNumber,
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes || "",
      })),
      notes: notes || "",
      status: "pending",
      total: getTotal().toFixed(2),
    };

    orderMutation.mutate(orderData);
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getTax = () => {
    return getSubtotal() * 0.08; // 8% tax
  };

  const getTotal = () => {
    return getSubtotal() + getTax();
  };

  const handleClose = () => {
    if (isSuccess) {
      setIsSuccess(false);
      setOrderNumber("");
      setNotes("");
      window.location.reload(); // Reset cart
    }
    onClose();
  };

  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-accent bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-xl font-semibold text-secondary mb-2">Order Placed!</h2>
            <p className="text-gray-600 mb-4">
              Your order has been sent to the kitchen. We'll have it ready soon!
            </p>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-600 mb-1">Order Number</p>
              <p className="font-mono font-medium text-secondary">{orderNumber}</p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Your Order</DialogTitle>
        </DialogHeader>
        
        <div className="max-h-96 overflow-y-auto">
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <h3 className="font-medium text-secondary">{item.name}</h3>
                  <p className="text-sm text-gray-600 flex items-center">
                    <IndianRupee className="w-3 h-3 mr-1" />
                    {item.price.toFixed(0)}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 p-0 rounded-full hover:bg-red-50 hover:border-red-200"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="font-medium min-w-[20px] text-center">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 p-0 rounded-full hover:bg-green-50 hover:border-green-200"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium flex items-center">
                <IndianRupee className="w-3 h-3 mr-1" />
                {getSubtotal().toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Tax</span>
              <span className="font-medium flex items-center">
                <IndianRupee className="w-3 h-3 mr-1" />
                {getTax().toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between items-center text-lg font-semibold">
              <span className="text-secondary">Total</span>
              <span className="text-primary flex items-center">
                <IndianRupee className="w-4 h-4 mr-1" />
                {getTotal().toFixed(0)}
              </span>
            </div>
          </div>

          <div className="mt-4">
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
              Special Instructions
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests?"
              className="mt-2"
              rows={3}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <Button
            onClick={handlePlaceOrder}
            disabled={orderMutation.isPending}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {orderMutation.isPending ? "Placing Order..." : "Place Order"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
