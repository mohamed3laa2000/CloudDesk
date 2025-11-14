import { Monitor, Zap, Shield, Globe, Users, BarChart } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function Product() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-20">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-semibold text-gray-900 mb-6">
              Powerful Cloud Desktops for Everyone
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Access fully-configured cloud desktops from any device. Run demanding applications without expensive hardware.
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="primary" size="lg">
                Start Free Trial
              </Button>
              <Button variant="secondary" size="lg">
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-semibold text-gray-900 mb-4">
            Everything You Need
          </h2>
          <p className="text-lg text-gray-600">
            Professional-grade features for students, educators, and professionals
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="p-8">
            <Monitor className="w-12 h-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Instant Access
            </h3>
            <p className="text-gray-600">
              Deploy fully-configured desktops in seconds. No installation, no configuration, no waiting.
            </p>
          </Card>

          <Card className="p-8">
            <Zap className="w-12 h-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Flexible Resources
            </h3>
            <p className="text-gray-600">
              Scale CPU, RAM, storage, and GPU to match your workload. Adjust on the fly as needs change.
            </p>
          </Card>

          <Card className="p-8">
            <Shield className="w-12 h-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Enterprise Security
            </h3>
            <p className="text-gray-600">
              Your data is encrypted and backed up automatically. Industry-standard security without complexity.
            </p>
          </Card>

          <Card className="p-8">
            <Globe className="w-12 h-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Global Infrastructure
            </h3>
            <p className="text-gray-600">
              Deploy in US, EU, or Asia Pacific regions. Choose the location closest to you for best performance.
            </p>
          </Card>

          <Card className="p-8">
            <Users className="w-12 h-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Team Collaboration
            </h3>
            <p className="text-gray-600">
              Share desktops, collaborate on projects, and manage resources across your organization.
            </p>
          </Card>

          <Card className="p-8">
            <BarChart className="w-12 h-12 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Usage Analytics
            </h3>
            <p className="text-gray-600">
              Track resource usage and costs in real-time. Identify optimization opportunities and control spending.
            </p>
          </Card>
        </div>
      </section>

      {/* Presets Section */}
      <section className="bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">
              Pre-Configured for Your Workflow
            </h2>
            <p className="text-lg text-gray-600">
              Choose from optimized presets or customize your own configuration
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8 border-2 border-indigo-200">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Development & Engineering
                </h3>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full">
                  Popular
                </span>
              </div>
              <p className="text-gray-600 mb-6">
                Optimized for software development, compiling, and running development tools.
              </p>
              <div className="space-y-2 text-sm text-gray-600 mb-6">
                <div>• 4 vCPU</div>
                <div>• 8 GB RAM</div>
                <div>• 50 GB SSD Storage</div>
                <div>• Pre-installed: VS Code, Git, Docker, Node.js</div>
              </div>
              <Button variant="primary" className="w-full">
                Start with Development
              </Button>
            </Card>

            <Card className="p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Data Science & ML
              </h3>
              <p className="text-gray-600 mb-6">
                High-performance configuration for data analysis, machine learning, and Jupyter notebooks.
              </p>
              <div className="space-y-2 text-sm text-gray-600 mb-6">
                <div>• 8 vCPU</div>
                <div>• 16 GB RAM</div>
                <div>• 100 GB SSD Storage</div>
                <div>• NVIDIA T4 GPU</div>
                <div>• Pre-installed: Python, Jupyter, TensorFlow, PyTorch</div>
              </div>
              <Button variant="secondary" className="w-full">
                Start with Data Science
              </Button>
            </Card>

            <Card className="p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                3D Rendering & CAD
              </h3>
              <p className="text-gray-600 mb-6">
                Powerful GPU-accelerated desktop for 3D modeling, rendering, and CAD applications.
              </p>
              <div className="space-y-2 text-sm text-gray-600 mb-6">
                <div>• 8 vCPU</div>
                <div>• 32 GB RAM</div>
                <div>• 200 GB SSD Storage</div>
                <div>• NVIDIA A100 GPU</div>
                <div>• Pre-installed: Blender, AutoCAD, SolidWorks</div>
              </div>
              <Button variant="secondary" className="w-full">
                Start with 3D Rendering
              </Button>
            </Card>

            <Card className="p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                General Purpose
              </h3>
              <p className="text-gray-600 mb-6">
                Balanced configuration for everyday tasks, web browsing, and light development.
              </p>
              <div className="space-y-2 text-sm text-gray-600 mb-6">
                <div>• 2 vCPU</div>
                <div>• 4 GB RAM</div>
                <div>• 30 GB SSD Storage</div>
                <div>• Pre-installed: Chrome, Office Suite, Basic Tools</div>
              </div>
              <Button variant="secondary" className="w-full">
                Start with General Purpose
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-8 py-20">
        <Card className="p-12 bg-indigo-50 border-indigo-200 text-center">
          <h2 className="text-3xl font-semibold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Create your first cloud desktop in under 60 seconds. No credit card required.
          </p>
          <Button variant="primary" size="lg">
            Start Free Trial
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            Free 7-day trial • Cancel anytime
          </p>
        </Card>
      </section>
    </div>
  );
}
