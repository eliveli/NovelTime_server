import db from "../utils/db";

type Comment = {
  commentId: string;
  writingId: string;
  userId: string;
  novelTitle: string;
  createDate: string;
  commentContent: string;
  originalCommentIdForReComment: string; // if it is not "" empty string, get the info for it
};

async function getTalkTitle(talkId: string) {
  const { talkTitle } = (await db(
    "SELECT writingTitle FROM writing WHERE writingId = (?)",
    talkId,
    "first",
  )) as { talkTitle: string };
  return talkTitle;
}

async function setCommentInfo(comment: Comment) {
  const { commentId, writingId, novelTitle, createDate, commentContent } = comment;

  const talkId = writingId;
  const talkTitle = await getTalkTitle(talkId);

  return {
    commentId,
    commentContent,
    createDate,
    talkId,
    talkTitle,
    novelTitle,
  };
}

function extractComments(comments: Comment[], isHome = true, order = 1) {
  // for UserPageHome page get the 4 comments
  // for UserPageWriting(Comment) page get the 8 comments as requested order
  const requiredNumber = isHome ? 4 : 8;

  const extractedComments = comments.slice(requiredNumber * (order - 1), requiredNumber * order);

  // for UserPageWriting
  if (!isHome) {
    const firstIndexOfNextOrder = requiredNumber * order;
    const isNextOrder = !!comments[firstIndexOfNextOrder];
    return { extractedComments, isNextOrder };
  }

  return extractedComments;
}

async function getCommentsSet(selectedComments: Comment[]) {
  const commentsSet = [];

  for (const comment of selectedComments) {
    const commentSet = await setCommentInfo(comment);
    commentsSet.push(commentSet);
  }
  return commentsSet;
}

async function getCommentsByUserId(userId: string) {
  return (await db("SELECT * FROM comment WHERE userId = (?)", userId, "all")) as Comment[];
}

async function getCommentsForUserPageHome(userId: string) {
  try {
    const comments = await getCommentsByUserId(userId);

    const selectedComments = extractComments(comments);

    const commentsSet = await getCommentsSet(selectedComments as Comment[]);

    return commentsSet;
  } catch (error) {
    console.log("error occurred in getCommentsForUserPageHome:", error);
  }
}

async function getCommentsForMyWriting(userId: string, order: number) {
  try {
    const comments = await getCommentsByUserId(userId);

    const { extractedComments, isNextOrder } = extractComments(comments, false, order) as {
      extractedComments: Comment[];
      isNextOrder: boolean;
    };

    const commentsSet = await getCommentsSet(extractedComments);

    return { commentsSet, isNextOrder };
  } catch (error) {
    console.log("error occurred in getCommentsForMyWriting:", error);
    return { commentsSet: undefined, isNextOrder: undefined };
  }
}

const userCommentService = {
  getCommentsForUserHome: getCommentsForUserPageHome,
  getComments: getCommentsForMyWriting,
};
export default userCommentService;
