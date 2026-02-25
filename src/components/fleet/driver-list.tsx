import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, User, Trash2, ChevronRight, Plus } from 'lucide-react';
import type { Driver } from '@/lib/definitions';
import { useInfiniteScroll } from '../../hooks/use-infinite-scroll';

interface DriverListProps {
  drivers: Driver[];
  loadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onEdit: (driver: Driver) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
}

export function DriverList({
  drivers,
  loadingMore,
  hasMore,
  onLoadMore,
  onEdit,
  onDelete,
  onAddNew,
}: DriverListProps) {
  const lastElementRef = useInfiniteScroll(onLoadMore, hasMore, loadingMore);

  return (
    <div className='space-y-4'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h2 className='text-xl font-bold'>Manage Drivers</h2>
          <p className='text-sm text-muted-foreground'>
            Add, remove, and view all drivers in your organization.
          </p>
        </div>
        <Button onClick={onAddNew} className='self-start sm:self-center'>
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
                ref={isLast ? lastElementRef : null}
                className='p-4 flex items-center justify-between hover:bg-muted/40 transition-colors group'
              >
                <div
                  className='flex items-center gap-4 flex-grow cursor-pointer'
                  onClick={() => onEdit(driver)}
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
                          driver.status === 'active' ? 'outline' : 'secondary'
                        }
                        className='text-[10px] h-4 px-1'
                      >
                        {driver.status}
                      </Badge>
                    </div>
                    {driver.rating && (
                      <div className='text-xs text-muted-foreground mt-1'>
                        ⭐ {driver.rating}/5
                      </div>
                    )}
                  </div>
                </div>

                <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='text-muted-foreground hover:text-destructive hover:!bg-destructive/10'
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(driver.id);
                    }}
                  >
                    <Trash2 className='h-5 w-5' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='text-muted-foreground hover:text-primary hover:!bg-primary/10'
                    onClick={() => onEdit(driver)}
                  >
                    <ChevronRight className='h-6 w-6' />
                  </Button>
                </div>
              </div>
            );
          })
        )}

        {loadingMore && (
          <div className='p-4 flex justify-center'>
            <Loader2 className='h-6 w-6 animate-spin text-primary' />
          </div>
        )}
      </div>
    </div>
  );
}
