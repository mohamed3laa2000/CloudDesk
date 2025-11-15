import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Monitor,
  Activity,
  DollarSign,
  Search,
  Plus,
  Play,
  Pause,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { LiveIndicator } from '../components/ui/LiveIndicator';
import { LastUpdated } from '../components/ui/LastUpdated';
import { useInstancesDemo } from '../hooks/useInstancesDemo';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { getPresetName } from '../data/images';
import { REGION_NAMES } from '../data/types';
import type { InstanceStatus } from '../data/types';

type StatusFilter = 'all' | 'running' | 'stopped' | 'provisioning';

export default function Dashboard() {
  const { instances, updateStatus, deleteInstance } = useInstancesDemo();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh every 10 seconds
  useAutoRefresh(() => {
    setLastUpdated(new Date());
  }, { interval: 10000 });

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setLastUpdated(new Date());
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Filter instances based on search and status
  const filteredInstances = useMemo(() => {
    return instances.filter((instance) => {
      const matchesSearch = instance.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ||
        instance.status.toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [instances, searchQuery, statusFilter]);

  // Calculate summary metrics
  const totalInstances = instances.length;
  const runningInstances = instances.filter((i) => i.status === 'RUNNING').length;
  const stoppedInstances = instances.filter((i) => i.status === 'STOPPED').length;

  // Simplified cost calculation (based on running instances)
  const estimatedMonthlyCost = runningInstances * 42.5; // Rough estimate per instance

  const handleStatusUpdate = async (
    e: React.MouseEvent,
    id: string,
    newStatus: InstanceStatus
  ) => {
    e.stopPropagation();
    
    // Optimistic update - instant UI feedback
    updateStatus(id, newStatus);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Refresh timestamp after update
    setLastUpdated(new Date());
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this instance?')) {
      deleteInstance(id);
    }
  };

  const getStatusVariant = (
    status: InstanceStatus
  ): 'success' | 'neutral' | 'info' | 'error' => {
    switch (status) {
      case 'RUNNING':
        return 'success';
      case 'STOPPED':
        return 'neutral';
      case 'PROVISIONING':
        return 'info';
      case 'ERROR':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 sm:mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="mb-1 text-xl sm:text-2xl font-semibold text-gray-900">
            Instances
          </h1>
          <p className="max-w-2xl text-sm text-gray-500">
            Manage your cloud desktop instances and monitor resource usage
          </p>
        </div>
        <div className="mt-4 lg:mt-0">
          <Link to="/create">
            <Button variant="primary" className="w-full lg:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create Instance
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Metrics Row */}
      <div className="mb-6 sm:mb-8 grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Instances */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <Monitor className="mb-3 h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
              <p className="mb-2 text-sm font-medium text-gray-500">
                Total Desktops
              </p>
              <p className="text-2xl sm:text-3xl font-semibold text-gray-900">
                {totalInstances}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {runningInstances} active
              </p>
            </div>
          </div>
        </Card>

        {/* Running Instances */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <Activity className="mb-3 h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
              <p className="mb-2 text-sm font-medium text-gray-500">
                Running Now
              </p>
              <p className="text-2xl sm:text-3xl font-semibold text-gray-900">
                {runningInstances}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {stoppedInstances} stopped
              </p>
            </div>
          </div>
        </Card>

        {/* Estimated Monthly Cost */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <DollarSign className="mb-3 h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
              <p className="mb-2 text-sm font-medium text-gray-500">
                Est. Monthly Cost
              </p>
              <p className="text-2xl sm:text-3xl font-semibold text-gray-900">
                ${estimatedMonthlyCost.toFixed(2)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Based on current usage
              </p>
            </div>
          </div>
        </Card>

        {/* Storage Used */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <Monitor className="mb-3 h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
              <p className="mb-2 text-sm font-medium text-gray-500">
                Storage Used
              </p>
              <p className="text-2xl sm:text-3xl font-semibold text-gray-900">
                {instances.reduce((total, instance) => total + instance.storageGb, 0)}{' '}
                GB
              </p>
              <p className="mt-1 text-xs text-gray-500">across all instances</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-md sm:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            type="text"
            placeholder="Search desktops..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center overflow-x-auto">
          <div className="inline-flex rounded-lg bg-gray-100 p-1 whitespace-nowrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`rounded-md px-2.5 sm:px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('running')}
              className={`rounded-md px-2.5 sm:px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === 'running'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              Running
            </button>
            <button
              onClick={() => setStatusFilter('stopped')}
              className={`rounded-md px-2.5 sm:px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === 'stopped'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              Stopped
            </button>
            <button
              onClick={() => setStatusFilter('provisioning')}
              className={`rounded-md px-2.5 sm:px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === 'provisioning'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              Provisioning
            </button>
          </div>
        </div>
      </div>

      {/* Instance List - Card Layout */}
      {filteredInstances.length === 0 ? (
        /* Empty State */
        <Card className="p-8 sm:p-12 lg:p-16 text-center">
          <Monitor className="mx-auto mb-4 sm:mb-6 h-12 w-12 sm:h-16 sm:w-16 text-gray-300" />
          <h3 className="mb-2 sm:mb-3 text-base sm:text-lg font-semibold text-gray-900">
            {instances.length === 0 ? 'No desktops yet' : 'No desktops found'}
          </h3>
          <p className="mx-auto mb-6 sm:mb-8 max-w-md text-sm sm:text-base text-gray-600">
            {instances.length === 0
              ? 'Create your first cloud desktop to get started. Choose from pre-configured templates or customize your own.'
              : 'No desktops match your current filters. Try adjusting your search or filter criteria.'}
          </p>
          {instances.length === 0 ? (
            <Link to="/create">
              <Button variant="primary" size="lg" className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Desktop
              </Button>
            </Link>
          ) : (
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
            >
              Clear Filters
            </Button>
          )}
        </Card>
      ) : (
        /* Instance Cards */
        <div className="space-y-3">
          {filteredInstances.map((instance) => (
            <Link key={instance.id} to={`/instances/${instance.id}`}>
              <Card className="p-4 sm:p-5 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                  {/* Left: Name, Status, Resources */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <LiveIndicator 
                        status={instance.status.toLowerCase() as any}
                        size="sm"
                      />
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                        {instance.name}
                      </h3>
                      <Badge variant={getStatusVariant(instance.status)}>
                        {instance.status}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Monitor className="h-3.5 w-3.5" />
                        {getPresetName(instance.imageId)}
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span>{instance.cpuCores} vCPU</span>
                      <span>•</span>
                      <span>{instance.ramGb} GB RAM</span>
                      <span>•</span>
                      <span>{instance.storageGb} GB</span>
                    </div>
                    
                    <div className="mt-2 flex items-center gap-3 sm:gap-4 text-xs text-gray-500">
                      <span>{REGION_NAMES[instance.region]}</span>
                      <span>•</span>
                      <span>{getRelativeTime(instance.createdAt)}</span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    {/* Connect Button (only for running instances) */}
                    {instance.status === 'RUNNING' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Connect
                      </Button>
                    )}
                    
                    {/* Start/Stop Button */}
                    {instance.status === 'STOPPED' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          handleStatusUpdate(e, instance.id, 'RUNNING');
                        }}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Start
                      </Button>
                    )}
                    {instance.status === 'RUNNING' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          handleStatusUpdate(e, instance.id, 'STOPPED');
                        }}
                      >
                        <Pause className="mr-2 h-4 w-4" />
                        Stop
                      </Button>
                    )}
                    
                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        handleDelete(e, instance.id);
                      }}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Results Info */}
      {filteredInstances.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {filteredInstances.length} of {instances.length} desktops
          </div>
          <LastUpdated 
            timestamp={lastUpdated} 
            onRefresh={handleManualRefresh}
            isRefreshing={isRefreshing}
          />
        </div>
      )}
    </div>
  );
}
