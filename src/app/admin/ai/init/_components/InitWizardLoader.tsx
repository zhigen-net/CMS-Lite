'use client'

import dynamic from 'next/dynamic'

const InitWizard = dynamic(() => import('./InitWizard'), { ssr: false })

export default function InitWizardLoader() {
  return <InitWizard />
}
