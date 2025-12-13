'use client';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Loader2,
  CheckCircle,
  XCircle,
  RotateCw,
  Ban,
  Wrench,
  Save,
  AlertTriangle,
  Router,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { saveInspectionReport } from '@/app/actions';
import {
  iconMap,
  type InspectionCategory,
  type Driver,
  type Vehicle,
  UserData,
} from '@/lib/definitions';
import React from 'react';
import { root } from 'postcss';

// Schema and default values are now managed inside the component that depends on them
const generateFormSchema = (categories: InspectionCategory[]) => {
  const schemaFields: Record<string, z.ZodType<any, any, any>> = {
    vehicleRegistration: z.string().min(1, 'Please select a vehicle.'),
    inspectingOfficer: z.string().min(1, 'Please select an inspector.'),
    currentOdometer: z.coerce.number().min(1, 'Odometer reading is required.'),
    driverName: z.string().min(1, 'Please select a driver.'),
    finalVerdict: z.enum(['PASS', 'FAIL'], {
      required_error: 'You must select a final verdict.',
    }),
  };

  categories.forEach((category) => {
    category.items.forEach((item) => {
      schemaFields[`${item.id}_status`] = z.enum(
        ['Ok', 'Needs Repair', 'not ok'],
        {
          required_error: 'Please select a status for every item.',
        }
      );
      schemaFields[`${item.id}_notes`] = z
        .string()
        .max(200, 'Notes must be 200 characters or less.')
        .optional();
    });
  });

  return z.object(schemaFields);
};

type FormValues = z.infer<ReturnType<typeof generateFormSchema>>;

function InspectionForm({
  categories,
  drivers,
  vehicles,
}: {
  categories: InspectionCategory[];
  drivers: Driver[];
  vehicles: Vehicle[];
}) {
  const [isSaving, startSaveTransition] = useTransition();
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);

  const { toast } = useToast();

  const formSchema = React.useMemo(
    () => generateFormSchema(categories),
    [categories]
  );

  const defaultValues = React.useMemo(() => {
    const values: Record<string, string | undefined | number> = {
      vehicleRegistration: '',
      currentOdometer: '',
      inspectingOfficer: '',
      driverName: '',
      finalVerdict: undefined,
    };
    categories.forEach((category) => {
      category.items.forEach((item) => {
        values[`${item.id}_status`] = undefined; // No default status
        values[`${item.id}_notes`] = '';
      });
    });
    return values as FormValues;
  }, [categories]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = (data: FormValues) => {
    startSaveTransition(async () => {
      const saveResult = await saveInspectionReport(data, categories);
      if (saveResult.success) {
        toast({
          title: 'Report Saved',
          description: saveResult.message,
        });
        setIsFormSubmitted(true);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error Saving Report',
          description: saveResult.message,
        });
      }
    });
  };

  const handleResetForm = () => {
    window.location.reload();
  };

  const isFormDisabled = isFormSubmitted || isSaving;

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Inspection Details</CardTitle>
              <CardDescription>
                Enter the vehicle and driver information for this inspection.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="vehicleRegistration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Registration</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isFormDisabled}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a vehicle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicles.map((v) => (
                          <SelectItem key={v.id} value={v.registration}>
                            {v.registration}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="driverName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Driver Name</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isFormDisabled}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a driver" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {drivers.map((d) => (
                          <SelectItem key={d.id} value={d.name}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentOdometer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Odometer (km)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 125000"
                        {...field}
                        disabled={isFormDisabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="inspectingOfficer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inspecting Officer</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="e.g., John Doe"
                        {...field}
                        disabled={isFormDisabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Accordion
            type="multiple"
            defaultValue={categories.map((c) => c.id)}
            className="w-full"
          >
            {categories.map((category) => {
              const IconComponent = iconMap[category.icon];
              return (
                <AccordionItem value={category.id} key={category.id}>
                  <AccordionTrigger
                    className="text-xl font-semibold hover:no-underline"
                    disabled={isFormDisabled}
                  >
                    <div className="flex items-center gap-3">
                      {IconComponent && (
                        <IconComponent className="h-6 w-6 text-primary" />
                      )}
                      {category.name}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="divide-y divide-border">
                      {category.items.map((item) => (
                        <div
                          className="grid gap-4 py-6 md:grid-cols-2"
                          key={item.id}
                        >
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                          <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name={`${item.id}_status` as keyof FormValues}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <div className="grid grid-cols-5 gap-2 md:gap-4">
                                      <Button
                                        type="button"
                                        onClick={() => field.onChange('Ok')}
                                        variant={
                                          field.value === 'Ok'
                                            ? 'default'
                                            : 'outline'
                                        }
                                        className="col-span-2 h-full flex-col p-3 text-sm font-medium data-[variant=default]:bg-accent data-[variant=default]:text-accent-foreground data-[variant=default]:hover:bg-accent/90"
                                        disabled={isFormDisabled}
                                      >
                                        <CheckCircle className="mb-1 h-5 w-5" />
                                        Ok
                                      </Button>
                                      <Button
                                        type="button"
                                        onClick={() =>
                                          field.onChange('Needs Repair')
                                        }
                                        variant={
                                          field.value === 'Needs Repair'
                                            ? 'default'
                                            : 'outline'
                                        }
                                        className="col-span-2 h-full flex-col p-3 text-sm font-medium data-[variant=default]:bg-amber-500 data-[variant=default]:text-white data-[variant=default]:hover:bg-amber-600"
                                        disabled={isFormDisabled}
                                      >
                                        <Wrench className="mb-1 h-5 w-5" />
                                        Needs Repair
                                      </Button>
                                      <Button
                                        type="button"
                                        onClick={() => field.onChange('not ok')}
                                        variant={
                                          field.value === 'not ok'
                                            ? 'destructive'
                                            : 'outline'
                                        }
                                        className="col-span-1 h-full flex-col p-3 text-sm font-medium"
                                        disabled={isFormDisabled}
                                      >
                                        <XCircle className="mb-1 h-5 w-5" />
                                        Not OK
                                      </Button>
                                    </div>
                                  </FormControl>
                                  <FormMessage className="text-center" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`${item.id}_notes` as keyof FormValues}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Add notes..."
                                      className="resize-none h-10 min-h-0"
                                      {...field}
                                      disabled={isFormDisabled}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          <Separator />

          <Card>
            <CardHeader>
              <CardTitle>Final Verdict</CardTitle>
              <CardDescription>
                Provide the final pass or fail status for the inspection.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="finalVerdict"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <div className="flex justify-center gap-4">
                        <Button
                          type="button"
                          onClick={() => field.onChange('PASS')}
                          variant={
                            field.value === 'PASS' ? 'default' : 'outline'
                          }
                          className="flex h-auto w-32 flex-col items-center p-4 data-[variant=default]:bg-accent data-[variant=default]:text-accent-foreground data-[variant=default]:hover:bg-accent/90"
                          disabled={isFormDisabled}
                        >
                          <CheckCircle className="mb-3 h-6 w-6" />
                          Pass
                        </Button>
                        <Button
                          type="button"
                          onClick={() => field.onChange('FAIL')}
                          variant={
                            field.value === 'FAIL' ? 'destructive' : 'outline'
                          }
                          className="flex h-auto w-32 flex-col items-center p-4"
                          disabled={isFormDisabled}
                        >
                          <XCircle className="mb-3 h-6 w-6" />
                          Fail
                        </Button>
                      </div>
                    </FormControl>
                    <div className="pt-2 text-center">
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {!isFormSubmitted && (
            <div className="flex flex-col items-center gap-4 pt-4">
              <Button
                type="submit"
                size="lg"
                disabled={isFormDisabled}
                className="w-full md:w-auto"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Report...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Inspection Report
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </Form>

      {isFormSubmitted && (
        <Card className="w-full animate-in fade-in-50 slide-in-from-bottom-10 duration-500">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle>Submission Complete</CardTitle>
            <CardDescription>
              Your inspection report has been saved.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button size="lg" variant="outline" onClick={handleResetForm}>
              <RotateCw className="mr-2 h-4 w-4" />
              Start New Inspection
            </Button>
          </CardContent>
        </Card>
      )}

      {!isFormDisabled && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => form.reset(defaultValues)}
                className="fixed bottom-6 left-6 z-50 h-14 w-14 rounded-full shadow-lg"
              >
                <RotateCw className="h-6 w-6" />
                <span className="sr-only">Reset Form</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Reset Form</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

export default function VehicleCheckForm({
  categories,
  drivers,
  vehicles,
}: {
  categories: InspectionCategory[];
  drivers: Driver[];
  vehicles: Vehicle[];
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
      />
    );
  }

  return null;
}
