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

type CommentComposed = {
  commentId: string;
  userName: string;
  userImg: {
    src: string;
    position: string;
  };
  commentContent: string;
  createDate: string;
  reComment: any[];
};

function composeTalkDetail(writing: Writing, user: User, isLike: boolean) {
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
  };
}

async function getNovelByNovelId(novelId: string) {
  const novel = (await db(
    "SELECT novelId, novelImg, novelTitle, novelAuthor, novelGenre, novelDesc FROM novelInfo WHERE novelId = (?)",
    novelId,
    "first",
  )) as NovelDetail;

  if (!novel) return;

  return novel;
}

async function getCommentsByWritingId(writingId: string) {
  return (await db("SELECT * FROM comment WHERE writingId = (?)", writingId, "all")) as Comment[];
}

async function setComment(comment: Comment) {
  const {
    commentId,
    userId,
    commentContent,
    createDate,
    reComment, // it can be undefined
  } = comment;

  // * 모든 리코멘트는 원본 코멘트 아래에 작성 순으로 나열됨

  const user = await getUserNameAndImg(userId);
  if (!user) return;

  let reCommentComposed: any[] = [];

  // set reComments
  if (reComment) {
    const reComments = [];
    const commentsUserNames: { [commentId: string]: string } = {
      [commentId]: user.userName,
    }; // to set originalCommentUserName

    // compose reComments
    for (const recom of reComment) {
      const reCommentSet1st = await setComment(recom);
      if (!reCommentSet1st) continue;
      const originalCommentId = recom.originalCommentIdForReComment;

      commentsUserNames[commentId] = reCommentSet1st.userName;

      reComments.push({
        commentId: reCommentSet1st.commentId,
        originalCommentId,
        originalCommentUserName: "",
        userName: reCommentSet1st.userName,
        userImg: reCommentSet1st.userImg,
        commentContent: reCommentSet1st.commentContent,
        createDate: reCommentSet1st.createDate,
      });
    }

    // add original comment's user names to reComments
    const reCommentsWithOriginalCommentsUserNames = reComments.map((_) => {
      const r = _;
      r.originalCommentUserName = commentsUserNames[r.originalCommentId];
      return r;
    });

    reCommentComposed = reCommentsWithOriginalCommentsUserNames;
  }

  return {
    commentId,
    userName: user.userName,
    userImg: user.userImg,
    commentContent,
    createDate,
    reComment: reCommentComposed,
  };
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
    if (!comments2ndWithOriginalIDs[c.originalCommentIdForReComment]) {
      comments2ndWithOriginalIDs[c.originalCommentIdForReComment] = [c];
    }
    if (comments2ndWithOriginalIDs[c.originalCommentIdForReComment]) {
      comments2ndWithOriginalIDs[c.originalCommentIdForReComment] = [
        ...comments2ndWithOriginalIDs[c.originalCommentIdForReComment],
        c,
      ];
    }
  });

  const commentIDsOfComments2nd = comments2nd.map((c) => c.commentId);

  // 3차 코멘트 (2차 코멘트의 리코멘트)
  const comments3rd = allReComments.filter((r) => !commentIDsOfComments2nd.includes(r.commentId));

  // 1차 코멘트에 리코멘트 속성 추가 (1,2,3차 코멘트 합치기)
  const commentsWithReComments = comments1st.map((_) => {
    const c = _;
    const reComments: Comment[] = []; // 2차 코멘트 + 3차 코멘트
    const reReCommentsIDs: string[] = [];
    // ㄴ2차의 리코멘트인 3차 코멘트 아이디s
    // ㄴnot 3차의 리코멘트인 3차 코멘트 아이디s

    const comments2ndOfThisOne = comments2ndWithOriginalIDs[c.commentId];

    // 1차 코멘트의 리코멘트로 2차 코멘트 넣기
    if (comments2ndOfThisOne) {
      reComments.push(...comments2ndOfThisOne);
    }

    // 1차 코멘트의 리코멘트로 2차의 리코멘트인 3차 코멘트 넣기
    if (comments2ndOfThisOne && comments3rd.length) {
      const commentsIDsOfComments2ndOfThisOne = comments2ndOfThisOne.map((cc) => cc.commentId);

      comments3rd.forEach((ccc, idx) => {
        if (commentsIDsOfComments2ndOfThisOne.includes(ccc.originalCommentIdForReComment)) {
          reComments.push(ccc);
          reReCommentsIDs.push(ccc.commentId); // 2차의 리코멘트인 3차 코멘트 아이디 배열 추가
          comments3rd.splice(idx, 1); // 해당 3차 코멘트 배열에서 삭제 (for 다음 번 탐색 시간 감소)
        }
      });
    }

    // 1차 코멘트의 리코멘트로 3차의 리코멘트인 3차 코멘트 넣기
    if (reReCommentsIDs.length) {
      comments3rd.forEach((ccc, idx) => {
        if (reReCommentsIDs.includes(ccc.originalCommentIdForReComment)) {
          reComments.push(ccc);

          const idxOfReReComment = reReCommentsIDs.indexOf(ccc.originalCommentIdForReComment);
          reReCommentsIDs.splice(idxOfReReComment, 1); // 3차 코멘트 아이디 배열에서 삭제

          comments3rd.splice(idx, 1);
        }
      });
    }

    if (reComments.length) {
      c.reComment = reComments;
    }
    return c;
  });

  return commentsWithReComments;
}

async function composeComments(comments: Comment[]) {
  const commentsComposed = [];

  for (const comment of comments) {
    const commentComposed = await setComment(comment);

    if (!commentComposed) continue;

    commentsComposed.push(commentComposed);
  }

  return commentsComposed;
}

function sortCommentsOld(c1: CommentComposed, c2: CommentComposed) {
  if (c1.createDate < c2.createDate) return -1;
  if (c1.createDate > c2.createDate) return 1;
  return 0;
}
function sortCommentsNew(c1: CommentComposed, c2: CommentComposed) {
  if (c1.createDate < c2.createDate) return 1;
  if (c1.createDate > c2.createDate) return -1;
  return 0;
}

function sortComments(comments: CommentComposed[], sortType: "new" | "old") {
  // sort comments
  if (sortType === "old") {
    comments.sort(sortCommentsOld);
  } else {
    comments.sort(sortCommentsNew);
  }

  // sort reComments
  const commentsSorted = comments.map((_) => {
    const c = _;
    if (c.reComment.length) {
      if (sortType === "old") {
        c.reComment.sort(sortCommentsOld);
      } else {
        c.reComment.sort(sortCommentsNew);
      }
    }
    return c;
  });

  return commentsSorted;
}

export default async function getWriting(
  writingType: "T" | "R",
  writingId: string,
  sortType: "new" | "old",
) {
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
    if (!commentsFromDB.length) {
      //  when comments empty
      const talk = composeTalkDetail(writing, user, isLike);

      return { talk, novel, commentList: [] };
    }
    const commentsWithReComments = setCommentsWithReComments(commentsFromDB);

    const commentsComposed = await composeComments(commentsWithReComments);

    const commentList = sortComments(commentsComposed, sortType);

    const talk = composeTalkDetail(writing, user, isLike);

    return { talk, novel, commentList };
  }
}
