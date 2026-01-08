import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { blink } from '@/lib/blink'
import { Building2, Users, Workflow, TrendingUp } from 'lucide-react'
import type { Company, Customer, OnboardingFlow } from '@/types'

export function DashboardPage() {
  const [stats, setStats] = useState({
    companies: 0,
    customers: 0,
    flows: 0,
    completionRate: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const user = await blink.auth.me()
      if (!user) return

      const [companies, customers, flows] = await Promise.all([
        blink.db.companies.list<Company>({ where: { userId: user.id } }),
        blink.db.customers.list<Customer>({ where: { userId: user.id } }),
        blink.db.onboardingFlows.list<OnboardingFlow>({ where: { userId: user.id } })
      ])

      setStats({
        companies: companies.length,
        customers: customers.length,
        flows: flows.length,
        completionRate: 0 // Will calculate from progress data
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setIsLoading(false)
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest customer onboarding updates</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No recent activity yet. Start by creating a company and onboarding flow.
            </p>
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
