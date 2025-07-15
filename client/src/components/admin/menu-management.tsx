import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MenuItem, InsertMenuItem } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, Clock, Leaf, Flame, IndianRupee, Loader2 } from "lucide-react";

interface MenuFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  preparationTime: number;
  isVegetarian: boolean;
  isSpicy: boolean;
  isAvailable: boolean;
}

export default function MenuManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<MenuFormData>({
    name: "",
    description: "",
    price: "",
    category: "appetizers",
    preparationTime: 15,
    isVegetarian: false,
    isSpicy: false,
    isAvailable: true,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: menuItems, isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
  });

  const addMutation = useMutation({
    mutationFn: async (data: InsertMenuItem) => {
      const response = await apiRequest("POST", "/api/menu", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Menu item added",
        description: "New menu item has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add menu item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertMenuItem> }) => {
      const response = await apiRequest("PUT", `/api/menu/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      setEditingItem(null);
      resetForm();
      toast({
        title: "Menu item updated",
        description: "Menu item has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update menu item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/menu/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu"] });
      toast({
        title: "Menu item deleted",
        description: "Menu item has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete menu item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "appetizers",
      preparationTime: 15,
      isVegetarian: false,
      isSpicy: false,
      isAvailable: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      preparationTime: Number(formData.preparationTime),
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: submitData });
    } else {
      addMutation.mutate(submitData);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      price: item.price,
      category: item.category,
      preparationTime: item.preparationTime || 15,
      isVegetarian: item.isVegetarian || false,
      isSpicy: item.isSpicy || false,
      isAvailable: item.isAvailable,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this menu item?")) {
      deleteMutation.mutate(id);
    }
  };

  const categorizedItems = menuItems?.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>) || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-secondary">Menu Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Menu Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Menu Item</DialogTitle>
            </DialogHeader>
            <MenuForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              isLoading={addMutation.isPending}
              onCancel={() => {
                setIsAddDialogOpen(false);
                resetForm();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-1/2 mb-4" />
                <div className="flex space-x-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(categorizedItems).map(([category, items]) => (
            <div key={category} className="space-y-4">
              <h3 className="text-lg font-semibold text-secondary capitalize">
                {category} ({items.length} items)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                  <Card key={item.id} className="shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-secondary">{item.name}</h4>
                        <div className="flex items-center space-x-1">
                          {item.isVegetarian && (
                            <Badge variant="outline" className="bg-green-100 text-green-800">
                              <Leaf className="w-3 h-3 mr-1" />
                              Veg
                            </Badge>
                          )}
                          {item.isSpicy && (
                            <Badge variant="outline" className="bg-red-100 text-red-800">
                              <Flame className="w-3 h-3 mr-1" />
                              Spicy
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center text-primary font-semibold">
                          <IndianRupee className="w-4 h-4 mr-1" />
                          {parseFloat(item.price).toFixed(0)}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          {item.preparationTime || 15} min
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant={item.isAvailable ? "default" : "secondary"}>
                          {item.isAvailable ? "Available" : "Unavailable"}
                        </Badge>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            className="p-2"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Menu Item</DialogTitle>
            </DialogHeader>
            <MenuForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              isLoading={updateMutation.isPending}
              onCancel={() => {
                setEditingItem(null);
                resetForm();
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function MenuForm({
  formData,
  setFormData,
  onSubmit,
  isLoading,
  onCancel,
}: {
  formData: MenuFormData;
  setFormData: (data: MenuFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="appetizers">Appetizers</SelectItem>
              <SelectItem value="mains">Main Courses</SelectItem>
              <SelectItem value="desserts">Desserts</SelectItem>
              <SelectItem value="drinks">Drinks</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          disabled={isLoading}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Price (₹) *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <Label htmlFor="preparationTime">Preparation Time (minutes)</Label>
          <Input
            id="preparationTime"
            type="number"
            value={formData.preparationTime}
            onChange={(e) => setFormData({ ...formData, preparationTime: Number(e.target.value) })}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.isVegetarian}
            onCheckedChange={(checked) => setFormData({ ...formData, isVegetarian: checked })}
            disabled={isLoading}
          />
          <Label>Vegetarian</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.isSpicy}
            onCheckedChange={(checked) => setFormData({ ...formData, isSpicy: checked })}
            disabled={isLoading}
          />
          <Label>Spicy</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.isAvailable}
            onCheckedChange={(checked) => setFormData({ ...formData, isAvailable: checked })}
            disabled={isLoading}
          />
          <Label>Available</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </form>
  );
}