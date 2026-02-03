"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import DatePicker, { registerLocale, setDefaultLocale } from "react-datepicker";
import { enUS } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
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
import {
  X,
  Plane,
  Calendar,
  Gauge,
  MapPin,
  Utensils,
  Home,
  Share2,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ListChecks,
  Navigation,
  GripVertical,
} from "lucide-react";
import {
  buildPlanFromForm,
  validatePlanForm,
  savePlanToLocalStorage,
  updatePlanInLocalStorage,
  getMockArrivalTime,
  getDayDates,
  generateCourse,
  type TravelPlan,
  type Destination,
  type DayCourse,
} from "@/lib/planStorage";
import type { LocalSearchItem } from "@/lib/naverMap";

registerLocale("en", enUS);
setDefaultLocale("en");

interface PlanInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** When set, form is pre-filled and submit becomes "Update" (overwrites this plan) */
  initialPlan?: TravelPlan | null;
  /** Called after create or update (e.g. refresh list) */
  onSuccess?: () => void;
}

const TRAVEL_PACE_OPTIONS = [
  { value: "slow", label: "Slow", description: "Relaxed, take it easy" },
  { value: "normal", label: "Normal", description: "Balanced pace" },
  { value: "busy", label: "Busy", description: "Pack it in!" },
];

const ACCOMMODATION_OPTIONS = [
  { value: "booked", label: "Already Booked", description: "I have my stay sorted" },
  { value: "need", label: "Need Recommendation", description: "Suggest where to stay" },
];

const defaultForm = {
  flightNumber: "",
  travelStart: "",
  travelEnd: "",
  travelPace: "normal" as const,
  mustGo: "",
  mustEat: "",
  accommodation: "need" as const,
};

/** Mock AI recommendations based on theme (mustGo/mustEat) */
function getMockAiRecommendations(mustGo: string, mustEat: string): { id: string; name: string; lat: number; lng: number }[] {
  const base = [
    { id: "ai_1", name: "Gyeongbokgung Palace", lat: 37.5796, lng: 126.977 },
    { id: "ai_2", name: "N Seoul Tower", lat: 37.5512, lng: 126.9882 },
    { id: "ai_3", name: "Hongdae", lat: 37.5563, lng: 126.9245 },
    { id: "ai_4", name: "Bukchon Hanok Village", lat: 37.5823, lng: 126.9853 },
    { id: "ai_5", name: "Myeongdong", lat: 37.5605, lng: 126.9853 },
    { id: "ai_6", name: "Insadong", lat: 37.5737, lng: 126.9862 },
    { id: "ai_7", name: "Dongdaemun Design Plaza", lat: 37.5666, lng: 127.0094 },
    { id: "ai_8", name: "Gwangjang Market", lat: 37.5702, lng: 127.0019 },
  ];
  return base;
}

function SortableDestinationRow({ id, name, source, index }: { id: string; name: string; source: "manual" | "ai"; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
        isDragging ? "border-modern-mint bg-modern-mint/10 shadow-md z-50 opacity-90" : "border-modern-mint/20 bg-modern-mint/5"
      }`}
    >
      <button
        type="button"
        className="p-1 rounded text-gray-400 hover:text-modern-mint cursor-grab active:cursor-grabbing touch-none"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>
      <MapPin size={16} className="text-modern-mint shrink-0" />
      <span className="text-sm font-medium text-foreground flex-1">{name}</span>
      {source === "ai" && <span className="text-xs text-modern-mint">AI</span>}
      <span className="text-xs text-gray-500">#{index + 1}</span>
    </div>
  );
}

export default function PlanInputModal({ isOpen, onClose, initialPlan = null, onSuccess }: PlanInputModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState(defaultForm);
  const [manualPlaceInput, setManualPlaceInput] = useState("");
  const [searchResults, setSearchResults] = useState<LocalSearchItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [locationValidationMessage, setLocationValidationMessage] = useState<string | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [finalDestinations, setFinalDestinations] = useState<Destination[]>([]);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([0]));

  const aiRecommendations = useMemo(
    () => getMockAiRecommendations(formData.mustGo, formData.mustEat),
    [formData.mustGo, formData.mustEat]
  );

  const selectedAiIds = useMemo(
    () => new Set(finalDestinations.filter((d) => d.source === "ai").map((d) => d.id)),
    [finalDestinations]
  );

  const arrivalTime = useMemo(
    () => getMockArrivalTime(formData.flightNumber),
    [formData.flightNumber]
  );

  const dayDates = useMemo(
    () => getDayDates(formData.travelStart, formData.travelEnd),
    [formData.travelStart, formData.travelEnd]
  );

  const generatedCoursePreview: DayCourse[] = useMemo(() => {
    if (finalDestinations.length === 0 || !formData.travelStart || !formData.travelEnd)
      return [];
    return generateCourse(
      finalDestinations,
      formData.travelStart,
      formData.travelEnd,
      formData.travelPace,
      arrivalTime
    );
  }, [finalDestinations, formData.travelStart, formData.travelEnd, formData.travelPace, arrivalTime]);

  // 네이버 지역 검색: 입력 시 실시간 검색 (디바운스)
  useEffect(() => {
    const q = manualPlaceInput.trim();
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!q) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    searchDebounceRef.current = setTimeout(() => {
      setSearchLoading(true);
      setSearchResults([]);
      fetch(`/api/search/local?query=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((data: { items?: LocalSearchItem[] }) => {
          setSearchResults(data.items ?? []);
          setShowSearchDropdown(true);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    }, 300);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [manualPlaceInput]);

  const toggleAi = (id: string) => {
    const rec = aiRecommendations.find((r) => r.id === id);
    if (!rec) return;
    if (selectedAiIds.has(id)) {
      setFinalDestinations((prev) => prev.filter((d) => d.id !== id));
    } else {
      setFinalDestinations((prev) => [
        ...prev,
        { id: rec.id, name: rec.name, lat: rec.lat, lng: rec.lng, source: "ai" },
      ]);
    }
  };

  /** 검색 결과 중 하나를 클릭했을 때만 목적지로 추가 (title + lat/lng) */
  const addPlaceFromSearch = useCallback((item: LocalSearchItem) => {
    setFinalDestinations((prev) => [
      ...prev,
      {
        id: `manual_${Date.now()}_${item.title}`,
        name: item.title,
        lat: item.lat,
        lng: item.lng,
        source: "manual",
      },
    ]);
    setManualPlaceInput("");
    setSearchResults([]);
    setShowSearchDropdown(false);
    setLocationValidationMessage(null);
  }, []);

  /** 검색 결과에 없는 장소를 강제로 넣으려 할 때 경고 */
  const showLocationValidation = useCallback(() => {
    if (manualPlaceInput.trim()) {
      setLocationValidationMessage("Please select a valid location from the search results");
    }
  }, [manualPlaceInput]);

  const removeFromFinalList = (id: string) => {
    setFinalDestinations((prev) => prev.filter((d) => d.id !== id));
  };

  const toggleDay = (index: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const previewSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handlePreviewDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = finalDestinations.map((d) => d.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    setFinalDestinations(arrayMove(finalDestinations, oldIndex, newIndex));
  };

  // Pre-fill form when editing
  useEffect(() => {
    if (isOpen && initialPlan) {
      setFormData({
        flightNumber: initialPlan.flightNumber,
        travelStart: initialPlan.travelStart,
        travelEnd: initialPlan.travelEnd,
        travelPace: initialPlan.travelPace,
        mustGo: initialPlan.mustGo,
        mustEat: initialPlan.mustEat,
        accommodation: initialPlan.accommodation,
      });
      if (initialPlan.finalDestinations?.length) {
        setFinalDestinations(initialPlan.finalDestinations);
      } else {
        const fromMustGo = initialPlan.mustGo.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
        setFinalDestinations(
          fromMustGo.map((name, i) => ({ id: `manual_${i}_${name}`, name, source: "manual" as const }))
        );
      }
    } else if (isOpen && !initialPlan) {
      setFormData(defaultForm);
      setFinalDestinations([]);
      setManualPlaceInput("");
      setSearchResults([]);
      setShowSearchDropdown(false);
      setLocationValidationMessage(null);
      setExpandedDays(new Set([0]));
    }
  }, [isOpen, initialPlan]);

  const handleGenerateShareLink = () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const params = new URLSearchParams({
      plan: "draft",
      flight: formData.flightNumber,
      pace: formData.travelPace,
    });
    const link = `${baseUrl}/plan?${params.toString()}`;
    setShareLink(link);
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      console.error("Copy failed");
    }
  };

  const handleSubmit = () => {
    setValidationError(null);
    const { valid, message } = validatePlanForm(formData);
    if (!valid) {
      setValidationError(message ?? "Please fill in the details.");
      return;
    }
    const formWithDestinations = {
      ...formData,
      arrivalTime: arrivalTime ?? undefined,
      finalDestinations: finalDestinations.length > 0 ? finalDestinations : undefined,
    };
    if (initialPlan) {
      const updated = buildPlanFromForm(formWithDestinations, {
        planId: initialPlan.id,
        createdAt: initialPlan.createdAt,
      });
      updatePlanInLocalStorage(updated);
      onClose();
      onSuccess?.();
    } else {
      const plan = buildPlanFromForm(formWithDestinations);
      savePlanToLocalStorage(plan);
      onClose();
      onSuccess?.();
      router.push("/my-plans");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div
        className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-[1001]">
          <h2 className="text-xl font-bold text-foreground">
            {initialPlan ? "Edit Plan" : "Plan Your Trip"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form
          className="p-6 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          {/* Flight Number + Mock Arrival */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Plane size={18} className="text-modern-mint" />
              Flight Number
            </label>
            <input
              type="text"
              placeholder="e.g. KE123"
              value={formData.flightNumber}
              onChange={(e) =>
                setFormData({ ...formData, flightNumber: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-modern-mint focus:ring-2 focus:ring-modern-mint/20 outline-none transition-all"
            />
            {arrivalTime && (
              <p className="mt-2 text-sm text-modern-mint font-medium">
                Estimated arrival:{" "}
                {(() => {
                  const [h, m] = arrivalTime.split(":").map(Number);
                  if (h >= 12) return `${h === 12 ? 12 : h - 12}:${String(m).padStart(2, "0")} PM`;
                  return `${h}:${String(m).padStart(2, "0")} AM`;
                })()}
              </p>
            )}
          </div>

          {/* Travel Period + Day–Date Mapping (English locale) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar size={18} className="text-modern-mint" />
              Travel Period
            </label>
            <div className="flex gap-3">
              <DatePicker
                selected={formData.travelStart ? new Date(formData.travelStart + "T12:00:00") : null}
                onChange={(d) =>
                  setFormData({
                    ...formData,
                    travelStart: d ? d.toISOString().slice(0, 10) : "",
                  })
                }
                placeholderText="Start date"
                dateFormat="MMM d, yyyy"
                locale="en"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-modern-mint focus:ring-2 focus:ring-modern-mint/20 outline-none transition-all w-full"
              />
              <DatePicker
                selected={formData.travelEnd ? new Date(formData.travelEnd + "T12:00:00") : null}
                onChange={(d) =>
                  setFormData({
                    ...formData,
                    travelEnd: d ? d.toISOString().slice(0, 10) : "",
                  })
                }
                placeholderText="End date"
                dateFormat="MMM d, yyyy"
                locale="en"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-modern-mint focus:ring-2 focus:ring-modern-mint/20 outline-none transition-all w-full"
              />
            </div>
            {dayDates.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                {dayDates.map((d, i) => (
                  <span key={d.date} className="px-2 py-1 rounded-lg bg-modern-mint/10 text-modern-mint-dark">
                    {d.dayLabel}: {d.dateLabel}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Travel Pace */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Gauge size={18} className="text-modern-mint" />
              Travel Pace
            </label>
            <div className="space-y-2">
              {TRAVEL_PACE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.travelPace === option.value
                      ? "border-modern-mint bg-modern-mint/5"
                      : "border-gray-200 hover:border-modern-mint/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="travelPace"
                    value={option.value}
                    checked={formData.travelPace === option.value}
                    onChange={(e) =>
                      setFormData({ ...formData, travelPace: e.target.value })
                    }
                    className="sr-only"
                  />
                  <span className="font-medium">{option.label}</span>
                  <span className="text-sm text-gray-500">— {option.description}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Manual Place Input: 네이버 지역 검색 연동, 검색 결과 중 선택 시에만 추가 */}
          <div className="relative">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MapPin size={18} className="text-modern-mint" />
              Manual Input
            </label>
            <input
              type="text"
              placeholder="Search for a place (e.g. Gyeongbokgung Palace)"
              value={manualPlaceInput}
              onChange={(e) => {
                setManualPlaceInput(e.target.value);
                setLocationValidationMessage(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  showLocationValidation();
                }
              }}
              onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
              onBlur={() => setTimeout(() => setShowSearchDropdown(false), 180)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-modern-mint focus:ring-2 focus:ring-modern-mint/20 outline-none transition-all"
            />
            {searchLoading && (
              <p className="mt-1 text-xs text-gray-500">Searching...</p>
            )}
            {showSearchDropdown && searchResults.length > 0 && (
              <ul className="absolute z-[1002] mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg max-h-56 overflow-y-auto">
                {searchResults.map((item, i) => (
                  <li key={`${item.title}-${i}`}>
                    <button
                      type="button"
                      className="w-full px-4 py-3 text-left text-sm hover:bg-modern-mint/10 border-b border-gray-100 last:border-0 flex flex-col gap-0.5"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => addPlaceFromSearch(item)}
                    >
                      <span className="font-medium text-foreground">{item.title}</span>
                      {(item.roadAddress || item.address) && (
                        <span className="text-xs text-gray-500 truncate">
                          {item.roadAddress || item.address}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {locationValidationMessage && (
              <p className="mt-2 text-sm text-amber-600 font-medium" role="alert">
                {locationValidationMessage}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Select a place from the search results to add it to your list.
            </p>
          </div>

          {/* AI Recommendations */}
          <div className="rounded-2xl border border-modern-mint/20 bg-modern-mint/5 p-4">
            <h4 className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
              <Sparkles size={18} className="text-modern-mint" />
              AI Recommendations
            </h4>
            <p className="text-xs text-gray-600 mb-3">
              Based on your theme; select places to add to your list.
            </p>
            <div className="flex flex-wrap gap-2">
              {aiRecommendations.map((rec) => (
                <label
                  key={rec.id}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 cursor-pointer transition-all text-sm ${
                    selectedAiIds.has(rec.id)
                      ? "border-modern-mint bg-modern-mint/10 text-foreground"
                      : "border-gray-200 hover:border-modern-mint/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedAiIds.has(rec.id)}
                    onChange={() => toggleAi(rec.id)}
                    className="rounded border-gray-300 text-modern-mint focus:ring-modern-mint"
                  />
                  {rec.name}
                </label>
              ))}
            </div>
          </div>

          {/* Final Destination List (animated) */}
          <div>
            <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <ListChecks size={18} className="text-modern-mint" />
              Final Destination List
            </h4>
            {finalDestinations.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">Add places above or select from AI.</p>
            ) : (
              <ul className="space-y-2">
                {finalDestinations.map((d, i) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-modern-mint/20 bg-white shadow-sm animate-in fade-in slide-in-from-top-2 duration-200"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <MapPin size={16} className="text-modern-mint shrink-0" />
                      {d.name}
                      {d.source === "ai" && (
                        <span className="text-xs text-modern-mint">AI</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFromFinalList(d.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-soft-coral hover:bg-soft-coral/10 transition-colors"
                      aria-label="Remove"
                    >
                      <X size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Must-go / Must-eat theme (optional, for AI context) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MapPin size={18} className="text-modern-mint opacity-60" />
              Theme (optional, for AI)
            </label>
            <input
              type="text"
              placeholder="e.g. palaces, nightlife"
              value={formData.mustGo}
              onChange={(e) =>
                setFormData({ ...formData, mustGo: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-modern-mint focus:ring-2 focus:ring-modern-mint/20 outline-none transition-all"
            />
          </div>

          {/* Must-eat Foods */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Utensils size={18} className="text-modern-mint" />
              Must-eat Foods
            </label>
            <textarea
              placeholder="e.g. Bibimbap, Korean BBQ, Tteokbokki..."
              value={formData.mustEat}
              onChange={(e) =>
                setFormData({ ...formData, mustEat: e.target.value })
              }
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-modern-mint focus:ring-2 focus:ring-modern-mint/20 outline-none transition-all resize-none"
            />
          </div>

          {/* Accommodation */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Home size={18} className="text-modern-mint" />
              Accommodation
            </label>
            <div className="space-y-2">
              {ACCOMMODATION_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.accommodation === option.value
                      ? "border-modern-mint bg-modern-mint/5"
                      : "border-gray-200 hover:border-modern-mint/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="accommodation"
                    value={option.value}
                    checked={formData.accommodation === option.value}
                    onChange={(e) =>
                      setFormData({ ...formData, accommodation: e.target.value })
                    }
                    className="sr-only"
                  />
                  <span className="font-medium">{option.label}</span>
                  <span className="text-sm text-gray-500">— {option.description}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Generated Course Preview (sortable list + Day accordion) */}
          {generatedCoursePreview.length > 0 && (
            <div className="rounded-2xl border border-modern-mint/20 bg-surface-muted/50 p-4">
              <h4 className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                <Navigation size={18} className="text-modern-mint" />
                Generated Course Preview
              </h4>
              <p className="text-xs text-gray-600 mb-3">
                Drag to reorder; Day assignment updates automatically.
              </p>
              <DndContext
                sensors={previewSensors}
                collisionDetection={closestCenter}
                onDragEnd={handlePreviewDragEnd}
              >
                <SortableContext
                  items={finalDestinations.map((d) => d.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 mb-4">
                    {finalDestinations.map((d, i) => (
                      <SortableDestinationRow
                        key={d.id}
                        id={d.id}
                        name={d.name}
                        source={d.source}
                        index={i}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <div className="space-y-2">
                {generatedCoursePreview.map((day, dayIndex) => (
                  <div
                    key={day.date}
                    className="rounded-xl border border-modern-mint/20 bg-white overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleDay(dayIndex)}
                      className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left font-medium text-foreground hover:bg-modern-mint/5 transition-colors"
                    >
                      <span>
                        {day.dayLabel} — {day.dateLabel}
                      </span>
                      {expandedDays.has(dayIndex) ? (
                        <ChevronDown size={20} className="text-modern-mint shrink-0" />
                      ) : (
                        <ChevronRight size={20} className="text-modern-mint shrink-0" />
                      )}
                    </button>
                    {expandedDays.has(dayIndex) && (
                      <div className="border-t border-modern-mint/10 p-3 space-y-2">
                        {day.items.map((item, itemIndex) =>
                          item.type === "place" ? (
                            <div
                              key={`${day.date}-${itemIndex}-place`}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-modern-mint/10 border border-modern-mint/20"
                            >
                              <MapPin size={16} className="text-modern-mint shrink-0" />
                              <span className="text-sm font-medium text-foreground">{item.name}</span>
                            </div>
                          ) : (
                            <div
                              key={`${day.date}-${itemIndex}-transit`}
                              className="flex items-center gap-2 px-3 py-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500"
                            >
                              <Navigation size={16} className="shrink-0" />
                              <span className="text-xs">
                                Transit: {item.from} → {item.to}
                              </span>
                              <span className="text-xs text-gray-400 ml-auto">(Naver API placeholder)</span>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Group Share */}
          <div className="rounded-2xl bg-surface-muted p-4 border border-modern-mint/20">
            <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
              <Share2 size={18} className="text-modern-mint" />
              Group Share
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Share your plan with travel buddies via link
            </p>
            {shareLink ? (
              <div className="space-y-2">
                <input
                  type="text"
                  readOnly
                  value={shareLink}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-modern-mint text-white text-sm font-medium hover:bg-modern-mint-dark transition-colors"
                >
                  {linkCopied ? (
                    <>
                      <Check size={16} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copy Link
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGenerateShareLink}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-modern-mint text-white font-medium hover:bg-modern-mint-dark transition-colors"
              >
                <Share2 size={20} />
                Generate Share Link
              </button>
            )}
          </div>

          {validationError && (
            <p className="text-sm text-red-500 text-center py-1" role="alert">
              {validationError}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-gradient-to-r from-modern-mint to-modern-mint-dark text-white font-semibold hover:opacity-95 transition-opacity shadow-lg"
          >
            {initialPlan ? "Update" : "Create My Plan"}
          </button>
        </form>
      </div>
    </div>
  );
}
