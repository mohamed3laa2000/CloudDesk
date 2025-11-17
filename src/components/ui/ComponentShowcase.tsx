/**
 * Component Showcase
 * 
 * This file demonstrates all UI components.
 * Use this as a reference or for visual testing.
 * Not meant to be used in production.
 */

import { useState } from 'react'
import { Button } from './Button'
import { Card, CardHeader, CardBody, CardFooter } from './Card'
import { Input, Textarea, Label, HelperText } from './Input'
import { Select, SelectOption } from './Select'
import { Badge, CountBadge } from './Badge'
import { DemoModeBadge } from './DemoModeBadge'
import { Tabs, UnderlineTabs } from './Tabs'

export function ComponentShowcase() {
  const [activeTab, setActiveTab] = useState('all')
  const [activeSection, setActiveSection] = useState('overview')
  const [inputValue, setInputValue] = useState('')
  const [selectValue, setSelectValue] = useState('')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl space-y-12">
        <div>
          <h1 className="mb-2 text-3xl font-semibold text-gray-900">
            CloudDesk EDU UI Components
          </h1>
          <p className="text-gray-600">Component showcase and reference</p>
        </div>

        {/* Buttons */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Buttons</h2>
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Variants</p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Sizes</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">States</p>
                <div className="flex flex-wrap gap-3">
                  <Button disabled>Disabled</Button>
                  <Button variant="secondary" disabled>
                    Disabled Secondary
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Cards */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Cards</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="mb-2 text-lg font-semibold">Basic Card</h3>
              <p className="text-gray-600">Simple card with padding</p>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Card with Sections</h3>
              </CardHeader>
              <CardBody>
                <p className="text-gray-600">Card body content</p>
              </CardBody>
              <CardFooter>
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Inputs */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Inputs</h2>
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <Label htmlFor="input1" required>
                  Text Input
                </Label>
                <Input
                  id="input1"
                  type="text"
                  placeholder="Enter text..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <HelperText>This is helper text</HelperText>
              </div>

              <div>
                <Label htmlFor="input2">Input with Error</Label>
                <Input id="input2" type="email" error placeholder="email@example.com" />
                <HelperText error>Invalid email address</HelperText>
              </div>

              <div>
                <Label htmlFor="textarea1">Textarea</Label>
                <Textarea id="textarea1" placeholder="Enter description..." rows={4} />
              </div>

              <div>
                <Label htmlFor="input3">Disabled Input</Label>
                <Input id="input3" type="text" disabled value="Disabled value" />
              </div>
            </div>
          </Card>
        </section>

        {/* Select */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Select</h2>
          <Card className="p-6">
            <div className="max-w-md space-y-6">
              <div>
                <Label htmlFor="select1">Region</Label>
                <Select
                  id="select1"
                  value={selectValue}
                  onChange={(e) => setSelectValue(e.target.value)}
                >
                  <SelectOption value="">Select a region</SelectOption>
                  <SelectOption value="us-east">US East (Virginia)</SelectOption>
                  <SelectOption value="us-west">US West (Oregon)</SelectOption>
                  <SelectOption value="eu-west">EU West (Ireland)</SelectOption>
                </Select>
              </div>

              <div>
                <Label htmlFor="select2">Disabled Select</Label>
                <Select id="select2" disabled>
                  <SelectOption value="disabled">Disabled option</SelectOption>
                </Select>
              </div>
            </div>
          </Card>
        </section>

        {/* Badges */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Badges</h2>
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Semantic Variants</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="neutral">Neutral</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="danger">Danger</Badge>
                  <Badge variant="info">Info</Badge>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Instance Status</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="running">RUNNING</Badge>
                  <Badge variant="stopped">STOPPED</Badge>
                  <Badge variant="provisioning">PROVISIONING</Badge>
                  <Badge variant="error">ERROR</Badge>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Count Badges</p>
                <div className="flex flex-wrap gap-4">
                  <div className="relative inline-block">
                    <div className="h-10 w-10 rounded-full bg-gray-200" />
                    <CountBadge count={5} className="absolute -right-1 -top-1" />
                  </div>
                  <div className="relative inline-block">
                    <div className="h-10 w-10 rounded-full bg-gray-200" />
                    <CountBadge count={99} className="absolute -right-1 -top-1" />
                  </div>
                  <div className="relative inline-block">
                    <div className="h-10 w-10 rounded-full bg-gray-200" />
                    <CountBadge count={150} className="absolute -right-1 -top-1" />
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Demo Mode Badge</p>
                <div className="flex flex-wrap gap-2">
                  <DemoModeBadge />
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Tabs */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Tabs</h2>
          <Card className="p-6">
            <div className="space-y-8">
              <div>
                <p className="mb-3 text-sm font-medium text-gray-700">Pill Tabs (Filters)</p>
                <Tabs
                  items={[
                    { id: 'all', label: 'All', count: 24 },
                    { id: 'running', label: 'Running', count: 3 },
                    { id: 'stopped', label: 'Stopped', count: 21 },
                  ]}
                  activeId={activeTab}
                  onChange={setActiveTab}
                />
                <p className="mt-3 text-sm text-gray-600">Active: {activeTab}</p>
              </div>

              <div>
                <p className="mb-3 text-sm font-medium text-gray-700">Underline Tabs</p>
                <UnderlineTabs
                  items={[
                    { id: 'overview', label: 'Overview' },
                    { id: 'performance', label: 'Performance' },
                    { id: 'logs', label: 'Logs' },
                  ]}
                  activeId={activeSection}
                  onChange={setActiveSection}
                />
                <p className="mt-3 text-sm text-gray-600">Active: {activeSection}</p>
              </div>
            </div>
          </Card>
        </section>

        {/* Combined Example */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Combined Example</h2>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Create Desktop Instance</h3>
                <Badge variant="info">Beta</Badge>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" required>
                    Instance Name
                  </Label>
                  <Input id="name" type="text" placeholder="e.g., My Ubuntu Desktop" />
                  <HelperText>Choose a descriptive name</HelperText>
                </div>

                <div>
                  <Label htmlFor="region">Region</Label>
                  <Select id="region">
                    <SelectOption value="">Select a region</SelectOption>
                    <SelectOption value="us-east">US East (Virginia)</SelectOption>
                    <SelectOption value="us-west">US West (Oregon)</SelectOption>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" rows={3} placeholder="Optional description..." />
                </div>
              </div>
            </CardBody>
            <CardFooter>
              <div className="flex justify-end gap-3">
                <Button variant="secondary">Cancel</Button>
                <Button variant="primary">Create Instance</Button>
              </div>
            </CardFooter>
          </Card>
        </section>
      </div>
    </div>
  )
}
