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
function getNovelTitleAndImg(novelId: string) {
  return new Promise<any>(async (resolve) => {
    await pool
      .getConnection()
      .then((connection) => {
        connection
          .query(query.getNovelTitleAndImg, novelId)
          .then((data) => {
            const titleAndImg = data.slice(0, data.length);
            resolve(titleAndImg);

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
async function setWritingInfo(writing: Writing) {
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
  const dataForNovelTitleAndImg = await getNovelTitleAndImg(novelId);
  const { novelTitle, novelImg } = dataForNovelTitleAndImg[0];

  if (talkOrRecommend === "T") {
    const talkId = writingId;
    const talkTitle = writingTitle;
    return {
      talkId,
      talkTitle,
      createDate,
      likeNO,
      commentNO,
      novelTitle,
      novelImg,
    };
  }

  const recommendId = writingId;
  const recommendTitle = writingTitle;
  return {
    recommendId,
    recommendTitle,
    createDate,
    likeNO,
    novelTitle,
    novelImg,
  };
}
async function setWritings(writings: Writing[]) {
  const writingsSet = [];
  for (const writing of writings) {
    const writingSet = await setWritingInfo(writing);
    writingsSet.push(writingSet);
  }
  return writingsSet;
}

function divideWritings(writings: Writing[], isHome: boolean, order = 1) {
  // for UserPageHome page get the 4 writings
  // for UserPageWriting page get the 8 writings
  const requiredNumber = isHome ? 4 : 8;

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
    // otherwise requesting from userPageWritings page, "order" will be 1 or bigger one
    //   because if an user clicks the "more" button writings in next order will be required
    if (talks.length >= requiredNumber * order && recommends.length >= requiredNumber * order) {
      break;
    }
  }

  // set the lists as requested after setting the arrays of talks and recommends
  const dividedTalks = talks.slice(requiredNumber * (order - 1), requiredNumber * order);
  const dividedRecommends = recommends.slice(requiredNumber * (order - 1), requiredNumber * order);

  return { dividedTalks, dividedRecommends };
}

async function getWritingsSet(writings: Writing[], isHome = true) {
  const { dividedTalks, dividedRecommends } = divideWritings(writings, isHome);

  const talksSet = await setWritings(dividedTalks);
  const recommendsSet = await setWritings(dividedRecommends);

  return { talksSet, recommendsSet };
}

async function getWritingByWritingId(writingId: string) {
  return new Promise<Writing>(async (resolve) => {
    await pool
      .getConnection()
      .then((connection) => {
        connection
          .query(query.getWritingByWritingId, writingId)
          .then(async (data) => {
            const writing = data[0];
            resolve(writing as Writing);

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

async function getWritingsByWritingIDs(writingIDs: string[]) {
  const writings: Writing[] = [];
  for (const writingId of writingIDs) {
    const writing = await getWritingByWritingId(writingId);
    writings.push(writing);
  }
  return writings;
}
async function getWritingIDsByUserId(userId: string) {
  return new Promise<any>(async (resolve) => {
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
export function getWritingsUserCreatedForUserPageHome(userId: string) {
  return new Promise<any>(async (resolve) => {
    await pool
      .getConnection()
      .then((connection) => {
        connection
          .query(query.getWritings, userId)
          .then(async (data) => {
            const writings = data.slice(0, data.length);

            const writingsSet = await getWritingsSet(writings as Writing[]);

            resolve(writingsSet);

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
export function getWritingsUserLikesForUserPageHome(userId: string) {
  return new Promise<any>(async (resolve) => {
    const writingIDs = await getWritingIDsByUserId(userId);

    const writings = await getWritingsByWritingIDs(writingIDs as string[]);

    // set writing info
    const writingsSet = await getWritingsSet(writings);

    resolve(writingsSet);
  });
}
