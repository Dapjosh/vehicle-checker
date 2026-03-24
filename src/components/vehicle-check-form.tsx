'use client';

import {
  iconMap,
  type InspectionCategory,
  type Driver,
  type Vehicle,
  UserData,
} from '@/lib/definitions';
import React from 'react';
import { z } from 'zod';
import InspectionForm from './inspection-form';

export default function VehicleCheckForm({
  categories,
  drivers,
  vehicles,
  officerName,
}: {
  categories: InspectionCategory[];
  drivers: Driver[];
  vehicles: Vehicle[];
  officerName: string;
}) {
  // const [isSaving, startSaveTransition] = useTransition();
  // const [isFormSubmitted, setIsFormSubmitted] = useState(false);

  // const { toast } = useToast();

  if (categories && drivers && vehicles) {
    return (
      <InspectionForm
        categories={categories}
        drivers={drivers}
        vehicles={vehicles}
        officerName={officerName}
      />
    );
  }

  return null;
}
