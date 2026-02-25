import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Truck, Calendar, Trash2, Edit, Plus } from 'lucide-react';
import type { Vehicle } from '@/lib/definitions';
import { useInfiniteScroll } from '../../hooks/use-infinite-scroll';

interface VehicleListProps {
  vehicles: Vehicle[];
  loadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
}

export function VehicleList({
  vehicles,
  loadingMore,
  hasMore,
  onLoadMore,
  onEdit,
  onDelete,
  onAddNew,
}: VehicleListProps) {
  const lastElementRef = useInfiniteScroll(onLoadMore, hasMore, loadingMore);

  return (
    <div className='space-y-4'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h2 className='text-xl font-bold'>Manage Vehicles</h2>
          <p className='text-sm text-muted-foreground'>
            Track registration, maintenance, and documents.
          </p>
        </div>
        <Button onClick={onAddNew} className='self-start sm:self-center'>
          <Plus className='mr-2 h-5 w-5' />
          Add Vehicle
        </Button>
      </div>

      <div className='border rounded-lg overflow-hidden bg-card'>
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
              <TableRow>
                <TableCell colSpan={6}>
                  <div className='p-8 text-center text-muted-foreground italic flex flex-col items-center gap-2'>
                    <Truck className='h-10 w-10 opacity-20' />
                    No vehicles registered yet.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              vehicles.map((vehicle, index) => {
                const isLast = index === vehicles.length - 1;
                return (
                  <TableRow
                    key={vehicle.id}
                    ref={isLast ? lastElementRef : null}
                  >
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
                        onClick={() => onEdit(vehicle)}
                      >
                        <Edit className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='text-destructive hover:bg-destructive hover:text-white'
                        onClick={() => onDelete(vehicle.id)}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
            {loadingMore && (
              <TableRow>
                <TableCell colSpan={6} className='text-center'>
                  <Loader2 className='h-6 w-6 animate-spin text-primary inline-block' />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
