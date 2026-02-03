import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        <h1 className="text-2xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-gray-600 mb-8">Manage your preferences.</p>
        <div className="rounded-2xl border border-modern-mint/20 bg-white p-6 space-y-4">
          <div className="flex items-center gap-3 py-3 border-b border-gray-100">
            <SettingsIcon size={20} className="text-modern-mint" />
            <span className="font-medium">Language</span>
            <span className="ml-auto text-sm text-gray-500">English</span>
          </div>
          <div className="flex items-center gap-3 py-3 border-b border-gray-100">
            <SettingsIcon size={20} className="text-modern-mint" />
            <span className="font-medium">Currency</span>
            <span className="ml-auto text-sm text-gray-500">KRW</span>
          </div>
          <div className="flex items-center gap-3 py-3">
            <SettingsIcon size={20} className="text-modern-mint" />
            <span className="font-medium">Notifications</span>
            <span className="ml-auto text-sm text-gray-500">On</span>
          </div>
        </div>
      </div>
    </main>
  );
}
