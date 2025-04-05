import Chat from '@/components/Chat'

export default function ChatPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center">Gemini AI Chat</h1>
        <Chat />
      </div>
    </main>
  )
}
