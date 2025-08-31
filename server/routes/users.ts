import { RequestHandler } from 'express'
import { supabase } from '../lib/supabase'

// Create a new user (signup)
export const createUser: RequestHandler = async (req, res) => {
  try {
    const { email, password, fullName, phone } = req.body

    console.log('Creating user with:', { email, fullName, phone })

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      })
    }

    // Create user in auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone
        }
      }
    })

    console.log('Auth signup result:', { authData, authError })

    if (authError) {
      return res.status(400).json({ 
        error: authError.message 
      })
    }

    if (!authData.user) {
      return res.status(400).json({ 
        error: 'Failed to create user' 
      })
    }

    // Create profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: email,
        full_name: fullName || null,
        phone: phone || null,
        role: email === 'hello.krsolutions@gmail.com' ? 'admin' : 'user'
      }, {
        onConflict: 'id'
      })
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return res.status(500).json({ 
        error: 'Failed to create user profile' 
      })
    }

    console.log('User created successfully:', profileData)

    res.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        profile: profileData
      }
    })

  } catch (error) {
    console.error('User creation error:', error)
    res.status(500).json({
      error: 'Failed to create user',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}

// Get user by ID
export const getUserById: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      return res.status(404).json({ 
        error: 'User not found' 
      })
    }

    res.json({
      success: true,
      profile
    })

  } catch (error) {
    console.error('Error fetching user:', error)
    res.status(500).json({
      error: 'Failed to fetch user'
    })
  }
}

// Login user
export const loginUser: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body

    console.log('Login attempt for:', email)

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      })
    }

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      console.log('Auth error:', authError)
      return res.status(401).json({ 
        error: authError.message 
      })
    }

    if (!authData.user) {
      return res.status(401).json({ 
        error: 'Authentication failed' 
      })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      // If profile doesn't exist, create it
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: authData.user.email || '',
          full_name: authData.user.user_metadata?.full_name || null,
          phone: authData.user.user_metadata?.phone || null,
          role: authData.user.email === 'hello.krsolutions@gmail.com' ? 'admin' : 'user'
        })
        .select()
        .single()

      if (createError) {
        return res.status(500).json({ 
          error: 'Failed to create user profile' 
        })
      }

      return res.json({
        success: true,
        message: 'Login successful',
        user: authData.user,
        profile: newProfile,
        session: authData.session
      })
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: authData.user,
      profile,
      session: authData.session
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      error: 'Login failed',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}

// List all users (admin only)
export const listUsers: RequestHandler = async (req, res) => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, role, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ 
        error: 'Failed to fetch users' 
      })
    }

    res.json({
      success: true,
      users: profiles,
      total: profiles?.length || 0
    })

  } catch (error) {
    console.error('Error listing users:', error)
    res.status(500).json({
      error: 'Failed to list users'
    })
  }
}

// Update user role (admin only)
export const updateUserRole: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params
    const { role } = req.body

    if (!['admin', 'user', 'guest'].includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role. Must be admin, user, or guest' 
      })
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        role, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ 
        error: 'Failed to update user role' 
      })
    }

    res.json({
      success: true,
      message: 'User role updated successfully',
      profile: data
    })

  } catch (error) {
    console.error('Error updating user role:', error)
    res.status(500).json({
      error: 'Failed to update user role'
    })
  }
}
