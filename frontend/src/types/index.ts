export type Language = 'javascript' | 'python' | 'cpp' | 'java' | 'rust' | 'c' | 'go' | 'swift'

export interface User {
  id: string
  email: string
  username: string
  created_at: string
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
  created_at: string
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
