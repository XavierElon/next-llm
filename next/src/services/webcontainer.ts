import { WebContainer } from '@webcontainer/api'

let webcontainerInstance: WebContainer

export async function getWebContainer() {
  if (!webcontainerInstance) {
    webcontainerInstance = await WebContainer.boot()
  }
  return webcontainerInstance
}

export async function runCode(language: string, code: string): Promise<string> {
  const container = await getWebContainer()

  // Create necessary files based on language
  const files = {
    'index.js': {
      file: {
        contents: ''
      }
    }
  }

  if (language === 'python') {
    files['index.js'].file.contents = `
      const fs = require('fs');
      fs.writeFileSync('script.py', ${JSON.stringify(code)});
      require('child_process').execSync('python3 script.py', { stdio: 'inherit' });
    `
  } else if (language === 'javascript') {
    files['index.js'].file.contents = code
  } else if (language === 'typescript') {
    files['index.js'].file.contents = `
      const fs = require('fs');
      fs.writeFileSync('script.ts', ${JSON.stringify(code)});
      require('child_process').execSync('tsc script.ts && node script.js', { stdio: 'inherit' });
    `
  }

  // Mount files
  await container.mount(files)

  try {
    // Install necessary dependencies
    if (language === 'python') {
      await container.spawn('apt-get', ['update'])
      await container.spawn('apt-get', ['install', '-y', 'python3'])
    } else if (language === 'typescript') {
      await container.spawn('npm', ['install', '-g', 'typescript'])
    }

    // Run the code
    const process = await container.spawn('node', ['index.js'])

    // Convert ReadableStream to text
    const reader = process.output.getReader()
    let result = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      result += value
    }

    return result
  } catch (error: any) {
    return `Error: ${error?.message || 'Unknown error occurred'}`
  }
}
