'use client'

/**
 * DataTable — Wrapper de tableau premium unifié pour les dashboards.
 *
 * API déclarative : passer `columns` + `rows`. Les cas avancés (custom cell rendering,
 * tri, pagination) restent possibles via la prop `renderRow`.
 *
 * Design : header sticky, zebra subtile, focus & hover accessibles, empty state intégré,
 * skeleton de chargement, mobile-friendly (scroll horizontal avec ombre indicative).
 */

import { type ReactNode, type Key } from 'react'
import { EmptyState } from './EmptyState'

export interface DataTableColumn<T> {
  /** Identifiant unique de la colonne. */
  key: string
  /** Libellé affiché dans le header. */
  header: ReactNode
  /** Rendu de la cellule. Reçoit la ligne complète. */
  cell: (row: T) => ReactNode
  /** Alignement du contenu. */
  align?: 'left' | 'center' | 'right'
  /** Largeur CSS optionnelle (ex: "120px", "20%"). */
  width?: string
  /** Masquer en dessous d'un breakpoint Tailwind (ex: "sm" → `hidden sm:table-cell`). */
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl'
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  /** Extracteur de clé unique par ligne. */
  rowKey: (row: T, index: number) => Key
  /** Rendu custom d'une ligne (écrase le rendu par colonnes). */
  renderRow?: (row: T, index: number) => ReactNode
  /** État de chargement — affiche un skeleton. */
  loading?: boolean
  /** Nombre de lignes skeleton. */
  skeletonRows?: number
  /** Message affiché quand `rows` est vide et non-loading. */
  emptyMessage?: string
  emptyTitle?: string
  /** Handler de clic sur ligne (ajoute curseur + hover). */
  onRowClick?: (row: T) => void
  /** Classe additionnelle sur le wrapper externe. */
  className?: string
}

function alignClass(align?: 'left' | 'center' | 'right') {
  if (align === 'center') return 'text-center'
  if (align === 'right') return 'text-right'
  return 'text-left'
}

function hideClass(hideBelow?: 'sm' | 'md' | 'lg' | 'xl') {
  if (!hideBelow) return ''
  return { sm: 'hidden sm:table-cell', md: 'hidden md:table-cell', lg: 'hidden lg:table-cell', xl: 'hidden xl:table-cell' }[hideBelow]
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  renderRow,
  loading = false,
  skeletonRows = 5,
  emptyMessage = 'Aucune donnée à afficher pour le moment.',
  emptyTitle,
  onRowClick,
  className = '',
}: DataTableProps<T>) {
  const isEmpty = !loading && rows.length === 0

  return (
    <div className={`overflow-hidden ${className}`}>
      {isEmpty ? (
        <EmptyState title={emptyTitle} message={emptyMessage} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={`${alignClass(col.align)} ${hideClass(col.hideBelow)} px-3 sm:px-4 py-3 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-ss-text-muted whitespace-nowrap`}
                    style={{
                      width: col.width,
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      background: 'rgba(15,23,42,0.35)',
                    }}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading
                ? Array.from({ length: skeletonRows }).map((_, i) => (
                    <tr key={`sk-${i}`}>
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={`${hideClass(col.hideBelow)} px-3 sm:px-4 py-3`}
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        >
                          <div className="h-4 rounded ss-shimmer" />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.map((row, index) => {
                    const clickable = !!onRowClick
                    return (
                      <tr
                        key={rowKey(row, index)}
                        onClick={clickable ? () => onRowClick!(row) : undefined}
                        tabIndex={clickable ? 0 : undefined}
                        onKeyDown={
                          clickable
                            ? (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  onRowClick!(row)
                                }
                              }
                            : undefined
                        }
                        className={`transition-colors ${clickable ? 'cursor-pointer hover:bg-white/[0.03] focus-visible:outline-none focus-visible:bg-white/[0.05]' : ''}`}
                      >
                        {renderRow
                          ? renderRow(row, index)
                          : columns.map((col) => (
                              <td
                                key={col.key}
                                className={`${alignClass(col.align)} ${hideClass(col.hideBelow)} px-3 sm:px-4 py-3 text-ss-text align-middle`}
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                              >
                                {col.cell(row)}
                              </td>
                            ))}
                      </tr>
                    )
                  })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
