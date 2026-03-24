export default function AppLogo({ className = "", alt = "Pause logo" }) {
  return (
    <svg
      viewBox="0 0 500 500"
      role="img"
      aria-label={alt}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="500" height="500" rx="0" fill="#2F6F6D" />
      <path
        d="M122 104c0-18 14-32 32-32h145l68 75v42c-11-4-23-6-35-7v-18h-83V106H135v288h122c7 13 16 25 27 35H132c-18 0-32-14-32-32V104z"
        fill="#F5F7F6"
      />
      <rect x="168" y="217" width="84" height="39" rx="0" fill="#F5F7F6" />
      <path d="M168 293h63c7-14 15-27 25-39h-88z" fill="#F5F7F6" />
      <rect x="168" y="293" width="52" height="34" rx="0" fill="#F5F7F6" />
      <circle cx="334" cy="340" r="91" fill="#F5F7F6" />
      <path
        d="M334 280c-25 0-42 15-42 38h30c0-7 5-13 12-13 8 0 13 5 13 13 0 7-3 11-11 19-10 10-17 20-17 38h29c0-10 2-14 11-23 11-11 18-21 18-38 0-21-17-34-43-34zm0 112c-10 0-18 8-18 19 0 10 8 18 18 18 11 0 19-8 19-18 0-11-8-19-19-19z"
        fill="#2F6F6D"
      />
    </svg>
  );
}
