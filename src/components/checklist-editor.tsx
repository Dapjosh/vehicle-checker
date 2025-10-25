
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { type InspectionCategory, type InspectionItem, iconMap, type IconName } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { v4 as uuidv4 } from 'uuid';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getChecklist, setChecklist } from '@/lib/firestore';


// Sortable wrapper for checklist items
function SortableItem({ categoryId, item, setEditingItem, handleDeleteItem }: { 
  categoryId: string; 
  item: InspectionItem;
  setEditingItem: (data: { categoryId: string; item: InspectionItem } | null) => void;
  handleDeleteItem: (categoryId: string, itemId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: { type: 'item', categoryId: categoryId }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center bg-background border-b last:border-b-0">
      <button {...attributes} {...listeners} className="p-4 cursor-grab active:cursor-grabbing">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      <div className="flex-grow flex items-center justify-between py-4 pr-4">
          <div>
            <h4 className="font-medium">{item.name}</h4>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditingItem({ categoryId, item })}>
              <Pencil className="h-3 w-3 mr-2" /> Edit
            </Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteItem(categoryId, item.id)}>
              <Trash2 className="h-3 w-3 mr-2" /> Delete
            </Button>
          </div>
      </div>
    </div>
  )
}

// Sortable wrapper for categories (AccordionItem)
function SortableCategory({ category, children }: { category: InspectionCategory; children: React.ReactNode }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ 
        id: category.id,
        data: { type: 'category' }
     });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 20 : undefined,
    };

    return (
        <div ref={setNodeRef} style={style} className="relative bg-background">
            <button {...attributes} {...listeners} className="absolute left-1 top-1/2 -translate-y-1/2 p-3 z-10 cursor-grab active:cursor-grabbing">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>
            <div className="ml-10">
                {children}
            </div>
        </div>
    );
}

export default function ChecklistEditor({ orgId }: { orgId: string }) {
  const [categories, setCategories] = useState<InspectionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<InspectionCategory | null>(null);
  const [editingItem, setEditingItem] = useState<{ categoryId: string; item: InspectionItem } | null>(null);

  const fetchAndSetChecklist = useCallback(async () => {
      setLoading(true);
      const checklist = await getChecklist(orgId);
      setCategories(checklist);
      setLoading(false);
  }, [orgId]);

  useEffect(() => {
    fetchAndSetChecklist();
  }, [fetchAndSetChecklist]);

  // Save to Firestore on change
  useEffect(() => {
    if (!loading && categories.length > 0) {
      setChecklist(orgId, categories).catch(e => console.error("Failed to save checklist:", e));
    }
  }, [categories, orgId, loading]);


  const updateCategories = (newCategories: InspectionCategory[] | ((prev: InspectionCategory[]) => InspectionCategory[])) => {
    setCategories(prev => {
        const updated = typeof newCategories === 'function' ? newCategories(prev) : newCategories;
        return updated;
    });
  };

  // Category Handlers
  const handleAddCategory = (name: string, icon: IconName) => {
    const newCategory: InspectionCategory = {
      id: uuidv4(),
      name,
      icon,
      items: [],
    };
    updateCategories(prev => [...prev, newCategory]);
  };

  const handleUpdateCategory = (id: string, name: string, icon: IconName) => {
    updateCategories(prev => prev.map((cat) => (cat.id === id ? { ...cat, name, icon } : cat)));
    setEditingCategory(null);
  };

  const handleDeleteCategory = (id: string) => {
    updateCategories(prev => prev.filter((cat) => cat.id !== id));
  };

  // Item Handlers
  const handleAddItem = (categoryId: string, name: string, description: string) => {
    const newItem: InspectionItem = {
      id: uuidv4(),
      name,
      description,
    };
    updateCategories(prev => prev.map((cat) => cat.id === categoryId ? { ...cat, items: [...cat.items, newItem] } : cat));
  };

  const handleUpdateItem = (categoryId: string, itemId: string, name: string, description: string) => {
    updateCategories(prev => prev.map((cat) =>
        cat.id === categoryId
          ? { ...cat, items: cat.items.map((item) => item.id === itemId ? { ...item, name, description } : item) }
          : cat
      ));
    setEditingItem(null);
  };

  const handleDeleteItem = (categoryId: string, itemId: string) => {
    updateCategories(prev => prev.map((cat) =>
        cat.id === categoryId
          ? { ...cat, items: cat.items.filter((item) => item.id !== itemId) }
          : cat
      ));
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const isCategoryDrag = active.data.current?.type === 'category' && over.data.current?.type === 'category';
    const isItemDrag = active.data.current?.type === 'item' && over.data.current?.type === 'item';

    if (isCategoryDrag) {
      updateCategories((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      return;
    }

    if (isItemDrag) {
      const activeCategoryId = active.data.current.categoryId;
      const overCategoryId = over.data.current.categoryId;

      if (activeCategoryId !== overCategoryId) return;

      updateCategories((prev) => {
        const categoryIndex = prev.findIndex(c => c.id === activeCategoryId);
        if (categoryIndex === -1) return prev;

        const category = prev[categoryIndex];
        const activeItemIndex = category.items.findIndex(i => i.id === active.id);
        const overItemIndex = category.items.findIndex(i => i.id === over.id);
        
        if (activeItemIndex === -1 || overItemIndex === -1) return prev;
        
        const reorderedItems = arrayMove(category.items, activeItemIndex, overItemIndex);
        const newCategories = [...prev];
        newCategories[categoryIndex] = { ...category, items: reorderedItems };
        return newCategories;
      });
    }
  }

  if (loading) {
    return (
        <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Checklist Editor</CardTitle>
          <CardDescription>
            Add, edit, or remove categories and inspection items. Drag and drop to reorder. Changes are saved for your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={categories} strategy={verticalListSortingStrategy}>
              <Accordion type="multiple" defaultValue={categories.map(c => c.id)} className="w-full">
                {categories.map((category) => (
                  <SortableCategory key={category.id} category={category}>
                    <AccordionItem value={category.id}>
                      <div className="flex items-center justify-between hover:bg-muted/50 rounded-md">
                        <AccordionTrigger className="flex-1 px-4 py-2 text-lg font-semibold hover:no-underline">
                          <div className="flex items-center gap-3">
                            {iconMap[category.icon] && React.createElement(iconMap[category.icon], { className: "h-6 w-6 text-primary" })}
                            {category.name}
                          </div>
                        </AccordionTrigger>
                        <div className="flex items-center gap-2 pr-4">
                          <Button variant="ghost" size="icon" onClick={() => setEditingCategory(category)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteCategory(category.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <AccordionContent className="border-t">
                        <SortableContext items={category.items} strategy={verticalListSortingStrategy}>
                          <div className="divide-y">
                             {category.items.map((item) => (
                              <SortableItem
                                key={item.id}
                                categoryId={category.id}
                                item={item}
                                setEditingItem={setEditingItem}
                                handleDeleteItem={handleDeleteItem}
                              />
                            ))}
                          </div>
                        </SortableContext>
                        <div className="p-4 border-t">
                          <AddItemDialog categoryId={category.id} onAddItem={handleAddItem} />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </SortableCategory>
                ))}
              </Accordion>
            </SortableContext>
          </DndContext>
          <div className="mt-6">
            <AddCategoryDialog onAddCategory={handleAddCategory} />
          </div>
        </CardContent>
      </Card>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent>
          <CategoryForm
            title="Edit Category"
            description="Update the category name and icon."
            buttonText="Save Changes"
            onSubmit={(name, icon) => editingCategory && handleUpdateCategory(editingCategory.id, name, icon)}
            initialData={editingCategory}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <ItemForm
            title="Edit Item"
            description="Update the item's name and description."
            buttonText="Save Changes"
            onSubmit={(name, description) => editingItem && handleUpdateItem(editingItem.categoryId, editingItem.item.id, name, description)}
            initialData={editingItem?.item}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function AddCategoryDialog({ onAddCategory }: { onAddCategory: (name: string, icon: IconName) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </DialogTrigger>
      <DialogContent>
        <CategoryForm
            title="Add New Category"
            description="Create a new category for the inspection checklist."
            buttonText="Add Category"
            onSubmit={(name, icon) => {
              onAddCategory(name, icon);
              setIsOpen(false);
            }}
          />
      </DialogContent>
    </Dialog>
  );
}

function CategoryForm({ title, description, buttonText, onSubmit, initialData }: {
  title: string;
  description: string;
  buttonText: string;
  onSubmit: (name: string, icon: IconName) => void;
  initialData?: Partial<InspectionCategory>;
}) {
  const [name, setName] = useState(initialData?.name || '');
  const [icon, setIcon] = useState<IconName | undefined>(initialData?.icon);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && icon) {
      onSubmit(name, icon);
      setName('');
      setIcon(undefined);
    }
  };

  return (
    <TooltipProvider>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="icon" className="text-right pt-2">Icon</Label>
            <div className="col-span-3">
              <div className="grid grid-cols-6 gap-2 rounded-md border bg-background/50 p-2">
                {(Object.keys(iconMap) as IconName[]).map((iconKey) => {
                  const IconComponent = iconMap[iconKey];
                  return (
                    <Tooltip key={iconKey} delayDuration={100}>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant={icon === iconKey ? 'default' : 'outline'}
                          size="icon"
                          onClick={() => setIcon(iconKey)}
                          className="aspect-square h-auto w-full"
                        >
                          <IconComponent className="h-5 w-5" />
                          <span className="sr-only">{iconKey}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{iconKey}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button type="submit" disabled={!name || !icon}>{buttonText}</Button>
        </DialogFooter>
      </form>
    </TooltipProvider>
  )
}

function AddItemDialog({ categoryId, onAddItem }: { categoryId: string; onAddItem: (categoryId: string, name: string, description: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <ItemForm
          title="Add New Item"
          description="Add a new inspection item to this category."
          buttonText="Add Item"
          onSubmit={(name, description) => {
            onAddItem(categoryId, name, description);
            setIsOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function ItemForm({ title, description, buttonText, onSubmit, initialData }: {
  title: string;
  description: string;
  buttonText: string;
  onSubmit: (name: string, description: string) => void;
  initialData?: Partial<InspectionItem>;
}) {
  const [name, setName] = useState(initialData?.name || '');
  const [itemDescription, setItemDescription] = useState(initialData?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name) {
      onSubmit(name, itemDescription);
      setName('');
      setItemDescription('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="item-name" className="text-right">Name</Label>
          <Input id="item-name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="item-description" className="text-right">Description</Label>
          <Textarea id="item-description" value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} className="col-span-3" />
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="ghost">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={!name}>{buttonText}</Button>
      </DialogFooter>
    </form>
  )
}
