import db from "../utils/db";
import { Novel, NovelListInfo, NovelListsSimpleInfos } from "../utils/types";

async function getListsUserCreatedByUserId(userId: string) {
  const query = "SELECT * FROM novelList WHERE userId = (?)";
  return (await db(query, userId, "all")) as NovelListInfo[];
}

async function getNovelListInfoByListId(novelListId: string) {
  return (await db(
    "SELECT * FROM novelList WHERE novelListId = (?)",
    novelListId,
    "first",
  )) as NovelListInfo;
}

async function getListsByListIDs(novelListIDs: string[]) {
  const novelListInfoList: NovelListInfo[] = [];
  for (const novelListID of novelListIDs) {
    const novelListInfo = await getNovelListInfoByListId(novelListID);
    novelListInfoList.push(novelListInfo);
  }

  return novelListInfoList;
}
async function getListIDsUserLikedByUserId(userId: string) {
  const query = "SELECT novelListId FROM novelListLike WHERE userId = (?)";

  const dataForNovelListIDs = (await db(query, userId, "all")) as Array<{
    novelListId: string;
  }>;

  const novelListIDs: string[] = [];

  dataForNovelListIDs.forEach(({ novelListId }) => {
    novelListIDs.push(novelListId);
  });

  return novelListIDs;
}

async function getNovelInfoByNovelId(novelId: string) {
  const novel = (await db(
    "SELECT novelId, novelImg, novelTitle, novelAuthor, novelGenre, novelIsEnd FROM novelInfo WHERE novelId = (?)",
    novelId,
    "first",
  )) as Novel;

  if (!novel) return;

  return { ...novel, novelIsEnd: !!novel?.novelIsEnd };
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
  const dataForNovelIDs = novelListInfo.novelIDs;

  if (!dataForNovelIDs && !isUserPageHome) return { novels: [], isNextOrder: false };
  if (!dataForNovelIDs) return [];

  // set novel IDs array
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

    if (!novel) continue;

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

async function getListInfoByListId(novelListId: string, order: number) {
  const novelListInfo = await getNovelListInfoByListId(novelListId);
  const { novels, isNextOrder } = (await getNovelsByNovelListInfo(novelListInfo, false, order)) as {
    novels: Novel[];
    isNextOrder: boolean;
  };
  return { novelListInfo, novels, isNextOrder };
}
async function checkIfItIsTheListLoginUserLiked(loginUserId: string, novelListId: string) {
  const data = (await db(
    "SELECT novelListId FROM novelListLike WHERE userId = (?) and novelListId = (?)",
    [loginUserId, novelListId],
    "raw",
  )) as Array<{ [key: string]: any }>;
  const isTheListLoginUserLikes = !!data[0];

  return isTheListLoginUserLikes;
}

function composeFinalListInfoUserCreated(
  novelListsSimpleInfos: NovelListsSimpleInfos[],
  novelListInfo: NovelListInfo,
  novels: Novel[],
  isTheListLoginUserLikes: boolean,
) {
  return {
    listId: novelListInfo.novelListId,
    listTitle: novelListInfo.novelListTitle,
    isLike: isTheListLoginUserLikes,
    otherList: novelListsSimpleInfos,
    novel: novels,
    userName: undefined,
  };
}

function composeFinalListInfoUserLiked(
  novelListsSimpleInfos: NovelListsSimpleInfos[],
  novelListInfo: NovelListInfo,
  novels: Novel[],
  isTheListLoginUserLikes: boolean,
  userName: string,
  userImgSrc: string,
  userImgPosition: string,
) {
  return {
    listId: novelListInfo.novelListId,
    listTitle: novelListInfo.novelListTitle,
    isLike: isTheListLoginUserLikes,
    otherList: novelListsSimpleInfos,
    novel: novels,
    userName,
    userImg: { src: userImgSrc, position: userImgPosition || "" },
  };
}

function setListsUserCreated(lists: NovelListInfo[], novelListId: string) {
  let isTheListThatExists = false;

  const otherListUserCreated = [];
  for (const list of lists) {
    // except the list given by client
    if (novelListId === list.novelListId) {
      isTheListThatExists = true;
      continue;
    }

    const listInfo = {
      listId: list.novelListId,
      listTitle: list.novelListTitle,
      userName: undefined,
      userImg: undefined,
    };
    otherListUserCreated.push(listInfo);
  }
  return { isTheListThatExists, otherListUserCreated };
}

async function setListsUserLiked(lists: NovelListInfo[], novelListId: string) {
  let isTheListThatExists = false;

  const listInfos = [];
  for (const list of lists) {
    // except the list given by client
    if (novelListId === list.novelListId) {
      isTheListThatExists = true;
      continue;
    }

    const userInfo = await getUserNameAndImgByUserId(list.userId);

    const listInfo = {
      listId: list.novelListId,
      listTitle: list.novelListTitle,
      userName: userInfo.userName,
      userImg: { src: userInfo.userImgSrc, position: userInfo.userImgPosition },
    };
    listInfos.push(listInfo);
  }
  return { isTheListThatExists, listInfos };
}

async function composeListsWithUsers(lists: NovelListInfo[], isMyList: boolean) {
  const listsComposed = [];

  for (const list of lists) {
    let userName;
    let userImg;
    if (!isMyList) {
      const userInfo = await getUserNameAndImgByUserId(list.userId);
      userName = userInfo.userName;
      userImg = { src: userInfo.userImgSrc, position: userInfo.userImgPosition };
    }

    const listComposed = {
      listId: list.novelListId,
      listTitle: list.novelListTitle,
      userName,
      userImg,
    };
    listsComposed.push(listComposed);
  }
  return listsComposed;
}

async function getListUserCreated(
  userIdInUserPage: string,
  listId: string,
  order: number,
  loginUserId?: string,
) {
  const lists = await getListsUserCreatedByUserId(userIdInUserPage);
  if (!lists.length) return;

  const { isTheListThatExists, otherListUserCreated } = setListsUserCreated(lists, listId);

  if (!isTheListThatExists) return;

  const { novelListInfo, novels, isNextOrder } = await getListInfoByListId(listId, order);

  // if it is the request by non login user (1)
  // or it is the login user's novel list that he/she created (2),
  // following value is always false
  // (actually in second case (2), the value won't be used in user page)
  let isTheListLoginUserLiked = false;
  if (loginUserId && loginUserId !== userIdInUserPage) {
    isTheListLoginUserLiked = await checkIfItIsTheListLoginUserLiked(loginUserId, listId);
  }

  const listComposed = composeFinalListInfoUserCreated(
    otherListUserCreated,
    novelListInfo,
    novels,
    isTheListLoginUserLiked,
  );

  return { novelList: listComposed, isNextOrder };
}

async function getListUserLiked(
  userIdInUserPage: string,
  listId: string,
  order: number,
  loginUserId?: string,
) {
  const novelListIDs = await getListIDsUserLikedByUserId(userIdInUserPage);
  if (!novelListIDs.length) return;

  const lists = await getListsByListIDs(novelListIDs);
  if (!lists.length) return;

  const { isTheListThatExists, listInfos } = await setListsUserLiked(lists, listId);

  if (!isTheListThatExists) return;

  const { novelListInfo, novels, isNextOrder } = await getListInfoByListId(listId, order);

  const { userName, userImgSrc, userImgPosition } = await getUserNameAndImgByUserId(
    novelListInfo.userId,
  );

  // if it is the request by non login user
  // following value is always false
  let isTheListLoginUserLiked = false;
  if (loginUserId) {
    isTheListLoginUserLiked = await checkIfItIsTheListLoginUserLiked(loginUserId, listId);
  }

  const listComposed = composeFinalListInfoUserLiked(
    listInfos,
    novelListInfo,
    novels,
    isTheListLoginUserLiked,
    userName,
    userImgSrc,
    userImgPosition,
  );

  return { novelList: listComposed, isNextOrder };
}

async function getAllListTitles(userIdInUserPage: string, isCreatedInString: string) {
  let lists: NovelListInfo[];

  // lists created or liked by the user
  const isCreated = isCreatedInString.toLowerCase() === "true";

  if (isCreated) {
    lists = await getListsUserCreatedByUserId(userIdInUserPage);
    if (!lists.length) return;
  } else {
    const novelListIDs = await getListIDsUserLikedByUserId(userIdInUserPage);
    if (!novelListIDs.length) return;

    lists = await getListsByListIDs(novelListIDs);
    if (!lists.length) return;
  }

  // user property in created lists is undefined
  // only liked lists have specific users who created them in the below
  const allListTitles = await composeListsWithUsers(lists, isCreated);

  return allListTitles;
}

const novelListDetailedService = {
  getListUserCreated,
  getListUserLiked,
  getAllListTitles,
};
export default novelListDetailedService;
