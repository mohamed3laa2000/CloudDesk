import { Bell, Search, HelpCircle } from 'lucide-react';

export function TopBar() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="text-gray-900 font-medium">Dashboard</span>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-gray-500 hover:text-gray-900 transition-colors">
          <Search className="w-5 h-5" />
        </button>
        <button className="p-2 text-gray-500 hover:text-gray-900 transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <button className="p-2 text-gray-500 hover:text-gray-900 transition-colors">
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
