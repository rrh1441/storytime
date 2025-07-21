export async function GET() {
  return new Response(JSON.stringify({ message: "Story route placeholder" }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}