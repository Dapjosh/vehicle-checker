'use client';

import React, {
  useState,
  useTransition,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  Trash2,
  Edit,
  User,
  Truck,
  Users,
  FileText,
  Calendar,
  Loader2,
  PlusCircle,
  Award,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import {
  saveDriverAction,
  deleteDriverAction,
  saveVehicleAction,
  deleteVehicleAction,
} from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import type {
  Driver,
  Vehicle,
  TrainingRecord,
  VehicleDocument,
} from '@/lib/definitions';
import { v4 as uuidv4 } from 'uuid';

function useInfiniteScroll(
  callback: () => void,
  hasMore: boolean,
  isLoading: boolean,
) {
  const observer = useRef<IntersectionObserver | null>(null);
  const triggerRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          callback();
        }
      });

      if (node) observer.current.observe(node);
    },
    [isLoading, hasMore, callback],
  );

  return triggerRef;
}

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
  const [isPending, startTransition] = useTransition();
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers || []);
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles || []);

  const [hasMoreDrivers, setHasMoreDrivers] = useState(
    initialDrivers?.length >= 10,
  );
  const [loadingMoreDrivers, setLoadingMoreDrivers] = useState(false);

  const [hasMoreVehicles, setHasMoreVehicles] = useState(
    initialVehicles?.length >= 10,
  );
  const [loadingMoreVehicles, setLoadingMoreVehicles] = useState(false);

  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);

  // Edit State
  const [editingDriver, setEditingDriver] = useState<Partial<Driver> | null>(
    null,
  );
  const [editingVehicle, setEditingVehicle] = useState<Partial<Vehicle> | null>(
    null,
  );

  useEffect(() => {
    setDrivers(initialDrivers || []);
    setHasMoreDrivers((initialDrivers?.length || 0) >= 10);
    setVehicles(initialVehicles || []);
    setHasMoreVehicles((initialVehicles?.length || 0) >= 10);
  }, [initialDrivers, initialVehicles]);

  const openNewDriver = () => {
    setEditingDriver({ status: 'active', trainings: [], orgId });
    setDriverModalOpen(true);
  };

  const openEditDriver = (driver: Driver) => {
    // Deep copy to avoid mutating state directly during edits
    setEditingDriver(JSON.parse(JSON.stringify(driver)));
    setDriverModalOpen(true);
  };

  const openNewVehicle = () => {
    setEditingVehicle({ status: 'active', documents: [], orgId });
    setVehicleModalOpen(true);
  };

  const openEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(JSON.parse(JSON.stringify(vehicle)));
    setVehicleModalOpen(true);
  };

  const loadMoreDrivers = async () => {
    if (loadingMoreDrivers || !hasMoreDrivers) return;
    setLoadingMoreDrivers(true);

    const lastItem = drivers[drivers.length - 1];

    const newItems = await loadMoreDriversAction(10, lastItem?.createdAt);

    if (newItems.length < 10) setHasMoreDrivers(false);
    setDrivers((prev) => [...prev, ...newItems]);
    setLoadingMoreDrivers(false);
  };

  const loadMoreVehicles = async () => {
    if (loadingMoreVehicles || !hasMoreVehicles) return;
    setLoadingMoreVehicles(true);

    const lastItem = vehicles[vehicles.length - 1];
    // Use the prop action instead of direct import
    const newItems = await loadMoreVehiclesAction(10, lastItem?.createdAt);

    if (newItems.length < 10) setHasMoreVehicles(false);
    setVehicles((prev) => [...prev, ...newItems]);
    setLoadingMoreVehicles(false);
  };
  const lastDriverRef = useInfiniteScroll(
    loadMoreDrivers,
    hasMoreDrivers,
    loadingMoreDrivers,
  );
  const lastVehicleRef = useInfiniteScroll(
    loadMoreVehicles,
    hasMoreVehicles,
    loadingMoreVehicles,
  );

  const handleSaveDriver = async () => {
    if (!editingDriver?.name) return;
    startTransition(async () => {
      const result = await saveDriverAction({ ...editingDriver, orgId });
      if (result.success) {
        toast({ title: 'Driver Saved' });
        setDriverModalOpen(false);
        // In real app, revalidatePath handles data refresh, but for instant UI feedback we can reload or handle logic
        window.location.reload();
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      }
    });
  };

  const handleDeleteDriver = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    startTransition(async () => {
      await deleteDriverAction(id);
      window.location.reload();
    });
  };

  const handleSaveVehicle = async () => {
    if (!editingVehicle?.registration) return;
    startTransition(async () => {
      const result = await saveVehicleAction({ ...editingVehicle, orgId });
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
    });
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
        <TabsList className="flex w-full">
          <TabsTrigger className="w-1/2" value='drivers'><Users className="mr-2 h-4 w-4" />Drivers ({drivers.length})</TabsTrigger>
          <TabsTrigger className="w-1/2" value='vehicles'>
            <Truck className="mr-2 h-4 w-4" />Vehicles ({vehicles.length})
          </TabsTrigger>
        </TabsList>

        {/* === DRIVERS TAB === */}
        <TabsContent value='drivers' className='space-y-4'>
          {/* <div className="flex justify-end">
            <Button onClick={openNewDriver}>
              <Plus className="mr-2 h-4 w-4" /> Add Driver
            </Button>
          </div> */}

          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
            <div>
              <h2 className='text-xl font-bold'>Manage Drivers</h2>
              <p className='text-sm text-muted-foreground'>
                Add, remove, and view all drivers in your organization.
              </p>
            </div>
            <Button
              onClick={openNewDriver}
              className='self-start sm:self-center'
            >
              <Plus className='mr-2 h-5 w-5' />
              Add Driver
            </Button>
          </div>

          <div className='border rounded-lg overflow-hidden divide-y bg-card'>
            {drivers.length === 0 ? (
              <div className='p-8 text-center text-muted-foreground italic flex flex-col items-center gap-2'>
                <User className='h-10 w-10 opacity-20' />
                No drivers registered yet.
              </div>
            ) : (
              drivers.map((driver, index) => {
                const isLast = index === drivers.length - 1;
                return (
                  <div
                    key={driver.id}
                    ref={isLast ? lastDriverRef : null}
                    className='p-4 flex items-center justify-between hover:bg-muted/40 transition-colors group'
                  >
                    <div
                      className='flex items-center gap-4 flex-grow cursor-pointer'
                      onClick={() => openEditDriver(driver)}
                    >
                      <Avatar className='h-10 w-10'>
                        <AvatarImage src={driver.photoURL} />
                        <AvatarFallback>
                          {driver.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className='font-semibold'>{driver.name}</div>
                        <div className='text-xs text-muted-foreground flex items-center gap-2 mt-1'>
                          <span>{driver.employeeId || 'No ID'}</span>
                          <Badge
                            variant={
                              driver.status === 'active'
                                ? 'outline'
                                : 'secondary'
                            }
                            className='text-[10px] h-4 px-1'
                          >
                            {driver.status}
                          </Badge>
                        </div>
                        <div className='flex justify-between text-xs mt-1'>
                          <span className='text-muted-foreground'>Rating:</span>
                          <span>
                            {driver.rating ? `⭐ ${driver.rating}/5` : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='text-muted-foreground hover:text-destructive hover:!bg-primary hover:!text-white'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDriver(driver.id);
                        }}
                      >
                        <Trash2 className='h-5 w-5' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='text-muted-foreground hover:!bg-primary hover:!text-white'
                        onClick={() => openEditDriver(driver)}
                      >
                        <ChevronRight className='h-6 w-6' />
                      </Button>
                    </div>
                    {/* <CardContent className="pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID:</span>
                    <span>{driver.employeeId || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rating:</span>
                    <span>{driver.rating ? `⭐ ${driver.rating}/5` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">License Exp:</span>
                    <span className={new Date(driver.license?.expiryDate || '') < new Date() ? "text-red-500 font-bold" : ""}>
                      {driver.license?.expiryDate || 'N/A'}
                    </span>
                  </div>
                  <div className="pt-4 flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDriver(driver)}>
                      <Edit className="h-4 w-4 mr-2" /> Details
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteDriver(driver.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent> */}
                  </div>
                );
              })
            )}

            {loadingMoreDrivers && (
              <div className='p-4 flex justify-center'>
                <Loader2 className='h-6 w-6 animate-spin text-primary' />
              </div>
            )}
          </div>
        </TabsContent>

        {/* === VEHICLES TAB === */}
        <TabsContent value='vehicles' className='space-y-4'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
            <div>
              <h2 className='text-xl font-bold'>Manage Vehicles</h2>
              <p className='text-sm text-muted-foreground'>
                Track registration, maintenance, and documents.
              </p>
            </div>
            <Button
              onClick={openNewVehicle}
              className='self-start sm:self-center'
            >
              <Plus className='mr-2 h-5 w-5' />
              Add Vehicle
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Registration</TableHead>
                <TableHead>Type/Model</TableHead>
                <TableHead>VIN/Chassis</TableHead>
                <TableHead>Next Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.length === 0 ? (
                <div className='p-8 text-center text-muted-foreground italic flex flex-col items-center gap-2'>
                  <Truck className='h-10 w-10 opacity-20' />
                  No vehicles registered yet.
                </div>
              ) : (
                vehicles.map((vehicle, index) => {
                  const isLast = index === vehicles.length - 1;
                  return (
                    <TableRow key={vehicle.id}>
                      <TableCell className='font-medium'>
                        {vehicle.registration}
                      </TableCell>
                      <TableCell>
                        {vehicle.make} {vehicle.model} ({vehicle.type})
                      </TableCell>
                      <TableCell className='text-xs font-mono text-muted-foreground'>
                        VIN: {vehicle.vin || 'N/A'} <br />
                        Chassis: {vehicle.chassisNumber || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {vehicle.maintenance?.nextServiceDate ? (
                          <span className='flex items-center gap-1'>
                            <Calendar className='h-3 w-3' />{' '}
                            {vehicle.maintenance.nextServiceDate}
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            vehicle.status === 'active'
                              ? 'outline'
                              : 'destructive'
                          }
                        >
                          {vehicle.status}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right space-x-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='text-primary hover:bg-primary hover:text-white'
                          onClick={() => openEditVehicle(vehicle)}
                        >
                          <Edit className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='text-destructive hover:bg-primary hover:text-white'
                          onClick={() => handleDeleteVehicle(vehicle.id)}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
              {loadingMoreVehicles && (
                <div className='p-4 flex justify-center'>
                  <Loader2 className='h-6 w-6 animate-spin text-primary' />
                </div>
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      {/* === DRIVER MODAL === */}
      <Dialog open={driverModalOpen} onOpenChange={setDriverModalOpen}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {editingDriver?.id ? 'Edit Driver' : 'Add New Driver'}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue='details' className='w-full'>
            <TabsList className='w-full'>
              <TabsTrigger value='details' className='flex-1'>
                Personal
              </TabsTrigger>
              <TabsTrigger value='license' className='flex-1'>
                License
              </TabsTrigger>
              <TabsTrigger value='training' className='flex-1'>
                Training
              </TabsTrigger>
            </TabsList>

            <div className='mt-4 space-y-4'>
              {/* Personal Details */}
              <TabsContent value='details' className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Full Name</Label>
                    <Input
                      value={editingDriver?.name || ''}
                      onChange={(e) =>
                        setEditingDriver((prev) => ({
                          ...prev!,
                          name: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Email</Label>
                    <Input
                      value={editingDriver?.email || ''}
                      onChange={(e) =>
                        setEditingDriver((prev) => ({
                          ...prev!,
                          email: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Phone</Label>
                    <Input
                      value={editingDriver?.phone || ''}
                      onChange={(e) =>
                        setEditingDriver((prev) => ({
                          ...prev!,
                          phone: e.target.value,
                        }))
                      }
                    />
                  </div>
                  {/* <div className="space-y-2">
                    <Label>Photo URL</Label>
                    <Input 
                      value={editingDriver?.photoURL || ''} 
                      onChange={e => setEditingDriver(prev => ({ ...prev!, photoURL: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div> */}
                  <div className='space-y-2'>
                    <Label>Date Hired</Label>
                    <Input
                      type='date'
                      value={editingDriver?.dateHired || ''}
                      onChange={(e) =>
                        setEditingDriver((prev) => ({
                          ...prev!,
                          dateHired: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Employee ID</Label>
                    <Input
                      value={editingDriver?.employeeId || ''}
                      onChange={(e) =>
                        setEditingDriver((prev) => ({
                          ...prev!,
                          employeeId: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Rating (1-5)</Label>
                    <Input
                      type='number'
                      min='1'
                      max='5'
                      value={editingDriver?.rating || ''}
                      onChange={(e) =>
                        setEditingDriver((prev) => ({
                          ...prev!,
                          rating: parseInt(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Status</Label>
                    <Select
                      value={editingDriver?.status}
                      onValueChange={(val: any) =>
                        setEditingDriver((prev) => ({ ...prev!, status: val }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='active'>Active</SelectItem>
                        <SelectItem value='inactive'>Inactive</SelectItem>
                        <SelectItem value='on_leave'>On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* License Details */}
              <TabsContent value='license' className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>License Number</Label>
                    <Input
                      value={editingDriver?.license?.number || ''}
                      onChange={(e) =>
                        setEditingDriver((prev) => ({
                          ...prev!,
                          license: {
                            ...prev?.license!,
                            number: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Issuing State</Label>
                    <Input
                      value={editingDriver?.license?.issuingState || ''}
                      onChange={(e) =>
                        setEditingDriver((prev) => ({
                          ...prev!,
                          license: {
                            ...prev?.license!,
                            issuingState: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Expiry Date</Label>
                    <Input
                      type='date'
                      value={editingDriver?.license?.expiryDate || ''}
                      onChange={(e) =>
                        setEditingDriver((prev) => ({
                          ...prev!,
                          license: {
                            ...prev?.license!,
                            expiryDate: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Class</Label>
                    <Input
                      value={editingDriver?.license?.class || ''}
                      onChange={(e) =>
                        setEditingDriver((prev) => ({
                          ...prev!,
                          license: { ...prev?.license!, class: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Training Records */}
              <TabsContent value='training' className='space-y-4'>
                <div className='flex justify-end'>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => {
                      const newTraining: TrainingRecord = {
                        id: uuidv4(),
                        type: 'Fire Safety',
                        issueDate: '',
                        expiryDate: '',
                      };
                      setEditingDriver((prev) => ({
                        ...prev!,
                        trainings: [...(prev?.trainings || []), newTraining],
                      }));
                    }}
                  >
                    <Plus className='h-4 w-4 mr-2' /> Add Training
                  </Button>
                </div>

                <ScrollArea className='h-[200px]'>
                  {editingDriver?.trainings?.map((training, index) => (
                    <div
                      key={training.id}
                      className='grid grid-cols-3 gap-2 p-2 border rounded-md mb-2 items-end'
                    >
                      <div className='space-y-1'>
                        <Label className='text-xs'>Type</Label>
                        <Select
                          value={training.type}
                          onValueChange={(val) => {
                            const newTrainings = [
                              ...(editingDriver.trainings || []),
                            ];
                            newTrainings[index].type = val;
                            setEditingDriver((prev) => ({
                              ...prev!,
                              trainings: newTrainings,
                            }));
                          }}
                        >
                          <SelectTrigger className='h-8'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='Fire Safety'>
                              Fire Safety
                            </SelectItem>
                            <SelectItem value='Defensive Driving'>
                              Defensive Driving
                            </SelectItem>
                            <SelectItem value='First Aid'>First Aid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className='space-y-1'>
                        <Label className='text-xs'>Expiry</Label>
                        <Input
                          type='date'
                          className='h-8'
                          value={training.expiryDate}
                          onChange={(e) => {
                            const newTrainings = [
                              ...(editingDriver.trainings || []),
                            ];
                            newTrainings[index].expiryDate = e.target.value;
                            setEditingDriver((prev) => ({
                              ...prev!,
                              trainings: newTrainings,
                            }));
                          }}
                        />
                      </div>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='text-destructive h-8 w-8 mb-0.5'
                        onClick={() => {
                          const newTrainings = editingDriver.trainings?.filter(
                            (t) => t.id !== training.id,
                          );
                          setEditingDriver((prev) => ({
                            ...prev!,
                            trainings: newTrainings,
                          }));
                        }}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter>
            <Button onClick={handleSaveDriver} disabled={isPending}>
              {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Save Driver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === VEHICLE MODAL === */}
      <Dialog open={vehicleModalOpen} onOpenChange={setVehicleModalOpen}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {editingVehicle?.id ? 'Edit Vehicle' : 'Add New Vehicle'}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue='specs' className='w-full'>
            <TabsList className='w-full'>
              <TabsTrigger value='specs' className='flex-1'>
                Specs
              </TabsTrigger>
              <TabsTrigger value='maintenance' className='flex-1'>
                Maintenance
              </TabsTrigger>
              <TabsTrigger value='docs' className='flex-1'>
                Documents
              </TabsTrigger>
            </TabsList>

            <div className='mt-4 space-y-4'>
              {/* Vehicle Specs */}
              <TabsContent value='specs' className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Registration (Plate)</Label>
                    <Input
                      value={editingVehicle?.registration || ''}
                      onChange={(e) =>
                        setEditingVehicle((prev) => ({
                          ...prev!,
                          registration: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Type</Label>
                    <Select
                      value={editingVehicle?.type}
                      onValueChange={(val) =>
                        setEditingVehicle((prev) => ({ ...prev!, type: val }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select type' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='Truck'>Truck</SelectItem>
                        <SelectItem value='Van'>Van</SelectItem>
                        <SelectItem value='Sedan'>Sedan</SelectItem>
                        <SelectItem value='Bus'>Bus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label>Make</Label>
                    <Input
                      value={editingVehicle?.make || ''}
                      onChange={(e) =>
                        setEditingVehicle((prev) => ({
                          ...prev!,
                          make: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Model</Label>
                    <Input
                      value={editingVehicle?.model || ''}
                      onChange={(e) =>
                        setEditingVehicle((prev) => ({
                          ...prev!,
                          model: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>VIN</Label>
                    <Input
                      value={editingVehicle?.vin || ''}
                      onChange={(e) =>
                        setEditingVehicle((prev) => ({
                          ...prev!,
                          vin: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Chassis Number</Label>
                    <Input
                      value={editingVehicle?.chassisNumber || ''}
                      onChange={(e) =>
                        setEditingVehicle((prev) => ({
                          ...prev!,
                          chassisNumber: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Maintenance Records */}
              <TabsContent value='maintenance' className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Current Odometer</Label>
                    <Input
                      type='number'
                      value={editingVehicle?.maintenance?.currentOdometer || 0}
                      onChange={(e) =>
                        setEditingVehicle((prev) => ({
                          ...prev!,
                          maintenance: {
                            ...prev?.maintenance!,
                            currentOdometer: parseInt(e.target.value),
                          },
                        }))
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Status</Label>
                    <Select
                      value={editingVehicle?.status}
                      onValueChange={(val: any) =>
                        setEditingVehicle((prev) => ({ ...prev!, status: val }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='active'>Active</SelectItem>
                        <SelectItem value='maintenance'>
                          In Maintenance
                        </SelectItem>
                        <SelectItem value='retired'>Retired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label>Last Service Date</Label>
                    <Input
                      type='date'
                      value={editingVehicle?.maintenance?.lastServiceDate || ''}
                      onChange={(e) =>
                        setEditingVehicle((prev) => ({
                          ...prev!,
                          maintenance: {
                            ...prev?.maintenance!,
                            lastServiceDate: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Next Service Date</Label>
                    <Input
                      type='date'
                      value={editingVehicle?.maintenance?.nextServiceDate || ''}
                      onChange={(e) =>
                        setEditingVehicle((prev) => ({
                          ...prev!,
                          maintenance: {
                            ...prev?.maintenance!,
                            nextServiceDate: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Documents */}
              <TabsContent value='docs' className='space-y-4'>
                <div className='flex justify-end'>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => {
                      const newDoc: VehicleDocument = {
                        id: uuidv4(),
                        type: 'Road Worthiness',
                        referenceNumber: '',
                      };
                      setEditingVehicle((prev) => ({
                        ...prev!,
                        documents: [...(prev?.documents || []), newDoc],
                      }));
                    }}
                  >
                    <Plus className='h-4 w-4 mr-2' /> Add Document
                  </Button>
                </div>

                <ScrollArea className='h-[200px]'>
                  {editingVehicle?.documents?.map((doc, index) => (
                    <div
                      key={doc.id}
                      className='grid grid-cols-3 gap-2 p-2 border rounded-md mb-2 items-end'
                    >
                      <div className='space-y-1'>
                        <Label className='text-xs'>Type</Label>
                        <Select
                          value={doc.type}
                          onValueChange={(val) => {
                            const newDocs = [
                              ...(editingVehicle.documents || []),
                            ];
                            newDocs[index].type = val;
                            setEditingVehicle((prev) => ({
                              ...prev!,
                              documents: newDocs,
                            }));
                          }}
                        >
                          <SelectTrigger className='h-8'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='Road Worthiness'>
                              Road Worthiness
                            </SelectItem>
                            <SelectItem value='Insurance'>Insurance</SelectItem>
                            <SelectItem value='Hackney Permit'>
                              Hackney Permit
                            </SelectItem>
                            <SelectItem value='Heavy Duty Permit'>
                              Heavy Duty Permit
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className='space-y-1'>
                        <Label className='text-xs'>Expiry</Label>
                        <Input
                          type='date'
                          className='h-8'
                          value={doc.expiryDate}
                          onChange={(e) => {
                            const newDocs = [
                              ...(editingVehicle.documents || []),
                            ];
                            newDocs[index].expiryDate = e.target.value;
                            setEditingVehicle((prev) => ({
                              ...prev!,
                              documents: newDocs,
                            }));
                          }}
                        />
                      </div>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='text-destructive h-8 w-8 mb-0.5'
                        onClick={() => {
                          const newDocs = editingVehicle.documents?.filter(
                            (d) => d.id !== doc.id,
                          );
                          setEditingVehicle((prev) => ({
                            ...prev!,
                            documents: newDocs,
                          }));
                        }}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter>
            <Button onClick={handleSaveVehicle} disabled={isPending}>
              {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Save Vehicle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
