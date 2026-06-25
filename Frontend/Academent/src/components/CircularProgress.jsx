import React from 'react';

/**
 * CircularProgress renders a customizable SVG-based progress circle.
 * 
 * @param {number} percentage - The progress percentage (0 - 100).
 * @param {number} size - The outer width and height of the SVG (defaults to 56).
 * @param {number} strokeWidth - Thickness of the progress ring track (defaults to 4).
 * @param {string} strokeColor - Tailwind color class for the progress ring (defaults to 'text-primary').
 * @param {string} trackColor - Tailwind color class for the background track (defaults to 'text-surface-container').
 * @param {string} className - Additional CSS classes to apply to the SVG.
 */
function CircularProgress({
  percentage = 0,
  size = 56,
  strokeWidth = 4,
  strokeColor = 'text-primary',
  trackColor = 'text-surface-container',
  className = '',
}) {
  const radius = size / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className={`w-full h-full -rotate-90 ${className}`}>
        {/* Track circle */}
        <circle
          className={trackColor}
          cx={size / 2}
          cy={size / 2}
          fill="transparent"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          className={`${strokeColor} transition-all duration-500 ease-out`}
          cx={size / 2}
          cy={size / 2}
          fill="transparent"
          r={radius}
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center ${strokeColor} text-label-sm font-bold`}>
        {percentage}%
      </span>
    </div>
  );
}

export default CircularProgress;
