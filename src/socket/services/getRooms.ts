import getUserNameAndImg from "../../services/home/shared/getUserNameAndImg";
import db from "../../services/utils/db";

type RoomsFromDB = { roomId: string; userId1: string; userId2: string };

async function getRoomsFromDB(loginUserId: string) {
  const query =
    "SELECT roomId, userId1, userId2 FROM chatroom WHERE (userId1 = (?) or userId2 = (?))";

  const roomsFromDB = (await db(query, [loginUserId, loginUserId], "all")) as RoomsFromDB[];

  return roomsFromDB;
}

async function getPartnerUser(loginUserId: string, userId1: string, userId2: string) {
  const partnerUserId = loginUserId === userId1 ? userId2 : userId1;

  const partnerUser = await getUserNameAndImg(partnerUserId);

  if (!partnerUser) return;
  return { userId: partnerUserId, ...partnerUser };
}

type PartOfMessage = {
  content: string;
  createDateTime: string;
  createDate: string;
  createTime: string;
};

async function getLatestMessageFromDB(roomId: string) {
  const query =
    "SELECT content, createDateTime, createDate, createTime FROM message WHERE roomId = (?) ORDER BY createDateTime DESC LIMIT 1";
  const message = (await db(query, roomId, "first")) as PartOfMessage;
  return message;
}

function composeLatestMessage(message: PartOfMessage) {
  const latestMessageContent = message.content;

  return {
    latestMessageContent,
    latestMessageDateTime: message.createDateTime,
    latestMessageDate: message.createDate,
    latestMessageTime: message.createTime,
  };
}

async function getLatestMessage(roomId: string) {
  const message = await getLatestMessageFromDB(roomId);

  if (!message) return;
  return composeLatestMessage(message);
}

async function getUnreadMessageNo(roomId: string, partnerUserId: string) {
  const query =
    "SELECT count(*) AS unreadMessageNo FROM message WHERE roomId = (?) and senderUserId = (?) and isReadByReceiver = 0";

  const { unreadMessageNo } = (await db(query, [roomId, partnerUserId], "first")) as {
    unreadMessageNo: BigInt;
  };

  return Number(unreadMessageNo);
}

async function composeRoom(loginUserId: string, userId1: string, userId2: string, roomId: string) {
  const partnerUser = await getPartnerUser(loginUserId, userId1, userId2);
  if (!partnerUser) return;

  const latestMessage = await getLatestMessage(roomId);

  if (!latestMessage) {
    return {
      roomId,
      partnerUserName: partnerUser.userName,
      partnerUserImg: partnerUser.userImg,
      latestMessageContent: "",
      latestMessageDateTime: "",
      latestMessageDate: "",
      latestMessageTime: "",
      unreadMessageNo: 0,
    };
  }

  const unreadMessageNo = await getUnreadMessageNo(roomId, partnerUser.userId);

  return {
    roomId,
    partnerUserName: partnerUser.userName,
    partnerUserImg: partnerUser.userImg,
    ...latestMessage,
    unreadMessageNo,
  };
}

async function composeRooms(roomsFromDB: RoomsFromDB[], loginUserId: string) {
  const rooms = [];

  for (const { roomId, userId1, userId2 } of roomsFromDB) {
    const room = await composeRoom(loginUserId, userId1, userId2, roomId);

    if (!room) continue;

    rooms.push(room);
  }

  return rooms;
}

type RoomComposed = {
  roomId: string;
  partnerUserName: string;
  partnerUserImg: {
    src: string;
    position: string;
  };
  latestMessageContent: string;
  latestMessageDateTime: string;
  latestMessageDate: string;
  latestMessageTime: string;
  unreadMessageNo: number;
};

const sortByMessageCreateTime = (room1: RoomComposed, room2: RoomComposed) => {
  if (room1.latestMessageDateTime < room2.latestMessageDateTime) return 1;
  if (room1.latestMessageDateTime > room2.latestMessageDateTime) return -1;
  return 0;
};

function sortRooms(rooms: RoomComposed[]) {
  return rooms.sort(sortByMessageCreateTime);
}

export default async function getRooms(loginUserId: string) {
  const roomsFromDB = await getRoomsFromDB(loginUserId);

  if (!roomsFromDB.length) return [];

  const roomsComposed = await composeRooms(roomsFromDB, loginUserId);

  const rooms = sortRooms(roomsComposed);

  return rooms;
}
