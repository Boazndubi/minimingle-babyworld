import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(" ")
}

export function formatCurrency(amount: number | undefined | null, currency: string = "KES"): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `${currency} 0.00`
  }

  return `${currency} ${Number(amount).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatNumber(num: number): string {
  return num.toLocaleString("en-KE")
}

export function getPercentageChange(current: number, previous: number): number {
  if (previous === 0) return 0
  return Number((((current - previous) / previous) * 100).toFixed(1))
}