import { getCurrentTimeExceptMilliSec } from "../scraper/utils/getCurrentTime";
import db from "../utils/db";

async function addNewRootComment(
  talkId: string, // -> writingId
  novelTitle: string,
  commentContent: string,
  loginUserId: string, // -> userId
  commentId: string,
  createDate: string,
) {
  const query =
    "INSERT INTO comment SET commentId = (?), writingId = (?), userId = (?), createDate = (?), commentContent = (?), novelTitle = (?)";

  await db(query, [commentId, talkId, loginUserId, createDate, commentContent, novelTitle]);
}

async function changeCommentNoInWriting(talkId: string) {
  const query = "UPDATE writing SET commentNO = commentNO + 1 WHERE writingId = (?)";

  await db(query, [talkId]);
}

export default async function createRootComment(
  talkId: string,
  novelTitle: string,
  commentContent: string,
  loginUserId: string,
) {
  // set unique comment id
  // - user creates comment one by one
  //  -> Date.now()
  // - some users can create comment simultaneously
  //  -> insert "loginUserId"
  // - commend id is only used to be divided between comments
  //  -> don't need to insert its category like "comment" in the id
  const commentId = `${loginUserId}${Date.now().toString()}`;

  const createDate = getCurrentTimeExceptMilliSec();

  await addNewRootComment(talkId, novelTitle, commentContent, loginUserId, commentId, createDate);

  await changeCommentNoInWriting(talkId);
}
