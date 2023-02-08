import db from "../utils/db";
import { NovelListInfo } from "../utils/types";
import getNovelByNovelIdFromDB from "./shared/getNovelByNovelId";
import getUserNameAndImg from "./shared/getUserNameAndImg";

export async function getNovelListsOfUsersFromDB() {
  return (await db(
    `SELECT novelListId, novelListTitle, novelIDs, userId FROM novelList
    ORDER BY RAND() LIMIT 2`,
    undefined,
    "all",
  )) as NovelListInfo[];
}

export async function getNovelsByNovelId(novelIDs: string) {
  // change string to string array holding novel IDs
  const novelIdInArray = novelIDs.split(" ");

  const novels = [];
  for (const novelId of novelIdInArray) {
    const novel = await getNovelByNovelIdFromDB(novelId, true);

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

export default async function getNovelListsOfUsers() {
  const novelLists = await getNovelListsOfUsersFromDB();

  return await composeNovelLists(novelLists);
}
