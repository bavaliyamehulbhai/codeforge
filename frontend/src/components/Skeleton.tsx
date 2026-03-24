import styles from './Skeleton.module.css'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  circle?: boolean
  className?: string
  style?: React.CSSProperties
}

export default function Skeleton({ width, height, circle, className = '', style }: SkeletonProps) {
  return (
    <div 
      className={`skeleton ${styles.base} ${className}`}
      style={{ 
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: circle ? '50%' : undefined,
        ...style
      }}
    />
  )
}
