// Types for @sbmdkl/nepali-date-converter (ships UMD/ESM bundles; its
// "types" entry is not picked up via the exports map by TS).
declare module "@sbmdkl/nepali-date-converter" {
  export interface BsCurrentDate {
    currentDate?: string;
  }
  export function adToBs(adDate: string): string | BsCurrentDate;
  export function bsToAd(selectedDate: string): string;
  export function calculateAge(...args: unknown[]): unknown;
}
