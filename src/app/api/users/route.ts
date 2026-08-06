import { findOrCreateUser } from "@/app/lib/mongodbUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUI_ADDRESS = /^0x[0-9a-fA-F]{1,64}$/;

export async function POST(request: Request) {
  let body: { walletAddress?: unknown };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (typeof body.walletAddress !== "string" || !SUI_ADDRESS.test(body.walletAddress)) {
    return Response.json({ error: "A valid Sui wallet address is required." }, { status: 400 });
  }

  try {
    const user = await findOrCreateUser(body.walletAddress.toLowerCase());
    return Response.json({ user });
  } catch (error) {
    console.error("Failed to create or find user:", error);
    return Response.json({ error: "Unable to save the user right now." }, { status: 500 });
  }
}
