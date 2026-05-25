import { useSearchParams } from 'react-router-dom'
import { QueuePage } from './QueuePage'

export function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') ?? undefined

  return <QueuePage searchQuery={query} defaultStatus="" />
}
