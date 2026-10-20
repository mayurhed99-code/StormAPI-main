import { useEffect, useRef, useCallback } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client/dist/sockjs.js'

/**
 * Subscribes to STOMP /topic/runs/{runId} and calls onMessage with
 * the parsed RunProgress payload on every 1s tick from the server.
 *
 * RunProgress shape (from report-service MetricsPoller):
 *   { runId, completed, total, failures, avgLatencyMs, status }
 */
export function useRunWebSocket(runId, onMessage) {
  const clientRef = useRef(null)

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      try { clientRef.current.deactivate() } catch (_e) { /* ignore */ }
      clientRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!runId) return

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      reconnectDelay: 2000,
      onConnect: () => {
        client.subscribe(`/topic/runs/${runId}`, (frame) => {
          try {
            const payload = JSON.parse(frame.body)
            onMessage(payload)
          } catch (_e) { /* ignore malformed frames */ }
        })
      },
      onStompError: (frame) => {
        console.error('STOMP error', frame)
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      disconnect()
    }
  }, [runId]) // eslint-disable-line react-hooks/exhaustive-deps

  return { disconnect }
}
