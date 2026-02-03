"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Plane,
  Calendar,
  Gauge,
  Utensils,
  Home,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  getPlansFromLocalStorage,
  deletePlanById,
  type TravelPlan,
} from "@/lib/planStorage";
import PlanInputModal from "@/components/PlanInputModal";

const PACE_LABELS: Record<string, string> = {
  slow: "Slow",
  normal: "Normal",
  busy: "Busy",
};

const ACCOMMODATION_LABELS: Record<string, string> = {
  booked: "Already Booked",
  need: "Need Recommendation",
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toISOString().slice(0, 10);
  } catch {
    return dateStr;
  }
}

function formatCreatedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function PlanCard({
  plan,
  onEdit,
  onDelete,
}: {
  plan: TravelPlan;
  onEdit: (plan: TravelPlan) => void;
  onDelete: (plan: TravelPlan) => void;
}) {
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(plan);
  };
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Are you sure?")) {
      deletePlanById(plan.id);
      onDelete(plan);
    }
  };

  return (
    <Link href={`/my-plans/${plan.id}`} className="block">
      <article className="rounded-2xl border border-modern-mint/20 bg-white shadow-sm overflow-hidden hover:border-modern-mint/40 hover:shadow-md transition-all">
      <div className="p-4 border-b border-modern-mint/10 bg-modern-mint/5">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Plane size={18} className="text-modern-mint" />
            {plan.flightNumber || "—"}
          </span>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">
              {formatCreatedAt(plan.createdAt)}
            </span>
            <button
              type="button"
              onClick={handleEdit}
              className="p-2 rounded-lg text-modern-mint hover:bg-modern-mint/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Edit plan"
            >
              <Pencil size={20} />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="p-2 rounded-lg text-soft-coral hover:bg-soft-coral/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Delete plan"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Calendar size={16} className="text-modern-mint shrink-0" />
          <span className="text-gray-600">
            {formatDate(plan.travelStart)} → {formatDate(plan.travelEnd)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Gauge size={16} className="text-modern-mint shrink-0" />
          <span className="text-gray-600">
            Pace: {PACE_LABELS[plan.travelPace] ?? plan.travelPace}
          </span>
        </div>
        {plan.mustGo && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin size={16} className="text-modern-mint shrink-0 mt-0.5" />
            <span className="text-gray-600 line-clamp-2">{plan.mustGo}</span>
          </div>
        )}
        {plan.mustEat && (
          <div className="flex items-start gap-2 text-sm">
            <Utensils size={16} className="text-modern-mint shrink-0 mt-0.5" />
            <span className="text-gray-600 line-clamp-2">{plan.mustEat}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <Home size={16} className="text-modern-mint shrink-0" />
          <span className="text-gray-600">
            {ACCOMMODATION_LABELS[plan.accommodation] ?? plan.accommodation}
          </span>
        </div>
      </div>
    </article>
    </Link>
  );
}

export default function MyPlansPage() {
  const [plans, setPlans] = useState<TravelPlan[]>([]);
  const [mounted, setMounted] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TravelPlan | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const refreshPlans = () => setPlans(getPlansFromLocalStorage());

  useEffect(() => {
    setPlans(getPlansFromLocalStorage());
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-4 py-6 pb-24">
          <h1 className="text-2xl font-bold text-foreground mb-2">My Plans</h1>
          <p className="text-gray-500">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        <h1 className="text-2xl font-bold text-foreground mb-2">My Plans</h1>
        <p className="text-gray-600 mb-6">
          Your saved travel plans appear here.
        </p>

        {plans.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-modern-mint/30 bg-modern-mint/5 p-12 text-center">
            <MapPin size={48} className="mx-auto text-modern-mint/50 mb-4" />
            <p className="text-gray-600 mb-4">No plans yet</p>
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-block px-6 py-3 rounded-xl bg-modern-mint text-white font-medium hover:bg-modern-mint-dark transition-colors"
            >
              Create Your First Plan
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onEdit={setEditingPlan}
                onDelete={refreshPlans}
              />
            ))}
          </div>
        )}
      </div>

      {editingPlan && (
        <PlanInputModal
          isOpen={true}
          onClose={() => setEditingPlan(null)}
          initialPlan={editingPlan}
          onSuccess={() => {
            refreshPlans();
            setEditingPlan(null);
          }}
        />
      )}
      {createModalOpen && (
        <PlanInputModal
          isOpen={true}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            refreshPlans();
            setCreateModalOpen(false);
          }}
        />
      )}
    </main>
  );
}
