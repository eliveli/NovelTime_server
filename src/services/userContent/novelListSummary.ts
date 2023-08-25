import db from "../utils/db";
import { NovelListInfo } from "../utils/types";

async function getNovelListInfoListByUserId(userId: string, isHome = true) {
  const queryForLimitedOrNot = isHome
    ? "SELECT * FROM novelList WHERE userId = (?) limit 4" // used in user home
    : "SELECT * FROM novelList WHERE userId = (?)"; // used in user's my list that the user created
  return (await db(queryForLimitedOrNot, userId, "all")) as NovelListInfo[];
}

async function getNovelListIDsByUserId(userId: string, isHome = true) {
  const queryForLimitedNumber = isHome
    ? "SELECT novelListId FROM novelListLike WHERE userId = (?) limit 4" // used in user home
    : "SELECT novelListId FROM novelListLike WHERE userId = (?)"; // used in user's other list that the user liked

  const dataForNovelListIDs = (await db(queryForLimitedNumber, userId, "all")) as Array<{
    novelListId: string;
  }>;

  const novelListIDs: string[] = [];

  dataForNovelListIDs.forEach(({ novelListId }) => {
    novelListIDs.push(novelListId);
  });

  return novelListIDs;
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

function getSpaceNo(novelIDs: string) {
  const space = " ";
  let spaceIdx = novelIDs.indexOf(space);
  let countingNo = 0;
  while (spaceIdx !== -1) {
    countingNo += 1;
    spaceIdx = novelIDs.indexOf(space, spaceIdx + 1);
  }
  return countingNo;
}

function setNovelNo(novelIDs: string) {
  if (!novelIDs) return 0;

  const spaceNo = getSpaceNo(novelIDs);

  if (spaceNo === 0) return 1;

  return spaceNo + 1;
}

async function getLikeNo(novelListId: string) {
  const dbQuery = "SELECT count(*) AS likeNoInBigInt FROM novelListLike WHERE novelListId = (?)";
  const { likeNoInBigInt } = (await db(dbQuery, [novelListId], "first")) as {
    likeNoInBigInt: BigInt;
  };

  return Number(likeNoInBigInt);
}

async function getNovelImg(novelId: string) {
  const dbQuery = "SELECT novelImg FROM novelInfo WHERE novelId = (?)";
  const novelImg = (await db(dbQuery, [novelId], "first")) as {
    novelImg: string;
  };

  if (!novelImg) return "";

  return novelImg.novelImg;
}

async function getNovelImgs(novelIDs: string, novelNo: number) {
  if (!novelNo) return [];

  let spaceIdx = 0;
  const novelImgs: string[] = [];

  for (let i = 0; i < novelIDs.length; i = spaceIdx) {
    // get novel id //
    spaceIdx = novelIDs.indexOf(" ", spaceIdx + 1);

    let novelId = "";

    if (i === 0 && spaceIdx === -1) {
      // there is a single novel
      novelId = novelIDs;
    } else if (i === 0) {
      // get the first novel when there are more than one
      novelId = novelIDs.slice(0, spaceIdx);
    } else if (spaceIdx === -1) {
      // get the last novel when there are more than one
      novelId = novelIDs.slice(i + 1);
    } else {
      // get a novel between the first and the last
      novelId = novelIDs.slice(i + 1, spaceIdx);
    }

    const novelImg = await getNovelImg(novelId);
    novelImgs.push(novelImg);

    if (spaceIdx === -1) break;
    if (novelImgs.length === 3) break;
  }

  return novelImgs;
}

async function setAllMyNovelListsOneByOne(novelLists: NovelListInfo[]) {
  const allNovelLists = [];

  for (const novelList of novelLists) {
    const novelNo = setNovelNo(novelList.novelIDs);
    const likeNo = await getLikeNo(novelList.novelListId);
    const novelImgs = await getNovelImgs(novelList.novelIDs, novelNo);

    const novelListSet = {
      listId: novelList.novelListId,
      listTitle: novelList.novelListTitle,
      novelNo,
      likeNo,
      novelImgs,
    };

    allNovelLists.push(novelListSet);
  }

  return allNovelLists;
}

async function getListInfoByListId(novelListId: string) {
  const dbQuery = "SELECT userId, novelListTitle, novelIDs FROM novelList WHERE novelListId = (?)";
  const listInfo = (await db(dbQuery, novelListId, "first")) as {
    userId: string;
    novelListTitle: string;
    novelIDs: string;
  };
  return listInfo;
}

async function setAllOthersNovelListsOneByOne(novelListIDs: string[]) {
  const allNovelLists = [];

  for (const novelListId of novelListIDs) {
    const { userId, novelListTitle, novelIDs } = await getListInfoByListId(novelListId);

    const novelNo = setNovelNo(novelIDs);
    const likeNo = await getLikeNo(novelListId);
    const novelImgs = await getNovelImgs(novelIDs, novelNo);

    const userInfo = await getUserNameAndImgByUserId(userId);
    const { userName } = userInfo;
    const userImg = { src: userInfo.userImgSrc, position: userInfo.userImgPosition };

    const novelListSet = {
      listId: novelListId,
      listTitle: novelListTitle,
      novelNo,
      likeNo,
      novelImgs,
      userName,
      userImg,
    };

    allNovelLists.push(novelListSet);
  }

  return allNovelLists;
}

async function getListsUserCreated(userId: string, isHome = false) {
  const novelLists = await getNovelListInfoListByUserId(userId, isHome);

  const novelListsComposed = await setAllMyNovelListsOneByOne(novelLists);

  return novelListsComposed;
}

async function getListsUserLiked(userId: string, isHome = false) {
  const novelListIDs = await getNovelListIDsByUserId(userId, isHome);

  const novelListsComposed = await setAllOthersNovelListsOneByOne(novelListIDs);

  return novelListsComposed;
}

const novelListSummaryService = {
  getListsUserCreated,
  getListsUserLiked,
};
export default novelListSummaryService;
