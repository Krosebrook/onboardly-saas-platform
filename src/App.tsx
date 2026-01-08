import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { CompaniesPage } from '@/pages/CompaniesPage'
import { FlowsPage } from '@/pages/FlowsPage'
import { CustomersPage } from '@/pages/CustomersPage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { blink } from '@/lib/blink'
import { Toaster } from '@/components/ui/sonner'
import { Workflow, CheckCircle2, Users, BarChart3 } from 'lucide-react'

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Onboardly</h1>
          <Button onClick={() => blink.auth.login()}>Sign In</Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-5xl font-bold text-foreground mb-6">
            Customer Onboarding Made Simple
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Build personalized step-by-step guides, track completion rates, and measure activation. 
            Scale pricing based on customers onboarded.
          </p>
          <Button size="lg" onClick={() => blink.auth.login()} className="gap-2">
            Get Started
          </Button>
        </div>

        <div className="grid gap-8 md:grid-cols-3 mb-16">
          <Card>
            <CardHeader>
              <Workflow className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Build Flows</CardTitle>
              <CardDescription>
                Create step-by-step onboarding guides tailored to each customer
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CheckCircle2 className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Track Progress</CardTitle>
              <CardDescription>
                Monitor completion rates and identify bottlenecks in real-time
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Measure Success</CardTitle>
              <CardDescription>
                Get actionable analytics on activation and customer success
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  )
}

function AppContent() {
  const { user, isLoading } = useAuth()
  const [currentPage, setCurrentPage] = useState('dashboard')

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LandingPage />
  }

  return (
    <DashboardLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {currentPage === 'dashboard' && <DashboardPage />}
      {currentPage === 'companies' && <CompaniesPage />}
      {currentPage === 'flows' && <FlowsPage />}
      {currentPage === 'customers' && <CustomersPage />}
      {currentPage === 'analytics' && (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Analytics Coming Soon</h3>
          <p className="text-muted-foreground">Detailed analytics and insights will be available here</p>
        </div>
      )}
      {currentPage === 'settings' && (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-foreground mb-2">Settings Coming Soon</h3>
          <p className="text-muted-foreground">Account and platform settings will be available here</p>
        </div>
      )}
    </DashboardLayout>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  )
}

export default App 