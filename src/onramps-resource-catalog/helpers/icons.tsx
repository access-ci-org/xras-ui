import {
  Boxes,
  CalendarCheck,
  Cloud,
  Cpu,
  Globe,
  HardDrive,
  History,
  Lightbulb,
  type LucideIcon,
  Monitor,
  MonitorSmartphone,
  Sparkles,
} from "lucide-react";

export const categoryIcons: Record<string, LucideIcon> = {
  CPU: Cpu,
  GPU: MonitorSmartphone,
  Innovative: Lightbulb,
  Cloud: Cloud,
  Storage: HardDrive,
};

export const featureIcons: Record<string, LucideIcon> = {
  "Advance reservations": CalendarCheck,
  "Composable hardware fabric": Boxes,
  "Compute Resources": Cpu,
  "CPU Compute": Cpu,
  "GPU Compute": MonitorSmartphone,
  "Innovative / Novel Compute": Lightbulb,
  "Large Memory Nodes": MonitorSmartphone,
  Preemption: History,
  "Science Gateway support": Globe,
  "Service / Other": Sparkles,
  "Storage Resources": HardDrive,
  "Virtual Machines": Monitor,
  Cloud: Cloud,
  Storage: HardDrive,
};

export const featureIconImages: Record<string, string> = {
  "ACCESS Pegasus":
    "https://pegasus.isi.edu/wordpress/wp-content/uploads/2016/01/favicon.ico",
  "ACCESS OnDemand":
    "https://openondemand.org/themes/fire/theme/assets/media/favicons/favicon.ico",
};
