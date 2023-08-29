import db from "../utils/db";
import { NovelListInfo } from "../utils/types";
import getNovelByNovelIdFromDB from "../shared/getNovelByNovelId";
import getUserNameAndImg from "../home/shared/getUserNameAndImg";

export async function getNovelListsOfUsersFromDB(limitedNo: number) {
  return (await db(
    `SELECT novelListId, novelListTitle, novelIDs, userId FROM novelList WHERE novelIDs != "" OR novelIDs IS NOT NULL
    ORDER BY RAND() LIMIT ${String(limitedNo)}`,
    undefined,
    "all",
  )) as NovelListInfo[];
}

export async function getNovelsByNovelId(novelIDs: string) {
  if (!novelIDs) return [];

  // change string to string array holding novel IDs
  const novelIdInArray = novelIDs.split(" ");

  const novels = [];
  for (const novelId of novelIdInArray) {
    const novel = await getNovelByNovelIdFromDB(novelId);

    if (!novel) continue;

    novels.push(novel);
  }
  return novels;
}

export async function composeNovelLists(novelLists: NovelListInfo[]) {
  if (novelLists.length === 0) return; // when getting no data from DB

  const novelListComposed = [];

  for (const novelList of novelLists) {
    const novel = await getNovelsByNovelId(novelList.novelIDs);
    const user = await getUserNameAndImg(novelList.userId);

    if (!user) continue;

    novelListComposed.push({
      listId: novelList.novelListId,
      listTitle: novelList.novelListTitle,
      userName: user.userName,
      userImg: user.userImg,
      novel, // can be empty array
    });
  }

  return novelListComposed;
}

export default async function getUserNovelListsAtRandom(limitedNo: number) {
  const novelLists = await getNovelListsOfUsersFromDB(limitedNo);

  return await composeNovelLists(novelLists);
}
