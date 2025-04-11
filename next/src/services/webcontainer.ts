import { WebContainer } from '@webcontainer/api'

let webcontainerInstance: WebContainer | null = null
let isInitialized = false

export async function getWebContainer() {
  if (!isInitialized) {
    webcontainerInstance = await WebContainer.boot()
    isInitialized = true

    // Install Python dependencies once during initialization
    const installProcess = await webcontainerInstance.spawn('apt-get', ['update'])
    await installProcess.exit
    const pythonProcess = await webcontainerInstance.spawn('apt-get', ['install', '-y', 'python3'])
    await pythonProcess.exit
  }
  return webcontainerInstance
}

export async function cleanupWebContainer() {
  if (webcontainerInstance) {
    await webcontainerInstance.teardown()
    webcontainerInstance = null
    isInitialized = false
  }
}

export async function runCode(language: string, code: string): Promise<string> {
  console.time('runCode')
  const container = await getWebContainer()
  console.timeLog('runCode', 'WebContainer initialized')

  if (!container) {
    throw new Error('Failed to initialize WebContainer')
  }

  let process: any = null

  try {
    const files = {
      'script.py': {
        file: {
          contents: code
        }
      }
    }

    console.timeLog('runCode', 'Mounting files')
    await container.mount(files)
    console.timeLog('runCode', 'Files mounted')

    console.timeLog('runCode', 'Spawning process')
    process = await container.spawn('python3', ['script.py'])
    console.timeLog('runCode', 'Process spawned')

    const timeout = setTimeout(() => {
      if (process) {
        process.kill()
        throw new Error('Execution timed out after 15 seconds')
      }
    }, 15000)

    let output = ''
    process.output.pipeTo(
      new WritableStream({
        write(chunk) {
          output += chunk
        }
      })
    )

    console.timeLog('runCode', 'Waiting for process exit')
    const exitCode = await process.exit
    console.timeLog('runCode', 'Process exited')
    clearTimeout(timeout)

    if (exitCode !== 0) {
      throw new Error(`Process exited with code ${exitCode}`)
    }

    return output
  } catch (error: any) {
    console.error('runCode error:', error)
    if (process) {
      process.kill()
    }
    return `Error: ${error?.message || 'Unknown error occurred'}`
  } finally {
    if (process) {
      process.kill()
    }
    console.timeEnd('runCode')
  }
}
