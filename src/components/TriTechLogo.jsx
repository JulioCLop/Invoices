export default function TriTechLogo({ iconSize = 38, showText = true, dark = false }) {
  const textColor = dark ? '#FFFFFF' : '#213547';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="0,4 13,19 0,34" fill="#E43A36" opacity="0.28" />
        <polygon points="10,4 23,19 10,34" fill="#E43A36" opacity="0.60" />
        <polygon points="20,4 33,19 20,34" fill="#E43A36" />
      </svg>
      {showText && (
        <div style={{ lineHeight: 1 }}>
          <div style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 700,
            fontSize: '1.1rem',
            letterSpacing: '-0.01em',
            color: textColor,
          }}>
            Tri-Tech
          </div>
        </div>
      )}
    </div>
  );
}
