import db from "../utils/db";
import { Novel, NovelListInfo } from "../utils/types";
import getUserNameAndImg from "./shared/getUserNameAndImg";

export async function getNovelListsOfUsersFromDB() {
  return (await db(
    `SELECT novelListId, novelListTitle, novelIDs, userId FROM novelList
    ORDER BY RAND() LIMIT 2`,
    undefined,
    "all",
  )) as NovelListInfo[];
}
export async function getNovelsByNovelIdFromDB(novelId: string) {
  const novel = (await db(
    "SELECT novelId, novelImg, novelTitle, novelAuthor, novelGenre, novelIsEnd FROM novelInfo WHERE novelId = (?)",
    novelId,
    "first",
  )) as Novel;
  return { ...novel, novelIsEnd: !!novel.novelIsEnd }; // convert tinyInt to boolean
}

export async function getNovelsByNovelId(novelIDs: string) {
  // change string to string array holding novel IDs
  const novelIdInArray = novelIDs.split(" ");

  const novels = [];
  for (const novelId of novelIdInArray) {
    const novel = await getNovelsByNovelIdFromDB(novelId);
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
