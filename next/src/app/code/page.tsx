'use client'

import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { runCode } from '@/services/webcontainer'

export default function CodePage() {
  const [language, setLanguage] = useState('python')
  const [theme, setTheme] = useState('vs-dark')
  const [code, setCode] = useState('')
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)

  const getDefaultCode = (lang: string) => {
    switch (lang) {
      case 'python':
        return '# Python Example\n\ndef greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("World"))'
      case 'javascript':
        return '// JavaScript Example\n\nfunction greet(name) {\n    return `Hello, ${name}!`;\n}\n\nconsole.log(greet("World"));'
      case 'typescript':
        return '// TypeScript Example\n\nfunction greet(name: string): string {\n    return `Hello, ${name}!`;\n}\n\nconsole.log(greet("World"));'
      case 'java':
        return '// Java Example\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}'
      default:
        return '// Start coding here'
    }
  }

  // Initialize code when language changes
  useEffect(() => {
    setCode(getDefaultCode(language))
  }, [language])

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang)
  }

  const handleRunCode = async () => {
    setIsRunning(true)
    setOutput('Running...')
    try {
      const result = await runCode(language, code)
      setOutput(result)
    } catch (error: any) {
      setOutput(`Error: ${error?.message || 'An error occurred'}`)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="p-8 bg-[#1b1c1d] text-white min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Code Editor</h1>

        <div className="bg-[#2d2e2f] rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex gap-4">
              <select value={language} onChange={(e) => handleLanguageChange(e.target.value)} className="bg-[#1b1c1d] text-white px-4 py-2 rounded-lg border border-gray-700">
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="csharp">C#</option>
                <option value="php">PHP</option>
                <option value="ruby">Ruby</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
              </select>

              <select value={theme} onChange={(e) => setTheme(e.target.value)} className="bg-[#1b1c1d] text-white px-4 py-2 rounded-lg border border-gray-700">
                <option value="vs-dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>

            <button onClick={handleRunCode} disabled={isRunning} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {isRunning ? (
                <>
                  <span className="loading-dot"></span>
                  <span className="loading-dot"></span>
                  <span className="loading-dot"></span>
                </>
              ) : (
                'Run Code'
              )}
            </button>
          </div>

          <div className="flex">
            <div className="flex-1" style={{ height: '600px' }}>
              <Editor
                height="100%"
                defaultLanguage="python"
                language={language}
                theme={theme}
                value={code}
                onChange={(value) => setCode(value || '')}
                options={{
                  minimap: { enabled: true },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                  formatOnPaste: true,
                  formatOnType: true
                }}
              />
            </div>

            <div className="w-1/3 p-4 bg-[#1b1c1d] border-l border-gray-700">
              <div className="font-mono bg-[#2d2e2f] rounded-lg p-4 h-full overflow-auto">
                <h2 className="text-sm text-gray-400 mb-2">Output:</h2>
                <pre className="text-sm whitespace-pre-wrap">{output || 'Run your code to see output...'}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
