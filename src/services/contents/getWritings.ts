/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import pool from "../../configs/db";
import { query } from "./contents.utils";

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

function getNovelTitleAndImg(novelId: string) {
  return new Promise<NovelTitleAndImg>(async (resolve) => {
    await pool
      .getConnection()
      .then((connection) => {
        connection
          .query(query.getNovelTitleAndImg, novelId)
          .then((data) => {
            const titleAndImg = data[0] as NovelTitleAndImg;
            const { novelTitle, novelImg } = titleAndImg;

            resolve({ novelTitle, novelImg });

            // When done with the connection, release it.
            connection.release();
          })

          .catch((err) => {
            console.log(err);
            connection.release();
          });
      })
      .catch((err) => {
        console.log(`not connected due to error: ${err}`);
      });
  });
}
async function getUserNameByUserId(userId: string) {
  return new Promise<string>(async (resolve) => {
    await pool
      .getConnection()
      .then((connection) => {
        connection
          .query(query.getUserNameByUserId, userId)
          .then((data) => {
            const { userName } = data[0];

            resolve(userName as string);

            // When done with the connection, release it.
            connection.release();
          })

          .catch((err) => {
            console.log(err);
            connection.release();
          });
      })
      .catch((err) => {
        console.log(`not connected due to error: ${err}`);
      });
  });
}
async function setWritingInfo(writing: Writing, isOnesUserCreated: boolean) {
  const {
    writingId,
    userId,
    createDate,
    writingTitle,
    writingImg,
    writingDesc,
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

    // when requesting writings from userPageHome page, "order" is always 1
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

async function getWritingByWritingId(writingId: string, contentsType?: "T" | "R") {
  // for othersWriting in UserPage divide as contents type
  // for UserPageHome page get all writings
  const queryForDividingWritings = contentsType
    ? query.getTalksOrRecommendsByWritingId
    : query.getWritingByWritingId;
  const paramsForDividingWritings = contentsType ? [writingId, contentsType] : writingId;
  return new Promise<Writing>(async (resolve) => {
    await pool
      .getConnection()
      .then((connection) => {
        connection
          .query(queryForDividingWritings, paramsForDividingWritings)
          .then(async (data) => {
            const writing = data[0] as Writing;
            resolve(writing);

            // When done with the connection, release it.
            connection.release();
          })

          .catch((err) => {
            console.log(err);
            connection.release();
          });
      })
      .catch((err) => {
        console.log(`not connected due to error: ${err}`);
      });
  });
}

async function getWritingsByWritingIDs(writingIDs: string[], contentsType?: "T" | "R") {
  const writings: Writing[] = [];
  for (const writingId of writingIDs) {
    const writing = await getWritingByWritingId(writingId, contentsType);
    // writing can be undefined if its contents type is different from the param's one
    // if so don't push that into the writings array
    if (!writing) continue;

    writings.push(writing);
  }
  return writings;
}
async function getWritingIDsByUserId(userId: string) {
  return new Promise<string[]>(async (resolve) => {
    await pool
      .getConnection()
      .then((connection) => {
        connection
          .query(query.getWritingIDsByUserId, userId)
          .then(async (data) => {
            const dataForWritingIDs = data.slice(0, data.length);
            const writingIDs: string[] = [];
            for (const dataForWritingId of dataForWritingIDs) {
              const { writingId } = dataForWritingId;
              writingIDs.push(writingId as string);
            }
            resolve(writingIDs);

            // When done with the connection, release it.
            connection.release();
          })

          .catch((err) => {
            console.log(err);
            connection.release();
          });
      })
      .catch((err) => {
        console.log(`not connected due to error: ${err}`);
      });
  });
}

function getWritingsByUserId(userId: string) {
  return new Promise<Writing[]>(async (resolve) => {
    await pool
      .getConnection()
      .then((connection) => {
        connection
          .query(query.getWritings, userId)
          .then(async (data) => {
            const writings = data.slice(0, data.length);

            resolve(writings as Writing[]);

            // When done with the connection, release it.
            connection.release();
          })

          .catch((err) => {
            console.log(err);
            connection.release();
          });
      })
      .catch((err) => {
        console.log(`not connected due to error: ${err}`);
      });
  });
}
function getTalksOrRecommendsByUserId(userId: string, talksOrRecommends: "T" | "R") {
  return new Promise<Writing[]>(async (resolve) => {
    await pool
      .getConnection()
      .then((connection) => {
        connection
          .query(query.getTalksOrRecommendsByUserId, [userId, talksOrRecommends])
          .then(async (data) => {
            const writings = data.slice(0, data.length);

            resolve(writings as Writing[]);

            // When done with the connection, release it.
            connection.release();
          })

          .catch((err) => {
            console.log(err);
            connection.release();
          });
      })
      .catch((err) => {
        console.log(`not connected due to error: ${err}`);
      });
  });
}

export function getWritingsUserCreatedForUserPageHome(userId: string) {
  return new Promise<any>(async (resolve) => {
    try {
      const writings = await getWritingsByUserId(userId);
      const { talksUserCreated, recommendsUserCreated } = await getWritingsSet(writings, true);

      resolve({ talksUserCreated, recommendsUserCreated });
    } catch (error) {
      console.log("error occurred in getWritingsUserCreatedForUserPageHome:", error);
    }
  });
}
export function getWritingsUserLikesForUserPageHome(userId: string) {
  return new Promise<any>(async (resolve) => {
    try {
      const writingIDs = await getWritingIDsByUserId(userId);
      const writings = await getWritingsByWritingIDs(writingIDs);
      const { talksUserLikes, recommendsUserLikes } = await getWritingsSet(writings, false);

      resolve({ talksUserLikes, recommendsUserLikes });
    } catch (error) {
      console.log("error occurred in getWritingsUserLikesForUserPageHome:", error);
    }
  });
}

export function getWritingsUserCreatedForMyWriting(
  userId: string,
  contentsType: "T" | "R",
  order: number,
) {
  return new Promise<any>(async (resolve) => {
    try {
      const talksOrRecommends = await getTalksOrRecommendsByUserId(userId, contentsType);
      const { talksOrRecommendsAsOrder, isNextOrder } = getTalksOrRecommendsAsOrder(
        talksOrRecommends,
        order,
      );
      const talksOrRecommendsSet = await setWritings(talksOrRecommendsAsOrder, true);

      resolve({ talksOrRecommendsSet, isNextOrder });
    } catch (error) {
      console.log("error occurred in getTalksOrRecommendsUserCreated:", error);
    }
  });
}
export function getWritingsUserLikesForOthersWriting(
  userId: string,
  contentsType: "T" | "R",
  order: number,
) {
  return new Promise<any>(async (resolve) => {
    try {
      const writingIDs = await getWritingIDsByUserId(userId);
      const talksOrRecommends = await getWritingsByWritingIDs(writingIDs, contentsType);
      const { talksOrRecommendsAsOrder, isNextOrder } = getTalksOrRecommendsAsOrder(
        talksOrRecommends,
        order,
      );
      const talksOrRecommendsSet = await setWritings(talksOrRecommendsAsOrder, false);

      resolve({ talksOrRecommendsSet, isNextOrder });
    } catch (error) {
      console.log("error occurred in getWritingsUserLikesForOthersWriting:", error);
    }
  });
}
