/**
 * Plan data type and localStorage helpers for KoGo travel plans
 */

/** Single destination (manual or AI-selected) */
export interface Destination {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
  source: "manual" | "ai";
}

/** One item in a day's course: place or transit placeholder */
export type CourseItem =
  | { type: "place"; name: string; lat?: number; lng?: number }
  | { type: "transit"; from: string; to: string };

/** One day in the generated course */
export interface DayCourse {
  dayLabel: string;
  date: string;
  dateLabel: string;
  items: CourseItem[];
}

export interface TravelPlan {
  id: string;
  flightNumber: string;
  travelStart: string;
  travelEnd: string;
  travelPace: string;
  mustGo: string;
  mustEat: string;
  accommodation: string;
  createdAt: string;
  /** Mock: e.g. "14:30" for KE123 */
  arrivalTime?: string;
  /** Final list of places (manual + selected AI) */
  finalDestinations?: Destination[];
  /** Auto-generated day-by-day course with transit placeholders */
  generatedCourse?: DayCourse[];
  /** User-defined order of place names (used on Plan Detail for drag-drop). When set, overrides display order. */
  placeOrder?: string[];
}

export interface PlanFormData {
  flightNumber: string;
  travelStart: string;
  travelEnd: string;
  travelPace: string;
  mustGo: string;
  mustEat: string;
  accommodation: string;
  arrivalTime?: string;
  finalDestinations?: Destination[];
  generatedCourse?: DayCourse[];
}

const STORAGE_KEY = "kogo_plans";

/**
 * Mock: flight number → arrival time (e.g. KE123 → "14:30")
 */
export function getMockArrivalTime(flightNumber: string): string | undefined {
  const upper = flightNumber.trim().toUpperCase();
  if (upper === "KE123") return "14:30";
  if (upper.startsWith("KE")) return "15:00";
  return undefined;
}

/**
 * Get array of { dayLabel, date, dateLabel } for travel period
 */
export function getDayDates(
  travelStart: string,
  travelEnd: string
): { dayLabel: string; date: string; dateLabel: string }[] {
  if (!travelStart || !travelEnd) return [];
  const start = new Date(travelStart + "T12:00:00");
  const end = new Date(travelEnd + "T12:00:00");
  if (end < start) return [];
  const out: { dayLabel: string; date: string; dateLabel: string }[] = [];
  const d = new Date(start);
  let dayNum = 1;
  while (d <= end) {
    const dateStr = d.toISOString().slice(0, 10);
    const dateLabel = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    out.push({
      dayLabel: `Day ${dayNum}`,
      date: dateStr,
      dateLabel,
    });
    d.setDate(d.getDate() + 1);
    dayNum++;
  }
  return out;
}

/** Simple haversine distance (km) between two points */
function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Places per day by pace */
const PLACES_PER_DAY: Record<string, number> = {
  slow: 2,
  normal: 3,
  busy: 4,
};

/**
 * Generate day-by-day course: Day 1 evening-only, Day 2+ by distance/pace.
 * Inserts transit placeholders between places.
 */
export function generateCourse(
  destinations: Destination[],
  travelStart: string,
  travelEnd: string,
  travelPace: string,
  arrivalTime?: string
): DayCourse[] {
  const dayDates = getDayDates(travelStart, travelEnd);
  if (dayDates.length === 0 || destinations.length === 0) return [];

  const places = destinations.map((d) => ({
    name: d.name,
    lat: d.lat ?? 37.5665 + (d.name.length % 10) * 0.01,
    lng: d.lng ?? 126.978 + (d.name.length % 10) * 0.01,
  }));
  const perDay = PLACES_PER_DAY[travelPace] ?? 3;

  // Day 1: evening only (arrival 14:30 → 1–2 places)
  const day1Max = arrivalTime ? 2 : perDay;
  const day1Places = places.slice(0, day1Max);
  const restPlaces = places.slice(day1Max);

  // Day 2+: nearest-neighbor order by distance (use first place of day as start)
  const ordered: typeof places = [];
  let remaining = [...restPlaces];
  let lastLat = day1Places.length
    ? day1Places[day1Places.length - 1].lat
    : 37.5665;
  let lastLng = day1Places.length
    ? day1Places[day1Places.length - 1].lng
    : 126.978;
  while (remaining.length > 0) {
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = distanceKm(
        lastLat,
        lastLng,
        remaining[i].lat,
        remaining[i].lng
      );
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    const [next] = remaining.splice(best, 1);
    ordered.push(next);
    lastLat = next.lat;
    lastLng = next.lng;
  }

  const day2Places = ordered;
  const days: DayCourse[] = [];

  // Build Day 1
  const items1: CourseItem[] = [];
  for (let i = 0; i < day1Places.length; i++) {
    items1.push({
      type: "place",
      name: day1Places[i].name,
      lat: day1Places[i].lat,
      lng: day1Places[i].lng,
    });
    if (i < day1Places.length - 1) {
      items1.push({
        type: "transit",
        from: day1Places[i].name,
        to: day1Places[i + 1].name,
      });
    }
  }
  days.push({
    dayLabel: dayDates[0].dayLabel,
    date: dayDates[0].date,
    dateLabel: dayDates[0].dateLabel,
    items: items1,
  });

  // Chunk day2+ by perDay
  for (let chunk = 0; chunk < day2Places.length; chunk += perDay) {
    const slice = day2Places.slice(chunk, chunk + perDay);
    const dayIndex = 1 + Math.floor(chunk / perDay);
    if (dayIndex >= dayDates.length) break;
    const dayInfo = dayDates[dayIndex];
    const items: CourseItem[] = [];
    for (let i = 0; i < slice.length; i++) {
      items.push({
        type: "place",
        name: slice[i].name,
        lat: slice[i].lat,
        lng: slice[i].lng,
      });
      if (i < slice.length - 1) {
        items.push({
          type: "transit",
          from: slice[i].name,
          to: slice[i + 1].name,
        });
      }
    }
    days.push({
      dayLabel: dayInfo.dayLabel,
      date: dayInfo.date,
      dateLabel: dayInfo.dateLabel,
      items,
    });
  }

  return days;
}

/**
 * Build a TravelPlan object from form data (for saving)
 */
export function buildPlanFromForm(
  form: PlanFormData,
  options?: { planId?: string; createdAt?: string }
): TravelPlan {
  const now = options?.createdAt ?? new Date().toISOString();
  const id = options?.planId ?? `plan_${Date.now()}`;
  const arrivalTime =
    form.arrivalTime ?? getMockArrivalTime(form.flightNumber);
  const finalDestinations = form.finalDestinations ?? [];
  const generatedCourse =
    form.generatedCourse ??
    (finalDestinations.length > 0 && form.travelStart && form.travelEnd
      ? generateCourse(
          finalDestinations,
          form.travelStart,
          form.travelEnd,
          form.travelPace,
          arrivalTime
        )
      : undefined);

  const mustGo =
    form.mustGo?.trim() ||
    finalDestinations.map((d) => d.name).join(", ") ||
    "";

  return {
    id,
    flightNumber: form.flightNumber.trim(),
    travelStart: form.travelStart,
    travelEnd: form.travelEnd,
    travelPace: form.travelPace,
    mustGo,
    mustEat: form.mustEat.trim(),
    accommodation: form.accommodation,
    createdAt: now,
    arrivalTime,
    finalDestinations: finalDestinations.length > 0 ? finalDestinations : undefined,
    generatedCourse:
      generatedCourse && generatedCourse.length > 0 ? generatedCourse : undefined,
  };
}

/**
 * Validate form: returns error message if required fields are empty
 */
export function validatePlanForm(form: PlanFormData): { valid: boolean; message?: string } {
  if (!form.flightNumber?.trim()) {
    return { valid: false, message: "Please fill in the details (Flight Number)." };
  }
  if (!form.travelStart?.trim()) {
    return { valid: false, message: "Please fill in the details (Travel start date)." };
  }
  if (!form.travelEnd?.trim()) {
    return { valid: false, message: "Please fill in the details (Travel end date)." };
  }
  return { valid: true };
}

/**
 * Save a new plan to localStorage (appends to existing list)
 */
export function savePlanToLocalStorage(plan: TravelPlan): void {
  if (typeof window === "undefined") return;
  const existing = getPlansFromLocalStorage();
  existing.unshift(plan);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error("Failed to save plan:", e);
  }
}

/**
 * Read all plans from localStorage
 */
export function getPlansFromLocalStorage(): TravelPlan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Get a single plan by id
 */
export function getPlanById(id: string): TravelPlan | null {
  const plans = getPlansFromLocalStorage();
  return plans.find((p) => p.id === id) ?? null;
}

/**
 * Get ordered list of place names for display (and map/timeline).
 * Uses placeOrder if set; otherwise flattens from generatedCourse or parses mustGo.
 */
export function getOrderedPlaces(plan: TravelPlan): string[] {
  if (plan.placeOrder && plan.placeOrder.length > 0) {
    return plan.placeOrder;
  }
  if (plan.generatedCourse && plan.generatedCourse.length > 0) {
    const names: string[] = [];
    for (const day of plan.generatedCourse) {
      for (const item of day.items) {
        if (item.type === "place") names.push(item.name);
      }
    }
    return names;
  }
  if (!plan.mustGo?.trim()) return ["Seoul"];
  return plan.mustGo
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Update place order for a plan and persist to localStorage.
 */
export function updatePlanPlaceOrder(planId: string, placeOrder: string[]): TravelPlan | null {
  const plan = getPlanById(planId);
  if (!plan) return null;
  const updated: TravelPlan = { ...plan, placeOrder };
  updatePlanInLocalStorage(updated);
  return updated;
}

/**
 * Delete a plan by id from localStorage
 */
export function deletePlanById(id: string): void {
  if (typeof window === "undefined") return;
  const plans = getPlansFromLocalStorage().filter((p) => p.id !== id);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  } catch (e) {
    console.error("Failed to delete plan:", e);
  }
}

/**
 * Update an existing plan in localStorage (keeps id and createdAt)
 */
export function updatePlanInLocalStorage(plan: TravelPlan): void {
  if (typeof window === "undefined") return;
  const plans = getPlansFromLocalStorage().map((p) =>
    p.id === plan.id ? plan : p
  );
  const exists = plans.some((p) => p.id === plan.id);
  if (!exists) {
    plans.unshift(plan);
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  } catch (e) {
    console.error("Failed to update plan:", e);
  }
}
