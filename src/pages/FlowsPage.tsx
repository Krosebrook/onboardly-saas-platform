import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { blink } from '@/lib/blink'
import { Plus, Workflow, Trash2, Edit, CheckCircle2, Building2, ListTodo } from 'lucide-react'
import { toast } from 'sonner'
import type { Company, OnboardingFlow, Step } from '@/types'
import { FlowStepsPage } from './FlowStepsPage'

export function FlowsPage() {
  const [flows, setFlows] = useState<OnboardingFlow[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [viewingStepsFlowId, setViewingStepsFlowId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    companyId: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const user = await blink.auth.me()
      if (!user) return

      const [flowsData, companiesData] = await Promise.all([
        blink.db.onboardingFlows.list<OnboardingFlow>({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' }
        }),
        blink.db.companies.list<Company>({ where: { userId: user.id } })
      ])

      setFlows(flowsData)
      setCompanies(companiesData)
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load flows')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.companyId) {
      toast.error('Name and company are required')
      return
    }

    try {
      const user = await blink.auth.me()
      if (!user) return

      await blink.db.onboardingFlows.create({
        userId: user.id,
        companyId: formData.companyId,
        name: formData.name,
        description: formData.description || undefined,
        isActive: '1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      toast.success('Onboarding flow created')
      setIsDialogOpen(false)
      setFormData({ name: '', description: '', companyId: '' })
      loadData()
    } catch (error) {
      console.error('Failed to create flow:', error)
      toast.error('Failed to create flow')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this onboarding flow? All steps will be removed.')) return

    try {
      await blink.db.onboardingFlows.delete(id)
      toast.success('Flow deleted')
      loadData()
    } catch (error) {
      console.error('Failed to delete flow:', error)
      toast.error('Failed to delete flow')
    }
  }

  const handleToggleActive = async (flow: OnboardingFlow) => {
    try {
      const newStatus = flow.isActive === '1' ? '0' : '1'
      await blink.db.onboardingFlows.update(flow.id, {
        isActive: newStatus,
        updatedAt: new Date().toISOString()
      })
      toast.success(newStatus === '1' ? 'Flow activated' : 'Flow deactivated')
      loadData()
    } catch (error) {
      console.error('Failed to toggle flow:', error)
      toast.error('Failed to update flow')
    }
  }

  if (viewingStepsFlowId) {
    return <FlowStepsPage flowId={viewingStepsFlowId} onBack={() => setViewingStepsFlowId(null)} />
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-5 bg-muted rounded animate-pulse mb-2" />
                <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Onboarding Flows</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage step-by-step onboarding guides
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Flow
        </Button>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No companies yet</h3>
            <p className="text-sm text-muted-foreground">
              Create a company first before building onboarding flows
            </p>
          </CardContent>
        </Card>
      ) : flows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Workflow className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No flows yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first onboarding flow
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Flow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {flows.map((flow) => {
            const company = companies.find(c => c.id === flow.companyId)
            const isActive = flow.isActive === '1'
            return (
              <Card key={flow.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        isActive ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        <Workflow className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg truncate">{flow.name}</CardTitle>
                          {isActive && (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <CardDescription className="truncate">
                          {company?.name || 'Unknown company'}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(flow.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {flow.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {flow.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isActive ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleToggleActive(flow)}
                    >
                      {isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => setViewingStepsFlowId(flow.id)}
                    >
                      <ListTodo className="h-3 w-3" />
                      Edit Steps
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Onboarding Flow</DialogTitle>
            <DialogDescription>
              Build a step-by-step guide for customer onboarding
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Select value={formData.companyId} onValueChange={(value) => setFormData({ ...formData, companyId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="flowName">Flow Name *</Label>
              <Input
                id="flowName"
                placeholder="New Customer Setup"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe this onboarding flow..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Flow</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
