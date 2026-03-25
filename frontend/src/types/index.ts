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
  streak_count: number
  achievements: Achievement[]
  last_active: string | null
  created_at: string
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
