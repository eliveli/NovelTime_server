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
function divideWritings(writings: Writing[], number: number, order = 1) {
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
    if (talks.length >= number * order && recommends.length >= number * order) {
      break;
    }
  }

  // set the lists as requested after setting the arrays of talks and recommends
  const dividedTalks = talks.slice(number * (order - 1), number * order);
  const dividedRecommends = recommends.slice(number * (order - 1), number * order);

  return { dividedTalks, dividedRecommends };
}

export default function getWritings(userId: string) {
  return new Promise<any>(async (resolve) => {
    await pool
      .getConnection()
      .then((connection) => {
        connection
          .query(query.getWritings, userId)
          .then(async (data) => {
            const writings = data.slice(0, data.length);
            const { dividedTalks, dividedRecommends } = divideWritings(writings, 4);

            const talksSet = [];
            const recommendsSet = [];
            for (const talk of dividedTalks) {
              const talkSet = await setWritingInfo(talk);
              talksSet.push(talkSet);
            }
            for (const recommend of dividedRecommends) {
              const recommendSet = await setWritingInfo(recommend);
              recommendsSet.push(recommendSet);
            }

            resolve({ talksSet, recommendsSet });

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
