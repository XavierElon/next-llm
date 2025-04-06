import Chat from '@/components/Chat'

export default function ChatPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-2">
      <div className="w-full max-w-4xl">
        <Chat />
      </div>
    </main>
  )
}
