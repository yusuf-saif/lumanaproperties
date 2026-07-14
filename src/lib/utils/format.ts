export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatEnum(value: string): string {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatRoomType(type: string): string {
  switch (type) {
    case 'STUDIO': return 'Studio'
    case 'ONE_BEDROOM': return '1 Bedroom'
    case 'TWO_BEDROOM': return '2 Bedroom'
    case 'THREE_BEDROOM': return '3 Bedroom'
    case 'PENTHOUSE': return 'Penthouse'
    default: return type
  }
}
