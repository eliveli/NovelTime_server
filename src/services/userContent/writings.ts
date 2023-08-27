import db from "../utils/db";
import { Recommend, Talk, Writing } from "../utils/types";

type NovelTitleAndImg = {
  novelTitle: string;
  novelImg: string;
};

async function getNovelTitleAndImg(novelId: string) {
  const { novelTitle, novelImg } = (await db(
    "SELECT novelTitle, novelImg FROM novelInfo WHERE novelId = (?)",
    novelId,
    "first",
  )) as NovelTitleAndImg;

  return { novelTitle, novelImg };
}
async function getUserNameByUserId(userId: string) {
  const { userName } = (await db(
    "SELECT userName FROM user WHERE userId = (?)",
    userId,
    "first",
  )) as {
    userName: string;
  };
  return userName;
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
    ? "SELECT * FROM writing WHERE writingId = (?) and talkOrRecommend = (?)"
    : "SELECT * FROM writing WHERE writingId = (?)";
  const paramsForDividingWritings = contentType ? [writingId, contentType] : writingId;

  return (await db(queryForDividingWritings, paramsForDividingWritings, "first")) as Writing;
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
  const dataForWritingIDs = (await db(
    "SELECT writingId FROM writingLike WHERE userId = (?)",
    userId,
    "all",
  )) as {
    writingId: string;
  }[];
  const writingIDs: string[] = [];
  for (const dataForWritingId of dataForWritingIDs) {
    const { writingId } = dataForWritingId;
    writingIDs.push(writingId);
  }
  return writingIDs;
}

async function getWritingsByUserId(userId: string) {
  return (await db("SELECT * FROM writing WHERE userId = (?)", userId, "all")) as Writing[];
}

async function getTalksOrRecommendsByUserId(userId: string, talksOrRecommends: "T" | "R") {
  return (await db(
    "SELECT * FROM writing WHERE userId = (?) and talkOrRecommend = (?)",
    [userId, talksOrRecommends],
    "all",
  )) as Writing[];
}

async function getWritingsUserCreatedForUserHome(userId: string) {
  try {
    const writings = await getWritingsByUserId(userId);
    const { talksUserCreated, recommendsUserCreated } = await getWritingsSet(writings, true);

    return { talksUserCreated, recommendsUserCreated };
  } catch (error) {
    console.log("error occurred in getWritingsUserCreatedForUserHome:", error);
    // to avoid type error destructuring undefined in controller
    return { talksUserCreated: undefined, recommendsUserCreated: undefined };
  }
}

async function getWritingsUserLikedForUserHome(userId: string) {
  try {
    const writingIDs = await getWritingIDsByUserId(userId);
    const writings = await getWritingsByWritingIDs(writingIDs);
    const { talksUserLikes, recommendsUserLikes } = await getWritingsSet(writings, false);

    return { talksUserLikes, recommendsUserLikes };
  } catch (error) {
    console.log("error occurred in getWritingsUserLikedForUserHome:", error);
    return { talksUserLikes: undefined, recommendsUserLikes: undefined };
  }
}

async function getWritingsUserCreated(userId: string, contentType: "T" | "R", order: number) {
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

async function getWritingsUserLiked(userId: string, contentType: "T" | "R", order: number) {
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
    console.log("error occurred in getWritingsUserLiked:", error);
    return { talksOrRecommendsSet: undefined, isNextOrder: undefined };
  }
}

const userWritingService = {
  getWritingsUserCreated,
  getWritingsUserCreatedForUserHome,
  getWritingsUserLiked,
  getWritingsUserLikedForUserHome,
};
export default userWritingService;
