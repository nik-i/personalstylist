"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Status = "disconnected" | "connecting" | "connected" | "listening" | "speaking";

interface GarmentCard {
  id: string;
  thumbnailPath: string | null;
  subcategory: string | null;
  colorPrimary: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractGarments(output: unknown): GarmentCard[] {
  if (Array.isArray(output)) return output as GarmentCard[];
  if (output && typeof output === "object") {
    return Object.values(output).flat() as GarmentCard[];
  }
  return [];
}

export default function VoicePage() {
  const [status, setStatus] = useState<Status>("disconnected");
  const [garments, setGarments] = useState<GarmentCard[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const senderRef = useRef<RTCRtpSender | null>(null);
  // Maps function call_id → tool name so we know which tool result arrived
  const pendingCallsRef = useRef<Map<string, string>>(new Map());

  const cleanup = useCallback(() => {
    pcRef.current?.close();
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current = null;
    micStreamRef.current = null;
    senderRef.current = null;
    pendingCallsRef.current.clear();
  }, []);

  function disconnect() {
    cleanup();
    setStatus("disconnected");
    setGarments([]);
    setIsMuted(false);
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
      case "response.output_item.done": {
        const item = event.item;
        if (item?.type === "function_call" && item.call_id && item.name) {
          pendingCallsRef.current.set(item.call_id, item.name);
        }
        break;
      }
      case "conversation.item.created": {
        const item = event.item;
        if (item?.type === "function_call_output" && item.call_id) {
          const toolName = pendingCallsRef.current.get(item.call_id);
          const isReadTool =
            toolName === "search_garments" ||
            toolName === "get_garment" ||
            toolName === "get_groupings";
          if (isReadTool && item.output) {
            try {
              const parsed = JSON.parse(item.output);
              const cards = extractGarments(parsed).filter((g) => g.id);
              if (cards.length > 0) setGarments(cards);
            } catch {
              // ignore malformed output
            }
          }
          pendingCallsRef.current.delete(item.call_id);
        }
        break;
      }
    }
  }

  async function connect() {
    setError(null);
    setStatus("connecting");

    try {
      // 1. Mint ephemeral session token server-side
      const tokenRes = await fetch("/api/realtime/session", { method: "POST" });
      if (!tokenRes.ok) {
        const { error: e } = await tokenRes.json().catch(() => ({ error: "Server error" }));
        throw new Error(e ?? "Failed to create session");
      }
      const session = await tokenRes.json();
      const ephemeralKey: string | undefined = session.client_secret?.value;
      if (!ephemeralKey) throw new Error("No client_secret returned");

      // 2. Request mic access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      // 3. Create RTCPeerConnection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // 4. Wire remote audio to a hidden <audio> element
      const audio = document.createElement("audio");
      audio.autoplay = true;
      document.body.appendChild(audio);
      pc.ontrack = (e) => {
        audio.srcObject = e.streams[0];
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          disconnect();
        }
      };

      // 5. Add mic track
      const sender = pc.addTrack(stream.getAudioTracks()[0], stream);
      senderRef.current = sender;

      // 6. Data channel for events (must be created before offer)
      const dc = pc.createDataChannel("oai-events");
      dc.onmessage = (e) => {
        try {
          handleEvent(JSON.parse(e.data));
        } catch {
          // ignore parse errors
        }
      };

      // 7. Create SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 8. Exchange SDP with OpenAI Realtime
      const sdpRes = await fetch(
        "https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ephemeralKey}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        }
      );
      if (!sdpRes.ok) throw new Error(`OpenAI SDP error: ${sdpRes.status}`);

      // 9. Set remote description with answer
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

  const statusMeta: Record<Status, { dot: string; label: string }> = {
    disconnected: { dot: "bg-gray-300", label: "Disconnected" },
    connecting:   { dot: "bg-yellow-400 animate-pulse", label: "Connecting…" },
    connected:    { dot: "bg-green-400", label: "Ready" },
    listening:    { dot: "bg-blue-400 animate-pulse", label: "Listening…" },
    speaking:     { dot: "bg-purple-400 animate-pulse", label: "Speaking…" },
  };

  const isActive = status !== "disconnected";

  return (
    <main className="min-h-screen bg-[#FAF7F4] flex flex-col items-center px-4 py-8 max-w-sm mx-auto">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-8">
        <h1 className="text-xl font-semibold text-gray-800">Your Stylist</h1>
        {isActive && (
          <button
            onClick={disconnect}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            End session
          </button>
        )}
      </div>

      {/* Status pill */}
      <div className="flex items-center gap-2 mb-8">
        <span className={`w-2.5 h-2.5 rounded-full ${statusMeta[status].dot}`} />
        <span className="text-sm text-gray-500">{statusMeta[status].label}</span>
      </div>

      {/* Garment panel */}
      {garments.length > 0 && (
        <div className="w-full mb-8">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Recommendations
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
            {garments.map((g) => (
              <div key={g.id} className="flex-shrink-0 w-[88px] text-center">
                {g.thumbnailPath ? (
                  <img
                    src={g.thumbnailPath}
                    alt={g.subcategory ?? "garment"}
                    className="w-[88px] h-[88px] object-cover rounded-xl shadow-sm"
                  />
                ) : (
                  <div className="w-[88px] h-[88px] bg-gray-200 rounded-xl" />
                )}
                <p className="text-[11px] text-gray-600 mt-1.5 truncate leading-tight">
                  {g.subcategory ?? "piece"}
                </p>
                {g.colorPrimary && (
                  <p className="text-[10px] text-gray-400 truncate">{g.colorPrimary}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main interaction area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-10 w-full">
        {!isActive ? (
          <>
            {error && (
              <p className="text-sm text-red-500 text-center max-w-xs">{error}</p>
            )}
            <button
              onClick={connect}
              className="bg-gray-900 text-white rounded-full px-10 py-4 text-base font-medium hover:bg-gray-700 active:scale-95 transition-all"
            >
              Start styling session
            </button>
          </>
        ) : (
          <>
            {/* Visualizer circle */}
            <div className="relative flex items-center justify-center">
              <div
                className={`absolute w-24 h-24 rounded-full opacity-20 transition-all duration-500 ${
                  status === "speaking" ? "bg-purple-400 scale-125" :
                  status === "listening" ? "bg-blue-400 scale-110" :
                  "bg-gray-300 scale-100"
                }`}
              />
              <div
                className={`w-16 h-16 rounded-full transition-all duration-300 ${
                  status === "speaking" ? "bg-purple-300" :
                  status === "listening" ? "bg-blue-300" :
                  "bg-gray-200"
                }`}
              />
            </div>

            {/* Controls */}
            <div className="flex gap-4">
              <button
                onClick={toggleMute}
                className={`px-7 py-3 rounded-full text-sm font-medium transition-colors ${
                  isMuted
                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                    : "bg-white text-gray-700 shadow-sm hover:bg-gray-50"
                }`}
              >
                {isMuted ? "Unmute" : "Mute"}
              </button>
              <button
                onClick={disconnect}
                className="px-7 py-3 rounded-full text-sm font-medium bg-gray-900 text-white hover:bg-gray-700 transition-colors"
              >
                End
              </button>
            </div>
          </>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-10 text-center">
        Ask me what to wear for any occasion
      </p>
    </main>
  );
}
