import { setOthersNovelListsOneByOne } from "../userContent/novelListSummary";
import db from "../utils/db";
import { NovelListInfo } from "../utils/types";
import { composeNovelLists } from "./getUserNovelListsAtRandom";

type NovelListIDs = { novelListId: string }[];

export async function getNovelListsPeopleLikeFromDB() {
  const dbQuery =
    "SELECT novelListId FROM novelListLike GROUP BY novelListId ORDER BY count(*) DESC";
  const novelListIDsFromDB = (await db(dbQuery, undefined, "all")) as NovelListIDs;
  if (!novelListIDsFromDB.length) return;

  const novelListIDs = novelListIDsFromDB.map((_) => _.novelListId);
  return novelListIDs;
}

export async function getNovelList(novelListId: string) {
  const dbQuery =
    'SELECT novelListId, novelListTitle, novelIDs, userId FROM novelList WHERE (novelIDs != "" OR novelIDs IS NOT NULL) AND novelListId = (?)';
  return (await db(dbQuery, novelListId, "first")) as NovelListInfo;
}

export async function getNovelLists(novelListIDs: string[], limitedNo: number) {
  const novelLists: NovelListInfo[] = [];
  for (const novelListId of novelListIDs) {
    const novelList = await getNovelList(novelListId);
    if (!novelList) continue;

    novelLists.push(novelList);
    if (novelLists.length === limitedNo) break;
  }
  return novelLists;
}

export default async function getUserNovelListsPeopleLike(
  limitedNo: number,
  isWithSummaryCardInString: string,
) {
  const isWithSummaryCard = isWithSummaryCardInString === "true";

  const novelListIDs = await getNovelListsPeopleLikeFromDB();
  if (!novelListIDs) return;

  if (isWithSummaryCard) {
    const listsComposed = await setOthersNovelListsOneByOne(novelListIDs, limitedNo);
    return listsComposed;
  }

  const novelLists = await getNovelLists(novelListIDs, limitedNo);

  const listsComposed = await composeNovelLists(novelLists);
  return listsComposed;
}
