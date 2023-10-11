import createId from "../utils/createId";
import db from "../utils/db";

async function createRoomInDB(partnerUserId: string, loginUserId: string) {
  const roomId = createId();

  const query = "INSERT INTO chatroom SET roomId = (?), userId1 = (?), userId2 = (?)";
  await db(query, [roomId, loginUserId, partnerUserId]);

  return roomId;
}

async function getRoomIdFromDB(partnerUserId: string, loginUserId: string) {
  const query =
    "SELECT roomId FROM chatroom WHERE (userId1 = (?) and userId2 = (?)) or (userId1 = (?) and userId2 = (?))";

  const roomId = (await db(
    query,
    [partnerUserId, loginUserId, loginUserId, partnerUserId],
    "first",
  )) as string;

  return roomId;
}

async function getUser(userName: string) {
  const query = "SELECT userId, userImgSrc, userImgPosition FROM user WHERE userName = (?)";
  const user = (await db(query, userName, "first")) as {
    userId: string;
    userImgSrc: string;
    userImgPosition: string;
  };
  return user;
}

export default async function createRoom(partnerUserName: string, loginUserId: string) {
  const partnerUser = await getUser(partnerUserName);

  if (!partnerUser) throw Error("user doesn't exist");

  // check if the room exists already for the users
  let type = "previous" as "new" | "previous";
  let roomId = await getRoomIdFromDB(partnerUser.userId, loginUserId);
  // it can exist if the partner created the room and didn't send a message
  //  since the login user got rooms at first

  if (!roomId) {
    roomId = await createRoomInDB(partnerUser.userId, loginUserId);
    type = "new";
  }

  return {
    room: {
      roomId,
      partnerUserName,
      partnerUserImg: {
        src: partnerUser.userImgSrc,
        position: partnerUser.userImgPosition,
      },
      latestMessageContent: "",
      latestMessageDateTime: "",
      latestMessageDate: "",
      latestMessageTime: "",
      unreadMessageNo: 0,
    },
    partnerUserId: partnerUser.userId,
    type,
  };
}
