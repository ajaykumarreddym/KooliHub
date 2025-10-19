import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Layers, Plus, Trash2 } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

interface Category {
  id: string;
  name: string;
  service_type: string;
  parent_id: string | null;
  level: number;
  path: string | null;
}

interface Subcategory extends Category {
  parent_id: string;
  parent?: {
    id: string;
    name: string;
  };
}

interface SubcategoryManagerProps {
  serviceTypeId?: string;
}

export const SubcategoryManager: React.FC<SubcategoryManagerProps> = ({ serviceTypeId }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image_url: "",
  });

  useEffect(() => {
    if (serviceTypeId) {
      fetchCategories();
    }
  }, [serviceTypeId]);

  useEffect(() => {
    if (selectedCategory) {
      fetchSubcategories();
    }
  }, [selectedCategory]);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("service_type", serviceTypeId)
        .eq("level", 0) // Root categories only
        .eq("is_active", true)
        .order("sort_order");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [serviceTypeId]);

  const fetchSubcategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("categories")
        .select(`
          *,
          parent:categories!parent_id(id, name)
        `)
        .eq("parent_id", selectedCategory)
        .eq("is_active", true)
        .order("sort_order");

      if (error) throw error;
      setSubcategories(data || []);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      toast({
        title: "Error",
        description: "Failed to load subcategories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  const handleCreateSubcategory = useCallback(async () => {
    if (!formData.name || !selectedCategory) {
      toast({
        title: "Validation Error",
        description: "Subcategory name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from("categories")
        .insert([{
          name: formData.name,
          description: formData.description,
          image_url: formData.image_url,
          service_type: serviceTypeId,
          parent_id: selectedCategory,
          is_active: true,
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subcategory created successfully",
      });

      setShowAddDialog(false);
      setFormData({ name: "", description: "", image_url: "" });
      fetchSubcategories();
    } catch (error: any) {
      console.error("Error creating subcategory:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create subcategory",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [formData, selectedCategory, serviceTypeId]);

  const handleDeleteSubcategory = useCallback(async (subcategoryId: string) => {
    if (!confirm("Are you sure you want to delete this subcategory?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("categories")
        .update({ is_active: false })
        .eq("id", subcategoryId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subcategory deleted successfully",
      });

      fetchSubcategories();
    } catch (error: any) {
      console.error("Error deleting subcategory:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete subcategory",
        variant: "destructive",
      });
    }
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Subcategory Management
          </CardTitle>
          <CardDescription>
            Manage subcategories within parent categories
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Selector */}
          <div className="space-y-2">
            <Label>Parent Category</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Add Subcategory Button */}
          {selectedCategory && (
            <Button onClick={() => setShowAddDialog(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Subcategory
            </Button>
          )}

          {/* Subcategories List */}
          {selectedCategory && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Subcategories ({subcategories.length})
              </Label>
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">
                  Loading subcategories...
                </div>
              ) : subcategories.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No subcategories found. Create one to get started.
                </div>
              ) : (
                <div className="space-y-2">
                  {subcategories.map((subcat) => (
                    <div
                      key={subcat.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{subcat.name}</div>
                          {subcat.description && (
                            <div className="text-sm text-muted-foreground">
                              {subcat.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Level {subcat.level}</Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteSubcategory(subcat.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Subcategory Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subcategory</DialogTitle>
            <DialogDescription>
              Create a new subcategory under the selected category
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter subcategory name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter subcategory description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="Enter image URL"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateSubcategory} disabled={loading}>
                {loading ? "Creating..." : "Create Subcategory"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

