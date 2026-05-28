
export async function POST() {
  return Response.json(
    { ok: true },
    { headers: { 'Set-Cookie': 'cms_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0' } }
  )
}
