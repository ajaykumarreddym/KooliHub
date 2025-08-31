import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

export const Debug: React.FC = () => {
  const [results, setResults] = useState<any[]>([])
  const [email, setEmail] = useState('hello.krsolutions@gmail.com')
  const [password, setPassword] = useState('MySuccess@2025')

  const addResult = (label: string, data: any) => {
    setResults(prev => [...prev, { label, data, timestamp: new Date() }])
  }

  const testConnection = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1)
      addResult('Database Connection', { success: !error, data, error })
    } catch (error) {
      addResult('Database Connection', { success: false, error })
    }
  }

  const testSignUp = async () => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: 'Admin User' }
        }
      })
      addResult('Sign Up Test', { data, error })
    } catch (error) {
      addResult('Sign Up Test', { error })
    }
  }

  const testSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      addResult('Sign In Test', { data, error })
    } catch (error) {
      addResult('Sign In Test', { error })
    }
  }

  const checkProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
      
      addResult('Check Profiles', { data, error })
    } catch (error) {
      addResult('Check Profiles', { error })
    }
  }

  const setupAdmin = async () => {
    try {
      const response = await fetch('/api/setup/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const result = await response.json()
      addResult('Setup Admin', result)
    } catch (error) {
      addResult('Setup Admin', { error })
    }
  }

  const checkDatabase = async () => {
    try {
      const response = await fetch('/api/check/database')
      const result = await response.json()
      addResult('Database Check', result)
    } catch (error) {
      addResult('Database Check', { error })
    }
  }

  const testAuthAPI = async () => {
    try {
      const response = await fetch('/api/test/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const result = await response.json()
      addResult('API Auth Test', result)
    } catch (error) {
      addResult('API Auth Test', { error })
    }
  }

  const clearResults = () => setResults([])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Admin Auth Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={checkDatabase}>Check Database</Button>
            <Button onClick={testConnection}>Test DB Connection</Button>
            <Button onClick={setupAdmin}>Setup Admin</Button>
            <Button onClick={testAuthAPI}>Test API Auth</Button>
            <Button onClick={testSignUp}>Test Sign Up</Button>
            <Button onClick={testSignIn}>Test Sign In</Button>
            <Button onClick={checkProfiles}>Check Profiles</Button>
            <Button variant="outline" onClick={clearResults}>Clear</Button>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index} className="p-3 border rounded">
                <div className="font-medium text-sm">
                  {result.label} - {result.timestamp.toLocaleTimeString()}
                </div>
                <pre className="text-xs mt-2 bg-gray-50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
