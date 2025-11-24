import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  HardDrive,
  Search,
  Database,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { LastUpdated } from '../components/ui/LastUpdated';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useBackupsDemo } from '../hooks/useBackupsDemo';
import type { BackupStatus } from '../data/types';

type StatusFilter = 'all' | 'creating' | 'completed' | 'error';

export default function BackupRoute() {
  const { backups, loading: isLoading, error } = useBackupsDemo();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useDocumentTitle('Backups');

  // Auto-refresh every 10 seconds
  useAutoRefresh(() => {
    setLastUpdated(new Date());
  }, { interval: 10000 });

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setLastUpdated(new Date());
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Filter backups based on search and status
  const filteredBackups = useMemo(() => {
    if (!backups || !Array.isArray(backups)) return [];
    return backups.filter((backup) => {
      const matchesSearch = backup.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
        backup.sourceInstanceName
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      
      const matchesStatus =
        statusFilter === 'all' ||
        backup.status.toLowerCase() === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [backups, searchQuery, statusFilter]);

  // Calculate summary metrics
  const totalBackups = (backups || []).filter(b => b.status !== 'DELETED').length;
  const completedBackups = (backups || []).filter(b => b.status === 'COMPLETED').length;
  const totalStorageGb = (backups || [])
    .filter(b => b.status === 'COMPLETED')
    .reduce((sum, b) => sum + b.storageGb, 0);
  const totalCost = (backups || [])
    .filter(b => b.status !== 'DELETED')
    .reduce((sum, b) => sum + b.currentCost, 0);

  const getStatusVariant = (
    status: BackupStatus
  ): 'success' | 'neutral' | 'info' | 'error' => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'CREATING':
        return 'info';
      case 'ERROR':
        return 'error';
      case 'DELETED':
        return 'neutral';
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-teal-600 dark:text-teal-400" />
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Loading backups...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 dark:text-red-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Failed to Load Backups
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <Button variant="primary" onClick={handleManualRefresh}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="mb-1 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Backups
        </h1>
        <p className="max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Manage your instance backups and monitor storage costs
        </p>
      </div>

      {/* Summary Metrics Row */}
      <div className="mb-6 sm:mb-8 grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Backups */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <Database className="mb-3 h-5 w-5 sm:h-6 sm:w-6 text-teal-600 dark:text-teal-400" />
              <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Backups
              </p>
              <p className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100">
                {totalBackups}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {completedBackups} completed
              </p>
            </div>
          </div>
        </Card>

        {/* Total Storage */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <HardDrive className="mb-3 h-5 w-5 sm:h-6 sm:w-6 text-teal-600 dark:text-teal-400" />
              <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Storage
              </p>
              <p className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100">
                {totalStorageGb.toFixed(1)} GiB
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                across all backups
              </p>
            </div>
          </div>
        </Card>

        {/* Total Cost */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <Database className="mb-3 h-5 w-5 sm:h-6 sm:w-6 text-teal-600 dark:text-teal-400" />
              <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Cost
              </p>
              <p className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100">
                Rp {totalCost.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                accumulated storage cost
              </p>
            </div>
          </div>
        </Card>

        {/* Average Size */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <HardDrive className="mb-3 h-5 w-5 sm:h-6 sm:w-6 text-teal-600 dark:text-teal-400" />
              <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                Average Size
              </p>
              <p className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100">
                {completedBackups > 0 
                  ? (totalStorageGb / completedBackups).toFixed(1) 
                  : '0.0'} GiB
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                per backup
              </p>
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
            placeholder="Search backups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center overflow-x-auto">
          <div className="inline-flex rounded-lg bg-gray-100 dark:bg-slate-700 p-1 whitespace-nowrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`rounded-md px-2.5 sm:px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`rounded-md px-2.5 sm:px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setStatusFilter('creating')}
              className={`rounded-md px-2.5 sm:px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === 'creating'
                  ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Creating
            </button>
            <button
              onClick={() => setStatusFilter('error')}
              className={`rounded-md px-2.5 sm:px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === 'error'
                  ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Error
            </button>
          </div>
        </div>
      </div>

      {/* Backup List - Card Layout */}
      {filteredBackups.length === 0 ? (
        /* Empty State */
        <Card className="p-8 sm:p-12 lg:p-16 text-center">
          <Database className="mx-auto mb-4 sm:mb-6 h-12 w-12 sm:h-16 sm:w-16 text-gray-300 dark:text-gray-600" />
          <h3 className="mb-2 sm:mb-3 text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
            {backups.length === 0 
              ? 'No backups yet'
              : 'No backups found'}
          </h3>
          <p className="mx-auto mb-6 sm:mb-8 max-w-md text-sm sm:text-base text-gray-600 dark:text-gray-300">
            {backups.length === 0
              ? 'Create your first backup from an instance detail page to preserve your VM state.'
              : 'No backups match your current filters. Try adjusting your search or filter criteria.'}
          </p>
          {backups.length > 0 && (
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
        /* Backup Cards */
        <div className="space-y-3">
          {filteredBackups.map((backup) => (
            <Link key={backup.id} to={`/backups/${backup.id}`}>
              <Card className="p-4 sm:p-5 hover:border-gray-300 dark:hover:border-slate-600 hover:shadow-md transition-all cursor-pointer">
                <div>
                  {/* Name and Status */}
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {backup.name}
                    </h3>
                    <Badge variant={getStatusVariant(backup.status)}>
                      {backup.status}
                    </Badge>
                  </div>
                  
                  {/* Source Instance and Details */}
                  <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                    <span className="flex items-center gap-1">
                      <HardDrive className="h-3.5 w-3.5" />
                      {backup.sourceInstanceName}
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span>
                      {backup.storageGb !== null && backup.storageGb !== undefined 
                        ? `${backup.storageGb.toFixed(2)} GiB` 
                        : 'Calculating...'}
                    </span>
                    <span>•</span>
                    <span>
                      Rp {(backup.currentCost || 0).toLocaleString('id-ID', { 
                        minimumFractionDigits: 0, 
                        maximumFractionDigits: 0 
                      })}
                    </span>
                  </div>
                  
                  {/* Created At */}
                  <div className="mt-2 flex items-center gap-3 sm:gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>Created {getRelativeTime(backup.createdAt)}</span>
                  </div>
                  
                  {/* Error Message */}
                  {backup.status === 'ERROR' && backup.errorMessage && (
                    <div className="mt-3 flex items-start gap-2 p-2 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700 dark:text-red-300">
                        {backup.errorMessage}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Results Info */}
      {filteredBackups.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredBackups.length} of {backups.filter(b => b.status !== 'DELETED').length} backups
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
