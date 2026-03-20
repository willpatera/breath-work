/**
 * Lightweight inline SVG icons.
 * Based on Material Symbols Rounded (24px).
 * No external font or network dependency.
 */

interface IconProps {
  size?: number
  className?: string
}

export function IconInfo({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 -960 960 960" fill="currentColor" className={className}>
      <path d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>
    </svg>
  )
}

export function IconClose({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 -960 960 960" fill="currentColor" className={className}>
      <path d="M480-424 284-228q-11 11-28 11t-28-11q-11-11-11-28t11-28l196-196-196-196q-11-11-11-28t11-28q11-11 28-11t28 11l196 196 196-196q11-11 28-11t28 11q11 11 11 28t-11 28L536-480l196 196q11 11 11 28t-11 28q-11 11-28 11t-28-11L480-424Z"/>
    </svg>
  )
}

export function IconRestart({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 -960 960 960" fill="currentColor" className={className}>
      <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q92 0 172.5 41T790-736v-104q0-17 11.5-28.5T830-880q17 0 28.5 11.5T870-840v200q0 17-11.5 28.5T830-600H630q-17 0-28.5-11.5T590-640q0-17 11.5-28.5T630-680h128q-32-56-87.5-88T480-800q-134 0-227 93t-93 227q0 134 93 227t227 93q104 0 189-62t117-162q6-16 20.5-23t30.5-1q16 6 22.5 22t-1.5 32q-44 118-148 196T480-80Z"/>
    </svg>
  )
}

export function IconPlay({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 -960 960 960" fill="currentColor" className={className}>
      <path d="M360-272q-14 8-27 1t-13-23v-372q0-16 13-23t27 1l288 186q12 8 12 22t-12 22L360-272Z"/>
    </svg>
  )
}

export function IconPause({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 -960 960 960" fill="currentColor" className={className}>
      <path d="M360-320q-17 0-28.5-11.5T320-360v-240q0-17 11.5-28.5T360-640q17 0 28.5 11.5T400-600v240q0 17-11.5 28.5T360-320Zm240 0q-17 0-28.5-11.5T560-360v-240q0-17 11.5-28.5T600-640q17 0 28.5 11.5T640-600v240q0 17-11.5 28.5T600-320Z"/>
    </svg>
  )
}

export function IconSettings({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 -960 960 960" fill="currentColor" className={className}>
      <path d="M405-80q-15 0-26-10t-13-25l-12-93q-13-5-24.5-12T307-235l-87 36q-14 5-28 1t-22-17L96-329q-8-13-5-28t15-24l75-57q-1-7-1-21t1-21l-75-57q-12-9-15-24t5-28l74-114q8-13 22-17t28 1l87 36q11-8 23-15t24-12l12-93q2-15 13-25t26-10h150q15 0 26 10t13 25l12 93q13 5 24.5 12t22.5 15l87-36q14-5 28-1t22 17l74 114q8 13 5 28t-15 24l-75 57q1 7 1 21t-1 21l75 57q12 9 15 24t-5 28l-74 114q-8 13-22 17t-28-1l-87-36q-11 8-23 15t-24 12l-12 93q-2 15-13 25t-26 10H405Zm75-240q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Z"/>
    </svg>
  )
}
