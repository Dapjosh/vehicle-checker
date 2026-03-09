import React, { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Plus, Trash2, Loader2 } from 'lucide-react';
import type { Driver, TrainingRecord } from '@/lib/definitions';
import { v4 as uuidv4 } from 'uuid';

interface DriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverData: Partial<Driver> | null;
  onSave: (driver: Partial<Driver>) => Promise<void>;
}

function capitalizeEachWord(str: string) {
    return str.replace(/\b\w/g, char => char.toUpperCase());
}

export function DriverModal({
  isOpen,
  onClose,
  driverData,
  onSave,
}: DriverModalProps) {
  const [formData, setFormData] = useState<Partial<Driver> | null>(null);
  const [isPending, startTransition] = useTransition();

  

  useEffect(() => {
    setFormData(driverData);
  }, [driverData, isOpen]);

  const handleSave = () => {
    if (!formData) return;
    formData.name = capitalizeEachWord(formData.name?.trim() || '');
    startTransition(async () => {
      await onSave(formData);
    });
  };

  const updateField = (field: keyof Driver, value: any) => {
    setFormData((prev) => ({ ...prev!, [field]: value }));
  };

  const updateLicense = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev!,
      license: { ...prev?.license!, [field]: value },
    }));
  };

  if (!formData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {formData.id ? 'Edit Driver' : 'Add New Driver'}
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
                    value={formData.name || ''}
                    onChange={(e) => updateField('name', e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Email</Label>
                  <Input
                    value={formData.email || ''}
                    onChange={(e) => updateField('email', e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone || ''}
                    onChange={(e) => updateField('phone', e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Rating (1-5)</Label>
                  <Input
                    type='number'
                    min='1'
                    max='5'
                    value={formData.rating || ''}
                    onChange={(e) =>
                      updateField('rating', parseInt(e.target.value))
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Date Hired</Label>
                  <Input
                    type='date'
                    value={formData.dateHired || ''}
                    onChange={(e) => updateField('dateHired', e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Employee ID</Label>
                  <Input
                    value={formData.employeeId || ''}
                    onChange={(e) => updateField('employeeId', e.target.value)}
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
                    value={formData.license?.number || ''}
                    onChange={(e) => updateLicense('number', e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Issuing State</Label>
                  <Input
                    value={formData.license?.issuingState || ''}
                    onChange={(e) =>
                      updateLicense('issuingState', e.target.value)
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Expiry Date</Label>
                  <Input
                    type='date'
                    value={formData.license?.expiryDate || ''}
                    onChange={(e) =>
                      updateLicense('expiryDate', e.target.value)
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Class</Label>
                  <Input
                    value={formData.license?.class || ''}
                    onChange={(e) => updateLicense('class', e.target.value)}
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
                    setFormData((prev) => ({
                      ...prev!,
                      trainings: [...(prev?.trainings || []), newTraining],
                    }));
                  }}
                >
                  <Plus className='h-4 w-4 mr-2' /> Add Training
                </Button>
              </div>

              <ScrollArea className='h-[200px]'>
                {formData.trainings?.map((training, index) => (
                  <div
                    key={training.id}
                    className='grid grid-cols-3 gap-2 p-2 border rounded-md mb-2 items-end'
                  >
                    <div className='space-y-1'>
                      <Label className='text-xs'>Type</Label>
                      <Select
                        value={training.type}
                        onValueChange={(val) => {
                          const newTrainings = [...(formData.trainings || [])];
                          newTrainings[index].type = val;
                          setFormData((prev) => ({
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
                          const newTrainings = [...(formData.trainings || [])];
                          newTrainings[index].expiryDate = e.target.value;
                          setFormData((prev) => ({
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
                        const newTrainings = formData.trainings?.filter(
                          (t) => t.id !== training.id,
                        );
                        setFormData((prev) => ({
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
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Save Driver
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
