import type { CSSProperties } from 'react'
import type { SvgIconComponent } from '@mui/icons-material'

export type BrutalIconTone = 'gold' | 'ink' | 'danger' | 'navy'
export type BrutalIconVariant = 'tile' | 'inline' | 'nav' | 'pin'

type Props = {
  Icon: SvgIconComponent
  size?: number
  tone?: BrutalIconTone
  variant?: BrutalIconVariant
  ariaLabel?: string
  className?: string
}

export const BrutalIcon = ({
  Icon,
  size = 22,
  tone = 'gold',
  variant = 'inline',
  ariaLabel,
  className,
}: Props) => {
  const cssVar = { '--bi-size': `${size}px` } as CSSProperties
  const classes = [
    'brutalIcon',
    `brutalIcon--${tone}`,
    `brutalIcon--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span
      className={classes}
      style={cssVar}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    >
      <Icon />
    </span>
  )
}
