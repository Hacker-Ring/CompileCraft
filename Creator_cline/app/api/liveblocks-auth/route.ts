import { Liveblocks } from "@liveblocks/node";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: Request) {
  try {
    // Get the current user from your Clerk auth
    const { userId } = await auth();
    
    // Ensure the user is authenticated
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Start a session with Liveblocks
    const session = liveblocks.prepareSession(userId, {
      userInfo: {
        name: userId.slice(0, 8),
      },
    });

    // Get the room from the request body
    const body = await request.json();
    const { room } = body;
    
    if (room) {
      session.allow(room, session.FULL_ACCESS);
    }

    // Authorize the user and return the result
    const { status, body: responseBody } = await session.authorize();
    return new Response(responseBody, { status });
  } catch (error) {
    console.error("Liveblocks auth error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
