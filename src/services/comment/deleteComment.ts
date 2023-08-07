import db from "../utils/db";

async function checkIfItHasReComment(commentId: string) {
  const query = "SELECT * FROM comment WHERE parentCommentId = (?)";

  const reComment = (await db(query, commentId, "all")) as Comment[];

  if (!reComment.length) return false;

  return true;
}

async function deleteCommentWithCommentId(commentId: string) {
  const query = "DELETE FROM comment WHERE commentId = (?)";

  await db(query, [commentId]);
}

async function regardAsDeleted(commentId: string) {
  const query =
    "UPDATE comment SET isDeleted = 1, userId = '', commentContent = '' WHERE commentId = (?)";

  await db(query, [commentId]);
}

async function getFirstAncestorCommentId(commentId: string) {
  const query = "SELECT firstAncestorCommentId FROM comment WHERE commentId = (?)";

  const { firstAncestorCommentId } = (await db(query, [commentId], "first")) as {
    firstAncestorCommentId: string;
  };

  // when this is a root comment, following value doesn't exist
  if (!firstAncestorCommentId) return "";

  // when this is a reComment
  return firstAncestorCommentId;
}

async function decreaseReCommentNoForRootComment(rootCommentId: string) {
  const query =
    "UPDATE comment SET reCommentNoForRootComment = reCommentNoForRootComment - 1 WHERE commentId = (?)";

  await db(query, [rootCommentId]);
}

async function getWritingId(commentId: string) {
  const query = "SELECT writingId FROM comment WHERE commentId = (?)";

  const { writingId } = (await db(query, [commentId], "first")) as {
    writingId: string;
  };

  return writingId;
}

async function decreaseCommentNo(writingId: string) {
  const query = "UPDATE writing SET commentNO = commentNO - 1 WHERE writingId = (?)";

  await db(query, [writingId]);
}

export default async function deleteComment(commentId: string) {
  const hasReComment = await checkIfItHasReComment(commentId);

  if (hasReComment) {
    await regardAsDeleted(commentId);
  } else {
    // get the root comment that has this comment given to this function as its reComment
    const rootCommentId = await getFirstAncestorCommentId(commentId);

    // if the root comment exist, decrease its reComment number
    if (rootCommentId) {
      await decreaseReCommentNoForRootComment(rootCommentId);
    }

    const writingId = await getWritingId(commentId);

    await decreaseCommentNo(writingId);

    await deleteCommentWithCommentId(commentId);
  }
}
