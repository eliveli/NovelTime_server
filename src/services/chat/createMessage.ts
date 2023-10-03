import createId from "../utils/createId";
import db from "../utils/db";
import { getCurrentTimeExceptMilliSec, splitDateTime } from "../utils/getCurrentTime";

type MessageToDB = {
  messageId: string;
  roomId: string;
  senderUserId: string;
  content: string;
  createDateTime: string;
  createDate: string;
  createTime: string;
  isReadByReceiver: 0 | 1;
};
type MessageToUser = {
  messageId: string;
  roomId: string;
  content: string;
  createDate: string;
  createTime: string;
  isReadByReceiver: boolean;
  senderUserName: string;
  senderUserImg: {
    src: string;
    position: string;
  };
};
export type MessageWithSocket = {
  roomId: string;
  content: string;
  senderUserId: string;
  senderUserName: string;
  senderUserImg: {
    src: string;
    position: string;
  };
};

async function addMessageToDB(message: MessageToDB) {
  const query =
    "INSERT INTO message SET messageId = (?), roomId = (?), senderUserId = (?), content = (?), createDateTime = (?), createDate = (?), createTime = (?), isReadByReceiver = (?)";

  await db(query, [
    message.messageId,
    message.roomId,
    message.senderUserId,
    message.content,
    message.createDateTime,
    message.createDate,
    message.createTime,
    message.isReadByReceiver,
  ]);
}

export default async function createMessage(messageWithSocket: MessageWithSocket) {
  try {
    const { roomId, content, senderUserId, senderUserName, senderUserImg } = messageWithSocket;
    const messageId = createId();

    const createDateTime = getCurrentTimeExceptMilliSec();
    const { createDate, createTime } = splitDateTime(createDateTime);

    const messageToDB: MessageToDB = {
      messageId,
      roomId,
      senderUserId,
      content,
      createDateTime,
      createDate,
      createTime,
      isReadByReceiver: 0,
    };

    const messageToUser: MessageToUser = {
      messageId,
      roomId,
      content,
      createDate,
      createTime,
      isReadByReceiver: false,
      senderUserName,
      senderUserImg,
    };

    await addMessageToDB(messageToDB);

    return messageToUser;
  } catch (error) {
    console.log(error);
  }
}
