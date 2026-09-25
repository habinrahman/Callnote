export const runtime = "nodejs";

export function GET() {
  return Response.json({
    supabaseUrlPresent: Boolean(!!process.env.SUPABASE_URL),
    supabaseSecretPresent: Boolean(!!process.env.SUPABASE_SECRET_KEY),
    supabaseUrlLength: process.env.SUPABASE_URL?.length ?? 0,
    supabaseSecretLength: process.env.SUPABASE_SECRET_KEY?.length ?? 0,
    nodeEnv: process.env.NODE_ENV ?? null,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    callnoteEnvTestPresent: Boolean(process.env.CALLNOTE_ENV_TEST),
  });
}
