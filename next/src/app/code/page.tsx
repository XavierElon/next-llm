'use client'

import { useState } from 'react'
import Editor from '@monaco-editor/react'
import { runCode } from '@/services/webcontainer'

export default function CodePage() {
  const [code, setCode] = useState('# Write your Python code here\n\nprint("Hello, World!")')
  const [output, setOutput] = useState('')
  const [language, setLanguage] = useState('python')
  const [isRunning, setIsRunning] = useState(false)

  const handleEditorChange = (value: string | undefined) => {
    if (value) setCode(value)
  }

  const handleRunCode = async () => {
    setIsRunning(true)
    setOutput('Running...')
    try {
      const result = await runCode(language, code)
      setOutput(result)
    } catch (error: any) {
      setOutput(`Error: ${error?.message || 'An error occurred'}`)
    }
    setIsRunning(false)
  }

  return (
    <div className="flex flex-col h-screen bg-[#1b1c1d] text-white">
      <div className="flex-none p-4 border-b border-gray-700 flex items-center justify-between">
        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-[#2d2e2f] text-white px-4 py-2 rounded-lg border border-gray-700">
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
        </select>

        <button onClick={handleRunCode} disabled={isRunning} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
          {isRunning ? 'Running...' : 'Run Code'}
        </button>
      </div>

      <div className="flex-1 flex">
        {/* Editor Panel */}
        <div className="flex-1 p-4">
          <Editor
            height="100%"
            defaultLanguage="python"
            language={language}
            value={code}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true
            }}
          />
        </div>

        {/* Output Panel */}
        <div className="w-1/3 p-4 bg-[#2d2e2f] border-l border-gray-700">
          <div className="font-mono bg-black rounded-lg p-4 h-full overflow-auto">
            <h2 className="text-sm text-gray-400 mb-2">Output:</h2>
            <pre className="text-sm whitespace-pre-wrap">{output || 'Run your code to see output...'}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}
