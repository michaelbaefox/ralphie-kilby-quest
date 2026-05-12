export const buildGoogleMapsUrl = (lat: number, lng: number, label?: string) => {
  const dest = label ? `${encodeURIComponent(label)}@${lat},${lng}` : `${lat},${lng}`
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`
}

export const buildAppleMapsUrl = (lat: number, lng: number, label?: string) => {
  const daddr = label ? `${encodeURIComponent(label)}` : `${lat},${lng}`
  return `https://maps.apple.com/?daddr=${daddr}&ll=${lat},${lng}`
}

export const buildTelHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, '')}`
