import getUserNameAndImg from "../home/shared/getUserNameAndImg";
import db from "../utils/db";
import { extractCreateDate, getCurrentTimeExceptMilliSec } from "../utils/getCurrentTime";

type RoomsFromDB = { roomId: string; userId1: string; userId2: string };

async function getRoomsFromDB(loginUserId: string) {
  const query =
    "SELECT roomId, userId1, userId2 FROM chatroom WHERE (userId1 = (?) or userId2 = (?))";

  const roomsFromDB = (await db(query, [loginUserId, loginUserId], "all")) as RoomsFromDB[];

  return roomsFromDB;
}

async function getPartnerUser(loginUserId: string, userId1: string, userId2: string) {
  const partnerUserId = loginUserId === userId1 ? userId1 : userId2;

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

  let latestMessageDate = "";

  const messageCreateDate = extractCreateDate(message.createDateTime);
  const currentDate = extractCreateDate(getCurrentTimeExceptMilliSec());

  if (messageCreateDate === currentDate) {
    latestMessageDate = message.createTime;
  } else {
    latestMessageDate = message.createDate;
  }

  return { latestMessageContent, latestMessageDate };
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

async function composeRooms(roomsFromDB: RoomsFromDB[], loginUserId: string) {
  const rooms = [];

  for (const { roomId, userId1, userId2 } of roomsFromDB) {
    const partnerUser = await getPartnerUser(loginUserId, userId1, userId2);
    if (!partnerUser) continue;

    const latestMessage = await getLatestMessage(roomId);

    if (!latestMessage) {
      const room = {
        roomId,
        partnerUserName: partnerUser.userName,
        partnerUserImg: partnerUser.userImg,
        latestMessageContent: "",
        latestMessageDate: "",
        unreadMessageNo: 0,
      };

      rooms.push(room);
      continue;
    }

    const unreadMessageNo = await getUnreadMessageNo(roomId, partnerUser.userId);

    const room = {
      roomId,
      partnerUserName: partnerUser.userName,
      partnerUserImg: partnerUser.userImg,
      ...latestMessage,
      unreadMessageNo,
    };

    rooms.push(room);
  }

  return rooms;
}

export default async function getRooms(loginUserId: string) {
  const roomsFromDB = await getRoomsFromDB(loginUserId);

  if (!roomsFromDB.length) return [];

  const rooms = await composeRooms(roomsFromDB, loginUserId);

  return rooms;
}
