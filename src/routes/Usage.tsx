import { useState, useEffect } from 'react';
import { useInstancesDemo } from '../hooks/useInstancesDemo';
import { buildUsage, calculateUsageSummary } from '../data/usage';
import { REGION_NAMES, type UsageSummary, type UsageRow } from '../data/types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Monitor, DollarSign, Activity, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function Usage() {
  const { instances, isDemo } = useInstancesDemo();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiUsageData, setApiUsageData] = useState<{
    summary: UsageSummary;
    usageRows: UsageRow[];
  } | null>(null);

  // Fetch usage data from API for authenticated users
  useEffect(() => {
    const fetchUsageData = async () => {
      if (!isAuthenticated || isDemo) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await apiService.getUsageSummary();
        setApiUsageData({
          summary: {
            totalHours: data.totalHours,
            totalCost: data.totalCost,
            totalComputeCost: data.totalComputeCost,
            totalStorageCost: data.totalStorageCost,
            averageCostPerDesktop: data.averageCostPerDesktop,
            activeDesktops: data.activeDesktops,
          },
          usageRows: data.usageByInstance,
        });
      } catch (err: any) {
        console.error('Error fetching usage data:', err);
        setError(err.message || 'Failed to load usage data');
      } finally {
        setLoading(false);
      }
    };

    fetchUsageData();
  }, [isAuthenticated, isDemo]);

  // Use API data for authenticated users, localStorage data for demo mode
  const usageRows = isAuthenticated && !isDemo && apiUsageData 
    ? apiUsageData.usageRows 
    : buildUsage(instances);
  
  const summary = isAuthenticated && !isDemo && apiUsageData
    ? apiUsageData.summary
    : calculateUsageSummary(usageRows);

  // Dynamic document title
  useDocumentTitle(`Usage (Rp ${summary.totalCost.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })})`);

  // Sort by cost descending for display
  const sortedUsage = [...usageRows].sort((a, b) => b.estimatedCost - a.estimatedCost);

  // Show loading state for authenticated users
  if (loading && isAuthenticated && !isDemo) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="w-12 h-12 text-indigo-600 mx-auto mb-3 animate-pulse" />
            <p className="text-sm text-gray-600">Loading usage data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && isAuthenticated && !isDemo) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state only for authenticated users who have never created instances
  // If usageRows.length > 0, show billing history even if all instances are deleted
  const hasNeverCreatedInstances = usageRows.length === 0;
  if (hasNeverCreatedInstances && isAuthenticated && !isDemo) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mb-2">Usage & Cost</h1>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Track your cloud desktop usage and estimated costs. All charges are based on actual runtime.
          </p>
        </div>

        {/* Empty State */}
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-indigo-600 dark:text-indigo-300" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2">No Usage Data Yet</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              You haven't created any cloud desktops yet. Create your first desktop to start tracking usage and costs.
            </p>
            <a
              href="/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create Your First Desktop
            </a>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mb-2">Usage & Cost</h1>
        <p className="text-sm text-gray-500 dark:text-gray-300">
          Track your cloud desktop usage and estimated costs. All charges are based on actual runtime.
        </p>
      </div>

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Total Hours */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center">
              <Activity className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-1">Total Hours Used</p>
          <p className="text-3xl font-semibold text-gray-900 dark:text-gray-50 mb-1">
            {summary.totalHours.toFixed(1)}
            <span className="text-lg font-normal text-gray-500 dark:text-gray-300 ml-1">hours</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Last 30 days</p>
        </Card>

        {/* Total Cost */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-1">Total Estimated Cost</p>
          <p className="text-3xl font-semibold text-gray-900 dark:text-gray-50 mb-1">
            Rp {summary.totalCost.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Based on current usage</p>
        </Card>

        {/* Active Desktops */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center">
              <Monitor className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-1">Active Desktops</p>
          <p className="text-3xl font-semibold text-gray-900 dark:text-gray-50 mb-1">
            {summary.activeDesktops}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Avg Rp {summary.averageCostPerDesktop.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} per desktop
          </p>
        </Card>
      </div>

      {/* Usage Chart Area */}
      <Card className="p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-6">Usage by Instance</h2>
        
        {/* Simple bar chart visualization */}
        <div className="space-y-4">
          {sortedUsage.filter(row => row.hours > 0).map((row) => {
            const maxHours = Math.max(...usageRows.map(r => r.hours));
            const widthPercent = maxHours > 0 ? (row.hours / maxHours) * 100 : 0;
            
            return (
              <div key={row.instanceId} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-medium text-gray-900 dark:text-gray-50 truncate">
                      {row.instanceName}
                    </span>
                    <Badge 
                      variant={
                        row.status === 'RUNNING' ? 'success' : 
                        row.status === 'STOPPED' ? 'neutral' : 
                        row.status === 'DELETED' ? 'error' :
                        'info'
                      }
                    >
                      {row.status === 'RUNNING' ? 'Running' : 
                       row.status === 'STOPPED' ? 'Stopped' : 
                       row.status === 'DELETED' ? 'Deleted' :
                       'Provisioning'}
                    </Badge>
                  </div>
                  <span className="text-gray-600 dark:text-gray-300 ml-4 whitespace-nowrap">
                    {row.hours.toFixed(1)} hrs
                  </span>
                </div>
                <div className="relative h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-indigo-600 dark:bg-indigo-500 rounded-lg transition-all duration-300"
                    style={{ width: `${widthPercent}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-end px-3">
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-50">
                      Rp {row.estimatedCost.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          
          {sortedUsage.filter(row => row.hours > 0).length === 0 && (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-300">No usage data for this period</p>
            </div>
          )}
        </div>
      </Card>

      {/* Detailed Breakdown Table */}
      <Card className="overflow-hidden">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-gray-600">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Cost by Desktop</h2>
        </div>
        
        {/* Desktop: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-50">
                  Desktop Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-50">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900 dark:text-gray-50">
                  Hours Used
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900 dark:text-gray-50">
                  Compute Cost
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900 dark:text-gray-50">
                  Storage Cost
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900 dark:text-gray-50">
                  Total Cost
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedUsage.map((row) => {
                const instance = instances.find(i => i.id === row.instanceId);
                return (
                  <tr key={row.instanceId} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                          {row.instanceName}
                        </span>
                        {instance && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {REGION_NAMES[instance.region]}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant={
                          row.status === 'RUNNING' ? 'success' : 
                          row.status === 'STOPPED' ? 'neutral' : 
                          row.status === 'DELETED' ? 'error' :
                          'info'
                        }
                      >
                        {row.status === 'RUNNING' ? 'Running' : 
                         row.status === 'STOPPED' ? 'Stopped' : 
                         row.status === 'DELETED' ? 'Deleted' :
                         'Provisioning'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900 dark:text-gray-50">
                      {row.hours.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600 dark:text-gray-300">
                      Rp {row.computeCost.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600 dark:text-gray-300">
                      Rp {row.storageCost.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-50">
                      Rp {row.estimatedCost.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 dark:bg-slate-800 border-t-2 border-gray-300 dark:border-gray-600">
              <tr>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-50">
                  Total
                </td>
                <td className="px-6 py-4"></td>
                <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-50">
                  {summary.totalHours.toFixed(1)}
                </td>
                <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-50">
                  Rp {summary.totalComputeCost.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </td>
                <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-50">
                  Rp {summary.totalStorageCost.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </td>
                <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-50">
                  Rp {summary.totalCost.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        {/* Mobile: Cards */}
        <div className="md:hidden p-4 space-y-3">
          {sortedUsage.map((row) => {
            const instance = instances.find(i => i.id === row.instanceId);
            return (
              <div key={row.instanceId} className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-gray-50 truncate">{row.instanceName}</h3>
                    {instance && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{REGION_NAMES[instance.region]}</p>
                    )}
                  </div>
                  <Badge 
                    variant={
                      row.status === 'RUNNING' ? 'success' : 
                      row.status === 'STOPPED' ? 'neutral' : 
                      row.status === 'DELETED' ? 'error' :
                      'info'
                    }
                  >
                    {row.status === 'RUNNING' ? 'Running' : 
                     row.status === 'STOPPED' ? 'Stopped' : 
                     row.status === 'DELETED' ? 'Deleted' :
                     'Provisioning'}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-300">Hours Used:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-50">{row.hours.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-300">Compute Cost:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-50">Rp {row.computeCost.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-300">Storage Cost:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-50">Rp {row.storageCost.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                    <span className="text-gray-500 dark:text-gray-300 font-medium">Total Cost:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-50">Rp {row.estimatedCost.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Total Summary */}
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg border-2 border-indigo-200 dark:border-indigo-700">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-200 font-medium">Total Hours:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-50">{summary.totalHours.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-200 font-medium">Total Compute Cost:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-50">Rp {summary.totalComputeCost.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-200 font-medium">Total Storage Cost:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-50">Rp {summary.totalStorageCost.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-indigo-300 dark:border-indigo-600">
                <span className="text-gray-900 dark:text-gray-50 font-semibold">Total Cost:</span>
                <span className="font-bold text-gray-900 dark:text-gray-50 text-base">Rp {summary.totalCost.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
