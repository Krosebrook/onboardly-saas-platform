import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { blink } from '@/lib/blink'
import { Plus, Trash2, Edit, ChevronUp, ChevronDown, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import type { OnboardingFlow, Step } from '@/types'

interface FlowStepsPageProps {
  flowId: string
  onBack: () => void
}

export function FlowStepsPage({ flowId, onBack }: FlowStepsPageProps) {
  const [flow, setFlow] = useState<OnboardingFlow | null>(null)
  const [steps, setSteps] = useState<Step[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStep, setEditingStep] = useState<Step | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    estimatedTime: ''
  })

  useEffect(() => {
    loadData()
  }, [flowId])

  const loadData = async () => {
    try {
      const user = await blink.auth.me()
      if (!user) return

      const [flowData, stepsData] = await Promise.all([
        blink.db.onboardingFlows.get<OnboardingFlow>(flowId),
        blink.db.steps.list<Step>({
          where: { flowId },
          orderBy: { stepOrder: 'asc' }
        })
      ])

      setFlow(flowData)
      setSteps(stepsData)
    } catch (error) {
      console.error('Failed to load steps:', error)
      toast.error('Failed to load steps')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingStep(null)
    setFormData({ title: '', description: '', content: '', estimatedTime: '' })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (step: Step) => {
    setEditingStep(step)
    setFormData({
      title: step.title,
      description: step.description || '',
      content: step.content || '',
      estimatedTime: step.estimatedTime || ''
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required')
      return
    }

    try {
      const user = await blink.auth.me()
      if (!user) return

      if (editingStep) {
        await blink.db.steps.update(editingStep.id, {
          title: formData.title,
          description: formData.description || undefined,
          content: formData.content || undefined,
          estimatedTime: formData.estimatedTime || undefined,
          updatedAt: new Date().toISOString()
        })
        toast.success('Step updated')
      } else {
        await blink.db.steps.create({
          userId: user.id,
          flowId,
          title: formData.title,
          description: formData.description || undefined,
          content: formData.content || undefined,
          estimatedTime: formData.estimatedTime || undefined,
          stepOrder: steps.length + 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        toast.success('Step added')
      }

      setIsDialogOpen(false)
      loadData()
    } catch (error) {
      console.error('Failed to save step:', error)
      toast.error('Failed to save step')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this step?')) return

    try {
      await blink.db.steps.delete(id)
      toast.success('Step deleted')
      loadData()
    } catch (error) {
      console.error('Failed to delete step:', error)
      toast.error('Failed to delete step')
    }
  }

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= steps.length) return

    const newSteps = [...steps]
    const temp = newSteps[index]
    newSteps[index] = newSteps[newIndex]
    newSteps[newIndex] = temp

    try {
      await Promise.all(newSteps.map((step, i) => 
        blink.db.steps.update(step.id, { stepOrder: i + 1 })
      ))
      setSteps(newSteps)
      toast.success('Step reordered')
    } catch (error) {
      console.error('Failed to reorder steps:', error)
      toast.error('Failed to reorder')
      loadData()
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center">Loading steps...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{flow?.name}</h1>
          <p className="text-muted-foreground">Manage the steps for this onboarding flow</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Steps ({steps.length})</h2>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Step
        </Button>
      </div>

      {steps.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No steps added to this flow yet.</p>
            <Button variant="outline" onClick={handleOpenCreate}>Add your first step</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {steps.map((step, index) => (
            <Card key={step.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      disabled={index === 0}
                      onClick={() => handleMove(index, 'up')}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      disabled={index === steps.length - 1}
                      onClick={() => handleMove(index, 'down')}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded">
                        Step {index + 1}
                      </span>
                      <h3 className="font-semibold text-lg">{step.title}</h3>
                    </div>
                    {step.description && (
                      <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                    )}
                    {step.estimatedTime && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Estimated time: {step.estimatedTime}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(step)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive"
                      onClick={() => handleDelete(step.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingStep ? 'Edit Step' : 'Add New Step'}</DialogTitle>
            <DialogDescription>
              Define the instructions and content for this onboarding step.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="stepTitle">Title *</Label>
              <Input
                id="stepTitle"
                placeholder="e.g. Set up your profile"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stepDescription">Brief Description</Label>
              <Input
                id="stepDescription"
                placeholder="Short summary of what to do"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedTime">Estimated Time</Label>
                <Input
                  id="estimatedTime"
                  placeholder="e.g. 5 minutes"
                  value={formData.estimatedTime}
                  onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stepContent">Detailed Instructions / Content</Label>
              <Textarea
                id="stepContent"
                placeholder="Markdown or HTML supported..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>{editingStep ? 'Save Changes' : 'Add Step'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
