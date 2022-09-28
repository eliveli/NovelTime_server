/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import db from "../utils/db";
import {
  Novel,
  NovelList,
  NovelListInfo,
  NovelListSetForMyOrOthersList,
  NovelListsSimpleInfos,
} from "../utils/types";

async function getNovelListInfoListByUserId(userId: string, isHome = true) {
  // for userPage get the two novel list
  // for userPageNovelList page get all novel list
  const queryForLimitedOrNot = isHome
    ? "SELECT * FROM novelList WHERE userId = (?) limit 2"
    : "SELECT * FROM novelList WHERE userId = (?)";
  return (await db(queryForLimitedOrNot, userId, "all")) as NovelListInfo[];
}

async function getNovelListInfoByListId(novelListId: string) {
  return (await db(
    "SELECT * FROM novelList WHERE novelListId = (?)",
    novelListId,
    "first",
  )) as NovelListInfo;
}

async function getNovelListInfoListByListIDs(novelListIDs: string[]) {
  const novelListInfoList: NovelListInfo[] = [];
  for (const novelListID of novelListIDs) {
    const novelListInfo = await getNovelListInfoByListId(novelListID);
    novelListInfoList.push(novelListInfo);
  }

  return novelListInfoList;
}
async function getNovelListIDsByUserId(userId: string, isHome = true) {
  // for userPage get the two novel list IDs
  // for userPageNovelList page get all novel list IDs
  const queryForLimitedNumber = isHome
    ? "SELECT novelListId FROM novelListLike WHERE userId = (?) limit 2"
    : "SELECT novelListId FROM novelListLike WHERE userId = (?)";

  const dataForNovelListIDs = (await db(queryForLimitedNumber, userId, "all")) as Array<{
    novelListId: string;
  }>;

  console.log(dataForNovelListIDs);

  console.log(Array.isArray(dataForNovelListIDs));
  const novelListIDs: string[] = [];

  dataForNovelListIDs.forEach((dataForNovelListID) => {
    const { novelListId } = dataForNovelListID;
    novelListIDs.push(novelListId);
  });

  // for (const dataForNovelListID of dataForNovelListIDs) {
  //   const { novelListId } = dataForNovelListID;
  //   novelListIDs.push(novelListId);
  // }
  return novelListIDs;
}

async function getNovelInfoByNovelId(novelId: string) {
  return (await db(
    "SELECT novelId, novelImg, novelTitle, novelAuthor, novelGenre, novelIsEnd FROM novelInfo WHERE novelId = (?)",
    novelId,
    "first",
  )) as Novel;
}
type UserInfo = {
  userName: string;
  userImgSrc: string;
  userImgPosition: string;
};
async function getUserNameAndImgByUserId(userId: string) {
  return (await db(
    "SELECT userName, userImgSrc, userImgPosition FROM user WHERE userId = (?)",
    userId,
    "first",
  )) as UserInfo;
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
  const data = (await db(
    "SELECT novelListId FROM novelListLike WHERE userId = (?) and novelListId = (?)",
    [loginUserId, novelListId],
    "raw",
  )) as Array<{ [key: string]: any }>;
  const isTheListLoginUserLikes = !!data[0];

  return isTheListLoginUserLikes;
}

function getNovelListSetForMyOrOthersList(
  novelListsSimpleInfos: NovelListsSimpleInfos[],
  novelListInfo: NovelListInfo,
  novels: Novel[],
  isTheListLoginUserLikes: boolean,
  userName?: string,
  userImgSrc?: string,
  userImgPosition?: string,
) {
  const novelListSet: NovelListSetForMyOrOthersList = {
    listId: novelListInfo.novelListId,
    listTitle: novelListInfo.novelListTitle,
    isLike: isTheListLoginUserLikes,
    otherList: novelListsSimpleInfos,
    novel: novels,
    userName,
  };
  if (userImgSrc) {
    novelListSet.userImg = { src: userImgSrc, position: userImgPosition || "" };
  }
  return novelListSet;
}

async function getNovelListsSimpleInfos(
  novelListInfoList: NovelListInfo[],
  isMyList: boolean,
  novelListId: string,
) {
  let isListIdSelected = false; // whether there is the listId selected by user or not
  const novelListsSimpleInfos = [];
  for (const novelListInfo of novelListInfoList) {
    // except the list info that was requested by user
    if (novelListId === novelListInfo.novelListId) {
      isListIdSelected = true;
      continue;
    }

    // userInfo is required for othersList page not for myList page
    let userName;
    let userImg;
    if (!isMyList) {
      const userInfo = await getUserNameAndImgByUserId(novelListInfo.userId);
      userName = userInfo.userName;
      userImg = { src: userInfo.userImgSrc, position: userInfo.userImgPosition };
    }

    const simpleInfo = {
      listId: novelListInfo.novelListId,
      listTitle: novelListInfo.novelListTitle,
      userName,
      userImg,
    };
    novelListsSimpleInfos.push(simpleInfo);
  }
  return { isListIdSelected, novelListsSimpleInfos };
}
async function getSimpleInfosOfAllNovelListsOfUser(
  novelListInfoList: NovelListInfo[],
  isMyList: boolean,
) {
  const novelListsSimpleInfos = [];
  for (const novelListInfo of novelListInfoList) {
    let userName;
    let userImg;
    if (!isMyList) {
      const userInfo = await getUserNameAndImgByUserId(novelListInfo.userId);
      userName = userInfo.userName;
      userImg = { src: userInfo.userImgSrc, position: userInfo.userImgPosition };
    }

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

async function getNovelListsUserCreatedForUserPageHome(userId: string) {
  try {
    const novelListInfoList = await getNovelListInfoListByUserId(userId);

    const novelLists = await getNovelLists(novelListInfoList);

    const novelListsSet = getNovelListsSetUserCreated(novelLists);

    return novelListsSet;
  } catch (error) {
    console.log("error occurred in getNovelListsUserCreatedForUserPageHome:", error);
  }
}

async function getNovelListUserCreatedForMyList(
  userIdInUserPage: string,
  listId: string,
  order: number,
  loginUserId?: string,
) {
  try {
    const novelListInfoList = await getNovelListInfoListByUserId(userIdInUserPage, false);

    // its property name is "otherList" in returned data.
    // it means the lists except the one got by listId
    const { isListIdSelected, novelListsSimpleInfos } = await getNovelListsSimpleInfos(
      novelListInfoList,
      true,
      listId,
    );

    // there is no list that an user created in his/her user page that was selected by login user
    if (!isListIdSelected) {
      return {
        novelList: {},
        isNextOrder: false,
      };
    }

    const { novelListInfo, novels, isNextOrder } = await getNovelsAndInfoByListId(listId, order);

    // if it is the request by non login user (1)
    // or it is the login user's novel list that he/she created (2),
    // following value is always false
    // (actually in second case (2), the value won't be used in user page)
    let isTheListLoginUserLikes = false;
    if (loginUserId && loginUserId !== userIdInUserPage) {
      isTheListLoginUserLikes = await getIsTheListLoginUserLikes(loginUserId, listId);
    }

    const novelListSet = getNovelListSetForMyOrOthersList(
      novelListsSimpleInfos,
      novelListInfo,
      novels,
      isTheListLoginUserLikes,
    );

    return { novelList: novelListSet, isNextOrder };
  } catch (error) {
    console.log("error occurred in getNovelListsUserCreatedForMyList:", error);
    return { novelList: undefined, isNextOrder: undefined };
  }
}

async function getNovelListUserLikesForOthersList(
  userIdInUserPage: string,
  listId: string,
  order: number,
  loginUserId?: string,
) {
  try {
    const novelListIDs = await getNovelListIDsByUserId(userIdInUserPage, false);

    const novelListInfoList = await getNovelListInfoListByListIDs(novelListIDs);

    // its property name is "otherList" in returned data.
    // it means the lists except the one got by listId
    const { isListIdSelected, novelListsSimpleInfos } = await getNovelListsSimpleInfos(
      novelListInfoList,
      false,
      listId,
    );

    // there is no list that an user likes in his/her user page that was selected by login user
    if (!isListIdSelected) {
      return {
        novelList: {},
        isNextOrder: false,
      };
    }

    const { novelListInfo, novels, isNextOrder } = await getNovelsAndInfoByListId(listId, order);

    const { userName, userImgSrc, userImgPosition } = await getUserNameAndImgByUserId(
      novelListInfo.userId,
    );

    // if it is the request by non login user
    // following value is always false
    let isTheListLoginUserLikes = false;
    if (loginUserId) {
      isTheListLoginUserLikes = await getIsTheListLoginUserLikes(loginUserId, listId);
    }

    const novelListSet = getNovelListSetForMyOrOthersList(
      novelListsSimpleInfos,
      novelListInfo,
      novels,
      isTheListLoginUserLikes,
      userName,
      userImgSrc,
      userImgPosition,
    );

    return { novelList: novelListSet, isNextOrder };
  } catch (error) {
    console.log("error occurred in getNovelListsUserLikesForOthersList:", error);
    return { novelList: undefined, isNextOrder: undefined };
  }
}

async function getAllNovelListTitlesAtTheMoment(userIdInUserPage: string, isMyList: string) {
  try {
    let novelListInfoList: NovelListInfo[];
    const isMyListAsBoolean = isMyList.toLowerCase() === "true";
    if (isMyListAsBoolean) {
      novelListInfoList = await getNovelListInfoListByUserId(userIdInUserPage, false);
    } else {
      const novelListIDs = await getNovelListIDsByUserId(userIdInUserPage, false);

      novelListInfoList = await getNovelListInfoListByListIDs(novelListIDs);
    }

    const allNovelListsInfoOfUser = await getSimpleInfosOfAllNovelListsOfUser(
      novelListInfoList,
      isMyListAsBoolean,
    );

    return allNovelListsInfoOfUser;
  } catch (error) {
    console.log("error occurred in getAllNovelListTitlesAtTheMoment:", error);
  }
}

async function getNovelListsUserLikesForUserPageHome(userId: string) {
  try {
    const novelListIDs = await getNovelListIDsByUserId(userId);
    const novelListInfoList = await getNovelListInfoListByListIDs(novelListIDs);
    const novelLists = await getNovelLists(novelListInfoList);
    const novelListsSet = await getNovelListsSetUserLikes(novelLists);
    return novelListsSet;
  } catch (error) {
    console.log("error occurred in getNovelListsUserLikesForUserPageHome:", error);
  }
}

const userNovelListService = {
  getMyList: getNovelListUserCreatedForMyList,
  getMyListOfUserHome: getNovelListsUserCreatedForUserPageHome,
  getOthersList: getNovelListUserLikesForOthersList,
  getOthersListOfUserHome: getNovelListsUserLikesForUserPageHome,
  getAllListTitles: getAllNovelListTitlesAtTheMoment,
};
export default userNovelListService;
