'use client'

import Link from 'next/link'
import React, { useCallback, useEffect, useRef, useState } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

interface Section {
  id: string
  name: string
  order: number
  isActive: boolean
  canvasWidth: number
  canvasHeight: number
  backgroundImage?: { url: string } | null
}

interface Table {
  id: string
  label: string
  section: string | { id: string }
  capacity: number
  shape: 'round' | 'square' | 'rectangle'
  x: number
  y: number
  width: number
  height: number
  isActive: boolean
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface Interaction {
  type: 'drag' | 'resize'
  tableId: string
  shape: Table['shape']
  dir?: string
  startMouseX: number
  startMouseY: number
  startX: number
  startY: number
  startWidth: number
  startHeight: number
  moved: boolean
}

// ── Constants ────────────────────────────────────────────────────────────────

const DRAG_THRESHOLD = 4 // px
const SNAP = 5           // % — resize snaps to 5% grid
const MIN_SIZE = SNAP    // % — minimum table dimension
const HANDLE = 8         // resize handle square px

const DIRS = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const
type Dir = (typeof DIRS)[number]

const CURSORS: Record<Dir, string> = {
  nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize',
  e: 'e-resize', se: 'se-resize', s: 's-resize',
  sw: 'sw-resize', w: 'w-resize',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sectionId(t: Table) {
  return typeof t.section === 'string' ? t.section : t.section.id
}

function round1(n: number) {
  return Math.round(n * 10) / 10
}

function displayH(t: Table) {
  return t.shape !== 'rectangle' ? t.width : t.height
}

function handlePos(dir: Dir): React.CSSProperties {
  const h = HANDLE
  const half = h / 2
  const mid = `calc(50% - ${half}px)`
  const base: React.CSSProperties = {
    position: 'absolute', width: h, height: h,
    backgroundColor: '#fff', border: '1.5px solid #3b82f6',
    borderRadius: 2, cursor: CURSORS[dir], zIndex: 10,
  }
  switch (dir) {
    case 'nw': return { ...base, top: -half, left: -half }
    case 'n':  return { ...base, top: -half, left: mid }
    case 'ne': return { ...base, top: -half, right: -half }
    case 'e':  return { ...base, top: mid, right: -half }
    case 'se': return { ...base, bottom: -half, right: -half }
    case 's':  return { ...base, bottom: -half, left: mid }
    case 'sw': return { ...base, bottom: -half, left: -half }
    case 'w':  return { ...base, top: mid, left: -half }
  }
}

// ── TablePopup ────────────────────────────────────────────────────────────────

function TablePopup({
  table,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  table: Table
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const h = displayH(table)

  const btn = (danger = false): React.CSSProperties => ({
    padding: '5px 10px', border: 'none', cursor: 'pointer',
    fontSize: 12, fontWeight: 600, borderRadius: 5,
    backgroundColor: 'transparent',
    color: danger ? '#ef4444' : 'var(--theme-text)',
    display: 'flex', alignItems: 'center', gap: 5,
    whiteSpace: 'nowrap',
  })

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        left: `${table.x}%`,
        top: `${table.y - h / 2}%`,
        transform: 'translate(-50%, calc(-100% - 10px))',
        backgroundColor: 'var(--theme-bg)',
        border: '1px solid var(--theme-elevation-200)',
        borderRadius: 8,
        boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
        display: 'flex',
        alignItems: 'center',
        padding: '3px 4px',
        gap: 2,
        zIndex: 100,
      }}
    >
      {/* Label badge */}
      <span style={{
        fontSize: 11, fontWeight: 700, color: 'var(--theme-text)',
        padding: '0 8px 0 4px',
        borderRight: '1px solid var(--theme-elevation-150)',
        marginRight: 2,
      }}>
        {table.label}
      </span>

      {/* Edit */}
      <button onClick={onEdit} style={btn()}>
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        Edit
      </button>

      {/* Duplicate */}
      <button onClick={onDuplicate} style={btn()}>
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        Duplicate
      </button>

      {/* Delete */}
      <button onClick={onDelete} style={btn(true)}>
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
        Delete
      </button>

      {/* Down-pointing caret */}
      <div style={{
        position: 'absolute', bottom: -6, left: '50%',
        transform: 'translateX(-50%)', pointerEvents: 'none',
        width: 0, height: 0,
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: '6px solid var(--theme-elevation-200)',
      }} />
      <div style={{
        position: 'absolute', bottom: -5, left: '50%',
        transform: 'translateX(-50%)', pointerEvents: 'none',
        width: 0, height: 0,
        borderLeft: '5px solid transparent',
        borderRight: '5px solid transparent',
        borderTop: '5px solid var(--theme-bg)',
      }} />
    </div>
  )
}

// ── TableChip ────────────────────────────────────────────────────────────────

function TableChip({
  table,
  saveState,
  selected,
  onBodyDown,
  onHandleDown,
}: {
  table: Table
  saveState: SaveState
  selected: boolean
  onBodyDown: (e: React.MouseEvent, t: Table) => void
  onHandleDown: (e: React.MouseEvent, t: Table, dir: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  const h = displayH(table)

  const bg =
    saveState === 'saving' ? '#f59e0b'
    : saveState === 'error' ? '#ef4444'
    : table.isActive ? '#3b82f6'
    : '#6b7280'

  const highlighted = selected || hovered

  return (
    <div
      data-table-id={table.id}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={(e) => onBodyDown(e, table)}
      style={{
        position: 'absolute',
        left: `${table.x}%`,
        top: `${table.y}%`,
        width: `${table.width}%`,
        height: `${h}%`,
        transform: 'translate(-50%, -50%)',
        backgroundColor: bg,
        borderRadius: table.shape === 'round' ? '50%' : 6,
        border: `2px solid ${highlighted ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.2)'}`,
        cursor: saveState === 'saving' ? 'wait' : 'grab',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        userSelect: 'none',
        boxShadow: selected
          ? '0 0 0 3px rgba(255,255,255,0.5), 0 4px 16px rgba(0,0,0,0.35)'
          : hovered
          ? '0 0 0 2px rgba(59,130,246,0.5), 0 4px 16px rgba(0,0,0,0.3)'
          : '0 2px 6px rgba(0,0,0,0.25)',
        zIndex: highlighted ? 20 : 1,
        minWidth: 28, minHeight: 28,
        transition: 'box-shadow 0.15s, border-color 0.15s, background-color 0.2s',
      }}
    >
      <span style={{
        color: '#fff', fontSize: 11, fontWeight: 700,
        textAlign: 'center', pointerEvents: 'none',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        maxWidth: '90%', lineHeight: 1.2,
      }}>
        {table.label}
      </span>
      <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 9, pointerEvents: 'none' }}>
        {table.capacity}p
      </span>

      {/* Resize handles — on hover when idle */}
      {hovered && saveState === 'idle' && DIRS.map((dir) => (
        <div
          key={dir}
          style={handlePos(dir)}
          onMouseDown={(e) => {
            e.stopPropagation()
            onHandleDown(e, table, dir)
          }}
        />
      ))}
    </div>
  )
}

// ── Floor Plan View ───────────────────────────────────────────────────────────

export default function FloorPlanView() {
  const [sections, setSections] = useState<Section[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({})
  const [tooltip, setTooltip] = useState<string | null>(null)
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)

  const canvasRef = useRef<HTMLDivElement>(null)
  const ia = useRef<Interaction | null>(null)

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    Promise.all([
      fetch('/api/sections?limit=100&sort=order', { credentials: 'include' }),
      fetch('/api/tables?limit=500', { credentials: 'include' }),
    ])
      .then(async ([sr, tr]) => {
        if (!sr.ok || !tr.ok) throw new Error('Failed to load data')
        const [sd, td] = await Promise.all([sr.json(), tr.json()])
        const secs: Section[] = sd.docs ?? []
        setSections(secs)
        setTables(td.docs ?? [])
        if (secs.length) setActiveId(secs[0].id)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  // ── Position save ─────────────────────────────────────────────────────────

  const save = useCallback(async (id: string, patch: Partial<Pick<Table, 'x' | 'y' | 'width' | 'height'>>) => {
    setSaveStates((s) => ({ ...s, [id]: 'saving' }))
    const body = Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, round1(v as number)]))
    try {
      const res = await fetch(`/api/tables/${id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      setSaveStates((s) => ({ ...s, [id]: 'saved' }))
      setTimeout(() => setSaveStates((s) => ({ ...s, [id]: 'idle' })), 1200)
    } catch {
      setSaveStates((s) => ({ ...s, [id]: 'error' }))
      setTimeout(() => setSaveStates((s) => ({ ...s, [id]: 'idle' })), 3000)
    }
  }, [])

  // ── Duplicate ─────────────────────────────────────────────────────────────

  const handleDuplicate = useCallback(async () => {
    if (!selectedTableId) return
    const table = tables.find((t) => t.id === selectedTableId)
    if (!table) return
    setSelectedTableId(null)
    try {
      const res = await fetch('/api/tables', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: `${table.label} copy`,
          section: sectionId(table),
          capacity: table.capacity,
          shape: table.shape,
          x: Math.min(95, round1(table.x + SNAP)),
          y: Math.min(95, round1(table.y + SNAP)),
          width: table.width,
          height: table.height,
          isActive: table.isActive,
        }),
      })
      if (!res.ok) throw new Error()
      const { doc } = await res.json()
      setTables((prev) => [...prev, doc])
    } catch { /* silent */ }
  }, [selectedTableId, tables])

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = useCallback(async () => {
    if (!selectedTableId) return
    if (!window.confirm('Delete this table? This cannot be undone.')) return
    const id = selectedTableId
    setSelectedTableId(null)
    try {
      const res = await fetch(`/api/tables/${id}`, {
        method: 'DELETE', credentials: 'include',
      })
      if (!res.ok) throw new Error()
      setTables((prev) => prev.filter((t) => t.id !== id))
    } catch { /* silent */ }
  }, [selectedTableId])

  // ── Interaction start ─────────────────────────────────────────────────────

  const onBodyDown = useCallback((e: React.MouseEvent, t: Table) => {
    if (e.button !== 0) return
    e.preventDefault()
    setSelectedTableId(null)
    ia.current = {
      type: 'drag', tableId: t.id, shape: t.shape,
      startMouseX: e.clientX, startMouseY: e.clientY,
      startX: t.x, startY: t.y, startWidth: t.width, startHeight: t.height,
      moved: false,
    }
  }, [])

  const onHandleDown = useCallback((e: React.MouseEvent, t: Table, dir: string) => {
    if (e.button !== 0) return
    e.preventDefault()
    setSelectedTableId(null)
    ia.current = {
      type: 'resize', tableId: t.id, shape: t.shape, dir,
      startMouseX: e.clientX, startMouseY: e.clientY,
      startX: t.x, startY: t.y, startWidth: t.width, startHeight: t.height,
      moved: false,
    }
  }, [])

  // ── Mouse move ────────────────────────────────────────────────────────────

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ia.current || !canvasRef.current) return
    const cur = ia.current
    const rect = canvasRef.current.getBoundingClientRect()
    const rawDx = e.clientX - cur.startMouseX
    const rawDy = e.clientY - cur.startMouseY

    if (!cur.moved) {
      if (rawDx * rawDx + rawDy * rawDy < DRAG_THRESHOLD * DRAG_THRESHOLD) return
      cur.moved = true
    }

    const dx = (rawDx / rect.width) * 100
    const dy = (rawDy / rect.height) * 100

    if (cur.type === 'drag') {
      const newX = Math.max(0, Math.min(100, cur.startX + dx))
      const newY = Math.max(0, Math.min(100, cur.startY + dy))
      setTables((prev) => prev.map((t) => t.id === cur.tableId ? { ...t, x: newX, y: newY } : t))
      setTooltip(`x ${round1(newX)}%  y ${round1(newY)}%`)
    } else {
      const dir = cur.dir ?? ''
      const { startX: sx, startY: sy, startWidth: sw, startHeight: sh, shape } = cur
      let nx = sx, ny = sy, nw = sw, nh = sh

      const snapDim = (raw: number) => Math.max(MIN_SIZE, Math.round(raw / SNAP) * SNAP)

      // Side handles → one dimension only; corners → both
      if (dir.includes('e')) { nw = snapDim(sw + dx); nx = sx + (nw - sw) / 2 }
      if (dir.includes('w')) { nw = snapDim(sw - dx); nx = sx - (nw - sw) / 2 }
      if (dir.includes('s')) { nh = snapDim(sh + dy); ny = sy + (nh - sh) / 2 }
      if (dir.includes('n')) { nh = snapDim(sh - dy); ny = sy - (nh - sh) / 2 }

      // Round/square tables stay square
      if (shape !== 'rectangle') {
        if (dir === 'n' || dir === 's') { nw = nh; nx = sx }
        else if (dir === 'e' || dir === 'w') { nh = nw; ny = sy }
        else { const size = Math.max(nw, nh); nw = size; nh = size }
      }

      nx = Math.max(nw / 2, Math.min(100 - nw / 2, nx))
      ny = Math.max(nh / 2, Math.min(100 - nh / 2, ny))

      setTables((prev) => prev.map((t) => t.id === cur.tableId ? { ...t, x: nx, y: ny, width: nw, height: nh } : t))
      setTooltip(`x ${round1(nx)}%  y ${round1(ny)}%  w ${round1(nw)}%  h ${round1(nh)}%`)
    }
  }, [])

  // ── Mouse up / leave ──────────────────────────────────────────────────────

  const onMouseUp = useCallback(() => {
    const cur = ia.current
    ia.current = null
    setTooltip(null)
    if (!cur) return

    if (!cur.moved) {
      // click — show popup
      setSelectedTableId(cur.tableId)
      return
    }

    setTables((prev) => {
      const t = prev.find((x) => x.id === cur.tableId)
      if (t) {
        save(cur.tableId, cur.type === 'drag'
          ? { x: t.x, y: t.y }
          : { x: t.x, y: t.y, width: t.width, height: t.height })
      }
      return prev
    })
  }, [save])

  // ── Derived ───────────────────────────────────────────────────────────────

  const activeSection = sections.find((s) => s.id === activeId) ?? null
  const visibleTables = tables.filter((t) => sectionId(t) === activeId)
  const selectedTable = visibleTables.find((t) => t.id === selectedTableId) ?? null
  const ar = activeSection
    ? `${activeSection.canvasWidth ?? 800} / ${activeSection.canvasHeight ?? 600}`
    : '4 / 3'

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return <div style={{ padding: 40, color: 'var(--theme-text)' }}>Loading…</div>
  if (error)   return <div style={{ padding: 40, color: '#ef4444' }}>Error: {error}</div>

  return (
    <div style={{ padding: 24, fontFamily: 'inherit' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--theme-text)' }}>Floor Plan</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/admin/collections/sections/create" style={{
            padding: '6px 14px', borderRadius: 6, textDecoration: 'none', fontSize: 13,
            backgroundColor: 'var(--theme-elevation-150)', color: 'var(--theme-text)',
            border: '1px solid var(--theme-elevation-200)',
          }}>+ Section</Link>
          <Link href="/admin/collections/tables/create" style={{
            padding: '6px 14px', borderRadius: 6, textDecoration: 'none', fontSize: 13,
            backgroundColor: '#3b82f6', color: '#fff',
          }}>+ Table</Link>
        </div>
      </div>

      {sections.length === 0 ? (
        <p style={{ color: 'var(--theme-elevation-500)', fontSize: 14 }}>
          No sections yet.{' '}
          <Link href="/admin/collections/sections/create" style={{ color: '#3b82f6' }}>Create one</Link>{' '}
          to get started.
        </p>
      ) : (
        <>
          {/* Section tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {sections.map((s) => (
              <button key={s.id} onClick={() => { setActiveId(s.id); setSelectedTableId(null) }} style={{
                padding: '6px 16px', borderRadius: 9999, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                backgroundColor: s.id === activeId ? '#3b82f6' : 'var(--theme-elevation-150)',
                color: s.id === activeId ? '#fff' : 'var(--theme-text)',
                opacity: s.isActive ? 1 : 0.5,
              }}>{s.name}</button>
            ))}
          </div>

          {activeSection && (
            <div style={{ position: 'relative', width: '100%', maxWidth: 960 }}>

              {/* Canvas */}
              <div
                ref={canvasRef}
                onMouseDown={(e) => { if (e.target === canvasRef.current) setSelectedTableId(null) }}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: ar,
                  borderRadius: 10,
                  border: '1px solid var(--theme-elevation-200)',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
                  cursor: 'default',
                  backgroundImage: activeSection.backgroundImage?.url
                    ? `url(${activeSection.backgroundImage.url})`
                    : [
                        'linear-gradient(rgba(99,120,155,0.10) 1px, transparent 1px)',
                        'linear-gradient(90deg, rgba(99,120,155,0.10) 1px, transparent 1px)',
                        'linear-gradient(rgba(99,120,155,0.04) 1px, transparent 1px)',
                        'linear-gradient(90deg, rgba(99,120,155,0.04) 1px, transparent 1px)',
                      ].join(', '),
                  backgroundSize: activeSection.backgroundImage?.url
                    ? 'cover'
                    : '10% 10%, 10% 10%, 2% 2%, 2% 2%',
                  backgroundColor: 'var(--theme-elevation-50)',
                }}
              >
                {visibleTables.length === 0 && (
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: 'var(--theme-elevation-400)', fontSize: 14, pointerEvents: 'none',
                  }}>
                    No tables — create one and assign it to this section.
                  </div>
                )}

                {visibleTables.map((t) => (
                  <TableChip
                    key={t.id}
                    table={t}
                    saveState={saveStates[t.id] ?? 'idle'}
                    selected={t.id === selectedTableId}
                    onBodyDown={onBodyDown}
                    onHandleDown={onHandleDown}
                  />
                ))}

                {/* Popup — shown on click */}
                {selectedTable && (
                  <TablePopup
                    table={selectedTable}
                    onEdit={() => { window.location.href = `/admin/collections/tables/${selectedTable.id}` }}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                  />
                )}

                {/* Live coordinate tooltip while dragging/resizing */}
                {tooltip && (
                  <div style={{
                    position: 'absolute', bottom: 8, right: 8, pointerEvents: 'none',
                    backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff',
                    fontSize: 11, fontFamily: 'monospace',
                    padding: '3px 8px', borderRadius: 4,
                  }}>
                    {tooltip}
                  </div>
                )}
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12, color: 'var(--theme-elevation-500)', flexWrap: 'wrap' }}>
                {([['#3b82f6', 'Active'], ['#6b7280', 'Inactive'], ['#f59e0b', 'Saving'], ['#ef4444', 'Error']] as const).map(([c, l]) => (
                  <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: c, display: 'inline-block' }} />
                    {l}
                  </span>
                ))}
                <span style={{ color: 'var(--theme-elevation-400)', marginLeft: 4 }}>
                  Click to select · Drag to move · Hover to resize
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
