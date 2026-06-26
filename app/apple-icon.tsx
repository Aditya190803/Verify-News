import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** Apple touch icon — Facets three-plane mark on brand terracotta. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#c45c3a',
          borderRadius: 40,
        }}
      >
        <svg width="120" height="120" viewBox="0 0 48 48" fill="none">
          <path d="M14 34V14l10 6v20l-10-6z" fill="#faf8f5" fillOpacity={0.92} />
          <path d="M24 20l10-6v20l-10 6V20z" fill="#faf8f5" fillOpacity={0.55} />
          <path d="M34 14v20l-6 3.5V17.5L34 14z" fill="#faf8f5" fillOpacity={0.35} />
        </svg>
      </div>
    ),
    { ...size },
  );
}