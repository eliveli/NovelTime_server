/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import pool from "../../configs/db";
import { query } from "./contents.utils";

type NovelListInfo = {
  novelListId: string;
  userId: string;
  novelListTitle: string;
  novelIDs: string;
};

type Novel = {
  novelId: string;
  novelImg: string;
  novelTitle: string;
  novelDesc: string;
  novelAuthor: string;
  novelAge: string;
  novelGenre: string;
  novelIsEnd: boolean;
  novelPlatform: string;
  novelPlatform2: string;
  novelPlatform3: string;
  novelUrl: string;
  novelUrl2: string;
  novelUrl3: string;
  isRecommendation: number;
  isFreeTalk: number;
};

async function getNovelListInfoListByUserId(userId: string) {
  return new Promise<NovelListInfo[]>(async (resolve) => {
    await pool
      .getConnection()
      .then((connection) => {
        connection
          .query(query.getNovelListInfoListByUserId, userId)
          .then(async (data) => {
            const novelListInfoList = data.slice(0, data.length);

            resolve(novelListInfoList as NovelListInfo[]);

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
async function getNovelInfoByNovelId(novelId: string) {
  return new Promise<Novel>(async (resolve) => {
    await pool
      .getConnection()
      .then((connection) => {
        connection
          .query(query.getNovelInfoByNovelId, novelId)
          .then(async (data) => {
            const novelInfo = data[0];

            resolve(novelInfo as Novel);

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
async function getNovelLists(novelListInfoList: NovelListInfo[]) {
  const novelLists = [];
  for (const novelListInfo of novelListInfoList) {
    const dataForNovelIDs = novelListInfo.novelIDs;
    const novelIDs = dataForNovelIDs.split(" ");

    // get novels by novel id per the novel list
    const novels: Novel[] = [];

    for (const novelId of novelIDs) {
      const novel = await getNovelInfoByNovelId(novelId);
      console.log("novel:", novel);
      novels.push(novel);
    }

    const novelList = { ...novelListInfo, novels };
    novelLists.push(novelList);
  }
  return novelLists;
}
export function getNovelListsUserCreated(userId: string) {
  return new Promise<any>(async (resolve) => {
    const novelListInfoList = await getNovelListInfoListByUserId(userId);

    const novelLists = await getNovelLists(novelListInfoList);

    // const novelListsSet = await getNovelListsSet(novelLists);

    resolve(novelLists);
  });
}
export function getNovelListsUserLikes(userId: string) {
  return new Promise<any>(async (resolve) => {
    // const writingIDs = await getWritingIDsByUserId(userId);
    // const writings = await getWritingsByWritingIDs(writingIDs);
    // // set writing info
    // const writingsSet = await getWritingsSet(writings, 4);
    // resolve(writingsSet);
  });
}
