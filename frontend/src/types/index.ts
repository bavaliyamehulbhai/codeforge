export type Language = 'javascript' | 'python' | 'cpp' | 'java' | 'rust' | 'c' | 'go' | 'swift'

export interface User {
  id: string
  email: string
  username: string
  avatar_url?: string | null
  bio: string
  website: string
  social_links: {
    github: string
    twitter: string
    linkedin: string
  }
  preferences: {
    theme: string
    fontSize: number
    autoSave: boolean
    tabSize: number
    voiceEnabled: boolean
  }
  plan?: 'free' | 'pro' | 'team' | 'enterprise'
  subscription?: {
    status: string
    provider: string
    current_period_end: string | null
    cancel_at_period_end?: boolean
  }
  usage?: {
    compiler_runs: number
    voice_minutes: number
    updated_at: string | null
  }
  streak_count: number
  achievements: Achievement[]
  last_active: string | null
  created_at: string
}

export interface UsageLimits {
  compiler_runs: number
  voice_minutes: number
}

export interface Achievement {
  id: string
  name: string
  icon: string
  earned_at: string
}

export interface Snippet {
  id: string
  user_id: string
  workspace_id?: string | null
  title: string
  language: string
  code: string
  is_public: boolean
  likes: number
  run_count: number
  tags: string[]
  created_at: string
  updated_at: string
}

export interface ExecutionResult {
  stdout: string | null
  stderr: string | null
  compile_output: string | null
  message: string | null
  time: string | null
  memory: number | null
  status: {
    id: number
    description: string
  }
}

export interface AuthState {
  user: User | null
  loading: boolean
}

export interface SnippetsState {
  snippets: Snippet[]
  loading: boolean
}
