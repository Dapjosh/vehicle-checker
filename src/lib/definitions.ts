
import {
  Cog, Droplets, Car, Armchair, Circle, Lightbulb, Fan,
  Gauge, BatteryCharging, CarFront, Sofa, Siren, Thermometer,
  Speaker, Snowflake, Disc, Fuel, SprayCan, SlidersHorizontal, Wrench,
  AirVent, Power, Settings2, Radio, CircuitBoard, Heater, ParkingCircle,
  type LucideProps
} from 'lucide-react';
import { type Timestamp } from 'firebase/firestore';


export const iconMap = {
  Cog,
  Droplets,
  Car,
  Armchair,
  Circle,
  Lightbulb,
  Fan,
  Gauge,
  BatteryCharging,
  CarFront,
  Sofa,
  Siren,
  Thermometer,
  Speaker,
  Snowflake,
  Disc,
  Fuel,
  SprayCan,
  SlidersHorizontal,
  Wrench,
  AirVent,
  Power,
  Settings2,
  Radio,
  CircuitBoard,
  Heater,
  ParkingCircle,
  "Tires&Wheels": Circle,
  "ElectricalSystem": BatteryCharging,
  "Driver": Siren,
  "PrimeMover": Car,
  "Trailer": Cog,
};

export type IconName = keyof typeof iconMap;

export const defaultInspectionCategories: InspectionCategory[] = [
  {
    id: 'driver',
    name: 'Driver',
    icon: 'Driver' as IconName,
    items: [
      { id: 'driver_license_insurance', name: 'Vehicle License & Insurance', description: 'Are the vehicle license(s) and insurance certificate valid?' },
      { id: 'driver_valid_license', name: 'Driver\'s License', description: 'Does the driver have a valid driver\'s license?' },
      { id: 'driver_induction_card', name: 'Induction Card', description: 'Has the driver undergone DDT& does he possess a valid induction card?' },
      { id: 'driver_ppe', name: 'Basic PPE', description: 'Does the driver have his basic PPE (helmet, safety boots, and overall)?' },
    ],
  },
  {
    id: 'prime_mover',
    name: 'Prime Mover/Tractor Head',
    icon: 'PrimeMover' as IconName,
    items: [
      { id: 'pm_oil_fuel_leaks', name: 'Oil and Fuel Leaks', description: 'Is the truck free from oil and fuel leaks?' },
      { id: 'pm_windscreen', name: 'Windscreen', description: 'Is it clear of unnecessary stickers and free of cracks?' },
      { id: 'pm_lights_wipers', name: 'Lights & Wipers', description: 'Are the head lights, trafficators and wiper in good functional condition?' },
      { id: 'pm_horn_alarm', name: 'Horn and Reverse Alarm', description: 'Are they functional?' },
      { id: 'pm_mirrors', name: 'Driving Mirrors', description: 'Are all mirrors firmly fixed and well positioned for good visibility?' },
      { id: 'pm_tires', name: 'Tires Condition', description: 'Are all tires in good condition and well inflated? (360 degrees inspection)' },
      { id: 'pm_studs_nuts', name: 'Wheel Studs & Nuts', description: 'The wheels have all the required studs and nuts (no missing nuts)' },
      { id: 'pm_cabin', name: 'Cabin Condition', description: 'The cabin, doors, seats, 3-point belts, floor plate, steps and other parts intact?' },
      { id: 'pm_engine_start', name: 'Engine Start', description: 'The engine starts using the starter/battery? (no pushing, non-usage of wires)' },
      { id: 'pm_hand_brake', name: 'Hand Brake/Park Brake', description: 'Is the hand brake/park brake functional?' },
      { id: 'pm_aux_braking', name: 'Auxiliary Braking System', description: 'Is the vehicle equipped with an auxiliary braking system (bevel brake, coolant, engine brake)' },
      { id: 'pm_extinguisher', name: 'Fire Extinguisher & Safety Cone', description: 'Is the vehicle with one 9kg extinguisher and 2 caution sign/Safety Cone' },
      { id: 'pm_jack', name: 'Functional Jack', description: 'Does the vehicle have a functional jack?' },
      { id: 'pm_wheel_chokes', name: 'Wheel Chokes', description: 'Does the vehicle have 2 standard wheel chokes with handles?' },
      { id: 'pm_cigarette_lighter', name: 'Cigarette Lighter', description: 'The cigarette lighter is removed from the cabin' },
      { id: 'pm_cabin_items', name: 'Cabin Free of Items', description: 'Is the cabin free of any moving item?' },
      { id: 'pm_battery_secured', name: 'Battery Secure', description: 'Battery is properly secured?' },
      { id: 'pm_battery_terminals', name: 'Battery Terminals & Cables', description: 'Are the battery terminals and electrical cables well insulated?' },
      { id: 'pm_exhaust', name: 'Exhaust Condition', description: 'Is exhaust intact, silent, free of leaks and not smoking?' },
      { id: 'pm_fuel_pipes', name: 'Fuel/CNG Pipes & Air Tanks', description: 'Fuel, CNG linking pipes and air tanks are properly locked.' },
    ],
  },
  {
    id: 'trailer_container',
    name: 'Trailer/Container',
    icon: 'Trailer' as IconName,
    items: [
      { id: 'tc_brakes', name: 'Trailer Brakes', description: 'Must operate correctly when connected to tractor. (check air hose of trailer)' },
      { id: 'tc_axles', name: 'Axles', description: 'The trailer must have a minimum of 2 axles.' },
      { id: 'tc_kingpin', name: 'Kingpin Play', description: 'The kingpin play in relation to fifth wheel checked (check greasy turntable)' },
      { id: 'tc_landing_legs', name: 'Landing Legs', description: 'The trailer landing legs are straight and adjustable not welded (landing sit is well secured)' },
      { id: 'tc_twistlock', name: 'Twistlock', description: 'Check the twistlock if well secured' },
      { id: 'tc_loading_bed', name: 'Loading Bed Condition', description: 'Is the loading bed smooth, free from obstructions and gaping holes?' },
      { id: 'tc_hooks', name: 'Loading Bed Hooks', description: 'Are the hooks of the trailer loading bed (SIDED BODY) intact?' },
      { id: 'tc_chassis', name: 'Trailer Body/Chassis', description: 'Is the trailer body (chassis) intact and there is no visible cracks and has worn parts?' },
      { id: 'tc_trailer_tires', name: 'Trailer Tires', description: 'All trailer tyres good in condition and well inflated? (360 degrees inspection) MINIMUM DEPTH OF 2.5MM' },
      { id: 'tc_spare_wheel', name: 'Spare Wheel', description: 'Does the vehicle have a good inflated spare wheel?' },
      { id: 'tc_tarpaulin_harness', name: 'Tarpaulin Harnessing Devices', description: 'Are the tarpaulin harnessing devices in position? Are they appropriate and adequate?' },
      { id: 'tc_wheel_nuts', name: 'Wheel Nuts/Studs', description: 'wheel nuts/studs are complete and fastened. Hub cover' },
      { id: 'tc_tarpaulin', name: 'Tarpaulin Adequacy', description: 'Is there a good and adequate tarpaulin?' },
      { id: 'tc_reflectors', name: 'Rear Safety Reflectors', description: 'Is rear safety reflectors fitted to the trailer? And conspicuity tape fitted.' },
      { id: 'tc_twist_lock_intact', name: 'Twist Lock Intactness', description: 'Is the twist lock well intact' },
    ]
  }
];

export type InspectionItem = {
  id: string;
  name: string;
  description: string;
};

export type InspectionItemWithStatus = InspectionItem & {
  categoryId: string;
  categoryName: string;
  status: Status;
  notes: string;
}

export type InspectionCategory = {
  id: string;
  name: string;
  icon: IconName;
  items: InspectionItem[];
};

export type Status = 'Ok' | 'Needs Repair' | 'not ok';

export type UserRole = 'member' | 'super_admin';

export interface UserData {
  uid?: string;
  email?: string;
  role?: string;
  displayName?: string;
  photoURL?: string;
}

export interface MemberData {
  orgId: string;
  email: string;
  role: string;
  orgName: string;
  createdBy: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface InspectionReportSummary {
  id: string;
  vehicleRegistration: string;
  driverName: string;
  currentOdometer: number;
  finalVerdict: 'PASS' | 'FAIL';
  submittedBy: string;
  submittedAt: Timestamp;
}

export type InspectionReport = InspectionReportSummary & {
  items: InspectionItemWithStatus[];
}

export interface Vehicle {
  id: string;
  registration: string;
  createdAt: string;
}

export interface Driver {
  id: string;
  name: string;
  createdAt: string;
}
