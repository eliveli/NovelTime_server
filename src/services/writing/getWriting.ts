import db from "../utils/db";
import { Writing } from "../utils/types";
import getUserNameAndImg from "../home/shared/getUserNameAndImg";
import { getContentLike } from "../shared/toggleLike";

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

function composeTalkDetail(writing: Writing, user: User, isLike: boolean) {
  return {
    talkId: writing.writingId,

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
function composeRecommendDetail(writing: Writing, user: User, isLike: boolean) {
  return {
    recommendId: writing.writingId,

    userName: user.userName,
    userImg: user.userImg,

    createDate: writing.createDate,

    likeNO: writing.likeNO,
    isLike, // login-user's LIKE

    recommendTitle: writing.writingTitle,
    recommendDesc: writing.writingDesc,
    recommendImg: writing.writingImg,
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

export async function getWriting(writingType: "T" | "R", writingId: string, loginUserId?: string) {
  const writing = (await db(
    "SELECT * FROM writing WHERE writingId = (?)",
    [writingId],
    "first",
  )) as Writing;

  if (!writing?.userId) return;
  const user = await getUserNameAndImg(writing.userId);
  if (!user) return;

  let isLike = false;
  if (loginUserId) {
    isLike = await getContentLike("writing", loginUserId, writingId);
  }

  const novel = await getNovelByNovelId(writing.novelId);
  if (!novel) return;

  if (writingType === "T") {
    const talk = composeTalkDetail(writing, user, isLike);

    return { talk, novel };
  }

  const recommend = composeRecommendDetail(writing, user, isLike);

  return { recommend, novel };
}
