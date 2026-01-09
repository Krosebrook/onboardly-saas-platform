import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Circle, Clock, ChevronRight } from 'lucide-react'
import { blink } from '@/lib/blink'
import { toast } from 'sonner'
import type { OnboardingFlow, Step, CustomerProgress, Customer } from '@/types'

// This page is meant to be public-facing
export function CustomerPortalPage() {
  const [flow, setFlow] = useState<OnboardingFlow | null>(null)
  const [steps, setSteps] = useState<Step[]>([])
  const [progress, setProgress] = useState<CustomerProgress[]>([])
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null)

  // In a real app, these would come from the URL params
  // For this demo/MVP, we'll try to find them from a "token" or similar
  // Let's assume we use search params for now: ?c=customerId&f=flowId
  const searchParams = new URLSearchParams(window.location.search)
  const customerId = searchParams.get('c')
  const flowId = searchParams.get('f')

  useEffect(() => {
    if (customerId && flowId) {
      loadData()
    } else {
      setIsLoading(false)
    }
  }, [customerId, flowId])

  const loadData = async () => {
    try {
      // NOTE: This currently requires the user to be logged in because of the security policy.
      // In a production app, we would use an Edge Function to bypass admin auth for this public page.
      // For now, we'll assume the customer is logged in or we've made the data public.
      
      const [flowData, stepsData, progressData, customerData] = await Promise.all([
        blink.db.onboardingFlows.get<OnboardingFlow>(flowId!),
        blink.db.steps.list<Step>({
          where: { flowId: flowId! },
          orderBy: { stepOrder: 'asc' }
        }),
        blink.db.customerProgress.list<CustomerProgress>({
          where: { customerId: customerId!, flowId: flowId! }
        }),
        blink.db.customers.get<Customer>(customerId!)
      ])

      setFlow(flowData)
      setSteps(stepsData)
      setProgress(progressData)
      setCustomer(customerData)
      
      if (stepsData.length > 0) {
        setSelectedStepId(stepsData[0].id)
      }
    } catch (error) {
      console.error('Failed to load portal data:', error)
      toast.error('Failed to load your onboarding guide')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleComplete = async (stepId: string) => {
    try {
      const existing = progress.find(p => p.stepId === stepId)
      
      if (existing) {
        const newStatus = existing.status === 'completed' ? 'not_started' : 'completed'
        await blink.db.customerProgress.update(existing.id, {
          status: newStatus,
          completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString()
        })
      } else {
        await blink.db.customerProgress.create({
          userId: flow?.userId, // This is a bit hacky, normally the admin creates the initial progress
          customerId: customerId!,
          flowId: flowId!,
          stepId: stepId,
          status: 'completed',
          completedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }
      
      toast.success('Progress updated')
      loadData()
    } catch (error) {
      console.error('Failed to update progress:', error)
      toast.error('Failed to update progress')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your onboarding...</p>
        </div>
      </div>
    )
  }

  if (!flow || !customer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Onboarding Not Found</CardTitle>
            <CardDescription>
              We couldn't find the onboarding flow you're looking for. Please check the link or contact support.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const completedCount = progress.filter(p => p.status === 'completed').length
  const totalSteps = steps.length
  const percentComplete = Math.round((completedCount / totalSteps) * 100) || 0
  const selectedStep = steps.find(s => s.id === selectedStepId)
  const isSelectedComplete = progress.find(p => p.stepId === selectedStepId)?.status === 'completed'

  return (
    <div className="min-h-screen bg-muted/30 pb-12">
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Welcome, {customer.name || customer.email}</h1>
            <p className="text-sm text-muted-foreground">{flow.name}</p>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium mb-1">{percentComplete}% Complete</div>
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500" 
                style={{ width: `${percentComplete}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Sidebar - Steps List */}
          <div className="lg:col-span-4 space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              Your Journey
              <span className="text-sm font-normal text-muted-foreground">
                ({completedCount}/{totalSteps})
              </span>
            </h2>
            <div className="space-y-2">
              {steps.map((step, index) => {
                const isComplete = progress.find(p => p.stepId === step.id)?.status === 'completed'
                const isSelected = selectedStepId === step.id
                
                return (
                  <button
                    key={step.id}
                    onClick={() => setSelectedStepId(step.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      isSelected 
                        ? 'bg-background border-primary shadow-sm' 
                        : 'bg-background/50 border-transparent hover:bg-background hover:border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div onClick={(e) => {
                        e.stopPropagation()
                        handleToggleComplete(step.id)
                      }}>
                        {isComplete ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground mb-0.5">Step {index + 1}</div>
                        <div className={`font-medium truncate ${isComplete ? 'text-muted-foreground line-through' : ''}`}>
                          {step.title}
                        </div>
                      </div>
                      <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Main Content - Step Details */}
          <div className="lg:col-span-8">
            {selectedStep ? (
              <Card className="min-h-[400px]">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-2xl">{selectedStep.title}</CardTitle>
                      {selectedStep.estimatedTime && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
                          <Clock className="h-4 w-4" />
                          {selectedStep.estimatedTime}
                        </div>
                      )}
                    </div>
                    <Button 
                      onClick={() => handleToggleComplete(selectedStep.id)}
                      variant={isSelectedComplete ? "outline" : "default"}
                      className="gap-2"
                    >
                      {isSelectedComplete ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Completed
                        </>
                      ) : (
                        'Mark as Complete'
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                  {selectedStep.description && (
                    <p className="text-lg text-muted-foreground mb-6">
                      {selectedStep.description}
                    </p>
                  )}
                  <div className="whitespace-pre-wrap text-foreground">
                    {selectedStep.content || 'No instructions provided for this step.'}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-background rounded-xl border">
                <CheckCircle2 className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-bold">You're all set!</h3>
                <p className="text-muted-foreground">Select a step to view instructions or mark them as complete.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
