import db from "../utils/db";

async function getMessagesFromDB(roomId: string) {
  const query = "SELECT * FROM message WHERE roomId = (?)";
  const messages = (await db(query, roomId, "all")) as {
    messageId: string;
    roomId: string;
    senderUserId: string;
    content: string;
    createdAt: string;
    isReadByReceiver: string;
  }[];
  return messages;
}

async function checkTheRoomAndUser(roomId: string, loginUserId: string) {
  const query = "SELECT * FROM chatroom WHERE roomId = (?) and (userId1 = (?) or userId2 = (?))";
  const isRoomAvailable = !!(await db(query, [roomId, loginUserId, loginUserId], "first"));

  if (!isRoomAvailable) {
    const query2 = "SELECT * FROM chatroom WHERE roomId = (?)";
    const isRoomExisting = !!(await db(query2, [roomId], "first"));

    if (isRoomExisting) throw Error("user is not in the room");
    else throw Error("room doesn't exist");
  }
}

async function markMessageRead(roomId: string, loginUserId: string) {
  const query =
    "UPDATE message SET isReadByReceiver = 1 WHERE roomId = (?) and senderUserId != (?)";

  await db(query, [roomId, loginUserId]);
}
export default async function getMessages(roomId: string, loginUserId: string) {
  await checkTheRoomAndUser(roomId, loginUserId);

  const messages = await getMessagesFromDB(roomId);

  await markMessageRead(roomId, loginUserId);

  return messages;
}
