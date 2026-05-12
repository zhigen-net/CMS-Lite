import { permanentRedirect } from 'next/navigation'


interface Props { params: Promise<{ slug: string }> }

export default async function OldTagRedirect({ params }: Props) {
  const { slug } = await params
  permanentRedirect(`/tag/${slug}`)
}
