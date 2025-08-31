import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function UserTest() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  
  // Create User Form
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: ''
  })

  // Login Form
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  })

  const addResult = (label: string, data: any) => {
    setResults(prev => [...prev, { 
      label, 
      data, 
      timestamp: new Date().toLocaleTimeString(),
      success: !data.error
    }])
  }

  const clearResults = () => setResults([])

  const createUser = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      })
      const result = await response.json()
      addResult('Create User', result)
      
      if (result.success) {
        setCreateForm({ email: '', password: '', fullName: '', phone: '' })
      }
    } catch (error) {
      addResult('Create User', { error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  const loginUser = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      })
      const result = await response.json()
      addResult('Login User', result)
    } catch (error) {
      addResult('Login User', { error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  const listUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/users')
      const result = await response.json()
      addResult('List Users', result)
    } catch (error) {
      addResult('List Users', { error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  const createTestAdmin = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'hello.krsolutions@gmail.com',
          password: 'MySuccess@2025',
          fullName: 'Admin User',
          phone: '+91 9876543210'
        })
      })
      const result = await response.json()
      addResult('Create Admin', result)
    } catch (error) {
      addResult('Create Admin', { error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  const createTestUser = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@test.com',
          password: 'password123',
          fullName: 'Test User',
          phone: '+91 9876543211'
        })
      })
      const result = await response.json()
      addResult('Create Test User', result)
    } catch (error) {
      addResult('Create Test User', { error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">User Management Testing</h1>
          <p className="text-muted-foreground">Test user creation, login, and role-based authentication</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Forms */}
          <div className="space-y-6">
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="create">Create User</TabsTrigger>
                <TabsTrigger value="login">Login User</TabsTrigger>
              </TabsList>

              <TabsContent value="create">
                <Card>
                  <CardHeader>
                    <CardTitle>Create New User</CardTitle>
                    <CardDescription>Register a new user account</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="create-email">Email</Label>
                      <Input
                        id="create-email"
                        type="email"
                        value={createForm.email}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                        placeholder="user@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="create-password">Password</Label>
                      <Input
                        id="create-password"
                        type="password"
                        value={createForm.password}
                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                        placeholder="password123"
                      />
                    </div>
                    <div>
                      <Label htmlFor="create-name">Full Name</Label>
                      <Input
                        id="create-name"
                        value={createForm.fullName}
                        onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="create-phone">Phone</Label>
                      <Input
                        id="create-phone"
                        value={createForm.phone}
                        onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                        placeholder="+91 9876543210"
                      />
                    </div>
                    <Button onClick={createUser} disabled={loading} className="w-full">
                      Create User
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle>Login User</CardTitle>
                    <CardDescription>Test user authentication</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        placeholder="user@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        placeholder="password123"
                      />
                    </div>
                    <Button onClick={loginUser} disabled={loading} className="w-full">
                      Login
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Pre-configured test actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={createTestAdmin} disabled={loading} className="w-full" variant="outline">
                  Create Test Admin
                </Button>
                <Button onClick={createTestUser} disabled={loading} className="w-full" variant="outline">
                  Create Test User
                </Button>
                <Button onClick={listUsers} disabled={loading} className="w-full" variant="outline">
                  List All Users
                </Button>
                <Separator />
                <Button onClick={clearResults} variant="destructive" className="w-full">
                  Clear Results
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Results */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>API responses and status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {results.map((result, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{result.label}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={result.success ? "default" : "destructive"}>
                            {result.success ? "Success" : "Error"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{result.timestamp}</span>
                        </div>
                      </div>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                  
                  {results.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      No test results yet. Try creating a user or running other tests.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
