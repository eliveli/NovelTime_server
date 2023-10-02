/* eslint-disable prefer-destructuring */
import getUserNameAndImg from "../home/shared/getUserNameAndImg";
import db from "../utils/db";

type MessageFromDB = {
  messageId: string;
  roomId: string;
  senderUserId: string;
  content: string;
  createDateTime: string;
  createDate: string;
  createTime: string;
  isReadByReceiver: 0 | 1;
};

async function getMessagesFromDB(roomId: string) {
  const query = "SELECT * FROM message WHERE roomId = (?) ORDER BY createDateTime";
  const messages = (await db(query, roomId, "all")) as MessageFromDB[];
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
async function getUserIDsInTheRoom(roomId: string) {
  const query = "SELECT userId1, userId2 FROM chatroom WHERE roomId = (?)";

  const userIDs = (await db(query, [roomId], "first")) as { userId1: string; userId2: string };

  return userIDs;
}

async function findUserInfo(roomId: string) {
  const { userId1, userId2 } = await getUserIDsInTheRoom(roomId);

  const users = [];

  for (const userId of [userId1, userId2]) {
    const userInfo = await getUserNameAndImg(userId);

    if (!userInfo) throw Error("user doesn't exist");

    const user = { userId, ...userInfo };
    users.push(user);
  }

  return users;
}

async function composeMessages(roomId: string, messages: MessageFromDB[]) {
  const users = await findUserInfo(roomId);

  const messagesComposed = [];

  for (const message of messages) {
    let userMatched;
    if (message.senderUserId === users[0].userId) {
      userMatched = users[0];
    } else {
      userMatched = users[1];
    }

    const messageComposed = {
      messageId: message.messageId,
      roomId: message.roomId,
      content: message.content,
      createDate: message.createDate,
      createTime: message.createTime,
      isReadByReceiver: Boolean(message.isReadByReceiver),
      senderUserName: userMatched.userName,
      senderUserImg: userMatched.userImg,
    };

    messagesComposed.push(messageComposed);
  }

  return messagesComposed;
}

async function markMessageRead(roomId: string, loginUserId: string) {
  const query =
    "UPDATE message SET isReadByReceiver = 1 WHERE roomId = (?) and senderUserId != (?)";

  await db(query, [roomId, loginUserId]);
}

export default async function getMessages(roomId: string, loginUserId: string) {
  await checkTheRoomAndUser(roomId, loginUserId);

  const messagesFromDB = await getMessagesFromDB(roomId);
  if (messagesFromDB.length === 0) return [];

  const messages = await composeMessages(roomId, messagesFromDB);

  await markMessageRead(roomId, loginUserId);

  return messages;
}
