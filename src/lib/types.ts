export type Participant = {
  id: string;
  nickname: string;
  isHost: boolean;
  availableDates: string[];
  createdAt: string;
  updatedAt: string;
};

export type Room = {
  id: string;
  inviteCode: string;
  hostName: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  participants: Participant[];
};

export type RoomStore = {
  rooms: Room[];
};
