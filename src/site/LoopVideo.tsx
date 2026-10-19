import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Pause, Play } from "lucide-react";
import { prefersReduced } from "../proto/motion";

const VIDEO = `${import.meta.env.BASE_URL}video/`;

/*
 * Only one clip plays at a time: the most visible one. Every mounted clip reports its
 * intersection ratio here, and the group elects a single active clip.
 */
type Member = { ratio: number; claimed: boolean; set: (on: boolean) => void };
const group = new Map<symbol, Member>();
const MIN_RATIO = 0.35;

function elect() {
  let best: symbol | null = null;
  let top = MIN_RATIO;
  for (const [k, m] of group) {
    if (m.claimed && m.ratio > 0) {
      best = k;
      break;
    }
    if (m.ratio >= top) {
      best = k;
      top = m.ratio;
    }
  }
  for (const [k, m] of group) m.set(k === best);
}

/**
 * Looping, muted product clip recorded from the prototype (scripts/video.mjs). Plays only
 * while it is the most visible clip on screen, pauses on hover and focus, and shows the
 * poster without autoplay under reduced motion. Below the fold it loads nothing until it
 * comes near the viewport. With `to`, the clip links there; a separate control plays or pauses.
 */
export function LoopVideo({
  name,
  webm = true,
  poster,
  to,
  label,
  cta,
  eager = false,
  ambient = false,
}: {
  /** File name without extension in public/video/. */
  name: string;
  webm?: boolean;
  poster: string;
  /** Link target. Without it the clip is a plain video. */
  to?: string;
  label: string;
  cta?: string;
  eager?: boolean;
  /** Ambient clips loop whenever they are the clip in view: no control, no hover pause. */
  ambient?: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const key = useRef(Symbol(name));
  const [near, setNear] = useState(eager);
  const [active, setActive] = useState(false);
  const [held, setHeld] = useState(false);
  const [userPaused, setUserPaused] = useState(() => prefersReduced());
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const k = key.current;
    group.set(k, { ratio: 0, claimed: false, set: setActive });
    const thresholds = Array.from({ length: 11 }, (_, i) => i / 10);
    const io = new IntersectionObserver(
      ([e]) => {
        const m = group.get(k);
        if (!m) return;
        m.ratio = e.isIntersecting ? e.intersectionRatio : 0;
        if (!m.ratio) m.claimed = false;
        elect();
      },
      { threshold: thresholds },
    );
    const pre = new IntersectionObserver(
      ([e]) => e.isIntersecting && setNear(true),
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    pre.observe(el);
    return () => {
      io.disconnect();
      pre.disconnect();
      group.delete(k);
      elect();
    };
  }, []);

  // Sources are added when the clip comes near the viewport; load() picks them up.
  useEffect(() => {
    if (near && !eager) video.current?.load();
  }, [near, eager]);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (near && active && !held && !userPaused) v.play().catch(() => {});
    else v.pause();
  }, [near, active, held, userPaused]);

  const toggle = () => {
    const m = group.get(key.current);
    if (userPaused && m) {
      for (const o of group.values()) o.claimed = false;
      m.claimed = true;
      setNear(true);
      elect();
    }
    setUserPaused((p) => !p);
  };

  const hold = {
    onMouseEnter: () => setHeld(true),
    onMouseLeave: () => setHeld(false),
    onFocus: () => setHeld(true),
    onBlur: () => setHeld(false),
  };
  const media = (
    <video
      ref={video}
      poster={poster}
      muted
      loop
      playsInline
      preload={near ? "auto" : "none"}
      aria-hidden={to ? true : undefined}
      aria-label={to ? undefined : label}
      // Plain clips pause while hovered. The play button sits outside this, so it still works.
      onMouseEnter={to || ambient ? undefined : hold.onMouseEnter}
      onMouseLeave={to || ambient ? undefined : hold.onMouseLeave}
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
      className="block aspect-[1440/900] w-full bg-canvas object-cover"
    >
      {near && webm && (
        <source src={`${VIDEO}${name}.webm`} type="video/webm" />
      )}
      {near && <source src={`${VIDEO}${name}.mp4`} type="video/mp4" />}
    </video>
  );

  return (
    <div
      ref={wrap}
      className={`group relative overflow-hidden rounded-panel border border-line bg-surface shadow-card ${to ? "transition-shadow hover:shadow-pop" : ""}`}
    >
      {to ? (
        <Link to={to} aria-label={label} {...hold} className="block">
          {media}
          {cta && (
            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
              {cta} <ArrowUpRight aria-hidden size={13} />
            </span>
          )}
        </Link>
      ) : (
        media
      )}
      {!ambient && (
        <button
          onClick={toggle}
          aria-label={playing ? "Pause video" : "Play video"}
          className="absolute bottom-3 left-3 grid h-9 w-9 place-items-center rounded-full bg-primary/85 text-white transition-colors hover:bg-primary"
        >
          {playing ? (
            <Pause aria-hidden size={15} />
          ) : (
            <Play aria-hidden size={15} />
          )}
        </button>
      )}
    </div>
  );
}

export const posterOf = (name: string) => `${VIDEO}${name}.jpg`;
