/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import db from "../utils/db";
import { query } from "../utils/query";

type Writing = {
  writingId: string;
  userId: string;
  createDate: string;
  writingTitle: string;
  writingImg: string;
  writingDesc: string;
  novelId: string;
  likeNO: number;
  commentNO: number;
  talkOrRecommend: "T" | "R";
};
type Recommend = {
  recommendId: string;
  recommendTitle: string;
  createDate: string;
  likeNO: number;
  novelTitle: string;
  novelImg: string;
  userName?: string;
};
type Talk = {
  talkId: string;
  talkTitle: string;
  createDate: string;
  likeNO: number;
  commentNO: number;
  novelTitle: string;
  novelImg: string;
  userName?: string;
};
type NovelTitleAndImg = {
  novelTitle: string;
  novelImg: string;
};

async function getNovelTitleAndImg(novelId: string) {
  const { novelTitle, novelImg } = (await db(
    query.getNovelTitleAndImg,
    novelId,
  )) as NovelTitleAndImg;

  return { novelTitle, novelImg };
}
async function getUserNameByUserId(userId: string) {
  return (await db(query.getUserNameByUserId, userId)) as string;
}
async function setWritingInfo(writing: Writing, isOnesUserCreated: boolean) {
  const {
    writingId,
    userId,
    createDate,
    writingTitle,
    novelId,
    likeNO,
    commentNO,
    talkOrRecommend,
  } = writing;
  const { novelTitle, novelImg } = await getNovelTitleAndImg(novelId);

  let userName = "";
  // this is for writings an user likes not an user created
  // get the user name who created this writing that an user likes
  if (!isOnesUserCreated) {
    userName = await getUserNameByUserId(userId);
  }

  if (talkOrRecommend === "T") {
    const talk: Talk = {
      talkId: writingId,
      talkTitle: writingTitle,
      createDate,
      likeNO,
      commentNO,
      novelTitle,
      novelImg,
    };
    if (!isOnesUserCreated) {
      talk.userName = userName;
    }
    return talk;
  }

  const recommend: Recommend = {
    recommendId: writingId,
    recommendTitle: writingTitle,
    createDate,
    likeNO,
    novelTitle,
    novelImg,
  };
  if (!isOnesUserCreated) {
    recommend.userName = userName;
  }
  return recommend;
}
async function setWritings(writings: Writing[], isOnesUserCreated: boolean) {
  const writingsSet = [];
  for (const writing of writings) {
    const writingSet = await setWritingInfo(writing, isOnesUserCreated);
    writingsSet.push(writingSet);
  }
  return writingsSet;
}

function divideWritings(writings: Writing[]) {
  // for UserPageHome page get the 4 writings
  const requiredNumber = 4;
  const order = 1; // only needed 1 as order number in UserPageHome

  const talks = [];
  const recommends = [];
  for (const writing of writings) {
    if (writing.talkOrRecommend === "T") {
      talks.push(writing);
    }
    if (writing.talkOrRecommend === "R") {
      recommends.push(writing);
    }

    // when requesting writings from userPage, "order" is always 1
    if (talks.length >= requiredNumber * order && recommends.length >= requiredNumber * order) {
      break;
    }
  }

  // set the lists as requested after setting the arrays of talks and recommends
  const dividedTalks = talks.slice(requiredNumber * (order - 1), requiredNumber * order);
  const dividedRecommends = recommends.slice(requiredNumber * (order - 1), requiredNumber * order);

  return { dividedTalks, dividedRecommends };
}

function getTalksOrRecommendsAsOrder(talksOrRecommends: Writing[], order: number) {
  const requiredNumber = 8;
  const talksOrRecommendsAsOrder = talksOrRecommends.slice(
    requiredNumber * (order - 1),
    requiredNumber * order,
  );
  const firstIndexOfNextOrder = requiredNumber * order;
  const isNextOrder = !!talksOrRecommends[firstIndexOfNextOrder];
  return { talksOrRecommendsAsOrder, isNextOrder };
}
async function getWritingsSet(writings: Writing[], isOnesUserCreated: boolean) {
  const { dividedTalks, dividedRecommends } = divideWritings(writings);

  const talksSet = await setWritings(dividedTalks, isOnesUserCreated);
  const recommendsSet = await setWritings(dividedRecommends, isOnesUserCreated);

  if (isOnesUserCreated) {
    return {
      talksUserCreated: talksSet,
      recommendsUserCreated: recommendsSet,
    };
  }

  return {
    talksUserLikes: talksSet,
    recommendsUserLikes: recommendsSet,
  };
}

async function getWritingByWritingId(writingId: string, contentType?: "T" | "R") {
  // for othersWriting in UserPage divide as content type
  // for UserPageHome page get all writings
  const queryForDividingWritings = contentType
    ? query.getTalksOrRecommendsByWritingId
    : query.getWritingByWritingId;
  const paramsForDividingWritings = contentType ? [writingId, contentType] : writingId;

  return await db(queryForDividingWritings, paramsForDividingWritings);
}

async function getWritingsByWritingIDs(writingIDs: string[], contentType?: "T" | "R") {
  const writings: Writing[] = [];
  for (const writingId of writingIDs) {
    const writing = await getWritingByWritingId(writingId, contentType);
    // writing can be undefined if its content type is different from the param's one
    // if so don't push that into the writings array
    if (!writing) continue;

    writings.push(writing);
  }
  return writings;
}
async function getWritingIDsByUserId(userId: string) {
  const dataForWritingIDs = await db(query.getWritingIDsByUserId, userId);
  const writingIDs: string[] = [];
  for (const dataForWritingId of dataForWritingIDs) {
    const { writingId } = dataForWritingId;
    writingIDs.push(writingId as string);
  }
  return writingIDs;
}

async function getWritingsByUserId(userId: string) {
  return (await db(query.getWritings, userId)) as Writing[];
}

async function getTalksOrRecommendsByUserId(userId: string, talksOrRecommends: "T" | "R") {
  return (await db(query.getTalksOrRecommendsByUserId, [userId, talksOrRecommends])) as Writing[];
}

async function getWritingsUserCreatedForUserPageHome(userId: string) {
  try {
    const writings = await getWritingsByUserId(userId);
    const { talksUserCreated, recommendsUserCreated } = await getWritingsSet(writings, true);

    return { talksUserCreated, recommendsUserCreated };
  } catch (error) {
    console.log("error occurred in getWritingsUserCreatedForUserPageHome:", error);
    // to avoid type error destructuring undefined in controller
    return { talksUserCreated: undefined, recommendsUserCreated: undefined };
  }
}

async function getWritingsUserLikesForUserPageHome(userId: string) {
  try {
    const writingIDs = await getWritingIDsByUserId(userId);
    const writings = await getWritingsByWritingIDs(writingIDs);
    const { talksUserLikes, recommendsUserLikes } = await getWritingsSet(writings, false);

    return { talksUserLikes, recommendsUserLikes };
  } catch (error) {
    console.log("error occurred in getWritingsUserLikesForUserPageHome:", error);
    return { talksUserLikes: undefined, recommendsUserLikes: undefined };
  }
}

async function getWritingsUserCreatedForMyWriting(
  userId: string,
  contentType: "T" | "R",
  order: number,
) {
  try {
    const talksOrRecommends = await getTalksOrRecommendsByUserId(userId, contentType);
    const { talksOrRecommendsAsOrder, isNextOrder } = getTalksOrRecommendsAsOrder(
      talksOrRecommends,
      order,
    );
    const talksOrRecommendsSet = await setWritings(talksOrRecommendsAsOrder, true);

    return { talksOrRecommendsSet, isNextOrder };
  } catch (error) {
    console.log("error occurred in getTalksOrRecommendsUserCreated:", error);
    return { talksOrRecommendsSet: undefined, isNextOrder: undefined };
  }
}

async function getWritingsUserLikesForOthersWriting(
  userId: string,
  contentType: "T" | "R",
  order: number,
) {
  try {
    const writingIDs = await getWritingIDsByUserId(userId);
    const talksOrRecommends = await getWritingsByWritingIDs(writingIDs, contentType);
    const { talksOrRecommendsAsOrder, isNextOrder } = getTalksOrRecommendsAsOrder(
      talksOrRecommends,
      order,
    );
    const talksOrRecommendsSet = await setWritings(talksOrRecommendsAsOrder, false);

    return { talksOrRecommendsSet, isNextOrder };
  } catch (error) {
    console.log("error occurred in getWritingsUserLikesForOthersWriting:", error);
    return { talksOrRecommendsSet: undefined, isNextOrder: undefined };
  }
}

const userWritingService = {
  getMyWritings: getWritingsUserCreatedForMyWriting,
  getMyWritingsForUserHome: getWritingsUserCreatedForUserPageHome,
  getOthersWritings: getWritingsUserLikesForOthersWriting,
  getOthersWritingsForUserHome: getWritingsUserLikesForUserPageHome,
};
export default userWritingService;
