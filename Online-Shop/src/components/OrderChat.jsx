import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import "./OrderChat.css";

const REFRESH_MS = 5000; // while the chat is open, check for new messages every 5 seconds

// Usage: <OrderChat orderId={order.id} />
// Works for both sides: the customer who owns the order and any admin.
export function OrderChat({ orderId, onSent }) {
	const { profile } = useAuth();
	const [open, setOpen] = useState(false);
	const [messages, setMessages] = useState([]);
	const [text, setText] = useState("");
	const [error, setError] = useState("");
	const [sending, setSending] = useState(false);
	const listRef = useRef(null);

	// While the chat is open: load the messages now, then refresh every few seconds.
	useEffect(() => {
		if (!open) return;

		let cancelled = false;

		const load = async () => {
			try {
				const response = await axios.get(`/api/orders/${orderId}/messages`);
				if (!cancelled) setMessages(response.data);
			} catch {
				// keep showing what we already have
			}
		};

		load();
		const timer = setInterval(load, REFRESH_MS);

		return () => {
			cancelled = true;
			clearInterval(timer);
		};
	}, [open, orderId]);

	// Scroll to the newest message.
	useEffect(() => {
		if (listRef.current) {
			listRef.current.scrollTop = listRef.current.scrollHeight;
		}
	}, [messages.length, open]);

	const send = async (event) => {
		event.preventDefault();

		const trimmed = text.trim();
		if (!trimmed) return;

		setError("");
		setSending(true);
		try {
			const response = await axios.post(`/api/orders/${orderId}/messages`, {
				text: trimmed,
			});
			setMessages((current) => [...current, response.data]);
			setText("");
			if (onSent) onSent();
		} catch (err) {
			setError(
				err.response?.data?.error || "Could not send the message. Try again.",
			);
		}
		setSending(false);
	};

	const whoWrote = (message) => {
		if (message.senderId === profile?.id) return "You";
		return message.senderRole === "admin" ? "Store" : "Customer";
	};

	return (
		<div className="order-chat">
			<button
				type="button"
				className="order-chat-toggle"
				onClick={() => setOpen(!open)}
				aria-expanded={open}
			>
				{open ? "Hide messages" : "Messages"}
			</button>

			{open && (
				<div className="order-chat-box">
					<div className="order-chat-list" ref={listRef}>
						{messages.length === 0 && (
							<p className="order-chat-empty">No messages yet.</p>
						)}

						{messages.map((message) => {
							const mine = message.senderId === profile?.id;
							return (
								<div
									key={message.id}
									className={`order-chat-message ${mine ? "mine" : "theirs"}`}
								>
									<div className="order-chat-author">
										{whoWrote(message)} &middot;{" "}
										{new Date(message.createdAt).toLocaleString()}
									</div>
									<div className="order-chat-text">{message.text}</div>
								</div>
							);
						})}
					</div>

					<form className="order-chat-form" onSubmit={send}>
						<input
							type="text"
							value={text}
							onChange={(event) => setText(event.target.value)}
							placeholder="Write a message"
							maxLength={1000}
							aria-label="Message"
						/>
						<button type="submit" disabled={sending || !text.trim()}>
							{sending ? "Sending..." : "Send"}
						</button>
					</form>

					{error && (
						<p className="order-chat-error" role="alert">
							{error}
						</p>
					)}
				</div>
			)}
		</div>
	);
}

/*
What does this web remembers,
open: it rememebers if the chat is explanded or collapsed
the list of messages
text: the texts that is written on tha box
error, error
listRef: the LIST of messages so the code can scroll it



The tree effects

Loadin messages





*/