import { useState, useEffect } from 'react'
import { executeCode } from '@/lib/judge0'
import { ExecutionResult, User } from '@/types'

export function useCompiler(user: User | null = null) {
  const [code, setCode] = useState('// Write your code here...')
  const [language, setLanguage] = useState('javascript')
  const [output, setOutput] = useState<ExecutionResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [fontSize, setFontSize] = useState(14)
  const [theme, setTheme] = useState('vs-dark')

  // Initialize from user preferences or localStorage
  useEffect(() => {
    if (user?.preferences) {
      setFontSize(user.preferences.fontSize)
      setTheme(user.preferences.theme)
    } else {
      const savedSize = localStorage.getItem('codeforge_fontsize')
      const savedTheme = localStorage.getItem('codeforge_theme')
      if (savedSize) setFontSize(Number(savedSize))
      if (savedTheme) setTheme(savedTheme)
    }
  }, [user])

  const runCode = async (languageId: number) => {
    setIsRunning(true)
    setOutput(null)
    try {
      const result = await executeCode(languageId, code)
      setOutput(result as any)
    } catch (err) {
      setOutput({
        stdout: null,
        stderr: 'Execution failed. Please check your connection or API key.',
        compile_output: null,
        message: null,
        status: { id: 0, description: 'Error' },
        time: '0.0',
        memory: 0
      })
    } finally {
      setIsRunning(false)
    }
  }

  const updateFontSize = (size: number) => {
    setFontSize(size)
    localStorage.setItem('codeforge_fontsize', String(size))
  }

  const updateTheme = (newTheme: string) => {
    setTheme(newTheme)
    localStorage.setItem('codeforge_theme', newTheme)
  }

  return { 
    code, setCode, 
    language, setLanguage, 
    output, setOutput, isRunning, runCode,
    fontSize, updateFontSize,
    theme, updateTheme
  }
}
