import { Bookmark } from "lucide-react";

export default function SavedPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        <h1 className="text-2xl font-bold text-foreground mb-2">Saved</h1>
        <p className="text-gray-600 mb-8">
          Places and tips you&apos;ve saved for later.
        </p>
        <div className="rounded-2xl border-2 border-dashed border-soft-coral/30 bg-soft-coral/5 p-12 text-center">
          <Bookmark size={48} className="mx-auto text-soft-coral/50 mb-4" />
          <p className="text-gray-600">No saved items yet</p>
        </div>
      </div>
    </main>
  );
}
