/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import pool from "../../configs/db";
import { query } from "./contents.utils";

type UserInfo = {
  userName: string;
  userImgSrc: string;
  userImgPosition: string;
};
type NovelListInfo = {
  userId: string;
  novelListId: string;
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
interface NovelListsSimpleInfos {
  listId: string;
  listTitle: string;
  userName?: string;
  userImg?: {
    src: string;
    position: string;
  };
}
interface NovelListSetForMyOrOthersList {
  listId: string;
  listTitle: string;
  isLike: boolean;
  otherList: NovelListsSimpleInfos[];
  novel: Novel[];
  userName?: string;
  userImg?: { src: string; position: string };
}
async function getNovelListInfoListByUserId(userId: string, isHome = true) {
  // for userPageHome page get the two novel list
  // for userPageNovelList page get all novel list
  const queryForLimitedOrNot = isHome
    ? query.getTwoOfNovelListInfoListByUserId
    : query.getAllOfNovelListInfoListByUserId;
  return new Promise<NovelListInfo[]>(async (resolve) => {
    await pool
      .getConnection()
      .then((connection) => {
        connection
          .query(queryForLimitedOrNot, userId)
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
async function getNovelListInfoByListId(novelListId: string) {
  return new Promise<NovelListInfo>(async (resolve) => {
    await pool
      .getConnection()
      .then((connection) => {
        connection
          .query(query.getNovelListInfoByListId, novelListId)
          .then(async (data) => {
            const novelListInfo = data[0];

            resolve(novelListInfo as NovelListInfo);

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

async function getNovelListInfoListByListIDs(novelListIDs: string[], listId?: string) {
  // for other's list page except an listId that was requested by user
  const newNovelListIDs = listId ? novelListIDs.filter((id) => id !== listId) : novelListIDs;

  const novelListInfoList: NovelListInfo[] = [];
  for (const novelListID of newNovelListIDs) {
    const novelListInfo = await getNovelListInfoByListId(novelListID);
    novelListInfoList.push(novelListInfo);
  }

  return novelListInfoList;
}
async function getNovelListIDsByUserId(userId: string, isHome = true) {
  // for userPageHome page get the two novel list IDs
  // for userPageNovelList page get all novel list IDs
  const queryForLimitedNumber = isHome
    ? query.getTwoOfNovelListIDsByUserId
    : query.getAllOfNovelListIDsByUserId;

  return new Promise<string[]>(async (resolve) => {
    await pool
      .getConnection()
      .then((connection) => {
        connection
          .query(queryForLimitedNumber, userId)
          .then(async (data) => {
            const dataForNovelListIDs = data.slice(0, data.length);
            const novelListIDs: string[] = [];
            for (const dataForNovelListID of dataForNovelListIDs) {
              const { novelListId } = dataForNovelListID;
              novelListIDs.push(novelListId as string);
            }

            resolve(novelListIDs);

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
async function getUserNameAndImgByUserId(userId: string) {
  return new Promise<UserInfo>(async (resolve) => {
    await pool
      .getConnection()
      .then((connection) => {
        connection
          .query(query.getUserNameAndImgByUserId, userId)
          .then(async (data) => {
            const userInfo = data[0];

            resolve(userInfo as UserInfo);

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
async function getNovelsByNovelListInfo(
  novelListInfo: NovelListInfo,
  isUserPageHome: boolean,
  listOrder = 1,
) {
  // set novel IDs array
  const dataForNovelIDs = novelListInfo.novelIDs;
  const novelIDs = dataForNovelIDs.split(" ");

  // extract novel ids as requested
  // for UserPageNoveList(myList or othersList) page listOrder is the requested order
  // for UserPageHome page listOrder is 1 as default
  const novelNO = 8;
  const novelIDsRequired = novelIDs.slice(novelNO * (listOrder - 1), novelNO * listOrder);

  const novels: Novel[] = [];

  // get novels by novel IDs
  for (const novelId of novelIDsRequired) {
    const novel = await getNovelInfoByNovelId(novelId);
    novels.push(novel);
  }

  if (!isUserPageHome) {
    // for myList or othersList page
    const firstIndexOfNextOrder = novelNO * listOrder;
    const isNextOrder = !!novelIDs[firstIndexOfNextOrder];
    return { novels, isNextOrder };
  }
  // for UserPageHome page
  return novels;
}

async function getNovelLists(novelListInfoList: NovelListInfo[]) {
  const novelLists = [];
  for (const novelListInfo of novelListInfoList) {
    const novels = (await getNovelsByNovelListInfo(novelListInfo, true)) as Novel[];

    // add novels into list
    const novelList = { ...novelListInfo, novels };
    novelLists.push(novelList);
  }
  return novelLists;
}

async function getNovelsAndInfoByListId(novelListId: string, order: number) {
  const novelListInfo = await getNovelListInfoByListId(novelListId);
  const { novels, isNextOrder } = (await getNovelsByNovelListInfo(novelListInfo, false, order)) as {
    novels: Novel[];
    isNextOrder: boolean;
  };
  return { novelListInfo, novels, isNextOrder };
}
async function getIsTheListLoginUserLikes(loginUserId: string, novelListId: string) {
  return new Promise<boolean>(async (resolve) => {
    await pool
      .getConnection()
      .then((connection) => {
        connection
          .query(query.getIsTheListLoginUserLikes, [loginUserId, novelListId])
          .then(async (data) => {
            const isTheListLoginUserLikes = !!data[0];

            resolve(isTheListLoginUserLikes);

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

function getNovelListSetForMyList(
  novelListsSimpleInfosUserCreated: NovelListsSimpleInfos[],
  novelListInfo: NovelListInfo,
  novels: Novel[],
  isTheListLoginUserLikes: boolean,
) {
  return {
    listId: novelListInfo.novelListId,
    listTitle: novelListInfo.novelListTitle,
    isLike: isTheListLoginUserLikes,
    otherList: novelListsSimpleInfosUserCreated,
    novel: novels,
  };
}

async function getNovelListsSimpleInfos(
  novelListInfoList: NovelListInfo[],
  isMyList: boolean,
  novelListId?: string,
) {
  const novelListsSimpleInfos = [];
  for (const novelListInfo of novelListInfoList) {
    // userInfo is required for othersList page not for myList page
    let userName;
    let userImg;
    if (!isMyList) {
      const userInfo = await getUserNameAndImgByUserId(novelListInfo.userId);
      userName = userInfo.userName;
      userImg = { src: userInfo.userImgSrc, position: userInfo.userImgPosition };
    }

    // for myList except the list info that was requested by user
    if (novelListId === novelListInfo.novelListId) continue;

    const simpleInfo = {
      listId: novelListInfo.novelListId,
      listTitle: novelListInfo.novelListTitle,
      userName,
      userImg,
    };
    novelListsSimpleInfos.push(simpleInfo);
  }
  return novelListsSimpleInfos;
}

function getNovelListsSetUserCreated(novelLists: NovelList[]) {
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
async function getNovelListsSetUserLikes(novelLists: NovelList[]) {
  const novelListsSet = [];
  for (const novelList of novelLists) {
    const userInfo = await getUserNameAndImgByUserId(novelList.userId);
    const novelListSet = {
      listId: novelList.novelListId,
      listTitle: novelList.novelListTitle,
      novel: novelList.novels,
      userName: userInfo.userName,
      userImg: { src: userInfo.userImgSrc, position: userInfo.userImgPosition },
    };
    novelListsSet.push(novelListSet);
  }
  return novelListsSet;
}

export function getNovelListsUserCreatedForUserPageHome(userId: string) {
  return new Promise<any>(async (resolve) => {
    try {
      const novelListInfoList = await getNovelListInfoListByUserId(userId);

      const novelLists = await getNovelLists(novelListInfoList);

      const novelListsSet = getNovelListsSetUserCreated(novelLists);

      resolve(novelListsSet);
    } catch (error) {
      console.log("error occurred in getNovelListsUserCreatedForUserPageHome:", error);
    }
  });
}

export function getNovelListUserCreatedForMyList(
  userIdInUserPage: string,
  listId: string,
  order: number,
  loginUserId: string,
) {
  return new Promise<any>(async (resolve) => {
    try {
      const novelListInfoList = await getNovelListInfoListByUserId(userIdInUserPage, false);

      // its property name is "otherList" in returned data.
      // it means the lists except the one got by listId
      const novelListsSimpleInfosUserCreated = await getNovelListsSimpleInfos(
        novelListInfoList,
        true,
        listId,
      );

      const { novelListInfo, novels, isNextOrder } = await getNovelsAndInfoByListId(listId, order);

      // if it is the request by non login user (1)
      // or it is the login user's novel list that he/she created (2),
      // following value is always false
      // (actually in second case (2), the value won't be used in user page)
      let isTheListLoginUserLikes = false;
      if (loginUserId && loginUserId !== userIdInUserPage) {
        isTheListLoginUserLikes = await getIsTheListLoginUserLikes(loginUserId, listId);
      }

      const novelListSet = getNovelListSetForMyList(
        novelListsSimpleInfosUserCreated,
        novelListInfo,
        novels,
        isTheListLoginUserLikes,
      );

      resolve({ novelList: novelListSet, isNextOrder });
    } catch (error) {
      console.log("error occurred in getNovelListsUserCreatedForMyList:", error);
    }
  });
}

export function getNovelListUserLikesForOthersList(
  userIdInUserPage: string,
  listId: string,
  order: number,
  loginUserId: string,
) {
  return new Promise<any>(async (resolve) => {
    try {
      const novelListIDs = await getNovelListIDsByUserId(userIdInUserPage, false);

      const novelListInfoList = await getNovelListInfoListByListIDs(novelListIDs, listId);

      // its property name is "otherList" in returned data.
      // it means the lists except the one got by listId
      const novelListsSimpleInfosUserLikes = await getNovelListsSimpleInfos(
        novelListInfoList,
        false,
      );

      const { novelListInfo, novels, isNextOrder } = await getNovelsAndInfoByListId(listId, order);

      const { userName, userImgSrc, userImgPosition } = await getUserNameAndImgByUserId(
        novelListInfo.userId,
      );
    } catch (error) {
      console.log("error occurred in getNovelListsUserLikesForOthersList:", error);
    }
  });
}

export function getNovelListsUserLikesForUserPageHome(userId: string) {
  return new Promise<any>(async (resolve) => {
    try {
      const novelListIDs = await getNovelListIDsByUserId(userId);
      const novelListInfoList = await getNovelListInfoListByListIDs(novelListIDs);
      const novelLists = await getNovelLists(novelListInfoList);
      const novelListsSet = await getNovelListsSetUserLikes(novelLists);
      resolve(novelListsSet);
    } catch (error) {
      console.log("error occurred in getNovelListsUserLikesForUserPageHome:", error);
    }
  });
}
