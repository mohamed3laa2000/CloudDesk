import { Home, Monitor, Grid, FolderOpen, Settings, User } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', icon: Home, href: '#' },
  { name: 'Desktops', icon: Monitor, href: '#' },
  { name: 'Apps', icon: Grid, href: '#' },
  { name: 'Files', icon: FolderOpen, href: '#' },
  { name: 'Settings', icon: Settings, href: '#' },
];

export function Sidebar() {
  return (
    <aside className="w-60 bg-gray-50 border-r border-gray-200 flex flex-col h-screen">
      <div className="p-6">
        <h1 className="text-xl font-semibold text-gray-900">CloudDesk EDU</h1>
      </div>
      
      <nav className="flex-1 px-3">
        {navigation.map((item) => (
          <a
            key={item.name}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-900 rounded-lg hover:bg-white transition-colors"
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </a>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-200">
        <button className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium text-gray-900 rounded-lg hover:bg-white transition-colors">
          <User className="w-5 h-5" />
          <span>Profile</span>
        </button>
      </div>
    </aside>
  );
}
