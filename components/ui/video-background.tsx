"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import AmbientWorld from "./AmbientWorld";

interface VideoBackgroundProps {
  src: string;
}

export interface VideoBackgroundRef {
  play: () => void;
  pause: () => void;
  toggleMute: () => void;
}

const VideoBackground = forwardRef<VideoBackgroundRef, VideoBackgroundProps>(
  function VideoBackground({ src }, ref) {
    const [paused, setPaused] = useState(false);
    const [effectsMuted, setEffectsMuted] = useState(false);

    useImperativeHandle(ref, () => ({
      play: () => {
        setPaused(false);
      },
      pause: () => {
        setPaused(true);
      },
      toggleMute: () => {
        setEffectsMuted((prev) => !prev);
      },
    }));

    return (
      <div className="pointer-events-none absolute inset-0 z-0 h-full w-full" aria-hidden="true">
        <AmbientWorld
          backgroundImage={src}
          depthMap={src}
          particles={{ enabled: true, intensity: effectsMuted ? 0.2 : 1, preset: src || 'cyberpunk' }}
          shader={{ enabled: true, intensity: effectsMuted ? 0.25 : 1, paused }}
          ambience={{ muted: effectsMuted, paused }}
        />
      </div>
    );
  },
);

export { VideoBackground };
export default VideoBackground;