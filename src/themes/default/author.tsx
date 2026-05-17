'use client'

import AuthorArchive from './components/AuthorArchive'
import type { ThemeAuthorProps } from '@/types/theme'

export default function DefaultAuthor(props: ThemeAuthorProps) {
  return <AuthorArchive {...props} />
}
