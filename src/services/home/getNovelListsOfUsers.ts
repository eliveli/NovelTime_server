import db from "../utils/db";
import { Novel, NovelListInfo } from "../utils/types";
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
    const novel = await getNovelByNovelIdFromDB(novelId);
    novels.push(novel);
  }
  return novels;
}

export async function setNovelsInNovelList(novelLists: NovelListInfo[]) {
  for (const novelList of novelLists) {
    await getNovelsByNovelId(novelList.novelIDs);
  }
}

async function composeNovelLists(novelLists: NovelListInfo[]) {
  const novelListComposed = [];

  for (const novelList of novelLists) {
    const novel = await getNovelsByNovelId(novelList.novelIDs);
    const { userName, userImg } = await getUserNameAndImg(novelList.userId);

    novelListComposed.push({
      listId: novelList.novelListId,
      listTitle: novelList.novelListTitle,
      userName,
      userImg,
      novel,
    });
  }

  return novelListComposed;
}

export default async function getNovelListsOfUsers() {
  const novelLists = await getNovelListsOfUsersFromDB();
  return await composeNovelLists(novelLists);
}
