"use client";

export type MascotSize = "full" | "compact" | "mini" | "badge";

interface Props {
  size?: MascotSize;
  speaking?: boolean;
  initial?: string;
}

const DIMS = {
  full: {
    outer:  { w: 150, h: 158 },
    halo:   { top: 26, w: 150, h: 150 },
    hair:   { top: 20, w: 116, h: 118 },
    face:   { top: 34, w: 92,  h: 104 },
    cheek:  { top: 52, w: 13,  h: 9,  lr: 12 },
    eye:    { top: 38, w: 8,   h: 9,  gap: 22 },
    mouth:  { talkBottom: 22, talkW: 16, talkH: 12, smileBottom: 26, smileW: 18, smileH: 8 },
    beret:  { top: 6,  w: 78,  h: 34 },
    pompom: { top: 1,  w: 9,   h: 9 },
    float: "4.5s",
    blink: "4.8s",
  },
  compact: {
    outer:  { w: 112, h: 118 },
    halo:   { top: 20, w: 112, h: 112 },
    hair:   { top: 15, w: 88,  h: 90 },
    face:   { top: 26, w: 70,  h: 80 },
    cheek:  { top: 40, w: 11,  h: 7,  lr: 10 },
    eye:    { top: 29, w: 6,   h: 7,  gap: 17 },
    mouth:  { talkBottom: 17, talkW: 12, talkH: 9, smileBottom: 20, smileW: 14, smileH: 6 },
    beret:  { top: 4,  w: 60,  h: 26 },
    pompom: { top: 0,  w: 7,   h: 7 },
    float: "4.5s",
    blink: "4.8s",
  },
  mini: {
    outer:  { w: 92, h: 96 },
    halo:   { top: 16, w: 92, h: 92 },
    hair:   { top: 12, w: 72, h: 74 },
    face:   { top: 20, w: 58, h: 66 },
    cheek:  { top: 33, w: 9,  h: 6,  lr: 8 },
    eye:    { top: 24, w: 5,  h: 6,  gap: 14 },
    mouth:  { talkBottom: 14, talkW: 10, talkH: 8, smileBottom: 16, smileW: 12, smileH: 5 },
    beret:  { top: 3,  w: 50, h: 22 },
    pompom: { top: 0,  w: 6,  h: 6 },
    float: "4.5s",
    blink: "4.8s",
  },
};

export function MascotAvatar({ size = "full", speaking = false, initial = "M" }: Props) {
  if (size === "badge") {
    return (
      <span
        style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "#F5DCD3",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-serif)", fontStyle: "italic",
          fontSize: 15, color: "#D6402B", flexShrink: 0,
        }}
      >
        {initial}
      </span>
    );
  }

  const d = DIMS[size];
  const hw = d.hair.w / 2;
  const hh = d.hair.h;

  return (
    <div style={{
      position: "relative",
      width: d.outer.w,
      height: d.outer.h,
      animation: `frkFloat ${d.float} ease-in-out infinite`,
    }}>
      {/* Halo */}
      <div style={{
        position: "absolute", top: d.halo.top, left: "50%",
        transform: "translateX(-50%)",
        width: d.halo.w, height: d.halo.h, borderRadius: "50%",
        background: "radial-gradient(circle,rgba(245,220,211,0.55) 0%,rgba(245,220,211,0) 68%)",
      }} />

      {/* Hair */}
      <div style={{
        position: "absolute", top: d.hair.top, left: "50%",
        transform: "translateX(-50%)",
        width: d.hair.w, height: d.hair.h,
        background: "#201B15",
        borderRadius: `${hw}px ${hw}px ${hw * 0.79}px ${hw * 0.79}px / ${hh * 0.56}px ${hh * 0.56}px ${hh * 0.41}px ${hh * 0.41}px`,
        zIndex: 0,
      }} />

      {/* Face */}
      <div style={{
        position: "absolute", top: d.face.top, left: "50%",
        transform: "translateX(-50%)",
        width: d.face.w, height: d.face.h,
        background: "#F5DCD3", border: "1.5px solid #201B15",
        borderRadius: "47% 47% 46% 46% / 52% 52% 48% 48%",
        zIndex: 1, overflow: "hidden",
      }}>
        {/* Cheeks */}
        <div style={{ position: "absolute", top: d.cheek.top, left: d.cheek.lr, width: d.cheek.w, height: d.cheek.h, borderRadius: "50%", background: "rgba(214,64,43,0.30)" }} />
        <div style={{ position: "absolute", top: d.cheek.top, right: d.cheek.lr, width: d.cheek.w, height: d.cheek.h, borderRadius: "50%", background: "rgba(214,64,43,0.30)" }} />

        {/* Eyes */}
        <div style={{
          position: "absolute", top: d.eye.top, left: 0, right: 0,
          display: "flex", justifyContent: "center", gap: d.eye.gap,
          animation: `frkBlink ${d.blink} ease-in-out infinite`,
        }}>
          <span style={{ width: d.eye.w, height: d.eye.h, borderRadius: "50%", background: "#201B15", display: "block" }} />
          <span style={{ width: d.eye.w, height: d.eye.h, borderRadius: "50%", background: "#201B15", display: "block" }} />
        </div>

        {/* Mouth */}
        {speaking ? (
          <span style={{
            position: "absolute", bottom: d.mouth.talkBottom, left: "50%",
            transformOrigin: "center top",
            width: d.mouth.talkW, height: d.mouth.talkH,
            borderRadius: "0 0 16px 16px", background: "#D6402B",
            animation: "frkTalk 0.42s ease-in-out infinite",
          }} />
        ) : (
          <span style={{
            position: "absolute", bottom: d.mouth.smileBottom,
            left: "50%", transform: "translateX(-50%)",
            width: d.mouth.smileW, height: d.mouth.smileH,
            borderBottom: "2px solid #201B15",
            borderRadius: "0 0 14px 14px",
          }} />
        )}
      </div>

      {/* Beret */}
      <div style={{
        position: "absolute", top: d.beret.top, left: "50%",
        transform: "translateX(-58%) rotate(-14deg)",
        width: d.beret.w, height: d.beret.h,
        background: "#D6402B",
        borderRadius: "52% 52% 48% 48%",
        zIndex: 2,
      }} />

      {/* Pompom */}
      <div style={{
        position: "absolute", top: d.pompom.top, left: "50%",
        transform: "translateX(46%)",
        width: d.pompom.w, height: d.pompom.h,
        borderRadius: "50%", background: "#D6402B", zIndex: 2,
      }} />
    </div>
  );
}
