import { useEffect, useRef, useState } from 'react'

export function useWebSocket(url) {
  const [lastMessage, setLastMessage] = useState(null)
  const [readyState, setReadyState] = useState(WebSocket.CONNECTING)
  const wsRef = useRef(null)
  const messageQueueRef = useRef([])
  const reconnectTimeoutRef = useRef(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    
    const connect = () => {
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }

      try {
        const ws = new WebSocket(url)
        wsRef.current = ws

        ws.onopen = () => {
          if (!isMountedRef.current) {
            ws.close()
            return
          }
          setReadyState(WebSocket.OPEN)
          // Send any queued messages
          while (messageQueueRef.current.length > 0) {
            const msg = messageQueueRef.current.shift()
            if (msg && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(msg))
            }
          }
        }

        ws.onmessage = (event) => {
          if (!isMountedRef.current) return
          
          // Handle newline-separated JSON messages (backend batches multiple messages)
          const rawData = String(event.data)
          const messages = rawData.split('\n').filter(line => line.trim().length > 0)
          
          // If no newlines, treat as single message (backward compatibility)
          if (messages.length === 0 && rawData.trim().length > 0) {
            messages.push(rawData.trim())
          }
          
          for (let i = 0; i < messages.length; i++) {
            const messageStr = messages[i].trim()
            if (!messageStr) continue
            
            try {
              const message = JSON.parse(messageStr)
              setLastMessage(message)
            } catch (e) {
              console.error(`Failed to parse message ${i}:`, e, messageStr)
            }
          }
        }

        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
        }

        ws.onclose = (event) => {
          if (!isMountedRef.current) return
          
          setReadyState(WebSocket.CLOSED)
          // 1000 = normal close (e.g. component unmount / Strict Mode). Don't log as error.
          if (event.code !== 1000) {
            console.log('WebSocket closed:', event.code, event.reason || 'No reason')
          }
          // Don't reconnect on 1006 (abnormal closure) - backend likely not running/configured
          if (event.code !== 1000 && event.code !== 1006 && isMountedRef.current) {
            reconnectTimeoutRef.current = setTimeout(() => {
              if (isMountedRef.current) {
                console.log('Attempting to reconnect WebSocket...')
                connect()
              }
            }, 5000)
          } else if (event.code === 1006) {
            console.error(`WebSocket connection failed (1006) to ${url}. Ensure:`)
            console.error('1. Backend server is running')
            console.error('2. VITE_BACKEND_URL in .env.local matches your backend URL')
            console.error('3. Dev server was restarted after changing .env files')
            console.error(`   Current URL: ${url}`)
          }
        }
      } catch (error) {
        console.error('Failed to create WebSocket:', error)
        setReadyState(WebSocket.CLOSED)
      }
    }

    connect()

    return () => {
      isMountedRef.current = false
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting')
        wsRef.current = null
      }
    }
  }, [url])

  const sendMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
      messageQueueRef.current.push(message)
    }
  }

  return { lastMessage, sendMessage, readyState }
}
