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
  novelAuthor: string;
  novelGenre: string;
  novelIsEnd: boolean;
};

type NovelList = {
  novels: Novel[];
  novelListId: string;
  userId: string;
  novelListTitle: string;
  novelIDs: string;
};
async function getNovelListInfoListByUserId(userId: string, allOrNot = false) {
  // for userPageHome page get the two novel list
  // for userPageNovelList page get all novel list
  const queryForLimitedNumber = allOrNot
    ? query.getNovelListInfoListByUserId
    : query.getTwoOfNovelListInfoListByUserId;

  return new Promise<NovelListInfo[]>(async (resolve) => {
    await pool
      .getConnection()
      .then((connection) => {
        connection
          .query(queryForLimitedNumber, userId)
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
async function getNovelLists(novelListInfoList: NovelListInfo[], listOrder = 1) {
  const novelLists = [];
  for (const novelListInfo of novelListInfoList) {
    // get novel IDs per novel list
    const dataForNovelIDs = novelListInfo.novelIDs;
    const novelIDs = dataForNovelIDs.split(" ");

    // extract novel ids as requested
    // for UserPageNovelList page listOrder is the requested order
    // for UserPageHome page listOrder is 1 as default
    const novelNO = 8;
    const novelIDsRequired = novelIDs.slice(novelNO * (listOrder - 1), novelNO * listOrder);

    const novels: Novel[] = [];

    // get novels by novel IDs
    for (const novelId of novelIDsRequired) {
      const novel = await getNovelInfoByNovelId(novelId);
      console.log("novel:", novel);
      novels.push(novel);
    }

    // add novels into list
    const novelList = { ...novelListInfo, novels };
    novelLists.push(novelList);
  }
  return novelLists;
}

function getNovelListsSet(novelLists: NovelList[]) {
  const novelListsSet = [];
  for (const novelList of novelLists) {
    const novelListSet = {
      listId: novelList.novelListId,
      listTitle: novelList.novelListTitle,
      novel: novelList.novels,
    };
    novelListsSet.push(novelListSet);
  }
  return novelListsSet;
}

export function getNovelListsUserCreatedForUserPageHome(userId: string) {
  return new Promise<any>(async (resolve) => {
    const novelListInfoList = await getNovelListInfoListByUserId(userId);

    const novelLists = await getNovelLists(novelListInfoList);

    const novelListsSet = getNovelListsSet(novelLists);

    resolve(novelListsSet);
  });
}

export function getNovelListsUserLikesForUserPageHome(userId: string) {
  return new Promise<any>(async (resolve) => {
    // const novelListInfoList = await getNovelListInfoListByUserId(userId);
    // const novelLists = await getNovelLists(novelListInfoList);
    // add info of user name and user img //
    // const novelListsSet = getNovelListsSet(novelLists);
    // resolve(novelListsSet);
  });
}
