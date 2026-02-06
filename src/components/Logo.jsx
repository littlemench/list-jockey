export default function Logo({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Headphone arc */}
      <path
        d="M15 55C15 32.909 32.909 15 55 15H45C22.909 15 5 32.909 5 55V55"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M85 55C85 32.909 67.091 15 45 15H55C77.091 15 95 32.909 95 55V55"
        stroke="currentColor"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
      {/* Left earpiece - L */}
      <rect x="5" y="55" width="20" height="35" fill="currentColor" rx="3" />
      <text x="10" y="80" fill="white" fontSize="20" fontWeight="bold" fontFamily="Inter, sans-serif">L</text>
      {/* Right earpiece - J */}
      <rect x="75" y="55" width="20" height="35" fill="currentColor" rx="3" />
      <text x="80" y="80" fill="white" fontSize="20" fontWeight="bold" fontFamily="Inter, sans-serif">J</text>
    </svg>
  );
}
