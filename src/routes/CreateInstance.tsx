import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Monitor, Code, BarChart, Box } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { useInstancesDemo } from '../hooks/useInstancesDemo';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useDemo } from '../contexts/DemoContext';
import { IMAGE_PRESETS } from '../data/images';
import { calculateHourlyCost, calculateMonthlyCost } from '../data/pricing';
import type { Region, GpuType } from '../data/types';

const PRESET_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'general-purpose': Monitor,
  'dev-engineering': Code,
  'data-science-ml': BarChart,
  '3d-rendering-cad': Box,
  'windows-general': Monitor,
};

const REGIONS: { value: Region; label: string }[] = [
  { value: 'SINGAPORE', label: 'Singapore' },
  { value: 'IOWA', label: 'Iowa (US)' },
];

const GPU_OPTIONS: { value: GpuType; label: string; description: string; priceImpact: string }[] = [
  { value: 'NONE', label: 'None', description: 'No GPU (most workloads)', priceImpact: 'Rp 0/hr' },
  { value: 'T4', label: 'NVIDIA T4', description: 'Entry - ML inference, light training', priceImpact: '+Rp 5.810/hr' },
  { value: 'A10', label: 'NVIDIA A10', description: 'Professional - Graphics, AI inference', priceImpact: '+Rp 29.880/hr' },
  { value: 'V100', label: 'NVIDIA V100', description: 'Professional - Deep learning, HPC', priceImpact: '+Rp 41.168/hr' },
  { value: 'RTX_4090', label: 'NVIDIA RTX 4090', description: 'Workstation - 3D rendering, game dev', priceImpact: '+Rp 46.480/hr' },
  { value: 'RTX_A6000', label: 'NVIDIA RTX A6000', description: 'Workstation - Professional CAD', priceImpact: '+Rp 53.120/hr' },
  { value: 'A100', label: 'NVIDIA A100', description: 'Enterprise - Large-scale AI training', priceImpact: '+Rp 60.922/hr' },
  { value: 'H100', label: 'NVIDIA H100', description: 'Enterprise - Generative AI, LLMs', priceImpact: '+Rp 132.800/hr' },
];

export default function CreateInstance() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { createInstance, isDemo } = useInstancesDemo();
  
  // Get demo context if available (for demo routes)
  let isDemoMode = isDemo;
  try {
    const demoContext = useDemo();
    isDemoMode = demoContext.isDemo;
  } catch {
    // Not in demo context, use isDemo from hook
  }

  // Form state
  const [selectedPresetId, setSelectedPresetId] = useState<string>('dev-engineering');
  const [instanceName, setInstanceName] = useState('');
  const [region, setRegion] = useState<Region>('SINGAPORE');
  const [cpuCores, setCpuCores] = useState(4);
  const [ramGb, setRamGb] = useState(8);
  const [storageGb, setStorageGb] = useState(50);
  const [gpu, setGpu] = useState<GpuType>('NONE');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load preset from URL parameters
  useEffect(() => {
    const presetParam = searchParams.get('preset');
    if (presetParam) {
      // Map preset names from use cases to actual preset IDs
      const presetMapping: Record<string, { id: string; cpu: number; ram: number; storage: number; gpu: GpuType }> = {
        'development': { id: 'dev-engineering', cpu: 4, ram: 8, storage: 50, gpu: 'NONE' },
        'engineering': { id: '3d-rendering-cad', cpu: 8, ram: 32, storage: 100, gpu: 'T4' },
        'data-science': { id: 'data-science-ml', cpu: 8, ram: 64, storage: 200, gpu: 'A100' },
      };

      const presetConfig = presetMapping[presetParam];
      if (presetConfig) {
        setSelectedPresetId(presetConfig.id);
        setCpuCores(presetConfig.cpu);
        setRamGb(presetConfig.ram);
        setStorageGb(presetConfig.storage);
        setGpu(presetConfig.gpu);
      }
    }
  }, [searchParams]);

  // Handle preset selection
  const handlePresetSelect = (presetId: string) => {
    const preset = IMAGE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setSelectedPresetId(presetId);
    
    // Check if this is a Windows preset
    const isWindows = preset.osName.toLowerCase().includes('windows');
    
    // Pre-fill form with preset recommendations if fields are at default values
    if (cpuCores === 4 || cpuCores === 2) {
      setCpuCores(preset.recommendedCpu);
    }
    if (ramGb === 8 || ramGb === 4) {
      setRamGb(preset.recommendedRamGb);
    }
    if (storageGb === 50 || storageGb === 30) {
      setStorageGb(preset.recommendedStorageGb);
    }
    
    // Ensure Windows presets meet minimum storage requirement
    if (isWindows && storageGb < 50) {
      setStorageGb(Math.max(50, preset.recommendedStorageGb));
    }
    
    if (gpu === 'NONE' && preset.supportsGpu) {
      setGpu('T4');
    }
  };

  // Calculate costs
  const { hourlyCost, monthlyCost } = useMemo(() => {
    const mockInstance = {
      id: 'temp',
      name: 'temp',
      imageId: selectedPresetId,
      status: 'STOPPED' as const,
      cpuCores,
      ramGb,
      storageGb,
      gpu,
      region,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      hourlyCost: calculateHourlyCost(mockInstance),
      monthlyCost: calculateMonthlyCost(mockInstance),
    };
  }, [selectedPresetId, cpuCores, ramGb, storageGb, gpu, region]);

  // Check if selected preset is Windows-based
  const isWindowsPreset = useMemo(() => {
    const preset = IMAGE_PRESETS.find((p) => p.id === selectedPresetId);
    return preset?.osName.toLowerCase().includes('windows') || false;
  }, [selectedPresetId]);

  // Minimum storage requirement for Windows
  const minStorageGb = isWindowsPreset ? 50 : 20;

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!instanceName.trim()) {
      newErrors.instanceName = 'Instance name is required';
    } else if (instanceName.length < 3) {
      newErrors.instanceName = 'Instance name must be at least 3 characters';
    } else if (instanceName.length > 50) {
      newErrors.instanceName = 'Instance name must be less than 50 characters';
    }

    if (cpuCores < 1 || cpuCores > 16) {
      newErrors.cpuCores = 'CPU cores must be between 1 and 16';
    }

    if (ramGb < 2 || ramGb > 64) {
      newErrors.ramGb = 'RAM must be between 2 and 64 GB';
    }

    // Windows-specific storage validation
    if (storageGb < minStorageGb || storageGb > 500) {
      if (isWindowsPreset) {
        newErrors.storageGb = `Windows instances require at least ${minStorageGb} GB storage`;
      } else {
        newErrors.storageGb = 'Storage must be between 20 and 500 GB';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({}); // Clear previous errors

    try {
      await createInstance({
        name: instanceName.trim(),
        imageId: selectedPresetId,
        cpuCores,
        ramGb,
        storageGb,
        gpu,
        region,
      });

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Failed to create instance:', error);
      
      // Use the error message from the API service (which handles GCP errors)
      const errorMessage = error?.message || 'Failed to create instance. Please try again.';
      setErrors({ submit: errorMessage });
      
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPreset = IMAGE_PRESETS.find((p) => p.id === selectedPresetId);

  // Dynamic document title
  const documentTitle = useMemo(() => {
    if (isSubmitting) {
      return 'Creating Instance...';
    }
    if (instanceName) {
      return `Create "${instanceName}"`;
    }
    return 'Create Instance';
  }, [isSubmitting, instanceName]);

  useDocumentTitle(documentTitle);

  return (
    <div>
      {/* Page Header */}
      <div className="mb-4 sm:mb-6">
        <div className="mb-2 text-xs sm:text-sm text-gray-600 dark:text-gray-100">
          <Link to="/dashboard" className="hover:text-gray-900 dark:hover:text-gray-50">
            Dashboard
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 dark:text-gray-50">Create Desktop</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-50">Create New Desktop</h1>
        
        {/* Demo Mode Reminder */}
        {isDemoMode && (
          <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700 rounded-lg">
            <p className="text-xs text-amber-900 dark:text-amber-100">
              <span className="font-semibold">Demo Mode:</span> This instance will be stored in your browser only. 
              Your data won't be persisted to a database. <Link to="/onboarding" className="underline hover:text-amber-900 dark:hover:text-amber-50">Sign up</Link> to save your work.
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Error Alert - Show at top if submission fails */}
        {errors.submit && (
          <ErrorAlert
            title="Failed to Create Instance"
            message={errors.submit}
            onDismiss={() => setErrors({})}
            className="mb-4 sm:mb-6"
          />
        )}
        
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Left Column - Configuration Form */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Preset Selection - Compact */}
            <Card className="p-4 sm:p-6">
              <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-50">1. Choose Preset</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {IMAGE_PRESETS.map((preset) => {
                  const Icon = PRESET_ICONS[preset.id] || Monitor;
                  const isSelected = selectedPresetId === preset.id;

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePresetSelect(preset.id)}
                      className={`text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 dark:border-indigo-400'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-300 flex-shrink-0" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">{preset.name}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-100 line-clamp-2">{preset.description}</p>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Basic Configuration */}
            <Card className="p-4 sm:p-6">
              <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-50">2. Basic Configuration</h2>
              <div className="space-y-4">
                {/* Instance Name */}
                <div>
                  <label htmlFor="instanceName" className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-gray-100">
                    Desktop Name *
                  </label>
                  <Input
                    id="instanceName"
                    type="text"
                    placeholder="e.g., My Development Desktop"
                    value={instanceName}
                    onChange={(e) => setInstanceName(e.target.value)}
                    className={errors.instanceName ? 'border-red-500' : ''}
                  />
                  {errors.instanceName && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-300">{errors.instanceName}</p>
                  )}
                </div>

                {/* Region */}
                <div>
                  <label htmlFor="region" className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-gray-100">
                    Region *
                  </label>
                  <Select
                    id="region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value as Region)}
                  >
                    {REGIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </Card>

            {/* Resources */}
            <Card className="p-4 sm:p-6">
              <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-50">3. Resources</h2>
              <div className="space-y-5">

                {/* CPU Cores */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="cpuCores" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      CPU Cores
                    </label>
                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-200">
                      {cpuCores} vCPU
                    </span>
                  </div>
                  <input
                    id="cpuCores"
                    type="range"
                    min="1"
                    max="16"
                    step="1"
                    value={cpuCores}
                    onChange={(e) => setCpuCores(parseInt(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 dark:bg-gray-600 accent-indigo-600 dark:accent-indigo-400"
                  />
                  <div className="mt-1.5 flex justify-between text-xs text-gray-500 dark:text-gray-100">
                    <span>1</span>
                    <span>8</span>
                    <span>16</span>
                  </div>
                </div>

                {/* RAM */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="ramGb" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      RAM
                    </label>
                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-200">
                      {ramGb} GB
                    </span>
                  </div>
                  <input
                    id="ramGb"
                    type="range"
                    min="2"
                    max="64"
                    step="2"
                    value={ramGb}
                    onChange={(e) => setRamGb(parseInt(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 dark:bg-gray-600 accent-indigo-600 dark:accent-indigo-400"
                  />
                  <div className="mt-1.5 flex justify-between text-xs text-gray-500 dark:text-gray-100">
                    <span>2</span>
                    <span>32</span>
                    <span>64</span>
                  </div>
                </div>

                {/* Storage */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="storageGb" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Storage
                    </label>
                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-200">
                      {storageGb} GB
                    </span>
                  </div>
                  <input
                    id="storageGb"
                    type="range"
                    min={minStorageGb}
                    max="500"
                    step="10"
                    value={storageGb}
                    onChange={(e) => setStorageGb(parseInt(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 dark:bg-gray-600 accent-indigo-600 dark:accent-indigo-400"
                  />
                  <div className="mt-1.5 flex justify-between text-xs text-gray-500 dark:text-gray-100">
                    <span>{minStorageGb}</span>
                    <span>250</span>
                    <span>500</span>
                  </div>
                  {isWindowsPreset && (
                    <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-200">
                      Windows requires minimum {minStorageGb} GB storage
                    </p>
                  )}
                  {errors.storageGb && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-300">{errors.storageGb}</p>
                  )}
                </div>
              </div>
            </Card>

            {/* GPU Selection - Compact */}
            <Card className="p-4 sm:p-6">
              <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-50">4. GPU (Optional)</h2>
              <div className="space-y-2">

                <Select
                  value={gpu}
                  onChange={(e) => setGpu(e.target.value as GpuType)}
                >
                  {GPU_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.priceImpact}
                    </option>
                  ))}
                </Select>
                <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-100">
                  Required for ML, 3D rendering, and graphics workloads
                </p>
              </div>
            </Card>
          </div>

          {/* Right Column - Summary (Sticky on desktop) */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6 space-y-4">
              {/* Configuration Summary */}
              <Card className="p-4 sm:p-6">
                <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-50">Configuration Summary</h3>
                
                {/* Preset */}
                <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-100 mb-1">Preset</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{selectedPreset?.name}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-100 mt-0.5">{selectedPreset?.osName}</p>
                  
                  {/* Windows-specific information */}
                  {isWindowsPreset && (
                    <div className="mt-3 p-2.5 bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 rounded-lg">
                      <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">Windows Server</p>
                      <p className="text-xs text-blue-800 dark:text-blue-100">
                        Provisioning time: 5-10 minutes
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-100 mt-1">
                        Includes Windows Server 2025 with remote desktop access
                      </p>
                    </div>
                  )}
                </div>

                {/* Name & Region */}
                <div className="space-y-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-600">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-100 mb-0.5">Name</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                      {instanceName || <span className="text-gray-500 dark:text-gray-200">Not set</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-100 mb-0.5">Region</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                      {REGIONS.find(r => r.value === region)?.label}
                    </p>
                  </div>
                </div>

                {/* Resources */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 dark:text-gray-100">CPU</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">{cpuCores} vCPU</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 dark:text-gray-100">RAM</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">{ramGb} GB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 dark:text-gray-100">Storage</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">{storageGb} GB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 dark:text-gray-100">GPU</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                      {GPU_OPTIONS.find(g => g.value === gpu)?.label}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Cost Summary */}
              <Card className="p-4 sm:p-6 bg-indigo-50 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-700">
                <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-50">Cost Estimate</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-700 dark:text-gray-100 mb-1">Hourly</p>
                    <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-50">
                      Rp {hourlyCost.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}<span className="text-sm font-normal text-gray-700 dark:text-gray-100">/hr</span>
                    </p>
                  </div>
                  <div className="pt-3 border-t border-indigo-200 dark:border-indigo-600">
                    <p className="text-xs text-gray-700 dark:text-gray-100 mb-1">Monthly estimate</p>
                    <p className="text-xs text-gray-600 dark:text-gray-100 mb-2">(8 hrs/day, 22 days)</p>
                    <p className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-50">
                      Rp {monthlyCost.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}<span className="text-sm font-normal text-gray-700 dark:text-gray-100">/mo</span>
                    </p>
                  </div>
                </div>
                
                {/* Billing Notice */}
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <h4 className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1.5">Billing Information</h4>
                  <div className="space-y-1.5 text-xs text-blue-900 dark:text-blue-100">
                    <p>
                      <span className="font-medium">Storage:</span> Billed at Rp {(storageGb * 1660).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/month (Rp 1.660/GB/month) regardless of instance state.
                    </p>
                    <p>
                      <span className="font-medium">Compute:</span> Costs apply only when the instance is running.
                    </p>
                    {isWindowsPreset && (
                      <p>
                        <span className="font-medium">Windows:</span> Includes Windows Server license in compute cost.
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Desktop'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => navigate('/dashboard')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>

              {errors.submit && (
                <p className="text-xs text-red-600 dark:text-red-300 text-center">{errors.submit}</p>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
