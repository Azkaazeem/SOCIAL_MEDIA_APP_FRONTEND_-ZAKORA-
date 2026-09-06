import { useEffect, useRef, useState } from "react";
import { VolumeOff, VolumeUp } from "@mui/icons-material";
import "./autoPlayVideo.css";

const AutoPlayVideo = ({ src, className = "", style = {} }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  // Default unmuted (sound on) as requested by user
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Ensure video element starts unmuted
    video.muted = false;

    const handlePlayState = () => setIsPlaying(!video.paused);
    const handleVolumeChange = () => setIsMuted(video.muted);

    video.addEventListener("play", handlePlayState);
    video.addEventListener("pause", handlePlayState);
    video.addEventListener("volumechange", handleVolumeChange);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!videoRef.current) return;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            // Attempt to play unmuted by default
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
              playPromise.catch((err) => {
                // If browser autoplay policy requires initial user gesture before unmuted audio,
                // fallback to muted playback, and automatically unmute on the first interaction
                if (err.name === "NotAllowedError") {
                  videoRef.current.muted = true;
                  setIsMuted(true);
                  videoRef.current.play().then(() => {
                    const enableSoundOnGesture = () => {
                      if (videoRef.current) {
                        videoRef.current.muted = false;
                        setIsMuted(false);
                      }
                      window.removeEventListener("click", enableSoundOnGesture);
                    };
                    window.addEventListener("click", enableSoundOnGesture, { once: true });
                  }).catch(() => {});
                }
              });
            }
          } else {
            // Pause when scrolled out of view
            videoRef.current.pause();
          }
        });
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1.0],
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
      video.removeEventListener("play", handlePlayState);
      video.removeEventListener("pause", handlePlayState);
      video.removeEventListener("volumechange", handleVolumeChange);
    };
  }, []);

  const toggleSound = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const newMuted = !videoRef.current.muted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  };

  return (
    <div ref={containerRef} className="autoPlayVideoWrapper">
      <video
        ref={videoRef}
        src={src}
        controls
        muted={isMuted}
        playsInline
        crossOrigin="anonymous"
        preload="metadata"
        className={`autoPlayVideo ${className}`}
        style={style}
      />
      {/* Sound Overlay Toggle */}
      <button
        type="button"
        className="videoSoundToggle"
        onClick={toggleSound}
        title={isMuted ? "Unmute" : "Mute"}
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <VolumeOff fontSize="small" /> : <VolumeUp fontSize="small" />}
      </button>
    </div>
  );
};

export default AutoPlayVideo;
