import { useState } from 'react'
import { executeCode } from '@/lib/judge0'
import { ExecutionResult } from '@/types'

export function useCompiler() {
  const [code, setCode] = useState('// Write your code here...')
  const [language, setLanguage] = useState('javascript')
  const [output, setOutput] = useState<ExecutionResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem('codeforge_fontsize')) || 14)
  const [theme, setTheme] = useState(() => localStorage.getItem('codeforge_theme') || 'vscode-dark')

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
