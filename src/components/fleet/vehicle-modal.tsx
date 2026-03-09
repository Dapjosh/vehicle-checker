import React, { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Loader2, History, Save, FileText } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type {
  Vehicle,
  VehicleDocument,
  ServiceRecord,
} from '@/lib/definitions';
import { v4 as uuidv4 } from 'uuid';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleData: Partial<Vehicle> | null;
  onSave: (vehicle: Partial<Vehicle>) => Promise<void>;
}

export function VehicleModal({
  isOpen,
  onClose,
  vehicleData,
  onSave,
}: VehicleModalProps) {
  const [formData, setFormData] = useState<Partial<Vehicle> | null>(null);
  const [isPending, startTransition] = useTransition();

  // Maintenance Sub-state
  const [isAddingService, setIsAddingService] = useState(false);
  const [newService, setNewService] = useState<Partial<ServiceRecord>>({
    serviceDate: new Date().toISOString().split('T')[0],
    serviceType: '',
    currentOdometer: 0,
    serviceCost: 0,
    serviceProvider: '',
    notes: '',
  });

  useEffect(() => {
    setFormData(vehicleData);
  }, [vehicleData, isOpen]);

  const handleSave = () => {
    if (!formData) return;
    startTransition(async () => {
      formData.registration = formData.registration?.replaceAll(/[^a-zA-Z0-9]+/g, '').toUpperCase() || '';
      await onSave(formData);
    });
  };

  const updateField = (field: keyof Vehicle, value: any) => {
    setFormData((prev) => ({ ...prev!, [field]: value }));
  };

  const handleAddService = () => {
    if (!newService.serviceType || !newService.serviceDate) return;

    const record: ServiceRecord = {
      id: uuidv4(),
      serviceDate: newService.serviceDate!,
      serviceType: newService.serviceType!,
      currentOdometer: newService.currentOdometer || 0,
      serviceMileage: newService.currentOdometer || 0,
      status: 'active',
      serviceCost: newService.serviceCost || 0,
      serviceProvider: newService.serviceProvider || '',
      notes: newService.notes || '',
    };

    setFormData((prev) => {
      if (!prev) return null;
      const updatedHistory = [record, ...(prev.serviceHistory || [])];

      // Auto-update vehicle maintenance stats
      const currentLastService = prev.maintenance?.lastServiceDate;
      const isNewer =
        !currentLastService ||
        new Date(record.serviceDate) > new Date(currentLastService);

      const updatedMaintenance = {
        ...prev.maintenance,
        currentOdometer: Math.max(
          prev.maintenance?.currentOdometer || 0,
          record.currentOdometer,
        ),
        lastServiceDate: isNewer
          ? record.serviceDate
          : prev.maintenance?.lastServiceDate,
      };

      return {
        ...prev,
        serviceHistory: updatedHistory,
        maintenance: updatedMaintenance,
      };
    });

    setIsAddingService(false);
    setNewService({
      serviceDate: new Date().toISOString().split('T')[0],
      serviceType: '',
      currentOdometer: 0,
      serviceCost: 0,
      serviceProvider: '',
      notes: '',
    });
  };

  const handleDeleteService = (id: string) => {
    setFormData((prev) => ({
      ...prev!,
      serviceHistory: prev?.serviceHistory?.filter((s) => s.id !== id),
    }));
  };

  if (!formData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {formData.id ? 'Edit Vehicle' : 'Add New Vehicle'}
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
            {/* Specs Tab */}
            <TabsContent value='specs' className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>Registration</Label>
                  <Input
                    value={formData.registration || ''}
                    onChange={(e) =>
                      updateField('registration', e.target.value)
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(val) => updateField('type', val)}
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
                    value={formData.make || ''}
                    onChange={(e) => updateField('make', e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Model</Label>
                  <Input
                    value={formData.model || ''}
                    onChange={(e) => updateField('model', e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>VIN</Label>
                  <Input
                    value={formData.vin || ''}
                    onChange={(e) => updateField('vin', e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Chassis</Label>
                  <Input
                    value={formData.chassisNumber || ''}
                    onChange={(e) =>
                      updateField('chassisNumber', e.target.value)
                    }
                  />
                </div>
              </div>
            </TabsContent>

            {/* Maintenance Tab */}
            <TabsContent value='maintenance' className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>Current Odometer</Label>
                  <Input
                    type='number'
                    value={formData.maintenance?.currentOdometer || 0}
                    onChange={(e) =>
                      setFormData((prev) => ({
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
                    value={formData.status}
                    onValueChange={(val) => updateField('status', val)}
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
                    value={formData.maintenance?.lastServiceDate || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
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
                    value={formData.maintenance?.nextServiceDate || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
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

              {/* Service History Table */}
              <div className='space-y-4 border-t pt-4'>
                <div className='flex items-center justify-between'>
                  <h3 className='font-semibold flex items-center gap-2 text-sm'>
                    <History className='h-4 w-4' /> Service History
                  </h3>
                  {!isAddingService && (
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => setIsAddingService(true)}
                    >
                      <Plus className='h-4 w-4 mr-2' /> Log Service
                    </Button>
                  )}
                </div>

                {isAddingService && (
                  <div className='p-4 border rounded-md bg-slate-50 dark:bg-slate-900 space-y-4'>
                    <div className='grid grid-cols-2 gap-4'>
                      <div className='space-y-2'>
                        <Label>Date</Label>
                        <Input
                          type='date'
                          value={newService.serviceDate}
                          onChange={(e) =>
                            setNewService({
                              ...newService,
                              serviceDate: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label>Type</Label>
                        <Select
                          value={newService.serviceType}
                          onValueChange={(val) =>
                            setNewService({ ...newService, serviceType: val })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='Oil Change'>
                              Oil Change
                            </SelectItem>
                            <SelectItem value='Brake Service'>
                              Brake Service
                            </SelectItem>
                            <SelectItem value='Tire Rotation'>
                              Tire Rotation
                            </SelectItem>
                            <SelectItem value='General Maintenance'>
                              General Maintenance
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className='space-y-2'>
                        <Label>Odometer</Label>
                        <Input
                          type='number'
                          value={newService.currentOdometer}
                          onChange={(e) =>
                            setNewService({
                              ...newService,
                              currentOdometer: parseInt(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label>Cost</Label>
                        <Input
                          type='number'
                          value={newService.serviceCost}
                          onChange={(e) =>
                            setNewService({
                              ...newService,
                              serviceCost: parseFloat(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className='col-span-2 space-y-2'>
                        <Label>Provider</Label>
                        <Input
                          value={newService.serviceProvider}
                          onChange={(e) =>
                            setNewService({
                              ...newService,
                              serviceProvider: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className='col-span-2 space-y-2'>
                        <Label>Notes</Label>
                        <Textarea
                          value={newService.notes}
                          onChange={(e) =>
                            setNewService({
                              ...newService,
                              notes: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className='flex justify-end gap-2'>
                      <Button
                        size='sm'
                        variant='ghost'
                        onClick={() => setIsAddingService(false)}
                      >
                        Cancel
                      </Button>
                      <Button size='sm' onClick={handleAddService}>
                        <Save className='h-4 w-4 mr-2' /> Save
                      </Button>
                    </div>
                  </div>
                )}

                <div className='border rounded-md max-h-48 overflow-y-auto'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Odometer</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.serviceHistory?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className='text-center italic'>
                            No records.
                          </TableCell>
                        </TableRow>
                      ) : (
                        formData.serviceHistory
                          ?.sort(
                            (a, b) =>
                              new Date(b.serviceDate).getTime() -
                              new Date(a.serviceDate).getTime(),
                          )
                          .map((record) => (
                            <TableRow key={record.id}>
                              <TableCell>{record.serviceDate}</TableCell>
                              <TableCell>{record.serviceType}</TableCell>
                              <TableCell>{record.currentOdometer}</TableCell>
                              <TableCell>${record.serviceCost}</TableCell>
                              <TableCell>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  className='h-8 w-8 text-destructive'
                                  onClick={() => handleDeleteService(record.id)}
                                >
                                  <Trash2 className='h-4 w-4' />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            {/* Documents Tab - Simplified for brevity */}
            <TabsContent value='docs' className='space-y-4'>
              {/* Similar logic to previous implementation */}
              <div className='flex justify-end'>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => {
                    const newDoc: VehicleDocument = {
                      id: uuidv4(),
                      type: 'Insurance',
                      referenceNumber: '',
                    };
                    setFormData((prev) => ({
                      ...prev!,
                      documents: [...(prev?.documents || []), newDoc],
                    }));
                  }}
                >
                  <Plus className='h-4 w-4 mr-2' /> Add Document
                </Button>
              </div>
              <ScrollArea className='h-[200px]'>
                {formData.documents?.map((doc, index) => (
                  <div
                    key={doc.id}
                    className='grid grid-cols-3 gap-2 p-2 border rounded-md mb-2 items-end'
                  >
                    <div className='space-y-1'>
                      <Label className='text-xs'>Type</Label>
                      <Select
                        value={doc.type}
                        onValueChange={(val) => {
                          const docs = [...(formData.documents || [])];
                          docs[index].type = val;
                          setFormData((prev) => ({
                            ...prev!,
                            documents: docs,
                          }));
                        }}
                      >
                        <SelectTrigger className='h-8'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='Insurance'>Insurance</SelectItem>
                          <SelectItem value='Road Worthiness'>
                            Road Worthiness
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
                          const docs = [...(formData.documents || [])];
                          docs[index].expiryDate = e.target.value;
                          setFormData((prev) => ({
                            ...prev!,
                            documents: docs,
                          }));
                        }}
                      />
                    </div>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8 text-destructive'
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev!,
                          documents: prev?.documents?.filter(
                            (d) => d.id !== doc.id,
                          ),
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
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Save Vehicle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
