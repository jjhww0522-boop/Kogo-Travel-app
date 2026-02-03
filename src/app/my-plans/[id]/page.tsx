"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft, MapPin, Plane, Gauge, GripVertical, Info, X, Clock, DollarSign } from "lucide-react";
import {
  getPlanById,
  getOrderedPlaces,
  updatePlanPlaceOrder,
  type TravelPlan,
} from "@/lib/planStorage";
import NaverMapCompact, { type PlaceForMap } from "@/components/NaverMapCompact";
import PathDetailsAccordion from "@/components/PathDetailsAccordion";
import PathDetailsContent from "@/components/PathDetailsContent";

const PACE_LABELS: Record<string, string> = {
  slow: "Slow",
  normal: "Normal",
  busy: "Busy",
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/** Example place info (English description, hours, fee) for Info popover */
const PLACE_INFO_EXAMPLE: Record<string, { description: string; hours: string; fee: string }> = {
  "Gyeongbokgung Palace": {
    description: "The main royal palace of the Joseon dynasty. Built in 1395, it features traditional Korean architecture and the National Palace Museum.",
    hours: "Wed–Mon 9:00–18:00 (closed Tue)",
    fee: "Adults 3,000 KRW; Free with Hanbok rental",
  },
  "N Seoul Tower": {
    description: "Iconic communication tower on Namsan Mountain with observation decks, restaurants, and panoramic views of Seoul.",
    hours: "Sun–Thu 10:00–23:00, Fri–Sat 10:00–24:00",
    fee: "Observatory 16,000 KRW (adult)",
  },
  Hongdae: {
    description: "Vibrant district around Hongik University known for indie music, street performances, cafes, and nightlife.",
    hours: "Shops/cafes vary; nightlife until late",
    fee: "Free (individual venues may charge)",
  },
  "Bukchon Hanok Village": {
    description: "Traditional Korean village with preserved hanok houses. Walking alleys and cultural experiences.",
    hours: "Residential area; visit during daytime",
    fee: "Free",
  },
  Myeongdong: {
    description: "Major shopping and street food district. Department stores, cosmetics, and local snacks.",
    hours: "Stores typically 10:00–22:00",
    fee: "Free",
  },
  Insadong: {
    description: "Cultural street with galleries, teahouses, traditional crafts, and souvenir shops.",
    hours: "Most shops 10:00–20:00",
    fee: "Free",
  },
  "Dongdaemun Design Plaza": {
    description: "Landmark building by Zaha Hadid. Exhibitions, design shops, and events.",
    hours: "Varies by exhibition; building 10:00–21:00",
    fee: "Free (exhibitions may charge)",
  },
  "Gwangjang Market": {
    description: "Traditional market famous for bindaetteok, mayak gimbap, and vintage clothing.",
    hours: "Daily 9:00–18:00 (some stalls until 22:00)",
    fee: "Free (pay for food)",
  },
  Seoul: {
    description: "Capital of South Korea. Blend of historic palaces, modern districts, and K-culture.",
    hours: "—",
    fee: "—",
  },
};

function getPlaceInfo(name: string) {
  return (
    PLACE_INFO_EXAMPLE[name] ?? {
      description: "A must-visit spot on your trip. Details can be updated with real data later.",
      hours: "Check locally",
      fee: "—",
    }
  );
}

/** Build places for map: ordered names with lat/lng from finalDestinations when available */
function getPlacesForMap(plan: TravelPlan): PlaceForMap[] {
  const names = getOrderedPlaces(plan);
  const byName = new Map<string | undefined, { lat?: number; lng?: number }>();
  plan.finalDestinations?.forEach((d) => {
    byName.set(d.name, { lat: d.lat, lng: d.lng });
  });
  return names.map((name) => {
    const coords = byName.get(name);
    return { name, lat: coords?.lat, lng: coords?.lng };
  });
}

interface SortablePlaceCardProps {
  id: string;
  name: string;
  index: number;
  onInfoClick?: (name: string) => void;
}

function SortablePlaceCard({ id, name, index, onInfoClick }: SortablePlaceCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm transition-all ${
        isDragging
          ? "border-modern-mint shadow-lg opacity-90 z-50 scale-[1.02]"
          : "border-modern-mint/20 active:bg-modern-mint/5"
      }`}
    >
      <button
        type="button"
        className="touch-none p-1.5 rounded-lg text-gray-400 hover:text-modern-mint hover:bg-modern-mint/10 cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-modern-mint/30"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={20} />
      </button>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-modern-mint/20 text-sm font-bold text-modern-mint-dark">
        {index + 1}
      </span>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <MapPin size={20} className="text-modern-mint shrink-0" />
        <span className="font-semibold text-foreground truncate">{name}</span>
      </div>
      {onInfoClick && (
        <button
          type="button"
          onClick={() => onInfoClick(name)}
          className="p-2 rounded-lg text-modern-mint hover:bg-modern-mint/10 transition-colors shrink-0"
          aria-label="Place info"
        >
          <Info size={20} />
        </button>
      )}
    </div>
  );
}

export default function PlanDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [mounted, setMounted] = useState(false);
  const [infoPlaceName, setInfoPlaceName] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setPlan(getPlanById(id));
  }, [id]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!plan || !over || active.id === over.id) return;
    const orderedPlaces = getOrderedPlaces(plan);
    const items = orderedPlaces.map((name, i) => ({ id: `place-${i}`, name }));
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(items, oldIndex, newIndex);
    const newOrder = reordered.map((i) => i.name);
    const updated = updatePlanPlaceOrder(plan.id, newOrder);
    if (updated) setPlan(updated);
  };

  if (!mounted) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-4 py-6">
          <p className="text-gray-500">Loading...</p>
        </div>
      </main>
    );
  }

  if (!plan) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-4 py-6 pb-24">
          <p className="text-gray-600 mb-4">Plan not found.</p>
          <Link
            href="/my-plans"
            className="inline-flex items-center gap-2 text-modern-mint-dark font-medium"
          >
            <ArrowLeft size={18} />
            Back to My Plans
          </Link>
        </div>
      </main>
    );
  }

  const orderedPlaces = getOrderedPlaces(plan);
  const placesForMap = getPlacesForMap(plan);
  const sortableIds = orderedPlaces.map((_, i) => `place-${i}`);

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Fixed small map at top – markers follow place order */}
      <div className="sticky top-0 z-0">
        <NaverMapCompact places={placesForMap} />
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 -mt-2 relative z-10 bg-background rounded-t-3xl shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
        {/* Header */}
        <Link
          href="/my-plans"
          className="inline-flex items-center gap-2 py-2 text-sm text-gray-600 hover:text-modern-mint-dark mb-4 min-h-[44px]"
        >
          <ArrowLeft size={20} />
          Back to My Plans
        </Link>
        <div className="flex items-center gap-2 mb-1">
          <Plane size={22} className="text-modern-mint shrink-0" />
          <h1 className="text-xl font-bold text-foreground">
            {plan.flightNumber?.toUpperCase() || "My Plan"}
          </h1>
        </div>
        <p className="text-sm text-gray-500 mb-2">
          {formatDate(plan.travelStart)} – {formatDate(plan.travelEnd)}
        </p>
        <div className="flex items-center gap-2 mb-6">
          <Gauge size={16} className="text-soft-coral shrink-0" />
          <span className="text-sm text-gray-600">
            Pace: <span className="font-medium text-foreground">{PACE_LABELS[plan.travelPace] ?? plan.travelPace}</span>
          </span>
        </div>

        {/* Sortable place list (drag handle + number + name); order saved to localStorage */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            <div className="relative border-l-2 border-modern-mint/30 pl-6 ml-2 space-y-4">
              {orderedPlaces.map((place, index) => (
                <div key={`${place}-${index}`} className="relative">
                  <div
                    className="absolute left-0 w-4 h-4 rounded-full bg-modern-mint border-2 border-white shadow -translate-x-[29px] top-6"
                    aria-hidden
                  />
                  <SortablePlaceCard
                    id={sortableIds[index]}
                    name={place}
                    index={index}
                    onInfoClick={setInfoPlaceName}
                  />
                  {index < orderedPlaces.length - 1 && (
                    <div className="mt-3">
                      <PathDetailsAccordion
                        title="View Path Details"
                        subtitle={`From ${place} to ${orderedPlaces[index + 1]}`}
                        defaultOpen={false}
                      >
                        <PathDetailsContent />
                      </PathDetailsAccordion>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Plan summary footer */}
        <div className="mt-8 rounded-2xl border border-soft-coral/20 bg-soft-coral/5 p-4">
          <p className="text-sm font-medium text-gray-700 mb-1">Trip summary</p>
          {plan.mustEat && (
            <p className="text-sm text-gray-600">
              <span className="text-soft-coral-dark font-medium">Must-eat:</span> {plan.mustEat}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Accommodation: {plan.accommodation === "booked" ? "Already booked" : "Need recommendation"}
          </p>
        </div>
      </div>

      {/* Place info popover (modal) */}
      {infoPlaceName && (
        <div
          className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setInfoPlaceName(null)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <MapPin size={20} className="text-modern-mint" />
                {infoPlaceName}
              </h3>
              <button
                type="button"
                onClick={() => setInfoPlaceName(null)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-gray-700">{getPlaceInfo(infoPlaceName).description}</p>
              </div>
              <div className="flex items-start gap-2">
                <Clock size={18} className="text-modern-mint shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Hours</p>
                  <p className="text-sm text-gray-700">{getPlaceInfo(infoPlaceName).hours}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <DollarSign size={18} className="text-modern-mint shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">Admission / Fee</p>
                  <p className="text-sm text-gray-700">{getPlaceInfo(infoPlaceName).fee}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
