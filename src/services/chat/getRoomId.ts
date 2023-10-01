import createId from "../utils/createId";
import db from "../utils/db";

async function createRoom(partnerUserId: string, loginUserId: string) {
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

async function getUserId(userName: string) {
  const query = "SELECT userId FROM user WHERE userName = (?)";
  const { userId } = (await db(query, userName, "first")) as { userId: string };
  return userId;
}

export default async function getRoomId(partnerUserName: string, loginUserId: string) {
  const partnerUserId = await getUserId(partnerUserName);

  if (!partnerUserId) throw Error("user doesn't exist");

  const roomId = await getRoomIdFromDB(partnerUserId, loginUserId);

  if (!roomId) {
    const newRoomId = await createRoom(partnerUserId, loginUserId);
    return newRoomId;
  }

  return roomId;
}
