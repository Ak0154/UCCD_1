import { useEffect, useRef, useState, useCallback } from 'react'
import type { WebSocketEvent } from '../types/complaint'

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:8000/api/v1'
const RECONNECT_DELAY_MS = 3000
const MAX_RECONNECT_ATTEMPTS = 5

interface UseWebSocketOptions {
  onEvent?: (event: WebSocketEvent) => void
  reconnect?: boolean
}

export function useWebSocket(path: string, options: UseWebSocketOptions = {}) {
  const { onEvent, reconnect = true } = options
  const [lastMessage, setLastMessage] = useState<WebSocketEvent | null>(null)
  const [readyState, setReadyState] = useState<number>(WebSocket.CLOSED)
  const [events, setEvents] = useState<WebSocketEvent[]>([])

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const url = `${WS_BASE_URL}${path}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setReadyState(WebSocket.OPEN)
      reconnectAttemptsRef.current = 0
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WebSocketEvent
        setLastMessage(data)
        setEvents((prev) => [...prev.slice(-99), data])
        onEvent?.(data)
      } catch {
        // ignore malformed messages
      }
    }

    ws.onclose = () => {
      setReadyState(WebSocket.CLOSED)
      if (reconnect && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current += 1
        reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS)
      }
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [path, reconnect, onEvent])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  const sendMessage = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  return {
    lastMessage,
    events,
    sendMessage,
    readyState,
    isConnected: readyState === WebSocket.OPEN,
  }
}