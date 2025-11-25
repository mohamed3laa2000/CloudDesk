import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Database,
  HardDrive,
  Calendar,
  Trash2,
  AlertCircle,
  Loader2,
  Server,
  Clock,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LiveCostCounter } from '../components/ui/LiveCostCounter';
import { RestoreButton } from '../components/Backup/RestoreButton';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useBackupsDemo } from '../hooks/useBackupsDemo';
import type { BackupStatus } from '../data/types';

export default function BackupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { backups, deleteBackup, isDemo } = useBackupsDemo();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Find the backup from the list
  const backup = backups.find(b => b.id === id);
  const isLoading = false; // Data is already loaded from the hook
  const error = !backup && id ? 'Backup not found' : null;

  useDocumentTitle(
    backup 
      ? `${backup.name} - Backup Details`
      : 'Backup Not Found'
  );

  // Show toast helper
  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // Handle delete backup
  const handleDelete = async () => {
    if (!backup) return;
    
    setIsDeleting(true);
    
    try {
      await deleteBackup(backup.id);
      showToast('Backup deleted successfully');
      
      setTimeout(() => navigate(isDemo ? '/demo/backups' : '/backups'), 500);
    } catch (error: any) {
      console.error('Failed to delete backup:', error);
      
      const errorMessage = error?.message || 'Failed to delete backup. Please try again.';
      showToast(errorMessage);
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

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

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Calculate hours elapsed
  const getHoursElapsed = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const hoursElapsed = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    return hoursElapsed.toFixed(1);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-teal-600 dark:text-teal-400" />
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Loading backup details...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !backup) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <Card className="p-8 sm:p-12 lg:p-16 text-center">
          <AlertCircle className="mx-auto mb-4 sm:mb-6 h-12 w-12 sm:h-16 sm:w-16 text-red-500 dark:text-red-400" />
          <h3 className="mb-2 sm:mb-3 text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
            {error === 'Backup not found' ? 'Backup Not Found' : 'Failed to Load Backup'}
          </h3>
          <p className="mx-auto mb-6 sm:mb-8 max-w-md text-sm sm:text-base text-gray-600 dark:text-gray-300">
            {error || 'This backup may have been deleted or you don\'t have access.'}
          </p>
          <Link to="/backups">
            <Button variant="primary">Back to Backups</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        {/* Back button */}
        <Link 
          to="/backups"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Backups
        </Link>

        {/* Header card */}
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 sm:gap-6">
            {/* Left: Title and metadata */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{backup.name}</h1>
                <Badge variant={getStatusVariant(backup.status)}>
                  {backup.status}
                </Badge>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  <span>Backup ID: {backup.id}</span>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
              {backup.status === 'COMPLETED' && (
                <RestoreButton
                  backupId={backup.id}
                  machineImageName={backup.gcpMachineImageName}
                  defaultZone={backup.sourceInstanceZone}
                  onRestoreInitiated={(instanceId) => {
                    console.log('Restore initiated for instance:', instanceId);
                  }}
                />
              )}
              {backup.status !== 'DELETED' && backup.status !== 'CREATING' && (
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteModal(true)}
                  disabled={isDeleting}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? 'Deleting...' : 'Delete Backup'}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Error Message Banner */}
      {backup.status === 'ERROR' && backup.errorMessage && (
        <div className="mb-6">
          <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">Backup Error</p>
                <p className="text-sm text-red-700 dark:text-red-300">{backup.errorMessage}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left: Backup Details */}
        <div className="lg:col-span-2">
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Backup Details</h2>
            
            <dl className="space-y-6">
              {/* Backup Name */}
              <div className="flex items-start gap-4">
                <Database className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Backup Name</dt>
                  <dd className="text-base font-medium text-gray-900 dark:text-gray-100">{backup.name}</dd>
                </div>
              </div>

              {/* Source Instance */}
              <div className="flex items-start gap-4">
                <Server className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Source Instance</dt>
                  <dd className="text-base font-medium text-gray-900 dark:text-gray-100">
                    {backup.instanceId ? (
                      <Link 
                        to={`/instances/${backup.instanceId}`}
                        className="text-teal-600 dark:text-teal-400 hover:underline"
                      >
                        {backup.sourceInstanceName}
                      </Link>
                    ) : (
                      <span>{backup.sourceInstanceName}</span>
                    )}
                  </dd>
                  <dd className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Zone: {backup.sourceInstanceZone}
                  </dd>
                </div>
              </div>

              {/* Creation Date */}
              <div className="flex items-start gap-4">
                <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Created</dt>
                  <dd className="text-base font-medium text-gray-900 dark:text-gray-100">
                    {formatDate(backup.createdAt)}
                  </dd>
                </div>
              </div>

              {/* Storage Size */}
              <div className="flex items-start gap-4">
                <HardDrive className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Storage Size</dt>
                  <dd className="text-base font-medium text-gray-900 dark:text-gray-100">
                    {backup.storageGb !== null && backup.storageGb !== undefined
                      ? `${backup.storageGb.toFixed(2)} GiB`
                      : 'Calculating...'}
                  </dd>
                  {backup.storageBytes !== null && backup.storageBytes !== undefined && (
                    <dd className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {backup.storageBytes.toLocaleString()} bytes
                    </dd>
                  )}
                </div>
              </div>

              {/* Time Elapsed */}
              <div className="flex items-start gap-4">
                <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Time Elapsed</dt>
                  <dd className="text-base font-medium text-gray-900 dark:text-gray-100">
                    {getHoursElapsed(backup.createdAt)} hours
                  </dd>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-slate-700 pt-6" />

              {/* GCP Machine Image Name */}
              <div className="flex items-start gap-4">
                <Database className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">GCP Machine Image</dt>
                  <dd className="text-base font-mono text-gray-900 dark:text-gray-100 break-all">
                    {backup.gcpMachineImageName}
                  </dd>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</dt>
                  <dd>
                    <Badge variant={getStatusVariant(backup.status)}>
                      {backup.status}
                    </Badge>
                  </dd>
                </div>
              </div>
            </dl>
          </Card>
        </div>

        {/* Right: Cost Information */}
        <div>
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Cost Information</h2>
            
            <div className="space-y-6">
              {/* Current Accumulated Cost */}
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Current Accumulated Cost</p>
                {backup.status === 'COMPLETED' ? (
                  <LiveCostCounter
                    hourlyRate={backup.storageGb * 1.64}
                    isRunning={true}
                    startTime={new Date(backup.createdAt)}
                    className="text-3xl font-semibold"
                  />
                ) : (
                  <p className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
                    Rp {backup.currentCost.toLocaleString('id-ID', { 
                      minimumFractionDigits: 0, 
                      maximumFractionDigits: 0 
                    })}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Since creation
                </p>
              </div>

              <div className="border-t border-gray-200 dark:border-slate-700" />

              {/* Cost Breakdown */}
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Cost Breakdown</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Storage Size:</span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {backup.storageGb !== null && backup.storageGb !== undefined
                        ? `${backup.storageGb.toFixed(2)} GiB`
                        : 'Calculating...'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Time Elapsed:</span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {getHoursElapsed(backup.createdAt)} hours
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Rate:</span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      Rp 1,200/GiB/month
                    </span>
                  </div>
                </div>
              </div>

              {backup.status === 'CREATING' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-4">
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    Backup is being created. Cost calculation will begin once completed.
                  </p>
                </div>
              )}

              {backup.status === 'ERROR' && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mt-4">
                  <p className="text-sm text-red-900 dark:text-red-200">
                    Backup creation failed. No storage costs are being incurred.
                  </p>
                </div>
              )}

              {backup.status === 'DELETED' && (
                <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-3 mt-4">
                  <p className="text-sm text-gray-900 dark:text-gray-200">
                    Backup has been deleted. No further costs will be incurred.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full mx-4 p-6 sm:p-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Delete Backup
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete the backup "{backup.name}"? This action cannot be undone and will permanently remove the backup from GCP.
            </p>
            
            <div className="flex gap-3 justify-end">
              <Button 
                variant="secondary" 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Backup'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
