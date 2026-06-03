// ical.js ships no type declarations, and ical-expander's own .d.ts imports it.
// Declare it as untyped so the import resolves; we use it loosely in
// lib/services/calendar.ts.
declare module "ical.js";
