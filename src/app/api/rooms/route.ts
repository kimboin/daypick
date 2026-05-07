import { NextResponse } from "next/server";
import { createRoom } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      hostName: string;
      startDate: string;
      endDate: string;
      availableDates: string[];
    };

    const room = await createRoom(body);
    return NextResponse.json({
      roomId: room.id,
      inviteCode: room.inviteCode,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "방 생성에 실패했습니다." },
      { status: 400 },
    );
  }
}
