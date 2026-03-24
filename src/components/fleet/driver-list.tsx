import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  Loader2,
  User,
  Trash2,
  ChevronRight,
  Plus,
  Search,
} from 'lucide-react';
import type { Driver } from '@/lib/definitions';
import { useInfiniteScroll } from '../../hooks/use-infinite-scroll';
import { searchFleetAction } from '@/app/actions';

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

  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Driver[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (!search) {
      setResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchFleetAction(search, 'drivers');
      setResults(results as Driver[]);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const displayedDrivers = search ? results : drivers;

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

      <div className='relative w-full max-w-md'>
        <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
        <Input
          type='search'
          placeholder='Search by driver name...'
          className='pl-8 w-full bg-white'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {isSearching && (
          <Loader2 className='absolute right-2.5 z-40 top-2.5 h-4 w-4 animate-spin text-muted-foreground' />
        )}
      </div>

      <div className='border rounded-lg overflow-hidden divide-y bg-card'>
        {displayedDrivers.length === 0 ? (
          <div className='p-8 text-center text-muted-foreground italic flex flex-col items-center gap-2'>
            <User className='h-10 w-10 opacity-20' />
            No drivers registered yet.
          </div>
        ) : (
          displayedDrivers.map((driver, index) => {
            const isLast = index === drivers.length - 1;
            return (
              <div
                key={driver.id}
                ref={isLast ? lastElementRef : null}
                className='p-4 flex items-center justify-between hover:bg-muted/40 transition-colors group'
              >
                <div className='flex items-center gap-4 flex-grow cursor-pointer'>
                  <Avatar
                    className={`w-10 ${driver.photoUrl ? 'cursor-pointer hover:opacity-80 transition-opacity ring-transparent hover:ring-primary' : ''}`}
                    onClick={() =>
                      driver.photoUrl && setPreviewImage(driver.photoUrl)
                    }
                  >
                    <AvatarImage src={driver.photoUrl} />
                    <AvatarFallback>
                      {driver.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div onClick={() => onEdit(driver)}>
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

      <Dialog
        open={!!previewImage}
        onOpenChange={(open) => !open && setPreviewImage(null)}
      >
        <DialogContent className='max-w-3xl bg-transparent border-none shadow-none p-0 flex justify-center items-center'>
          <DialogTitle className='sr-only'>Driver Image Preview</DialogTitle>
          {previewImage && (
            <img
              src={previewImage}
              alt='Driver Preview'
              className='w-full h-auto max-h-[85vh] object-contain rounded-md shadow-2xl'
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
