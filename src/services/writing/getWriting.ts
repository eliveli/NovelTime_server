import db from "../utils/db";
import { Writing, Comment } from "../utils/types";
import getUserNameAndImg from "../home/shared/getUserNameAndImg";
import { getContentLike } from "../userContent/toggleLike";

type User = {
  userName: string;
  userImg: {
    src: string;
    position: string;
  };
};

type NovelDetail = {
  novelId: string;
  novelImg: string;
  novelTitle: string;
  novelAuthor: string;
  novelGenre: string;
  novelDesc: string;
};

function composeTalkDetail(writing: Writing, user: User, isLike: boolean, novel: NovelDetail) {
  return {
    talkId: writing.writingId,

    userId: writing.userId,
    userName: user.userName,
    userImg: user.userImg,

    createDate: writing.createDate,

    likeNO: writing.likeNO,
    commentNO: writing.commentNO,
    isLike, // login-user's LIKE

    talkTitle: writing.writingTitle,
    talkDesc: writing.writingDesc,
    talkImg: writing.writingImg,

    novel,
  };
}

async function getNovelByNovelId(novelId: string) {
  const novel = (await db(
    "SELECT novelId, novelImg, novelTitle, novelAuthor, novelGenre, novelDesc FROM novelInfo WHERE novelId = (?)",
    novelId,
    "first",
  )) as NovelDetail;

  if (!novel) return;

  return { ...novel };
}

async function getCommentsByWritingId(writingId: string) {
  return (await db("SELECT * FROM comment WHERE writingId = (?)", writingId, "all")) as Comment[];
}

function setCommentsWithReComments(commentsFromServer: Comment[]) {
  // 코멘트 분류 : 1차, 2차, 3차

  // 1차 코멘트 - 리코멘트가 아닌 것
  const comments1st = commentsFromServer.filter((_) => !_.originalCommentIdForReComment);

  // 모든 리코멘트 - 2차, 3차 코멘트
  const allReComments = commentsFromServer.filter((_) => !!_.originalCommentIdForReComment);

  if (allReComments.length === 0) {
    return comments1st; // 리코멘트가 없는 경우
  }

  // 2차 코멘트 (1차 코멘트의 리코멘트)
  const comments2nd = allReComments.filter((r) => {
    const comment2nd = comments1st.filter((c) => r.originalCommentIdForReComment === c.commentId);
    return !!comment2nd.length;
  });

  // { 원본코멘트아이디 : 2차 코멘트[] }
  const comments2ndWithOriginalIDs: { [x: string]: Comment[] } = {};
  comments2nd.forEach((c) => {
    comments2ndWithOriginalIDs[c.originalCommentIdForReComment] = [
      ...comments2ndWithOriginalIDs[c.originalCommentIdForReComment],
      c,
    ];
  });

  const commentIDsOfComments2nd = comments2nd.map((c) => c.commentId);

  // 3차 코멘트 (2차 코멘트의 리코멘트)
  const comments3rd = allReComments.filter((r) => !commentIDsOfComments2nd.includes(r.commentId));

  // 1차 코멘트에 리코멘트 속성 추가 (1,2,3차 코멘트 합치기)
  const commentsWithReComments = comments1st.map((_) => {
    const c = _;
    const reComment: Comment[] = [];

    const comments2ndOfThisOne = comments2ndWithOriginalIDs[c.commentId];

    // 1차 코멘트의 리코멘트로 2차 코멘트 넣기
    if (comments2ndOfThisOne) {
      reComment.push(...comments2ndOfThisOne);
    }

    // 1차 코멘트의 리코멘트로 ((이 1차의 리코멘인 2차)의 리코멘인) 3차 코멘트 넣기
    if (comments2ndOfThisOne && comments3rd.length) {
      const commentsIDsOfComments2ndOfThisOne = comments2ndOfThisOne.map((cc) => cc.commentId);

      comments3rd.forEach((ccc, idx) => {
        if (commentsIDsOfComments2ndOfThisOne.includes(ccc.originalCommentIdForReComment)) {
          reComment.push(ccc);
          comments3rd.splice(idx, 1); // 해당 3차 코멘트 배열에서 삭제 (for 다음 번 탐색 시간 감소)
        }
      });
    }

    if (reComment.length) {
      c.reComment = reComment;
    }
    return c;
  });

  return commentsWithReComments;
}

export default async function getWriting(writingType: "T" | "R", writingId: string) {
  if (writingType === "T") {
    const writing = (await db(
      "SELECT * FROM writing WHERE writingId = (?)",
      [writingId],
      "first",
    )) as Writing;

    const user = await getUserNameAndImg(writing.userId);
    if (!user) return;

    const isLike = await getContentLike("writing", writing.userId, writingId);

    const novel = await getNovelByNovelId(writing.novelId);
    if (!novel) return;

    const commentsFromDB = await getCommentsByWritingId(writingId);
    // * comments can be empty

    const commentsWithReComments = setCommentsWithReComments(commentsFromDB);

    composeTalkDetail(writing, user, isLike, novel);
  }
}
