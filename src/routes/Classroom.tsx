import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  Settings, 
  DollarSign,
  GraduationCap,
  Code,
  BarChart,
  Box,
  ChevronDown,
  Minus,
  Plus
} from 'lucide-react';

import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function Classroom() {
  const [selectedPreset, setSelectedPreset] = useState<string>('development');
  const [studentCount] = useState(25);

  useDocumentTitle('Classroom Mode (Coming Soon)');

  const presets = [
    {
      id: 'development',
      name: 'Development',
      icon: Code,
      specs: '4 vCPU • 8 GB RAM',
    },
    {
      id: 'datascience',
      name: 'Data Science',
      icon: BarChart,
      specs: '8 vCPU • 16 GB RAM',
    },
    {
      id: 'engineering',
      name: 'Engineering',
      icon: Box,
      specs: '8 vCPU • 32 GB RAM',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-50 mb-3">Classroom Mode</h1>
        <Badge variant="info" className="mb-4">Coming Soon</Badge>
        <p className="text-base text-gray-600 dark:text-gray-100 max-w-2xl mx-auto leading-relaxed">
          Provision and manage cloud desktops for entire classes with a single click. 
          Perfect for educators who need consistent environments for all students.
        </p>
      </div>

      {/* Hero Card */}
      <Card className="p-6 sm:p-8 md:p-12 mb-6 sm:mb-8 shadow-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-8 h-8 text-indigo-600 dark:text-indigo-300" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mb-4">
            Launch Desktops for Your Entire Class
          </h2>
          <p className="text-base text-gray-600 dark:text-gray-100 max-w-xl mx-auto leading-relaxed">
            Classroom Mode allows educators to create identical cloud desktop environments 
            for all students in a course. Set up once, deploy to everyone, and manage centrally.
          </p>
        </div>

        {/* Configuration Mock Controls */}
        <div className="max-w-lg mx-auto space-y-6 mb-8">
          {/* Class Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Select Class
            </label>
            <div className="relative">
              <select 
                disabled
                className="w-full h-11 px-3 pr-10 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-500 dark:text-gray-100 cursor-not-allowed opacity-70 appearance-none"
              >
                <option>Intro to Engineering Simulation</option>
                <option>Advanced CAD & 3D Modeling</option>
                <option>Data Science Fundamentals</option>
                <option>Machine Learning Workshop</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-300 pointer-events-none" />
            </div>
          </div>

          {/* Preset Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Desktop Preset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {presets.map((preset) => {
                const Icon = preset.icon;
                const isSelected = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset.id)}
                    disabled
                    className={`
                      relative p-4 rounded-lg border-2 transition-all cursor-not-allowed opacity-70
                      ${isSelected 
                        ? 'border-indigo-300 dark:border-indigo-500 bg-indigo-25 dark:bg-indigo-900/30' 
                        : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-slate-700'
                      }
                    `}
                  >
                    <Icon className="w-6 h-6 text-gray-400 dark:text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-100 mb-1">
                      {preset.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-100">
                      {preset.specs}
                    </p>
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="w-4 h-4 text-indigo-400 dark:text-indigo-300" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Student Count */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Number of Students
            </label>
            <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-slate-700 h-11 opacity-70">
              <button
                disabled
                className="w-11 h-11 flex items-center justify-center border-r border-gray-200 dark:border-gray-600 cursor-not-allowed"
              >
                <Minus className="w-4 h-4 text-gray-400 dark:text-gray-300" />
              </button>
              <div className="flex-1 text-center">
                <span className="text-base font-medium text-gray-700 dark:text-gray-100">{studentCount}</span>
              </div>
              <button
                disabled
                className="w-11 h-11 flex items-center justify-center border-l border-gray-200 dark:border-gray-600 cursor-not-allowed"
              >
                <Plus className="w-4 h-4 text-gray-400 dark:text-gray-300" />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-100 mt-1">Maximum 50 students per class</p>
          </div>
        </div>

        {/* CTA Area */}
        <div className="text-center pt-6 border-t border-gray-200 dark:border-gray-600">
          <Button 
            disabled 
            className="mb-3 opacity-60 cursor-not-allowed"
          >
            <Users className="w-4 h-4" />
            Launch Classroom
          </Button>
          <p className="text-xs text-gray-500 dark:text-gray-100">
            This feature is currently in development. The interface shown above is a preview of planned functionality.
          </p>
        </div>
      </Card>

      {/* Benefits Section */}
      <Card className="p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-6">Why Classroom Mode?</h3>
        
        <div className="space-y-6">
          {/* Benefit 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
              </div>
            </div>
            <div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-1">
                Consistent Environments
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-100 leading-relaxed">
                Every student gets an identical desktop with the same software, configurations, 
                and resources. No more "it works on my machine" issues.
              </p>
            </div>
          </div>

          {/* Benefit 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
              </div>
            </div>
            <div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-1">
                Save Hours of Setup Time
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-100 leading-relaxed">
                Deploy desktops for an entire class in seconds instead of spending hours 
                helping students install software individually.
              </p>
            </div>
          </div>

          {/* Benefit 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <Settings className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
              </div>
            </div>
            <div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-1">
                Centralized Management
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-100 leading-relaxed">
                Monitor student progress, provide assistance, and manage resources from a 
                single dashboard. Start, stop, or reset all desktops with one click.
              </p>
            </div>
          </div>

          {/* Benefit 4 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
              </div>
            </div>
            <div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-1">
                Predictable Costs
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-100 leading-relaxed">
                Set session durations and automatically stop desktops when class ends. 
                No surprise bills from students leaving instances running.
              </p>
            </div>
          </div>

          {/* Benefit 5 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
              </div>
            </div>
            <div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-1">
                Better Student Experience
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-100 leading-relaxed">
                Students focus on learning, not troubleshooting. Access powerful computing 
                resources from any device, anywhere.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Interest CTA */}
      <Card className="p-6 sm:p-8 bg-indigo-50 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-700 text-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-3">
          Interested in Classroom Mode?
        </h3>
        <p className="text-base text-gray-600 dark:text-gray-100 mb-6 max-w-lg mx-auto">
          We're actively developing this feature. Sign up to be notified when it launches 
          and get early access.
        </p>
        <Button variant="secondary" className="border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/60">
          Get Notified When Available
        </Button>
      </Card>
    </div>
  );
}
