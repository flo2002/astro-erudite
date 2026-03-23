import { SpaApp } from '@/spa/app'

type SpaRootProps = {
  basename?: string
}

export default function SpaRoot({ basename = '/' }: SpaRootProps) {
  return <SpaApp basename={basename} />
}
