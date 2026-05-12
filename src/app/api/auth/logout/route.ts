
export async function POST() {
  return Response.json(
    { ok: true },
    { headers: { 'Set-Cookie': 'cms_token=; Path=/; HttpOnly; Max-Age=0' } }
  )
}
