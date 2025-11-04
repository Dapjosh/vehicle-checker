'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import {
  Plus,
  Trash2,
  Loader2,
  Truck,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { type Driver, type Vehicle } from '@/lib/definitions';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  getDrivers,
  addDriver,
  deleteDriver,
  getVehicles,
  addVehicle,
  deleteVehicle,
} from '@/app/actions';

// =================================================================================
// Generic Add Item Form
// =================================================================================
interface AddItemFormProps {
  title: string;
  description: string;
  label: string;
  placeholder: string;
  buttonText: string;
  onAddItem: (value: string) => Promise<void>;
  onClose: () => void;
}

function AddItemForm({
  title,
  description,
  label,
  placeholder,
  buttonText,
  onAddItem,
  onClose,
}: AddItemFormProps) {
  const [value, setValue] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return;
    startTransition(async () => {
      await onAddItem(value);
      onClose();
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="item-value" className="text-right">
            {label}
          </Label>
          <Input
            id="item-value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="col-span-3"
            placeholder={placeholder}
            required
            disabled={isPending}
          />
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="ghost" disabled={isPending}>
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isPending || !value}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? 'Adding...' : buttonText}
        </Button>
      </DialogFooter>
    </form>
  );
}

// =================================================================================
// Generic Fleet List Component
// =================================================================================
interface FleetListProps<
  T extends { id: string; name: string } | { id: string; registration: string }
> {
  items: T[];
  itemType: 'driver' | 'vehicle';
  onDeleteItem: (item: T) => void;
  onRefresh: () => void;
  isLoading: boolean;
  addForm: React.ReactNode;
}

function FleetList<
  T extends { id: string; name: string } | { id: string; registration: string }
>({
  items,
  itemType,
  onDeleteItem,
  onRefresh,
  isLoading,
  addForm,
}: FleetListProps<T>) {
  const getItemName = (item: T) => {
    return 'name' in item ? item.name : item.registration;
  };

  return (
    <CardContent className="space-y-4">
      <div className="flex justify-end">{addForm}</div>
      <div className="rounded-md border">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : items.length > 0 ? (
          <div className="divide-y">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 hover:bg-muted/50"
              >
                <p className="font-medium">{getItemName(item)}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDeleteItem(item)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete {itemType}</span>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-8 text-center text-muted-foreground">
            No {itemType}s found. Add one to get started.
          </p>
        )}
      </div>
    </CardContent>
  );
}

// =================================================================================
// Main Fleet Manager Component
// =================================================================================
export default function FleetManager({ orgId }: { orgId: string | undefined }) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'driver' | 'vehicle';
    data: Driver | Vehicle;
  } | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [driversData, vehiclesData] = await Promise.all([
        getDrivers(orgId || ''),
        getVehicles(orgId || ''),
      ]);
      setDrivers(driversData);
      setVehicles(vehiclesData);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(message);
      toast({
        variant: 'destructive',
        title: 'Failed to load fleet data',
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }, [orgId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddItem = async (type: 'driver' | 'vehicle', value: string) => {
    const action = type === 'driver' ? addDriver : addVehicle;
    const result = await action(orgId || '', value);
    if (result.success) {
      toast({ title: 'Success', description: result.message });
      fetchData();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.message,
      });
    }
  };

  const confirmDeleteItem = () => {
    if (!itemToDelete) return;

    startDeleteTransition(async () => {
      const { type, data } = itemToDelete;
      const action = type === 'driver' ? deleteDriver : deleteVehicle;
      const result = await action(orgId || '', data.id);

      if (result.success) {
        toast({ title: 'Success', description: result.message });
        fetchData();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message,
        });
      }
      setItemToDelete(null);
    });
  };

  if (error) {
    return (
      <Card className="text-center py-12">
        <CardHeader>
          <CardTitle className="flex justify-center items-center gap-2 text-destructive">
            <AlertTriangle />
            Failed to Load Fleet Data
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchData}>
            <Loader2 className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Tabs defaultValue="drivers">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="drivers">
            <Users className="mr-2 h-4 w-4" /> Drivers
          </TabsTrigger>
          <TabsTrigger value="vehicles">
            <Truck className="mr-2 h-4 w-4" /> Vehicles
          </TabsTrigger>
        </TabsList>
        <TabsContent value="drivers">
          <Card>
            <CardHeader>
              <CardTitle>Manage Drivers</CardTitle>
              <CardDescription>
                Add, remove, and view all drivers in your organization.
              </CardDescription>
            </CardHeader>
            <FleetList
              items={drivers}
              itemType="driver"
              onDeleteItem={(item) =>
                setItemToDelete({ type: 'driver', data: item as Driver })
              }
              onRefresh={fetchData}
              isLoading={loading}
              addForm={
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Add Driver
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <AddItemForm
                      title="Add New Driver"
                      description="Enter the full name of the new driver."
                      label="Driver Name"
                      placeholder="e.g., John Doe"
                      buttonText="Add Driver"
                      onAddItem={(name) => handleAddItem('driver', name)}
                      onClose={() => setAddDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              }
            />
          </Card>
        </TabsContent>
        <TabsContent value="vehicles">
          <Card>
            <CardHeader>
              <CardTitle>Manage Vehicles</CardTitle>
              <CardDescription>
                Add, remove, and view all vehicles in your organization.
              </CardDescription>
            </CardHeader>
            <FleetList
              items={vehicles}
              itemType="vehicle"
              onDeleteItem={(item) =>
                setItemToDelete({ type: 'vehicle', data: item as Vehicle })
              }
              onRefresh={fetchData}
              isLoading={loading}
              addForm={
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Add Vehicle
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <AddItemForm
                      title="Add New Vehicle"
                      description="Enter the registration number of the new vehicle."
                      label="Registration"
                      placeholder="e.g., ABC-123"
                      buttonText="Add Vehicle"
                      onAddItem={(reg) => handleAddItem('vehicle', reg)}
                      onClose={() => setAddDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              }
            />
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={!!itemToDelete}
        onOpenChange={() => setItemToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the{' '}
              {itemToDelete?.type}
              {itemToDelete && (
                <>
                  {' '}
                  <span className="font-bold">
                    {itemToDelete.type === 'driver'
                      ? (itemToDelete.data as Driver).name
                      : (itemToDelete.data as Vehicle).registration}
                  </span>
                </>
              )}{' '}
              from your records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteItem}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? 'Deleting...' : 'Yes, delete it'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
