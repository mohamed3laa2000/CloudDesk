import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Monitor, Cpu, HardDrive } from 'lucide-react';

export function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back to CloudDesk EDU</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Desktops</p>
              <p className="text-3xl font-semibold text-gray-900 mt-2">3</p>
            </div>
            <Monitor className="w-8 h-8 text-indigo-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">CPU Usage</p>
              <p className="text-3xl font-semibold text-gray-900 mt-2">42%</p>
            </div>
            <Cpu className="w-8 h-8 text-indigo-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Storage Used</p>
              <p className="text-3xl font-semibold text-gray-900 mt-2">28 GB</p>
            </div>
            <HardDrive className="w-8 h-8 text-indigo-600" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Desktops</h2>
          <Button variant="ghost">View all</Button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Ubuntu 22.04 LTS</p>
              <p className="text-sm text-gray-500">Last accessed 2 hours ago</p>
            </div>
            <Button variant="primary">Connect</Button>
          </div>
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Windows 11 Pro</p>
              <p className="text-sm text-gray-500">Last accessed yesterday</p>
            </div>
            <Button variant="primary">Connect</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
