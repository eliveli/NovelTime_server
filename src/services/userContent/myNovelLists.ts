import db from "../utils/db";

async function updateNovelsInList(listId: string, nextNovelIDs: string) {
  const dbQuery = "UPDATE novelList SET novelIDs = (?) WHERE novelListId = (?)";
  await db(dbQuery, [nextNovelIDs, listId]);
}

async function getExistingNovelsFromList(listId: string) {
  const dbQuery = "SELECT novelIDs FROM novelList WHERE novelListId = (?)";
  const { novelIDs } = (await db(dbQuery, listId, "first")) as { novelIDs: string };
  return novelIDs;
}

async function createNovelListInDB(loginUserId: string, newNovelListTitle?: string) {
  const novelListId = `${loginUserId}${Date.now().toString()}`;
  const novelListTitle = newNovelListTitle || "기본 소설 리스트";

  const dbQuery = "INSERT INTO novelList SET novelListId = (?), novelListTitle = (?), userId = (?)";
  await db(dbQuery, [novelListId, novelListTitle, loginUserId]);
}

async function getNovelListByUserId(loginUserId: string) {
  const dbQuery = "SELECT novelListId, novelListTitle FROM novelList where userId = (?)";

  const novelListTitles = (await db(dbQuery, loginUserId, "all")) as {
    novelListId: string;
    novelListTitle: string;
  }[];

  return novelListTitles;
}

function setNextNovelIDs(allNovelIDs: string, novelIDsToRemove: string[]) {
  const allNovelIDsArray = allNovelIDs.split(" ");

  const nextNovelIDsArray = allNovelIDsArray.filter(
    (novelId) => !novelIDsToRemove.includes(novelId),
  );

  const nextNovelIDs = nextNovelIDsArray.join(" ");
  return nextNovelIDs;
}

async function getMyList(loginUserId: string) {
  let listTitles = await getNovelListByUserId(loginUserId);

  if (!listTitles.length) {
    await createNovelListInDB(loginUserId);
    listTitles = await getNovelListByUserId(loginUserId);
  }

  return listTitles;
}

async function createMyList(listTitle: string, loginUserId: string) {
  await createNovelListInDB(loginUserId, listTitle);
}

async function changeListTitle(listId: string, listTitle: string) {
  const dbQuery = "UPDATE novelList SET novelListTitle = (?) WHERE novelListId = (?)";
  await db(dbQuery, [listTitle, listId]);
}

async function removeMyList(listId: string) {
  const dbQuery = "DELETE FROM novelList WHERE novelListId = (?)";
  await db(dbQuery, listId);
}

async function addNovelToMyList(novelId: string, listIDs: string[]) {
  if (!listIDs.length) throw Error("list id doesn't exist");

  for (const listId of listIDs) {
    const prevNovelIDs = await getExistingNovelsFromList(listId);

    const nextNovelIDs = `${prevNovelIDs} ${novelId}`;

    await updateNovelsInList(listId, nextNovelIDs);
  }
}

async function removeNovelFromMyList(listId: string, novelIDsToRemove: string[]) {
  if (!novelIDsToRemove.length) throw Error("any novel id wasn't given");

  const allNovelIDs = await getExistingNovelsFromList(listId);

  const nextNovelIDs = setNextNovelIDs(allNovelIDs, novelIDsToRemove);

  await updateNovelsInList(listId, nextNovelIDs);
}

const myNovelListsService = {
  getMyList,
  createMyList,
  changeListTitle,
  removeMyList,
  addNovelToMyList,
  removeNovelFromMyList,
};
export default myNovelListsService;
