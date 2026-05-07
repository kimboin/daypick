import { NextResponse } from "next/server";
import { getRoom } from "@/lib/storage";

type Props = {
  params: Promise<{ inviteCode: string }>;
};

export async function GET(_: Request, { params }: Props) {
  const { inviteCode } = await params;
  const room = await getRoom(inviteCode);

  if (!room) {
    return NextResponse.json({ error: "유효하지 않은 초대코드입니다." }, { status: 404 });
  }

  return NextResponse.json({
    inviteCode: room.inviteCode,
    hostName: room.hostName,
    startDate: room.startDate,
    endDate: room.endDate,
    participantCount: room.participants.length,
  });
}
