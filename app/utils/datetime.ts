// 後端 DateTime 一律為 UTC，前端顯示時依使用者時區換算

/**
 * 將後端回傳的 UTC 字串解析為 Date。
 *
 * System.Text.Json 只有在 DateTimeKind 為 Utc 時才會輸出 Z 後綴；
 * Kind 為 Unspecified 時會輸出 2026-07-14T02:30:00 這種不帶時區標記的字串，
 * 而 JS 對「不帶時區標記的日期時間」是以「當地時間」解析（ECMA-262），
 * 會導致完全沒換算。故缺少 Z / ±hh:mm 時補上 Z，確保一律以 UTC 解析。
 */
function parseUtc(value: string): Date {
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)
  return new Date(hasZone ? value : `${value}Z`)
}

/** UTC 時間戳 → 使用者當地時區的「日期 時間」字串（如建立時間） */
export function formatDateTime(value: string): string {
  if (!value) return '—'
  const date = parseUtc(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

/**
 * UTC 時間戳 → 「日期」字串（如截止日）。
 *
 * 截止日是日期語意，前端以當日 UTC 午夜送出（見 save()），
 * 故固定以 UTC 取日期部分；若換算成當地時區，UTC 以西的使用者
 * 會看到日期整天往前位移（例如 UTC-5 會把 7/14 顯示成 7/13）。
 */
export function formatDate(value: string): string {
  if (!value) return '—'
  const date = parseUtc(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString(undefined, { timeZone: 'UTC' })
}
