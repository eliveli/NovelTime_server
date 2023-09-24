import { getCurrentTimeExceptMilliSec } from "../scraper/utils/getCurrentTime";
import createId from "../utils/createId";
import db from "../utils/db";

async function getFirstAncestorCommentId(parentCommentId: string) {
  const query = "SELECT firstAncestorCommentId FROM comment WHERE commentId = (?)";

  const { firstAncestorCommentId } = (await db(query, [parentCommentId], "first")) as {
    firstAncestorCommentId: string;
  };

  // value just got from DB will be falsy value when the parent comment is root comment
  if (!firstAncestorCommentId) return parentCommentId;

  return firstAncestorCommentId;
}

async function addNewReComment(
  talkId: string, // -> writingId
  novelTitle: string,
  commentContent: string,
  loginUserId: string, // -> userId
  commentId: string,
  createDate: string,
  parentCommentId: string,
  firstAncestorCommentId: string,
) {
  const query =
    "INSERT INTO comment SET commentId = (?), writingId = (?), userId = (?), createDate = (?), commentContent = (?), novelTitle = (?), parentCommentId = (?), firstAncestorCommentId = (?)";

  await db(query, [
    commentId,
    talkId,
    loginUserId,
    createDate,
    commentContent,
    novelTitle,
    parentCommentId,
    firstAncestorCommentId,
  ]);
}

async function increaseCommentNo(talkId: string) {
  const query = "UPDATE writing SET commentNO = commentNO + 1 WHERE writingId = (?)";

  await db(query, [talkId]);
}

// firstAncestorCommentId is always a root comment that has reComments
//  increase value in "reCommentNoForRootComment" the column of the root comment
async function increaseReCommentNoForRootComment(rootCommentId: string) {
  const query =
    "UPDATE comment SET reCommentNoForRootComment = reCommentNoForRootComment + 1 WHERE commentId = (?)";

  await db(query, [rootCommentId]);
}

export default async function createReComment(
  talkId: string,
  novelTitle: string,
  commentContent: string,
  loginUserId: string,
  parentCommentId: string,
) {
  const commentId = createId();

  const createDate = getCurrentTimeExceptMilliSec();

  const firstAncestorCommentId = await getFirstAncestorCommentId(parentCommentId);

  await addNewReComment(
    talkId,
    novelTitle,
    commentContent,
    loginUserId,
    commentId,
    createDate,
    parentCommentId,
    firstAncestorCommentId,
  );

  await increaseCommentNo(talkId);

  await increaseReCommentNoForRootComment(firstAncestorCommentId);
}
