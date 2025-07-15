import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Order } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Utensils, Check, CheckCircle } from "lucide-react";

interface OrderCardProps {
  order: Order;
}

export default function OrderCard({ order }: OrderCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiRequest("PATCH", `/api/orders/${order.id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order updated",
        description: "Order status has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Status update failed:", error);
      toast({
        title: "Update failed",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (status: string) => {
    updateStatusMutation.mutate(status);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "preparing":
        return <Badge className="bg-orange-100 text-orange-800">Preparing</Badge>;
      case "served":
        return <Badge className="bg-green-100 text-green-800">Served</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const orderItems = Array.isArray(order.items) ? order.items : [];

  return (
    <Card className="shadow-sm border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-medium">
              {order.tableId}
            </div>
            <div>
              <p className="font-medium text-secondary">Order #{order.id}</p>
              <p className="text-sm text-gray-600">
                {order.createdAt ? formatTime(order.createdAt) : 'Unknown time'}
              </p>
            </div>
          </div>
          {getStatusBadge(order.status)}
        </div>

        <div className="space-y-2 mb-4">
          {orderItems.map((item: any, index: number) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{item.name}</span>
              <span className="text-sm font-medium">{item.quantity}x</span>
            </div>
          ))}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <span className="font-medium text-secondary">Total</span>
              <span className="font-semibold text-primary">
                ${parseFloat(order.total).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="mb-4 p-2 bg-gray-50 rounded text-sm">
            <span className="font-medium text-gray-700">Notes: </span>
            <span className="text-gray-600">{order.notes}</span>
          </div>
        )}

        <div className="flex space-x-2">
          {order.status === "pending" && (
            <>
              <Button
                onClick={() => handleStatusUpdate("preparing")}
                disabled={updateStatusMutation.isPending}
                className="flex-1 bg-orange-100 text-orange-800 hover:bg-orange-200"
                variant="outline"
              >
                <Utensils className="w-4 h-4 mr-1" />
                Prepare
              </Button>
              <Button
                onClick={() => handleStatusUpdate("served")}
                disabled={updateStatusMutation.isPending}
                className="flex-1 bg-green-100 text-green-800 hover:bg-green-200"
                variant="outline"
              >
                <Check className="w-4 h-4 mr-1" />
                Serve
              </Button>
            </>
          )}
          {order.status === "preparing" && (
            <Button
              onClick={() => handleStatusUpdate("served")}
              disabled={updateStatusMutation.isPending}
              className="flex-1 bg-green-100 text-green-800 hover:bg-green-200"
              variant="outline"
            >
              <Check className="w-4 h-4 mr-1" />
              Mark Served
            </Button>
          )}
          {order.status === "served" && (
            <div className="flex items-center justify-center py-2 text-accent flex-1">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Completed</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
