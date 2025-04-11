'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Editor from '@monaco-editor/react'
import { runCode } from '@/services/webcontainer'

interface TestCase {
  id: number
  input: string
  expected: string
  description: string | null
}

interface Problem {
  id: number
  title: string
  description: string
  difficulty: string
  category: string
  tags: string[]
  testCases: TestCase[]
  functionName: string
}

export default function CodePage() {
  const searchParams = useSearchParams()
  const problemId = searchParams.get('problem')

  const [language, setLanguage] = useState('python')
  const [theme, setTheme] = useState('vs-dark')
  const [code, setCode] = useState('')
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [problem, setProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedTestCase, setSelectedTestCase] = useState(0)

  // Audio for success and failure sounds
  const successSound = typeof window !== 'undefined' ? new Audio('/assets/grunt-birthday-party-sound-effect.mp3') : null
  const failureSound = typeof window !== 'undefined' ? new Audio('/assets/fatality.mp3') : null

  useEffect(() => {
    const fetchProblem = async () => {
      if (!problemId) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/problems/${problemId}`)
        const data = await response.json()
        console.log('API Response:', data)
        setProblem(data)
        console.log('Problem state:', data)
        setCode(getDefaultCode(language, data))
      } catch (error) {
        console.error('Error fetching problem:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProblem()
  }, [problemId, language])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command + ' for Run Code
      if ((e.metaKey || e.ctrlKey) && e.key === "'") {
        e.preventDefault()
        handleRunCode()
      }

      // Command + Enter for Submit
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleSubmitCode()
      }
    }

    // Add the event listener to the document to catch events before the editor
    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [code, problem])

  const getDefaultCode = (lang: string, problem?: Problem) => {
    if (!problem) {
      return '// Select a problem to start coding'
    }

    const functionName = problem.functionName || 'solution'

    if (lang === 'python') {
      return `def ${functionName}(input):
    # Your solution here
    pass`
    }
    return `// Problem: ${problem.title}
// ${problem.description}

// Your solution here
`
  }

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang)
  }

  const handleRunCode = async () => {
    if (!problem) return

    setIsRunning(true)
    setOutput('Running code...')
    try {
      // Add a test case to capture print statements
      const testCode = `
${code}

# Test the function with a sample input
input = "test"
result = ${problem.functionName}(input)
print(result)
`
      const result = await runCode(language, testCode)
      setOutput(result)
    } catch (error: any) {
      setOutput(`Error: ${error?.message || 'An error occurred'}`)
    } finally {
      setIsRunning(false)
    }
  }

  const handleSubmitCode = async () => {
    if (!problem) return

    setIsSubmitting(true)
    setOutput('Running tests...')
    try {
      let allTestsPassed = true
      let testOutput = 'Test Results:\n\n'
      const results = []
      const testStatuses = []

      for (let i = 0; i < problem.testCases.length; i++) {
        const test = problem.testCases[i]
        const testCode = `
${code}

# Test case ${i + 1}
input = ${test.input}
result = ${problem.functionName}(input)
print(result)
`

        let result
        try {
          result = await runCode(language, testCode)
        } catch (error: any) {
          if (error.message.includes('timed out')) {
            testOutput += `Test ${i + 1}: ${test.description || 'No description'}\n`
            testOutput += `Input: ${test.input}\n`
            testOutput += `Timed out - possible infinite loop\n`
            testOutput += '❌ Failed\n\n'
            allTestsPassed = false
            testStatuses.push(false)
            results.push('')
            continue
          } else {
            throw error
          }
        }

        results.push(result)
        const expected = test.expected
        const lines = result.trim().split('\n')
        const lastLine = lines[lines.length - 1]
        const passed = lastLine === expected

        testOutput += `Test ${i + 1}: ${test.description || 'No description'}\n`
        testOutput += `Input: ${test.input}\n`
        testOutput += `Expected: "${expected}", Got: "${lastLine}"\n`
        testOutput += passed ? '✅ Passed\n' : '❌ Failed\n'
        testOutput += '\n'

        testStatuses.push(passed)
        if (!passed) {
          allTestsPassed = false
        }
      }

      const passedCount = testStatuses.filter((status) => status).length
      testOutput += `Summary: Passed ${passedCount}/${problem.testCases.length} tests\n`

      setOutput(testOutput)

      // Play appropriate sound based on test results
      if (allTestsPassed && successSound) {
        successSound.play().catch((error) => {
          console.error('Failed to play success sound:', error)
        })
      } else if (!allTestsPassed && failureSound) {
        failureSound.play().catch((error) => {
          console.error('Failed to play failure sound:', error)
        })
      }
    } catch (error: any) {
      setOutput(`Error: ${error?.message || 'An error occurred'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 bg-[#1b1c1d] text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-[#1b1c1d] text-white min-h-screen">
      <div className="max-w-5xl mx-auto">
        {problem ? (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold">{problem.title}</h1>
              <p className="text-gray-400 mt-2">{problem.description}</p>
              <div className="flex gap-2 mt-4">
                {problem.tags.map((tag) => (
                  <span key={tag} className="bg-[#2d2e2f] text-gray-400 px-3 py-1 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
                <span className={`px-3 py-1 rounded-full text-sm ${problem.difficulty === 'Easy' ? 'bg-green-900 text-green-300' : problem.difficulty === 'Medium' ? 'bg-yellow-900 text-yellow-300' : 'bg-red-900 text-red-300'}`}>{problem.difficulty}</span>
              </div>
            </div>

            <div className="bg-[#2d2e2f] rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <div className="flex gap-4">
                  {/* <select value={language} onChange={(e) => handleLanguageChange(e.target.value)} className="bg-[#1b1c1d] text-white px-4 py-2 rounded-lg border border-gray-700">
                    <option value="python">Python</option>
                  </select> */}

                  <select value={theme} onChange={(e) => setTheme(e.target.value)} className="bg-[#1b1c1d] text-white px-4 py-2 rounded-lg border border-gray-700">
                    <option value="vs-dark">Dark</option>
                    <option value="light">Light</option>
                  </select>
                </div>

                <div className="flex gap-4">
                  <button onClick={handleRunCode} disabled={isRunning} className="bg-[#2d2e2f] hover:bg-[#3d3e3f] text-white px-4 py-1.5 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
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

                  <button onClick={handleSubmitCode} disabled={isSubmitting} className="bg-[#2d2e2f] hover:bg-[#3d3e3f] text-white px-4 py-1.5 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                    {isSubmitting ? (
                      <>
                        <span className="loading-dot"></span>
                        <span className="loading-dot"></span>
                        <span className="loading-dot"></span>
                      </>
                    ) : (
                      'Submit'
                    )}
                  </button>
                </div>
              </div>

              <div className="flex">
                <div className="flex-1 flex flex-col">
                  <div style={{ height: 'calc(100vh - 400px)', minHeight: '400px', maxHeight: '500px' }}>
                    <Editor
                      height="100%"
                      defaultLanguage="python"
                      language={language}
                      theme={theme}
                      value={code}
                      onChange={(value) => setCode(value || '')}
                      beforeMount={(monaco) => {
                        monaco.editor.addKeybindingRule({
                          keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
                          command: 'noop',
                          when: 'editorTextFocus'
                        })

                        monaco.editor.defineTheme('custom-dark', {
                          base: 'vs-dark',
                          inherit: true,
                          rules: [],
                          colors: {
                            'editor.background': '#262626'
                          }
                        })
                      }}
                      onMount={(editor) => {
                        editor.updateOptions({ theme: 'custom-dark' })
                      }}
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
                        formatOnType: true,
                        quickSuggestions: false,
                        suggestOnTriggerCharacters: false,
                        acceptSuggestionOnEnter: 'off',
                        lineDecorationsWidth: 0,
                        lineNumbersMinChars: 3,
                        renderLineHighlight: 'none',
                        scrollbar: {
                          vertical: 'hidden',
                          horizontal: 'hidden',
                          useShadows: false,
                          verticalScrollbarSize: 0,
                          horizontalScrollbarSize: 0
                        },
                        multiCursorModifier: 'alt',
                        autoClosingBrackets: 'never',
                        autoClosingQuotes: 'never',
                        autoSurround: 'never',
                        glyphMargin: false,
                        folding: false
                      }}
                    />
                  </div>

                  {problem && problem.testCases && (
                    <div className="bg-[#1e1e1e] border-t border-gray-700">
                      <div className="flex items-center gap-2 px-4 py-2">
                        {problem.testCases.map((testCase, index) => (
                          <button key={testCase.id} onClick={() => setSelectedTestCase(index)} className={`px-3 py-1 rounded-md text-sm ${index === selectedTestCase ? 'bg-[#2d2e2f] text-white' : 'text-gray-400 hover:text-white'}`}>
                            Case {index + 1}
                          </button>
                        ))}
                      </div>
                      <div className="p-4 space-y-2">
                        <div>
                          <div className="text-gray-400 text-sm">Input</div>
                          <div className="bg-[#262626] p-2 rounded mt-1">
                            <pre className="text-sm">nums = {problem.testCases[selectedTestCase].input}</pre>
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm">Expected</div>
                          <div className="bg-[#262626] p-2 rounded mt-1">
                            <pre className="text-sm">{problem.testCases[selectedTestCase].expected}</pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-1/3 p-4 bg-[#1b1c1d] border-l border-gray-700">
                  <div className="font-mono bg-[#2d2e2f] rounded-lg p-4 h-full overflow-auto">
                    <h2 className="text-sm text-gray-400 mb-2">Output:</h2>
                    <pre className="text-sm whitespace-pre-wrap">{output || 'Run your code to see output...'}</pre>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold mb-4">No Problem Selected</h1>
            <p className="text-gray-400">Please select a problem from the problems page to start coding.</p>
          </div>
        )}
      </div>
    </div>
  )
}
