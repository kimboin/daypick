import { NextResponse } from "next/server";
import { addOrUpdateParticipant } from "@/lib/storage";

type Props = {
  params: Promise<{ inviteCode: string }>;
};

export async function POST(request: Request, { params }: Props) {
  try {
    const { inviteCode } = await params;
    const body = (await request.json()) as {
      nickname: string;
      availableDates: string[];
    };
    const room = await addOrUpdateParticipant(inviteCode, body);

    return NextResponse.json({
      inviteCode: room.inviteCode,
      participantCount: room.participants.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "참여 저장에 실패했습니다." },
      { status: 400 },
    );
  }
}
