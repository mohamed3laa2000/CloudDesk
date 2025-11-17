import { Zap, Settings, Users, Globe } from 'lucide-react';
import type { OnboardingStep } from '../types/onboarding';

/**
 * Configuration for all onboarding steps
 */
export const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    icon: Zap,
    title: "Welcome to CloudDesk EDU",
    description: "Get instant access to fully-configured cloud desktops in seconds. No installation, no configuration, no waiting. Your powerful computing environment is ready when you are.",
    features: [
      "Deploy desktops in under 60 seconds",
      "Pre-configured with essential software",
      "Access from any device with a browser"
    ]
  },
  {
    id: 2,
    icon: Settings,
    title: "Configure Your Perfect Desktop",
    description: "Scale resources to match your workload. Choose from flexible CPU, RAM, storage, and GPU options. Adjust on the fly as your needs change.",
    features: [
      "2-32 CPU cores",
      "4-128 GB RAM",
      "30 GB - 2 TB storage",
      "8 GPU options from T4 to H100"
    ]
  },
  {
    id: 3,
    icon: Users,
    title: "Built for Your Needs",
    description: "Whether you're a student running demanding coursework, an educator managing classroom environments, or a professional scaling compute power, CloudDesk EDU adapts to you.",
    features: [
      "Students: Run resource-intensive applications",
      "Educators: Manage classroom desktops centrally",
      "Professionals: Scale computing on demand"
    ]
  },
  {
    id: 4,
    icon: Globe,
    title: "Work From Anywhere",
    description: "Deploy your desktop in 13 global regions across North America, Europe, Asia Pacific, Middle East, and South America. Your work follows you, not your hardware.",
    features: [
      "13 global regions",
      "Low-latency connections",
      "99.9% uptime SLA",
      "Enterprise-grade security"
    ]
  }
];
