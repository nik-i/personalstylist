"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { MascotAvatar } from "@/components/ui/MascotAvatar";

type Status = "disconnected" | "connecting" | "connected" | "listening" | "speaking";

async function getLocation(): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    const timer = setTimeout(() => resolve(null), 3000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => { clearTimeout(timer); resolve(null); },
    );
  });
}

export default function VoicePage() {
  const [status, setStatus] = useState<Status>("disconnected");
  const [isWorking, setIsWorking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pcRef     = useRef<RTCPeerConnection | null>(null);
  const micRef    = useRef<MediaStream | null>(null);
  const senderRef = useRef<RTCRtpSender | null>(null);
  const dcRef     = useRef<RTCDataChannel | null>(null);

  const cleanup = useCallback(() => {
    pcRef.current?.close();
    micRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current  = null;
    micRef.current = null;
    senderRef.current = null;
    dcRef.current  = null;
  }, []);

  function disconnect() {
    cleanup();
    setStatus("disconnected");
    setIsWorking(false);
    setIsMuted(false);
  }

  async function handleToolCall(name: string, argsStr: string, callId: string) {
    setIsWorking(true);
    try {
      const args = JSON.parse(argsStr || "{}");
      const res  = await fetch("/api/voice/tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: name, callId, args }),
      });
      const data   = (await res.json()) as { output?: string };
      const output = data.output ?? "Sorry, I couldn't complete that request.";

      const dc = dcRef.current;
      if (!dc || dc.readyState !== "open") return;

      dc.send(JSON.stringify({
        type: "conversation.item.create",
        item: { type: "function_call_output", call_id: callId, output },
      }));
      dc.send(JSON.stringify({ type: "response.create" }));
    } catch {
      const dc = dcRef.current;
      if (dc?.readyState === "open") {
        dc.send(JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "function_call_output",
            call_id: callId,
            output: "Sorry, I had trouble with that — could you try again?",
          },
        }));
        dc.send(JSON.stringify({ type: "response.create" }));
      }
    } finally {
      setIsWorking(false);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleEvent(event: Record<string, any>) {
    switch (event.type) {
      case "input_audio_buffer.speech_started":
        setStatus("listening");
        break;
      case "input_audio_buffer.speech_stopped":
      case "response.created":
        setStatus("connected");
        break;
      case "response.audio.delta":
        setStatus("speaking");
        break;
      case "response.audio.done":
      case "response.done":
        setStatus("connected");
        break;
      case "response.function_call_arguments.done": {
        const { name, arguments: argsStr, call_id } = event as {
          name: string;
          arguments: string;
          call_id: string;
        };
        void handleToolCall(name, argsStr, call_id);
        break;
      }
    }
  }

  async function connect() {
    setError(null);
    setStatus("connecting");

    try {
      // Get location best-effort (3 s timeout) so session can embed coords
      const location = await getLocation();

      // 1. Mint ephemeral session token server-side
      const tokenRes = await fetch("/api/realtime/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(location ?? {}),
      });
      if (!tokenRes.ok) {
        const { error: e } = await tokenRes.json().catch(() => ({ error: "Server error" }));
        throw new Error(e ?? "Failed to create session");
      }
      const session     = await tokenRes.json();
      const ephemeralKey: string | undefined = session.client_secret?.value;
      if (!ephemeralKey) throw new Error("No client_secret returned");

      // 2. Microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micRef.current = stream;

      // 3. RTCPeerConnection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // 4. Remote audio → hidden <audio>
      const audio = document.createElement("audio");
      audio.autoplay = true;
      document.body.appendChild(audio);
      pc.ontrack = (e) => { audio.srcObject = e.streams[0]; };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          disconnect();
        }
      };

      // 5. Mic track
      senderRef.current = pc.addTrack(stream.getAudioTracks()[0], stream);

      // 6. Data channel for events (must be created before offer)
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.onmessage = (e) => {
        try { handleEvent(JSON.parse(e.data)); } catch { /* ignore parse errors */ }
      };

      // 7. SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 8. Exchange SDP with OpenAI
      const sdpRes = await fetch(
        "https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ephemeralKey}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        },
      );
      if (!sdpRes.ok) throw new Error(`OpenAI SDP error: ${sdpRes.status}`);

      // 9. Set remote description
      await pc.setRemoteDescription({ type: "answer", sdp: await sdpRes.text() });
      setStatus("connected");
    } catch (err) {
      cleanup();
      setStatus("disconnected");
      setError(err instanceof Error ? err.message : "Connection failed");
    }
  }

  function toggleMute() {
    const track = senderRef.current?.track;
    if (!track) return;
    track.enabled = !track.enabled;
    setIsMuted(!track.enabled);
  }

  useEffect(() => () => cleanup(), [cleanup]);

  const isActive    = status !== "disconnected";
  const isSpeaking  = status === "speaking";
  const isListening = status === "listening";

  const statusLabel: Record<Status, string> = {
    disconnected: "",
    connecting:   "Connecting…",
    connected:    "Ready",
    listening:    "Listening…",
    speaking:     "Speaking…",
  };

  return (
    <main className="min-h-screen bg-frock-cream flex flex-col px-5 pb-10 max-w-sm mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between py-5">
        <span
          className="text-xl text-frock-ink"
          style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}
        >
          Maya
        </span>
        {isActive && (
          <button
            onClick={disconnect}
            className="text-sm text-frock-muted hover:text-frock-ink transition-colors"
          >
            End session
          </button>
        )}
      </header>

      {/* Center: avatar + ambient rings */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
          {/* Listening ring */}
          {isListening && (
            <span
              className="absolute inset-0 rounded-full border border-frock-rouge"
              style={{ opacity: 0.45, animation: "frkRing 1.5s ease-out infinite" }}
            />
          )}
          {/* Speaking pulse */}
          {isSpeaking && (
            <span
              className="absolute inset-0 rounded-full bg-frock-blush"
              style={{ opacity: 0.25, animation: "frkPulse 1.2s ease-in-out infinite" }}
            />
          )}
          {/* Connecting ring */}
          {status === "connecting" && (
            <span
              className="absolute inset-0 rounded-full border border-frock-brass"
              style={{ opacity: 0.4, animation: "frkRing 2s ease-out infinite" }}
            />
          )}

          <MascotAvatar size={isActive ? "compact" : "full"} speaking={isSpeaking} />
        </div>

        {/* Status pill */}
        {isActive && (
          <div className="flex items-center gap-2">
            <span
              className={[
                "w-2 h-2 rounded-full",
                status === "connecting" ? "bg-frock-brass animate-pulse" :
                status === "connected"  ? "bg-frock-success" :
                status === "listening"  ? "bg-frock-rouge animate-pulse" :
                status === "speaking"   ? "bg-frock-rouge" : "",
              ].join(" ")}
            />
            <span className="text-sm text-frock-muted">{statusLabel[status]}</span>
          </div>
        )}

        {/* Tool-in-flight indicator */}
        {isWorking && (
          <p
            className="text-xs text-frock-muted"
            style={{ animation: "frkFade 0.3s ease" }}
          >
            Checking your wardrobe…
          </p>
        )}
      </div>

      {/* Bottom controls */}
      <div className="flex flex-col items-center gap-4 pt-6">
        {error && (
          <p className="text-sm text-frock-rouge text-center px-4">{error}</p>
        )}

        {!isActive ? (
          <>
            <p className="text-sm text-frock-muted text-center mb-1">
              Ask me what to wear for any occasion
            </p>
            <button
              onClick={connect}
              className="bg-frock-ink text-frock-cream rounded-full px-10 py-4 text-base font-medium active:scale-95 transition-all"
              style={{ transition: "opacity 0.15s, transform 0.1s" }}
            >
              Start session
            </button>
          </>
        ) : (
          <div className="flex gap-3 w-full">
            <button
              onClick={toggleMute}
              className={[
                "flex-1 py-3.5 rounded-full text-sm font-medium transition-colors",
                isMuted
                  ? "bg-frock-rouge text-frock-cream"
                  : "bg-frock-blush text-frock-ink",
              ].join(" ")}
            >
              {isMuted ? "Unmute" : "Mute"}
            </button>
            <button
              onClick={disconnect}
              className="flex-1 py-3.5 rounded-full text-sm font-medium bg-frock-ink text-frock-cream transition-colors"
            >
              End
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
