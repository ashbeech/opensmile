import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(amount: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(amount);
}

export function calculateHours(fromDate: Date): number {
  return Math.round((Date.now() - new Date(fromDate).getTime()) / 3600000);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ENQUIRY: "bg-gray-100 text-gray-800",
    NEW: "bg-blue-100 text-blue-800",
    CONTACTED: "bg-yellow-100 text-yellow-800",
    QUALIFIED: "bg-purple-100 text-purple-800",
    NURTURING: "bg-indigo-100 text-indigo-800",
    APPOINTMENT_BOOKED: "bg-cyan-100 text-cyan-800",
    CONSULTATION_COMPLETED: "bg-teal-100 text-teal-800",
    TREATMENT_STARTED: "bg-green-100 text-green-800",
    LOST: "bg-red-100 text-red-800",
    UNQUALIFIED: "bg-orange-100 text-orange-800",
    ACTIVE: "bg-green-100 text-green-800",
    PAUSED: "bg-yellow-100 text-yellow-800",
    CHURNED: "bg-red-100 text-red-800",
    SCHEDULED: "bg-blue-100 text-blue-800",
    ATTENDED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    NO_SHOW: "bg-orange-100 text-orange-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}
