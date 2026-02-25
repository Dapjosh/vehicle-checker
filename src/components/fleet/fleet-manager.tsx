'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Truck } from 'lucide-react';
import {
  saveDriverAction,
  deleteDriverAction,
  saveVehicleAction,
  deleteVehicleAction,
} from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import type { Driver, Vehicle } from '@/lib/definitions';
import { DriverList } from './driver-list';
import { VehicleList } from './vehicle-list';
import { DriverModal } from './driver-modal';
import { VehicleModal } from './vehicle-modal';

interface FleetManagerProps {
  initialDrivers: Driver[];
  initialVehicles: Vehicle[];
  orgId: string;
  loadMoreDriversAction: (
    limit: number,
    lastCreatedAt?: any,
  ) => Promise<Driver[]>;
  loadMoreVehiclesAction: (
    limit: number,
    lastCreatedAt?: any,
  ) => Promise<Vehicle[]>;
}

export default function FleetManager({
  initialDrivers,
  initialVehicles,
  orgId,
  loadMoreDriversAction,
  loadMoreVehiclesAction,
}: FleetManagerProps) {
  const { toast } = useToast();
  const [, startTransition] = useTransition();

  // --- List State ---
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers || []);
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles || []);

  // --- Pagination State ---
  const [hasMoreDrivers, setHasMoreDrivers] = useState(
    (initialDrivers?.length || 0) >= 10,
  );
  const [loadingMoreDrivers, setLoadingMoreDrivers] = useState(false);
  const [hasMoreVehicles, setHasMoreVehicles] = useState(
    (initialVehicles?.length || 0) >= 10,
  );
  const [loadingMoreVehicles, setLoadingMoreVehicles] = useState(false);

  // --- Modal State ---
  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Partial<Driver> | null>(
    null,
  );

  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Partial<Vehicle> | null>(
    null,
  );

  // Sync props to state
  useEffect(() => {
    setDrivers(initialDrivers || []);
    setHasMoreDrivers((initialDrivers?.length || 0) >= 10);
    setVehicles(initialVehicles || []);
    setHasMoreVehicles((initialVehicles?.length || 0) >= 10);
  }, [initialDrivers, initialVehicles]);

  // --- Driver Actions ---
  const openNewDriver = () => {
    setEditingDriver({ status: 'active', trainings: [], orgId });
    setDriverModalOpen(true);
  };

  const openEditDriver = (driver: Driver) => {
    setEditingDriver(JSON.parse(JSON.stringify(driver)));
    setDriverModalOpen(true);
  };

  const loadMoreDrivers = async () => {
    if (loadingMoreDrivers || !hasMoreDrivers) return;
    setLoadingMoreDrivers(true);
    try {
      const lastItem = drivers[drivers.length - 1];
      const newItems = await loadMoreDriversAction(10, lastItem?.createdAt);

      if (!newItems || newItems.length < 10) {
        setHasMoreDrivers(false);
      }
      if (newItems && newItems.length > 0) {
        setDrivers((prev) => {
          const ids = new Set(prev.map((d) => d.id));
          const filteredNewItems = newItems.filter((d) => !ids.has(d.id));
          return [...prev, ...filteredNewItems];
        });
      }
    } catch (error: any) {
      console.error('Error loading more drivers:', error);
      toast({
        title: 'Error loading drivers',
        description:
          error.message || 'Something went wrong while fetching data.',
        variant: 'destructive',
      });
      setHasMoreDrivers(false);
    } finally {
      setLoadingMoreDrivers(false);
    }
  };

  const handleSaveDriver = async (driverData: Partial<Driver>) => {
    const result = await saveDriverAction({ ...driverData, orgId });
    if (result.success) {
      toast({ title: 'Driver Saved' });
      setDriverModalOpen(false);
      window.location.reload();
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDriver = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    startTransition(async () => {
      await deleteDriverAction(id);
      window.location.reload();
    });
  };

  // --- Vehicle Actions ---
  const openNewVehicle = () => {
    setEditingVehicle({
      status: 'active',
      documents: [],
      orgId,
      serviceHistory: [],
    });
    setVehicleModalOpen(true);
  };

  const openEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(JSON.parse(JSON.stringify(vehicle)));
    setVehicleModalOpen(true);
  };

  const loadMoreVehicles = async () => {
    if (loadingMoreVehicles || !hasMoreVehicles) return;
    setLoadingMoreVehicles(true);
    try {
      const lastItem = vehicles[vehicles.length - 1];
      const newItems = await loadMoreVehiclesAction(10, lastItem?.createdAt);
      if (!newItems || newItems.length < 10) {
        setHasMoreVehicles(false);
      }

      if (newItems && newItems.length > 0) {
        setVehicles((prev) => {
          const ids = new Set(prev.map((v) => v.id));
          const filteredNewItems = newItems.filter((v) => !ids.has(v.id));
          return [...prev, ...filteredNewItems];
        });
      }
    } catch (error: any) {
      console.error('Error loading more vehicles:', error);
      toast({
        title: 'Error loading vehicles',
        description:
          error.message || 'Something went wrong while fetching data.',
        variant: 'destructive',
      });
      setHasMoreVehicles(false);
    } finally {
      setLoadingMoreVehicles(false);
    }
  };

  const handleSaveVehicle = async (vehicleData: Partial<Vehicle>) => {
    const result = await saveVehicleAction({ ...vehicleData, orgId });
    if (result.success) {
      toast({ title: 'Vehicle Saved' });
      setVehicleModalOpen(false);
      window.location.reload();
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    startTransition(async () => {
      await deleteVehicleAction(id);
      window.location.reload();
    });
  };

  return (
    <div className='space-y-6'>
      <Tabs defaultValue='drivers' className='w-full'>
        <TabsList className='flex w-full max-w-md'>
          <TabsTrigger className='w-1/2' value='drivers'>
            <Users className='mr-2 h-4 w-4' />
            Drivers ({drivers.length})
          </TabsTrigger>
          <TabsTrigger className='w-1/2' value='vehicles'>
            <Truck className='mr-2 h-4 w-4' />
            Vehicles ({vehicles.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value='drivers' className='space-y-4 pt-4'>
          <DriverList
            drivers={drivers}
            loadingMore={loadingMoreDrivers}
            hasMore={hasMoreDrivers}
            onLoadMore={loadMoreDrivers}
            onEdit={openEditDriver}
            onDelete={handleDeleteDriver}
            onAddNew={openNewDriver}
          />
        </TabsContent>

        <TabsContent value='vehicles' className='space-y-4 pt-4'>
          <VehicleList
            vehicles={vehicles}
            loadingMore={loadingMoreVehicles}
            hasMore={hasMoreVehicles}
            onLoadMore={loadMoreVehicles}
            onEdit={openEditVehicle}
            onDelete={handleDeleteVehicle}
            onAddNew={openNewVehicle}
          />
        </TabsContent>
      </Tabs>

      <DriverModal
        isOpen={driverModalOpen}
        onClose={() => setDriverModalOpen(false)}
        driverData={editingDriver}
        onSave={handleSaveDriver}
      />

      <VehicleModal
        isOpen={vehicleModalOpen}
        onClose={() => setVehicleModalOpen(false)}
        vehicleData={editingVehicle}
        onSave={handleSaveVehicle}
      />
    </div>
  );
}
