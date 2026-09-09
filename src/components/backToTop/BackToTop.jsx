import { useState, useEffect } from "react";
import { KeyboardArrowUpRounded } from "@mui/icons-material";
import "./backToTop.css";

const BackToTop = () => {
  const [visible, setVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      
      // Calculate scroll progress percentage (0 - 100)
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      setScrollProgress(progress);

      // Show after user scrolls down 280px
      if (scrollTop > 280) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // SVG Progress Ring calculations
  const size = 38;
  const strokeWidth = 2.2;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <div className={`backToTopContainer ${visible ? "visible" : ""}`}>
      <button
        type="button"
        className="backToTopBtn"
        onClick={scrollToTop}
        aria-label="Scroll back to top"
        title="Back to top"
      >
        {/* Circular Progress Ring */}
        <svg
          className="backToTopSvg"
          width="100%"
          height="100%"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background Track Ring */}
          <circle
            className="backToTopTrack"
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
          />
          {/* Active Dynamic Progress Ring */}
          <circle
            className="backToTopProgress"
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>

        {/* Upward Arrow Icon */}
        <KeyboardArrowUpRounded className="backToTopIcon" />

        {/* Hover Tooltip */}
        <span className="backToTopTooltip">Back to top</span>
      </button>
    </div>
  );
};

export default BackToTop;
