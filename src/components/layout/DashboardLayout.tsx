import { ReactNode } from 'react'
import { LayoutDashboard, Users, Workflow, BarChart3, Settings, LogOut, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { blink } from '@/lib/blink'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: ReactNode
  currentPage?: string
  onNavigate?: (page: string) => void
}

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' },
  { name: 'Companies', icon: Building2, page: 'companies' },
  { name: 'Flows', icon: Workflow, page: 'flows' },
  { name: 'Customers', icon: Users, page: 'customers' },
  { name: 'Analytics', icon: BarChart3, page: 'analytics' },
  { name: 'Settings', icon: Settings, page: 'settings' },
]

export function DashboardLayout({ children, currentPage = 'dashboard', onNavigate }: DashboardLayoutProps) {
  const { user } = useAuth()

  const handleLogout = async () => {
    await blink.auth.logout()
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 h-screen flex flex-col border-r border-border bg-card">
        {/* Logo */}
        <div className="h-16 border-b border-border flex items-center px-6">
          <h1 className="text-xl font-bold text-primary">Onboardly</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.page
            return (
              <button
                key={item.name}
                onClick={() => onNavigate?.(item.page)}
                className={cn(
                  "w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary border-r-2 border-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </button>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.email || 'User'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 h-screen flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-border flex items-center px-8 bg-card">
          <h2 className="text-lg font-semibold text-foreground capitalize">
            {currentPage}
          </h2>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
