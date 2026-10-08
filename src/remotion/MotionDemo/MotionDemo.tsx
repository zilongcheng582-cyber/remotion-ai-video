import { makeCircle, makeStar } from "@remotion/shapes";
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { MotionDemoProps } from "../../../types/constants";

// System font stack: no network fetch at render time, so renders are deterministic.
const fontFamily =
  'Inter, "Helvetica Neue", Helvetica, Arial, system-ui, sans-serif';

const BG = "#0b0b14";
const COLORS = ["#7c5cff", "#00d4ff", "#ff5c8a", "#ffd166"];

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = frame / durationInFrames;
  return (
    <AbsoluteFill style={{ background: BG }}>
      {COLORS.map((color, i) => {
        const angle = t * Math.PI * 2 + (i * Math.PI) / 2;
        const x = 50 + Math.cos(angle) * (22 + i * 4);
        const y = 50 + Math.sin(angle * (1 + i * 0.2)) * (18 + i * 3);
        return (
          <div
            key={color}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: 520,
              height: 520,
              marginLeft: -260,
              marginTop: -260,
              borderRadius: "50%",
              background: color,
              opacity: 0.22,
              filter: "blur(120px)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Title: React.FC<{ title: string; subtitle: string }> = ({
  title,
  subtitle,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = title.split(" ");
  const subIn = spring({ frame, fps, delay: 30, config: { damping: 200 } });
  const out = interpolate(frame, [75, 90], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", opacity: out }}
    >
      <div style={{ display: "flex", gap: 28, fontFamily }}>
        {words.map((word, i) => {
          const s = spring({
            frame,
            fps,
            delay: i * 6,
            config: { damping: 14 },
          });
          return (
            <span
              key={word + i}
              style={{
                fontSize: 120,
                fontWeight: 900,
                color: "white",
                letterSpacing: -3,
                transform: `translateY(${(1 - s) * 80}px) scale(${0.8 + s * 0.2})`,
                opacity: s,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
      <div
        style={{
          fontFamily,
          fontSize: 36,
          color: "#b9b9d0",
          marginTop: 24,
          opacity: subIn,
          transform: `translateY(${(1 - subIn) * 20}px)`,
        }}
      >
        {subtitle}
      </div>
    </AbsoluteFill>
  );
};

const Shapes: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const count = 4;
  const ring = makeCircle({ radius: 150 });
  const star = makeStar({ points: 5, innerRadius: 60, outerRadius: 130 });
  return (
    <AbsoluteFill>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {Array.from({ length: count }).map((_, i) => {
          const s = spring({
            frame,
            fps,
            delay: i * 8,
            config: { damping: 12 },
          });
          const x = width / 2 + (i - (count - 1) / 2) * 340;
          const rot = frame * (i % 2 ? -1.5 : 1.5);
          const shape = i % 2 ? star : ring;
          return (
            <g
              key={i}
              transform={`translate(${x} ${height / 2}) rotate(${rot}) scale(${s}) translate(${-shape.width / 2} ${-shape.height / 2})`}
            >
              <path
                d={shape.path}
                fill={i % 2 ? COLORS[i] : "none"}
                stroke={COLORS[i]}
                strokeWidth={8}
                opacity={0.9}
              />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

const Bars: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const values = [0.45, 0.7, 0.55, 0.9, 0.65, 1];
  const labels = ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"];
  const countUp = Math.round(
    interpolate(frame, [0, 70], [0, 248], {
      extrapolateRight: "clamp",
      easing: (x) => 1 - Math.pow(1 - x, 3),
    }),
  );
  const fadeIn = spring({ frame, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", fontFamily }}
    >
      <div style={{ opacity: fadeIn, textAlign: "center" }}>
        <div
          style={{
            fontSize: 150,
            fontWeight: 900,
            color: "white",
            lineHeight: 1,
          }}
        >
          +{countUp}%
        </div>
        <div style={{ fontSize: 32, color: "#b9b9d0", marginTop: 8 }}>
          growth in rendered videos
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 36,
          height: 260,
          marginTop: 50,
        }}
      >
        {values.map((v, i) => {
          const s = spring({
            frame,
            fps,
            delay: 10 + i * 5,
            config: { damping: 15 },
          });
          return (
            <div key={i} style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 90,
                  height: v * 220 * s,
                  borderRadius: 14,
                  background: `linear-gradient(180deg, ${COLORS[i % 4]}, ${COLORS[(i + 1) % 4]})`,
                }}
              />
              <div style={{ color: "#8a8aa5", fontSize: 22, marginTop: 10 }}>
                {labels[i]}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Wave: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const lines = COLORS.map((color, i) => {
    const points: string[] = [];
    for (let x = 0; x <= width; x += 16) {
      const y =
        height * 0.88 +
        Math.sin(x / 140 + frame / 12 + i) * (18 + i * 8) +
        Math.sin(x / 60 - frame / 8) * 12;
      points.push(`${x === 0 ? "M" : "L"}${x} ${y}`);
    }
    return { color, d: points.join(" ") };
  });
  const fade = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <svg width={width} height={height}>
        {lines.map((l) => (
          <path
            key={l.color}
            d={l.d}
            fill="none"
            stroke={l.color}
            strokeWidth={6}
            strokeLinecap="round"
            opacity={0.85}
          />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

const Outro: React.FC<{ title: string }> = ({ title }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 200 } });
  const pulse = 1 + Math.sin(frame / 6) * 0.015;
  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", fontFamily }}
    >
      <div
        style={{
          fontSize: 96,
          fontWeight: 900,
          color: "white",
          opacity: s,
          transform: `scale(${(0.9 + 0.1 * s) * pulse})`,
          textAlign: "center",
          background: `linear-gradient(90deg, ${COLORS[0]}, ${COLORS[1]}, ${COLORS[2]})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {title}
      </div>
      <div
        style={{ fontSize: 30, color: "#b9b9d0", marginTop: 20, opacity: s }}
      >
        Built with Remotion · Next.js · Vercel
      </div>
    </AbsoluteFill>
  );
};

export const MotionDemo: React.FC<z.infer<typeof MotionDemoProps>> = ({
  title,
  subtitle,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const globalFade = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp" },
  );
  return (
    <AbsoluteFill style={{ opacity: globalFade, background: BG }}>
      <Background />
      <Sequence durationInFrames={90}>
        <Title title={title} subtitle={subtitle} />
      </Sequence>
      <Sequence from={75} durationInFrames={75}>
        <Shapes />
      </Sequence>
      <Sequence from={150} durationInFrames={90}>
        <Bars />
      </Sequence>
      <Sequence from={150} durationInFrames={90}>
        <Wave />
      </Sequence>
      <Sequence from={225}>
        <Outro title={title} />
      </Sequence>
    </AbsoluteFill>
  );
};
