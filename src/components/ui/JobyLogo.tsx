type JobyLogoProps = {
  className?: string
}

export function JobyLogo({ className = 'h-9 w-9' }: JobyLogoProps) {
  return (
    <img
      src="/joby-logo.png"
      alt=""
      aria-hidden="true"
      width={48}
      height={48}
      className={`shrink-0 object-cover ${className}`}
    />
  )
}
