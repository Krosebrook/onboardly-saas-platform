import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { blink } from '@/lib/blink'
import { Building2, Users, Workflow, TrendingUp, Clock, AlertCircle, Sparkles, Loader2, BrainCircuit } from 'lucide-react'
import type { Company, Customer, OnboardingFlow, CustomerProgress, Step } from '@/types'

export function DashboardPage() {
  const [stats, setStats] = useState({
    companies: 0,
    customers: 0,
    flows: 0,
    completionRate: 0,
    pendingReminders: 0
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const user = await blink.auth.me()
      if (!user) return

      const [companies, customers, flows, allProgress, allSteps] = await Promise.all([
        blink.db.companies.list<Company>({ where: { userId: user.id } }),
        blink.db.customers.list<Customer>({ where: { userId: user.id } }),
        blink.db.onboardingFlows.list<OnboardingFlow>({ where: { userId: user.id } }),
        blink.db.customerProgress.list<CustomerProgress>({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' } }),
        blink.db.steps.list<Step>({ where: { userId: user.id } })
      ])

      // Calculate completion rate
      // For each customer/flow pair, how many steps are completed vs total steps in that flow
      let totalCompleted = 0
      let totalExpected = 0

      customers.forEach(customer => {
        flows.forEach(flow => {
          const flowSteps = allSteps.filter(s => s.flowId === flow.id)
          if (flowSteps.length === 0) return

          const customerFlowProgress = allProgress.filter(p => p.customerId === customer.id && p.flowId === flow.id)
          const completedInFlow = customerFlowProgress.filter(p => p.status === 'completed').length
          
          if (customerFlowProgress.length > 0) {
            totalCompleted += completedInFlow
            totalExpected += flowSteps.length
          }
        })
      })

      const completionRate = totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0

      setStats({
        companies: companies.length,
        customers: customers.length,
        flows: flows.length,
        completionRate,
        pendingReminders: 0 // Placeholder
      })

      // Recent Activity
      const activity = allProgress.slice(0, 5).map(p => {
        const customer = customers.find(c => c.id === p.customerId)
        const step = allSteps.find(s => s.id === p.stepId)
        return {
          id: p.id,
          customerName: customer?.name || customer?.email || 'Unknown',
          stepTitle: step?.title || 'Unknown step',
          status: p.status,
          updatedAt: p.updatedAt
        }
      })
      setRecentActivity(activity)

      // Generate AI Analysis if we have data
      if (customers.length > 0 && flows.length > 0) {
        generatePredictiveAnalysis(customers, flows, allSteps, allProgress)
      }

    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generatePredictiveAnalysis = async (customers: any[], flows: any[], steps: any[], progress: any[]) => {
    setIsAnalyzing(true)
    try {
      const dataContext = {
        totalCustomers: customers.length,
        flows: flows.map(f => ({
          name: f.name,
          steps: steps.filter(s => s.flowId === f.id).map(s => ({
            title: s.title,
            completions: progress.filter(p => p.stepId === s.id && p.status === 'completed').length
          }))
        }))
      }

      const { text } = await blink.ai.generateText({
        prompt: `Analyze this onboarding data and identify drop-off points. Suggest specific improvements for each flow to improve activation:\n\n${JSON.stringify(dataContext, null, 2)}`,
        system: "You are a product activation expert. You analyze user onboarding data to identify where users are getting stuck and provide actionable advice to improve completion rates."
      })
      setAiAnalysis(text)
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const statCards = [
    {
      title: 'Companies',
      value: stats.companies,
      icon: Building2,
      description: 'Total companies',
      color: 'text-primary'
    },
    {
      title: 'Active Customers',
      value: stats.customers,
      icon: Users,
      description: 'Being onboarded',
      color: 'text-accent'
    },
    {
      title: 'Onboarding Flows',
      value: stats.flows,
      icon: Workflow,
      description: 'Active flows',
      color: 'text-chart-3'
    },
    {
      title: 'Avg Completion',
      value: `${stats.completionRate}%`,
      icon: TrendingUp,
      description: 'Success rate',
      color: 'text-chart-5'
    }
  ]

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded animate-pulse mb-2" />
              <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your customer onboarding platform
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Predictive Activation Analytics Section */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-primary" />
              Predictive Activation Analytics
            </CardTitle>
            <CardDescription>AI-powered insights into customer drop-offs and activation bottlenecks</CardDescription>
          </div>
          {isAnalyzing && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </CardHeader>
        <CardContent>
          {aiAnalysis ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="bg-background/50 rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap border border-primary/10">
                {aiAnalysis}
              </div>
            </div>
          ) : isAnalyzing ? (
            <div className="space-y-2">
              <div className="h-4 bg-primary/10 rounded animate-pulse w-full" />
              <div className="h-4 bg-primary/10 rounded animate-pulse w-5/6" />
              <div className="h-4 bg-primary/10 rounded animate-pulse w-4/6" />
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p>Add more customer progress data to see AI-powered insights</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest customer onboarding updates</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4">
                    <div className={`h-2 w-2 rounded-full ${
                      activity.status === 'completed' ? 'bg-primary' : 'bg-muted-foreground'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {activity.customerName} {activity.status === 'completed' ? 'completed' : 'updated'} <span className="text-primary">{activity.stepTitle}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No recent activity yet. Start by creating a company and onboarding flow.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with these actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              • Create your first company<br />
              • Build an onboarding flow<br />
              • Add customers to onboard
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
