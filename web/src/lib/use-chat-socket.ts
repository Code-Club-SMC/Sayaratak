import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import type { ChatMessage } from "@/lib/query-options/chat";

type ChatSocketEvent = { type: "chat_message"; data: ChatMessage };

/**
 * Points at the same backend REST calls use (API_BASE_URL), not window.location —
 * in local dev the frontend and API run on different ports, so a same-origin
 * WebSocket would never reach the API. Relies on the browser sending the session
 * cookie automatically on the WebSocket handshake.
 */
export function useChatSocket(onMessage: (msg: ChatMessage) => void) {
	const [connected, setConnected] = useState(false);
	const onMessageRef = useRef(onMessage);
	onMessageRef.current = onMessage;

	useEffect(() => {
		let socket: WebSocket | null = null;
		let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
		let closedByCleanup = false;
		let attempt = 0;

		function connect() {
			const wsUrl = `${API_BASE_URL.replace(/^http/, "ws")}/api/v1/chat/ws`;
			socket = new WebSocket(wsUrl);

			socket.onopen = () => {
				attempt = 0;
				setConnected(true);
			};

			socket.onmessage = (event) => {
				try {
					const parsed = JSON.parse(event.data) as ChatSocketEvent;
					if (parsed.type === "chat_message") {
						onMessageRef.current(parsed.data);
					}
				} catch {
					// Ignore malformed frames.
				}
			};

			socket.onclose = () => {
				setConnected(false);
				if (closedByCleanup) return;
				attempt += 1;
				const delay = Math.min(1000 * 2 ** attempt, 15000);
				reconnectTimer = setTimeout(connect, delay);
			};

			socket.onerror = () => {
				socket?.close();
			};
		}

		connect();

		return () => {
			closedByCleanup = true;
			if (reconnectTimer) clearTimeout(reconnectTimer);
			socket?.close();
		};
	}, []);

	return { connected };
}
