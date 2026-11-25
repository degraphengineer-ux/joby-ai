import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Card } from './Card'

type StatCardProps = {
  label: string
  value: number
  href: string
  icon: ReactNode
}

export function StatCard({ label, value, href, icon }: StatCardProps) {
  return (
    <Link
      to={href}
      className="group rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
    >
      <Card className="flex h-full items-center gap-4 p-5 transition-colors group-hover:border-teal/30">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-teal/10 text-teal">
          {icon}
        </span>
        <span className="min-w-0">
          <span className="block text-2xl font-bold text-navy">{value}</span>
          <span className="block text-sm text-slatebody">{label}</span>
        </span>
      </Card>
    </Link>
  )
}