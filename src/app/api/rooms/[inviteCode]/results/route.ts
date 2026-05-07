import { NextResponse } from "next/server";
import { getRoomResults } from "@/lib/storage";

type Props = {
  params: Promise<{ inviteCode: string }>;
};

export async function GET(_: Request, { params }: Props) {
  const { inviteCode } = await params;
  const results = await getRoomResults(inviteCode);

  if (!results) {
    return NextResponse.json({ error: "유효하지 않은 초대코드입니다." }, { status: 404 });
  }

  return NextResponse.json(results);
}
