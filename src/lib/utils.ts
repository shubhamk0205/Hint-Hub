import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeWhitespace(input: string): string {
  if (!input) return ''
  // Normalize line endings, trim trailing spaces per line, collapse 3+ newlines to 2, and trim ends
  const normalized = input
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(line => line.replace(/\s+$/g, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return normalized
}