'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function FloorPlanNavLink() {
  const pathname = usePathname()
  const isActive = pathname === '/admin/floor-plan'

  return (
    <Link
      href="/admin/floor-plan"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        borderRadius: '4px',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: isActive ? 600 : 400,
        color: isActive ? 'var(--theme-text)' : 'var(--theme-elevation-500)',
        backgroundColor: isActive ? 'var(--theme-elevation-150)' : 'transparent',
        transition: 'background-color 0.15s, color 0.15s',
        width: '100%',
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
      Floor Plan
    </Link>
  )
}
