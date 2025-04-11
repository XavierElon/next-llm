'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Editor from '@monaco-editor/react'
import { runCode } from '@/services/webcontainer'

// Add styles at the top of the file
const tooltipStyles = `
.tooltip-container {
  position: relative;
  display: inline-block;
}

.tooltip {
  visibility: hidden;
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: #252526;
  color: #cccccc;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
  margin-top: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 4px;
}

.key {
  background-color: #333333;
  padding: 0px 3px;
  border-radius: 3px;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 11px;
  border: 1px solid #464646;
}

.tooltip-container:hover .tooltip {
  visibility: visible;
}

.button-group {
  display: flex;
  gap: 2px;
  padding: 2px;
  background: #333333;
  border-radius: 5px;
}

.action-button {
  height: 28px;
  padding: 0 8px;
  background: #252526;
  border: none;
  color: #cccccc;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.action-button:hover {
  background: #2a2a2a;
}

.action-button.submit-button {
  color: #89D185;
}

.action-button:first-child {
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
}

.action-button:last-child {
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
}

.action-button svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.debug-button {
  padding: 0 6px;
}

.action-button.debug-button {
  padding: 0 6px;
  color: #DDB100;
}

.language-select {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #252526;
  border: 1px solid #3d3e3f;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 11px;
  color: #cccccc;
  cursor: pointer;
  height: 22px;
}

.language-select:hover {
  background: #2a2a2a;
}

.language-select select {
  background: transparent;
  border: none;
  color: inherit;
  font-size: inherit;
  cursor: pointer;
  outline: none;
  appearance: none;
  padding-right: 12px;
}

.language-select::after {
  content: '';
  width: 0;
  height: 0;
  border-left: 3px solid transparent;
  border-right: 3px solid transparent;
  border-top: 3px solid #cccccc;
  margin-left: -8px;
  pointer-events: none;
}

.language-label {
  display: flex;
  align-items: center;
  font-size: 11px;
  color: #cccccc;
}

.theme-select {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #cccccc;
  cursor: pointer;
  position: relative;
}

.theme-select:hover {
  color: #ffffff;
}

.theme-select::after {
  content: '';
  display: inline-block;
  margin-left: 4px;
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid #cccccc;
  pointer-events: none;
}

.theme-select:hover::after {
  border-top-color: #ffffff;
}

.select-dropdown {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #454545;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  margin-top: 4px;
  z-index: 1000;
  min-width: 100px;
}

.theme-select.open .select-dropdown {
  display: block;
}

.option {
  padding: 4px 8px;
  cursor: pointer;
}

.option:hover {
  background: rgba(0, 0, 0, 0.2);
}
`

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
  const [isThemeOpen, setIsThemeOpen] = useState(false)

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
    setOutput('')
    try {
      // Add a test case to capture print statements and return value separately
      const testCode = `
${code}

# Test the function with a sample input
input = "test"
result = ${problem.functionName}(input)
print("Return value:", result)
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
print("Return value:", result)
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
                  <div className="language-label">Python3</div>

                  <div
                    className={`theme-select ${isThemeOpen ? 'open' : ''}`}
                    onClick={() => setIsThemeOpen(!isThemeOpen)}
                    onBlur={(e) => {
                      // Only close if the next focus target is outside our dropdown
                      if (!e.currentTarget.contains(e.relatedTarget)) {
                        setIsThemeOpen(false)
                      }
                    }}
                    tabIndex={0}>
                    {theme === 'vs-dark' ? 'Dark' : 'Light'}
                    <div className="select-dropdown">
                      <div
                        className="option"
                        onMouseDown={() => {
                          setTheme('vs-dark')
                          setIsThemeOpen(false)
                        }}>
                        Dark
                      </div>
                      <div
                        className="option"
                        onMouseDown={() => {
                          setTheme('light')
                          setIsThemeOpen(false)
                        }}>
                        Light
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pr-4">
                  <style>{tooltipStyles}</style>
                  <div className="button-group">
                    <div className="tooltip-container">
                      <button onClick={handleRunCode} disabled={isRunning} className="action-button">
                        {isRunning ? (
                          <>
                            <span className="loading-dot"></span>
                            <span className="loading-dot"></span>
                            <span className="loading-dot"></span>
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                              <path d="M3.78 2L3 2.41v11.18L3.78 14l8.45-5.1v-.8L3.78 2z" />
                            </svg>
                            Run
                          </>
                        )}
                      </button>
                      <div className="tooltip">
                        Run <span className="key">⌘</span>
                        <span className="key">'</span>
                      </div>
                    </div>

                    <div className="tooltip-container">
                      <button onClick={handleSubmitCode} disabled={isSubmitting} className="action-button submit-button">
                        Submit
                      </button>
                      <div className="tooltip">
                        Submit <span className="key">⌘</span>
                        <span className="key">Enter</span>
                      </div>
                    </div>

                    <div className="tooltip-container">
                      <button onClick={() => {}} className="action-button debug-button">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                          <path d="M8 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm0 6.25a2.75 2.75 0 1 1 0-5.5 2.75 2.75 0 0 1 0 5.5zm6.25-4.5h-1.25a4.49 4.49 0 0 0-1.536-2.536l.884-.884a.5.5 0 1 0-.707-.707l-1.027 1.027A4.5 4.5 0 0 0 8 2.75a4.49 4.49 0 0 0-2.614.85L4.359 2.573a.5.5 0 1 0-.707.707l.884.884A4.49 4.49 0 0 0 3 6.25H1.75a.5.5 0 0 0 0 1h1.25c0 .675.149 1.317.42 1.888l-.795.796a.5.5 0 1 0 .707.707l.927-.927A4.5 4.5 0 0 0 8 11.25a4.5 4.5 0 0 0 3.741-1.996l.927.927a.5.5 0 1 0 .707-.707l-.795-.796c.271-.571.42-1.213.42-1.888h1.25a.5.5 0 0 0 0-1z" />
                        </svg>
                      </button>
                      <div className="tooltip">
                        Debug <span className="key">⌘</span>
                        <span className="key">B</span>
                      </div>
                    </div>
                  </div>
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
                        minimap: { enabled: false },
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
                      <div className="flex flex-col gap-4 p-4">
                        <div>
                          <div className="text-gray-400 text-sm mb-1">Input</div>
                          <div className="bg-[#262626] p-2 rounded">
                            <pre className="text-sm">nums = {problem.testCases[selectedTestCase].input}</pre>
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm mb-1">Expected</div>
                          <div className="bg-[#262626] p-2 rounded">
                            <pre className="text-sm">{problem.testCases[selectedTestCase].expected}</pre>
                          </div>
                        </div>
                        {output && (
                          <>
                            <div>
                              <div className="text-gray-400 text-sm mb-1">Stdout</div>
                              <div className="bg-[#262626] p-2 rounded max-h-[120px] overflow-auto">
                                <pre className="text-sm whitespace-pre-wrap">
                                  {output
                                    .split('\n')
                                    .filter((line) => !line.startsWith('Return value:'))
                                    .join('\n')
                                    .trim() || 'null'}
                                </pre>
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-sm mb-1">Output</div>
                              <div className="bg-[#262626] p-2 rounded">
                                <pre className="text-sm">
                                  {output
                                    .split('\n')
                                    .find((line) => line.startsWith('Return value:'))
                                    ?.replace('Return value:', '')
                                    .trim()}
                                </pre>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
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
