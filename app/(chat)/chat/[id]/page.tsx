import { type Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { auth } from '@/auth'
import { getChat, getMissingKeys } from '@/app/actions'
import { Chat } from '@/components/chat'
//import { AI } from '@/lib/chat/actions'
import { AI } from '../../../../lib/chat/actions'
import { Session } from '@/lib/types'

export interface ChatPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({
  params
}: ChatPageProps): Promise<Metadata> {
  const session = await auth()

  if (!session?.user) {
    return {}
  }

  const chat = await getChat(params.id, session.user.id)
  return {
    title: chat?.title.toString().slice(0, 50) ?? 'Chat'
  }
}

export default async function ChatPage({ params }: ChatPageProps) {
  const session = (await auth()) as Session
  const missingKeys = await getMissingKeys()

  if (!session?.user) {
    redirect(`/login?next=/chat/${params.id}`)
  }

  const userId = session.user.id as string
  const chat = await getChat(params.id, userId)

  if (!chat) {
    redirect('/')
  }

  if (chat?.userId !== session?.user?.id) {
    notFound()
  }

  const filteredMessages = chat.messages.filter(
  (m) => m.role !== 'function' && m.role !== 'tool'
  )
  return (
  <AI
    initialAIState={{
      chatId: chat.id,
      // filtriamo via eventuali messaggi "function" / "tool"
      messages: filteredMessages as any,
    }}
  >
    <Chat
      id={chat.id}
      session={session}
      initialMessages={filteredMessages as any}
      missingKeys={missingKeys}
    />
  </AI>
)

}
