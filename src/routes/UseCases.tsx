import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Code, Cpu, Palette, Database, BookOpen, Briefcase, X, Check } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

type PresetType = 'development' | 'engineering' | 'data-science' | null;

const presetDetails = {
  development: {
    title: 'Development Preset',
    subtitle: 'Optimized for Programming & Software Development',
    specs: {
      cpu: '4 vCPU',
      ram: '8 GB',
      storage: '50 GB SSD',
      gpu: 'None'
    },
    software: [
      'VS Code with extensions',
      'Git & GitHub CLI',
      'Docker & Docker Compose',
      'Node.js, Python, Java, Go',
      'PostgreSQL & MongoDB',
      'Nginx web server'
    ],
    features: [
      'Pre-configured development environment',
      'All major programming languages',
      'Database servers ready to use',
      'Container support for microservices',
      'Port forwarding for web development',
      'Automatic daily backups'
    ],
    pricing: 'Rp 2.490/hour when running'
  },
  engineering: {
    title: 'Engineering Preset',
    subtitle: 'GPU-Accelerated for CAD & Simulation',
    specs: {
      cpu: '8 vCPU',
      ram: '32 GB',
      storage: '100 GB SSD',
      gpu: 'NVIDIA T4 (16 GB)'
    },
    software: [
      'AutoCAD 2024',
      'SolidWorks Premium',
      'MATLAB & Simulink',
      'ANSYS Workbench',
      'Fusion 360',
      'FreeCAD'
    ],
    features: [
      'Professional GPU acceleration',
      'Real-time rendering support',
      'Complex simulation capabilities',
      'Large assembly handling',
      'Collaborative design tools',
      'Project file versioning'
    ],
    pricing: 'Rp 19.920/hour when running'
  },
  'data-science': {
    title: 'Data Science Preset',
    subtitle: 'High-Performance ML & Analytics',
    specs: {
      cpu: '8 vCPU',
      ram: '64 GB',
      storage: '200 GB SSD',
      gpu: 'NVIDIA A100 (40 GB)'
    },
    software: [
      'Jupyter Lab & Notebooks',
      'Python with Anaconda',
      'TensorFlow & PyTorch',
      'scikit-learn & pandas',
      'R & RStudio',
      'Apache Spark'
    ],
    features: [
      'GPU-accelerated model training',
      'Large dataset processing',
      'Distributed computing support',
      'Pre-installed ML libraries',
      'Notebook collaboration',
      'Experiment tracking tools'
    ],
    pricing: 'Rp 41.500/hour when running'
  }
};

export function UseCases() {
  const [selectedPreset, setSelectedPreset] = React.useState<PresetType>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 lg:px-16">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo + Brand */}
            <div className="flex items-center gap-8">
              <Link to="/">
                <img src="/logo-clouddesk.png" alt="CloudDesk EDU" className="h-9 w-auto object-contain hover:opacity-80 transition-opacity" />
              </Link>
              
              {/* Center: Navigation Links */}
              <div className="hidden md:flex items-center gap-6">
                <Link to="/product" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Product
                </Link>
                <Link to="/use-cases" className="text-sm font-medium text-indigo-600 transition-colors">
                  Use Cases
                </Link>
                <Link to="/pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Pricing
                </Link>
                <Link to="/docs" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Documentation
                </Link>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-20">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-semibold text-gray-900 mb-6">
              Use Cases
            </h1>
            <p className="text-xl text-gray-600">
              Discover how CloudDesk EDU empowers students, educators, and professionals across different fields and workflows.
            </p>
          </div>
        </div>
      </section>

      {/* Education Use Cases */}
      <section className="max-w-7xl mx-auto px-8 py-20">
        <div className="mb-12">
          <Badge variant="info" className="mb-4">Education</Badge>
          <h2 className="text-3xl font-semibold text-gray-900 mb-4">
            For Students & Educators
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl">
            Enable learning without hardware barriers. Provide consistent, powerful computing environments for all students.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Computer Science Students */}
          <Card className="p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Code className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Computer Science Students
                </h3>
                <p className="text-sm text-gray-500">Programming & Development</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Challenge</h4>
                <p className="text-gray-600">
                  Students need to run IDEs, compilers, and development tools that their personal laptops can't handle.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Solution</h4>
                <p className="text-gray-600">
                  Pre-configured development environments with VS Code, Git, Docker, and language runtimes. Students can code from any device.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Key Benefits</h4>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-1">✓</span>
                    <span>Consistent development environment for all students</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-1">✓</span>
                    <span>No time wasted on setup and configuration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-1">✓</span>
                    <span>Access coursework from home, library, or campus</span>
                  </li>
                </ul>
              </div>
            </div>

            <Button 
              variant="secondary" 
              className="w-full"
              onClick={() => setSelectedPreset('development')}
            >
              View Development Preset
            </Button>
          </Card>

          {/* Engineering Students */}
          <Card className="p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Cpu className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Engineering Students
                </h3>
                <p className="text-sm text-gray-500">CAD & Simulation</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Challenge</h4>
                <p className="text-gray-600">
                  CAD software and engineering simulations require powerful GPUs and lots of RAM that student laptops don't have.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Solution</h4>
                <p className="text-gray-600">
                  GPU-accelerated desktops with AutoCAD, SolidWorks, and MATLAB pre-installed. Run complex simulations without buying expensive hardware.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Key Benefits</h4>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-1">✓</span>
                    <span>Professional-grade GPU acceleration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-1">✓</span>
                    <span>Run simulations 10x faster than personal laptops</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-1">✓</span>
                    <span>Save and resume work from anywhere</span>
                  </li>
                </ul>
              </div>
            </div>

            <Button 
              variant="secondary" 
              className="w-full"
              onClick={() => setSelectedPreset('engineering')}
            >
              View Engineering Preset
            </Button>
          </Card>

          {/* Data Science Students */}
          <Card className="p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Database className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Data Science Students
                </h3>
                <p className="text-sm text-gray-500">ML & Analytics</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Challenge</h4>
                <p className="text-gray-600">
                  Training machine learning models and processing large datasets requires significant compute power and memory.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Solution</h4>
                <p className="text-gray-600">
                  High-memory desktops with GPU support, Jupyter notebooks, Python, TensorFlow, and PyTorch pre-configured.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Key Benefits</h4>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-1">✓</span>
                    <span>Train models 50x faster with GPU acceleration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-1">✓</span>
                    <span>Process large datasets without memory limits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-1">✓</span>
                    <span>Collaborate on notebooks with classmates</span>
                  </li>
                </ul>
              </div>
            </div>

            <Button 
              variant="secondary" 
              className="w-full"
              onClick={() => setSelectedPreset('data-science')}
            >
              View Data Science Preset
            </Button>
          </Card>

          {/* Lecturers & Educators */}
          <Card className="p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Lecturers & Educators
                </h3>
                <p className="text-sm text-gray-500">Classroom Management</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Challenge</h4>
                <p className="text-gray-600">
                  Ensuring all students have the same software environment is time-consuming. Troubleshooting individual setups wastes class time.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Solution</h4>
                <p className="text-gray-600">
                  Deploy identical desktops for entire classes with one click. Monitor student progress and provide assistance remotely.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Key Benefits</h4>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-1">✓</span>
                    <span>Zero setup time for students</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-1">✓</span>
                    <span>Consistent environment eliminates "works on my machine"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-1">✓</span>
                    <span>Focus on teaching, not troubleshooting</span>
                  </li>
                </ul>
              </div>
            </div>

            <Button variant="secondary" className="w-full">
              Learn About Classroom Mode
            </Button>
          </Card>
        </div>
      </section>

      {/* Professional Use Cases */}
      <section className="bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-20">
          <div className="mb-12">
            <Badge variant="success" className="mb-4">Professional</Badge>
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">
              For Professionals & Teams
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl">
              Scale your computing power on demand. Work from anywhere without compromising on performance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Software Developers */}
            <Card className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Code className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Software Developers
                  </h3>
                  <p className="text-sm text-gray-500">Remote Development</p>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6">
                Work on resource-intensive projects from any device. Run builds, tests, and deployments faster with scalable compute.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-gray-900 mb-2">Perfect for:</p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Large codebase compilation</li>
                  <li>• Docker container development</li>
                  <li>• CI/CD pipeline testing</li>
                  <li>• Multi-environment testing</li>
                </ul>
              </div>

              <Button variant="ghost" className="w-full">
                Read Case Study →
              </Button>
            </Card>

            {/* 3D Artists & Designers */}
            <Card className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Palette className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    3D Artists & Designers
                  </h3>
                  <p className="text-sm text-gray-500">Creative Workflows</p>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6">
                Render complex 3D scenes and edit high-resolution videos without expensive workstations. Scale GPU power as needed.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-gray-900 mb-2">Perfect for:</p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• 3D modeling and rendering</li>
                  <li>• Video editing and compositing</li>
                  <li>• Motion graphics</li>
                  <li>• Real-time visualization</li>
                </ul>
              </div>

              <Button variant="ghost" className="w-full">
                Read Case Study →
              </Button>
            </Card>

            {/* Researchers */}
            <Card className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Researchers
                  </h3>
                  <p className="text-sm text-gray-500">Scientific Computing</p>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6">
                Run simulations, analyze large datasets, and train models without infrastructure overhead. Pay only for compute time used.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-gray-900 mb-2">Perfect for:</p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Scientific simulations</li>
                  <li>• Genomics analysis</li>
                  <li>• Climate modeling</li>
                  <li>• Statistical analysis</li>
                </ul>
              </div>

              <Button variant="ghost" className="w-full">
                Read Case Study →
              </Button>
            </Card>

            {/* Startups & Small Teams */}
            <Card className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Startups & Small Teams
                  </h3>
                  <p className="text-sm text-gray-500">Cost-Effective Scaling</p>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6">
                Provide powerful workstations to your team without upfront hardware costs. Scale resources as your team grows.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-gray-900 mb-2">Perfect for:</p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>��� Remote team collaboration</li>
                  <li>• Flexible resource allocation</li>
                  <li>• Cost-effective scaling</li>
                  <li>• Secure data management</li>
                </ul>
              </div>

              <Button variant="ghost" className="w-full">
                Read Case Study →
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-8 py-20">
        <Card className="p-12 bg-indigo-50 border-indigo-200 text-center">
          <h2 className="text-3xl font-semibold text-gray-900 mb-4">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of students, educators, and professionals who trust CloudDesk EDU for their computing needs.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="primary" size="lg">
              Start Free Trial
            </Button>
            <Button variant="secondary" size="lg">
              Schedule Demo
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            No credit card required • 7-day free trial • Cancel anytime
          </p>
        </Card>
      </section>
      </div>

      {/* Preset Modal */}
      {selectedPreset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedPreset(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-1">
                  {presetDetails[selectedPreset].title}
                </h2>
                <p className="text-gray-600">
                  {presetDetails[selectedPreset].subtitle}
                </p>
              </div>
              <button
                onClick={() => setSelectedPreset(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="px-8 py-6 space-y-8">
              {/* Specifications */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Hardware Specifications
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">CPU</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {presetDetails[selectedPreset].specs.cpu}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">RAM</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {presetDetails[selectedPreset].specs.ram}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Storage</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {presetDetails[selectedPreset].specs.storage}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">GPU</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {presetDetails[selectedPreset].specs.gpu}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pre-installed Software */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Pre-installed Software
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {presetDetails[selectedPreset].software.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-gray-700">
                      <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Key Features
                </h3>
                <div className="space-y-3">
                  {presetDetails[selectedPreset].features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-4 h-4 text-indigo-600" />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-semibold text-gray-900">
                    {presetDetails[selectedPreset].pricing.split('/')[0]}
                  </span>
                  <span className="text-gray-600">
                    /{presetDetails[selectedPreset].pricing.split('/')[1]}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Only pay for compute time. Storage charged separately at Rp 1.660/GB/month.
                </p>
                <div className="flex gap-3">
                  <Link to={`/create?preset=${selectedPreset}`} className="flex-1">
                    <Button variant="primary" className="w-full">
                      Create Desktop
                    </Button>
                  </Link>
                  <Link to="/pricing" className="flex-1">
                    <Button variant="secondary" className="w-full">
                      View Pricing
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
