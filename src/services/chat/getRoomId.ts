import createId from "../utils/createId";
import db from "../utils/db";

async function createRoom(otherUserName: string, loginUserName: string) {
  const roomId = createId();

  const query = "INSERT INTO chatroom SET roomId = (?), userId1 = (?), userId2 = (?)";
  await db(query, [roomId, loginUserName, otherUserName]);

  return roomId;
}

async function getRoomIdFromDB(otherUserName: string, loginUserName: string) {
  const query =
    "SELECT roomId FROM chatroom WHERE (userId1 = (?) and userId2 = (?)) or (userId1 = (?) and userId2 = (?))";

  const roomId = (await db(
    query,
    [otherUserName, loginUserName, loginUserName, otherUserName],
    "first",
  )) as string;

  return roomId;
}

async function getUserName(userId: string) {
  const query = "SELECT userName FROM user WHERE userId = (?)";
  const userName = (await db(query, userId, "first")) as string;
  return userName;
}

export default async function getRoomId(otherUserName: string, loginUserId: string) {
  const loginUserName = await getUserName(loginUserId);

  if (!loginUserName) return undefined;

  const roomId = await getRoomIdFromDB(otherUserName, loginUserName);

  if (!roomId) {
    const newRoomId = await createRoom(otherUserName, loginUserName);
    return newRoomId;
  }

  return roomId;
}
