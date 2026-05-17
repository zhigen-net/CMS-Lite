'use client'

import ArchiveList from './components/ArchiveList'
import type { ThemeArchiveProps } from '@/types/theme'

export default function DefaultCategory(props: ThemeArchiveProps) {
  return <ArchiveList {...props} type="category" />
}
