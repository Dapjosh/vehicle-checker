
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
  "Fluids": Droplets,
  "Engine": Cog,
  "Brakes": Disc,
  "Interior": Armchair,
};

export type IconName = keyof typeof iconMap;

export const defaultInspectionCategories: InspectionCategory[] = [
  {
    id: 'engine',
    name: 'Engine',
    icon: 'Engine' as IconName,
    items: [
      { id: 'engine_oil', name: 'Engine Oil', description: 'Check level and condition of engine oil.' },
      { id: 'coolant', name: 'Coolant System', description: 'Check coolant level and for leaks in hoses and radiator.' },
      { id: 'belts', name: 'Belts and Hoses', description: 'Inspect for wear, cracks, and proper tension.' },
    ],
  },
  {
    id: 'fluids',
    name: 'Fluids',
    icon: 'Fluids' as IconName,
    items: [
      { id: 'transmission_fluid', name: 'Transmission Fluid', description: 'Check level and condition.' },
      { id: 'brake_fluid', name: 'Brake Fluid', description: 'Check level and for contamination.' },
      { id: 'power_steering_fluid', name: 'Power Steering Fluid', description: 'Check level and for leaks.' },
    ],
  },
  {
    id: 'brakes',
    name: 'Brakes',
    icon: 'Brakes' as IconName,
    items: [
        { id: 'brake_pads', name: 'Brake Pads & Discs', description: 'Check for wear, damage, and thickness.' },
        { id: 'parking_brake', name: 'Parking Brake', description: 'Ensure it holds the vehicle securely.' },
    ]
  },
  {
    id: 'tires',
    name: 'Tires & Wheels',
    icon: 'Tires&Wheels' as IconName,
    items: [
        { id: 'tire_pressure', name: 'Tire Pressure', description: 'Check and adjust to manufacturer specifications.' },
        { id: 'tire_tread', name: 'Tire Tread Depth', description: 'Check for wear and any uneven patterns.' },
        { id: 'wheel_damage', name: 'Wheel Condition', description: 'Inspect for cracks, dents, or other damage.' },
    ]
  },
  {
    id: 'electrical',
    name: 'Electrical System',
    icon: 'ElectricalSystem' as IconName,
    items: [
        { id: 'battery', name: 'Battery', description: 'Check terminals for corrosion and secure connections.' },
        { id: 'headlights', name: 'Headlights & Taillights', description: 'Ensure all lights are operational.' },
        { id: 'horn', name: 'Horn', description: 'Test for proper operation.' },
    ]
  },
  {
    id: 'interior',
    name: 'Interior',
    icon: 'Interior' as IconName,
    items: [
        { id: 'seatbelts', name: 'Seatbelts', description: 'Check for proper function and signs of wear.' },
        { id: 'ac_heater', name: 'A/C and Heater', description: 'Verify both heating and cooling functions.' },
        { id: 'wipers', name: 'Windshield Wipers', description: 'Check for wear and proper operation.' },
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
  uid: string;
  email: string;
  role: UserRole;
  orgId: string;
  displayName?: string;
  photoURL?: string;
}

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
}

export interface InspectionReportSummary {
  id: string;
  vehicleRegistration: string;
  driverName: string;
  finalVerdict: 'PASS' | 'FAIL';
  submittedBy: string;
  submittedAt: Timestamp;
}

export type InspectionReport = InspectionReportSummary & {
    items: InspectionItemWithStatus[];
}
