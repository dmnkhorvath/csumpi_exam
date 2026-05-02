import { forwardRef } from 'react'

export const Icon = forwardRef(function Icon({ as: Cmp, size = 24, strokeWidth = 1.75, ...rest }, ref) {
  return <Cmp ref={ref} size={size} strokeWidth={strokeWidth} aria-hidden="true" {...rest} />
})
