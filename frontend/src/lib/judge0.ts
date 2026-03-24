import axios from 'axios'

const RAPIDAPI_KEY = import.meta.env.VITE_JUDGE0_API_KEY
const JUDGE0_URL = import.meta.env.VITE_JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com'

export async function executeCode(languageId: number, sourceCode: string): Promise<any> {
  try {
    // Unicode-safe Base64 encoding
    const encodedSource = btoa(
      new Uint8Array(new TextEncoder().encode(sourceCode))
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    )

    const headers: Record<string, string> = {}
    if (RAPIDAPI_KEY) {
      headers['X-RapidAPI-Key'] = RAPIDAPI_KEY
      headers['X-RapidAPI-Host'] = new URL(JUDGE0_URL).hostname
    }

    const response = await axios.post(
      `${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`,
      {
        language_id: languageId,
        source_code: encodedSource,
      },
      { headers }
    )

    const data = response.data
    const decode = (str: string | null) => {
      if (!str) return null
      try {
        const binaryString = atob(str)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        return new TextDecoder().decode(bytes)
      } catch (e) {
        return atob(str) // Fallback to plain atob if decoding fails
      }
    }

    return {
      ...data,
      stdout: decode(data.stdout),
      stderr: decode(data.stderr),
      compile_output: decode(data.compile_output),
      message: decode(data.message),
    }
  } catch (error) {
    console.error('Code execution failed:', error)
    throw error
  }
}
