import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { blink } from '@/lib/blink'
import { Plus, Users, Mail, Trash2, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Company, Customer } from '@/types'

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    companyId: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const user = await blink.auth.me()
      if (!user) return

      const [customersData, companiesData] = await Promise.all([
        blink.db.customers.list<Customer>({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' }
        }),
        blink.db.companies.list<Company>({ where: { userId: user.id } })
      ])

      setCustomers(customersData)
      setCompanies(companiesData)
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load customers')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.email.trim() || !formData.companyId) {
      toast.error('Email and company are required')
      return
    }

    try {
      const user = await blink.auth.me()
      if (!user) return

      await blink.db.customers.create({
        userId: user.id,
        companyId: formData.companyId,
        email: formData.email,
        name: formData.name || undefined,
        phone: formData.phone || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      toast.success('Customer added successfully')
      setIsDialogOpen(false)
      setFormData({ email: '', name: '', phone: '', companyId: '' })
      loadData()
    } catch (error) {
      console.error('Failed to create customer:', error)
      toast.error('Failed to add customer')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this customer? All progress will be lost.')) return

    try {
      await blink.db.customers.delete(id)
      toast.success('Customer deleted')
      loadData()
    } catch (error) {
      console.error('Failed to delete customer:', error)
      toast.error('Failed to delete customer')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse w-48" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
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
          <h1 className="text-3xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground mt-1">
            Manage customers being onboarded
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No companies yet</h3>
            <p className="text-sm text-muted-foreground">
              Create a company first before adding customers
            </p>
          </CardContent>
        </Card>
      ) : customers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No customers yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first customer to start onboarding
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Customer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {customers.map((customer) => {
            const company = companies.find(c => c.id === customer.companyId)
            return (
              <Card key={customer.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary">
                          {customer.name?.[0]?.toUpperCase() || customer.email[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg truncate">
                            {customer.name || 'Unnamed Customer'}
                          </CardTitle>
                          <Badge variant="outline">{company?.name || 'Unknown'}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </span>
                          {customer.phone && (
                            <span>{customer.phone}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(customer.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Added {new Date(customer.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Add a customer to start the onboarding process
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
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="customer@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Add Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
