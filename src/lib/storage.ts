import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createDateRange, isDateWithinRange, normalizeDates } from "@/lib/date";
import { generateInviteCode } from "@/lib/invite-code";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import type { Participant, Room, RoomStore } from "@/lib/types";

const dataDirectory = path.join(process.cwd(), "data");
const storePath = path.join(dataDirectory, "rooms.json");

async function ensureStore() {
  await mkdir(dataDirectory, { recursive: true });
  try {
    await readFile(storePath, "utf8");
  } catch {
    const initialData: RoomStore = { rooms: [] };
    await writeFile(storePath, JSON.stringify(initialData, null, 2), "utf8");
  }
}

async function readStore() {
  await ensureStore();
  const raw = await readFile(storePath, "utf8");
  return JSON.parse(raw) as RoomStore;
}

async function writeStore(data: RoomStore) {
  await ensureStore();
  await writeFile(storePath, JSON.stringify(data, null, 2), "utf8");
}

function validateRoomInput(hostName: string, startDate: string, endDate: string, availableDates: string[]) {
  if (!hostName.trim()) {
    throw new Error("닉네임을 입력해주세요.");
  }

  const fullRange = createDateRange(startDate, endDate);
  if (fullRange.length === 0) {
    throw new Error("올바른 날짜 범위를 입력해주세요.");
  }

  const normalized = normalizeDates(availableDates);
  if (normalized.length === 0) {
    throw new Error("가능한 날짜를 1개 이상 선택해주세요.");
  }

  const hasOutOfRangeDate = normalized.some((date) => !isDateWithinRange(date, startDate, endDate));
  if (hasOutOfRangeDate) {
    throw new Error("선택한 날짜에 범위 밖 값이 포함되어 있습니다.");
  }

  return normalized;
}

function buildParticipant(nickname: string, availableDates: string[], isHost: boolean, current?: Participant): Participant {
  const timestamp = new Date().toISOString();
  return {
    id: current?.id ?? randomUUID(),
    nickname: nickname.trim(),
    isHost,
    availableDates,
    createdAt: current?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

function mapParticipant(participant: {
  id: string;
  nickname: string;
  is_host?: boolean;
  available_dates?: string[];
  created_at: string;
  updated_at: string;
}): Participant {
  return {
    id: participant.id,
    nickname: participant.nickname,
    isHost: participant.is_host ?? false,
    availableDates: normalizeDates(participant.available_dates ?? []),
    createdAt: participant.created_at,
    updatedAt: participant.updated_at,
  };
}

function mapRoom(room: {
  id: string;
  invite_code: string;
  host_name: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  participants?: Array<{
    id: string;
    nickname: string;
    is_host?: boolean;
    available_dates?: string[];
    created_at: string;
    updated_at: string;
  }>;
}): Room {
  return {
    id: room.id,
    inviteCode: room.invite_code,
    hostName: room.host_name,
    startDate: room.start_date,
    endDate: room.end_date,
    createdAt: room.created_at,
    updatedAt: room.updated_at,
    participants: (room.participants ?? []).map(mapParticipant),
  };
}

async function createRoomInSupabase(input: {
  hostName: string;
  startDate: string;
  endDate: string;
  availableDates: string[];
}) {
  const availableDates = validateRoomInput(
    input.hostName,
    input.startDate,
    input.endDate,
    input.availableDates,
  );
  const supabase = getSupabaseAdmin();

  let inviteCode = generateInviteCode();
  while (true) {
    const { data: existing, error } = await supabase
      .from("rooms")
      .select("id")
      .eq("invite_code", inviteCode)
      .maybeSingle();

    if (error) {
      throw new Error("초대코드 확인 중 오류가 발생했습니다.");
    }

    if (!existing) {
      break;
    }

    inviteCode = generateInviteCode();
  }

  const { data: insertedRoom, error: roomError } = await supabase
    .from("rooms")
    .insert({
      invite_code: inviteCode,
      host_name: input.hostName.trim(),
      start_date: input.startDate,
      end_date: input.endDate,
    })
    .select("*")
    .single();

  if (roomError || !insertedRoom) {
    throw new Error("방 생성에 실패했습니다.");
  }

  const { data: insertedParticipant, error: participantError } = await supabase
    .from("participants")
    .insert({
      room_id: insertedRoom.id,
      nickname: input.hostName.trim(),
      is_host: true,
      available_dates: availableDates,
    })
    .select("*")
    .single();

  if (participantError || !insertedParticipant) {
    throw new Error("방장 일정 저장에 실패했습니다.");
  }

  return mapRoom({
    ...insertedRoom,
    participants: [insertedParticipant],
  });
}

async function getRoomFromSupabase(inviteCode: string) {
  const supabase = getSupabaseAdmin();
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("*")
    .eq("invite_code", inviteCode)
    .maybeSingle();

  if (roomError) {
    throw new Error("방 정보를 불러오지 못했습니다.");
  }

  if (!room) {
    return null;
  }

  const { data: participants, error: participantsError } = await supabase
    .from("participants")
    .select("*")
    .eq("room_id", room.id)
    .order("created_at", { ascending: true });

  if (participantsError) {
    throw new Error("참여자 정보를 불러오지 못했습니다.");
  }

  return mapRoom({
    ...room,
    participants: participants ?? [],
  });
}

async function addOrUpdateParticipantInSupabase(
  inviteCode: string,
  input: { nickname: string; availableDates: string[] },
) {
  if (!input.nickname.trim()) {
    throw new Error("닉네임을 입력해주세요.");
  }

  const room = await getRoomFromSupabase(inviteCode);
  if (!room) {
    throw new Error("유효하지 않은 초대코드입니다.");
  }

  const availableDates = validateRoomInput(
    input.nickname,
    room.startDate,
    room.endDate,
    input.availableDates,
  );
  const supabase = getSupabaseAdmin();

  const existing = room.participants.find(
    (participant) => participant.nickname.toLowerCase() === input.nickname.trim().toLowerCase(),
  );

  if (existing) {
    const { error } = await supabase
      .from("participants")
      .update({
        nickname: input.nickname.trim(),
        available_dates: availableDates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      throw new Error("참여자 일정 수정에 실패했습니다.");
    }
  } else {
    const { error } = await supabase.from("participants").insert({
      room_id: room.id,
      nickname: input.nickname.trim(),
      is_host: false,
      available_dates: availableDates,
    });

    if (error) {
      throw new Error("참여자 일정 저장에 실패했습니다.");
    }
  }

  const refreshedRoom = await getRoomFromSupabase(inviteCode);
  if (!refreshedRoom) {
    throw new Error("참여자 저장 후 방 정보를 확인하지 못했습니다.");
  }

  return refreshedRoom;
}

export async function createRoom(input: {
  hostName: string;
  startDate: string;
  endDate: string;
  availableDates: string[];
}) {
  if (isSupabaseConfigured()) {
    return createRoomInSupabase(input);
  }

  const availableDates = validateRoomInput(
    input.hostName,
    input.startDate,
    input.endDate,
    input.availableDates,
  );
  const store = await readStore();

  let inviteCode = generateInviteCode();
  while (store.rooms.some((room) => room.inviteCode === inviteCode)) {
    inviteCode = generateInviteCode();
  }

  const hostParticipant = buildParticipant(input.hostName, availableDates, true);
  const timestamp = new Date().toISOString();
  const room: Room = {
    id: randomUUID(),
    inviteCode,
    hostName: input.hostName.trim(),
    startDate: input.startDate,
    endDate: input.endDate,
    createdAt: timestamp,
    updatedAt: timestamp,
    participants: [hostParticipant],
  };

  store.rooms.push(room);
  await writeStore(store);
  return room;
}

export async function getRoom(inviteCode: string) {
  if (isSupabaseConfigured()) {
    return getRoomFromSupabase(inviteCode);
  }

  const store = await readStore();
  return store.rooms.find((room) => room.inviteCode === inviteCode) ?? null;
}

export async function addOrUpdateParticipant(
  inviteCode: string,
  input: { nickname: string; availableDates: string[] },
) {
  if (isSupabaseConfigured()) {
    return addOrUpdateParticipantInSupabase(inviteCode, input);
  }

  if (!input.nickname.trim()) {
    throw new Error("닉네임을 입력해주세요.");
  }

  const store = await readStore();
  const room = store.rooms.find((item) => item.inviteCode === inviteCode);
  if (!room) {
    throw new Error("유효하지 않은 초대코드입니다.");
  }

  const availableDates = validateRoomInput(
    input.nickname,
    room.startDate,
    room.endDate,
    input.availableDates,
  );

  const existingIndex = room.participants.findIndex(
    (participant) => participant.nickname.toLowerCase() === input.nickname.trim().toLowerCase(),
  );
  const current = existingIndex >= 0 ? room.participants[existingIndex] : undefined;
  const participant = buildParticipant(input.nickname, availableDates, current?.isHost ?? false, current);

  if (existingIndex >= 0) {
    room.participants[existingIndex] = participant;
  } else {
    room.participants.push(participant);
  }

  room.updatedAt = new Date().toISOString();
  await writeStore(store);
  return room;
}

export async function getRoomResults(inviteCode: string) {
  const room = await getRoom(inviteCode);
  if (!room) {
    return null;
  }

  const counts = new Map<string, number>();
  for (const participant of room.participants) {
    for (const date of participant.availableDates) {
      counts.set(date, (counts.get(date) ?? 0) + 1);
    }
  }

  const rankedDates = [...counts.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => b.count - a.count || a.date.localeCompare(b.date));

  const participantCount = room.participants.length;
  const commonDates = rankedDates
    .filter((entry) => entry.count === participantCount)
    .map((entry) => entry.date);

  return {
    inviteCode: room.inviteCode,
    hostName: room.hostName,
    startDate: room.startDate,
    endDate: room.endDate,
    participants: room.participants,
    rankedDates,
    commonDates,
  };
}
