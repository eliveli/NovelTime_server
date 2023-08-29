import db from "../utils/db";
import { NovelListInfo } from "../utils/types";
import { composeNovelLists } from "./getUserNovelListsAtRandom";

type NovelListIDs = { novelListId: string }[];

export async function getNovelListsPeopleLikeFromDB(limitedNo: number) {
  const dbQuery =
    "SELECT novelListId FROM novelListLike GROUP BY novelListId ORDER BY count(*) DESC LIMIT (?)";
  const novelListIDsFromDB = (await db(dbQuery, limitedNo, "all")) as NovelListIDs;
  const novelListIDs = novelListIDsFromDB.map((_) => _.novelListId);
  return novelListIDs;
}

export async function getNovelList(novelListId: string) {
  const dbQuery =
    'SELECT novelListId, novelListTitle, novelIDs, userId FROM novelList WHERE novelIDs != "" OR novelIDs IS NOT NULL AND novelListId = (?)';
  return (await db(dbQuery, novelListId, "first")) as NovelListInfo;
}

export async function getNovelLists(novelListIDs: string[]) {
  const novelLists: NovelListInfo[] = [];
  for (const novelListId of novelListIDs) {
    const novelList = await getNovelList(novelListId);
    if (!novelList) continue;

    novelLists.push(novelList);
  }
  return novelLists;
}

export default async function getUserNovelListsPeopleLike(limitedNo: number) {
  const novelListIDs = await getNovelListsPeopleLikeFromDB(limitedNo);
  if (!novelListIDs) return;

  const novelLists = await getNovelLists(novelListIDs);

  return await composeNovelLists(novelLists);
}
