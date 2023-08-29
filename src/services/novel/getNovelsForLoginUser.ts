import db from "../utils/db";
import { NovelInDetail } from "../utils/types";

async function getNovelsUserWroteFor(userId: string) {
  const dbQuery = "SELECT novelId FROM writing WHERE userId = (?)";

  const novelIDsArray = (await db(dbQuery, [userId], "all")) as { novelId: string }[];

  if (!novelIDsArray.length) return;

  const novelIDs = novelIDsArray.map((_) => _.novelId);

  return novelIDs;
}

async function getUsersWhoWroteForTheNovel(novelId: string) {
  const dbQuery = "SELECT userId FROM writing WHERE novelId = (?)";

  const userIDsArray = (await db(dbQuery, novelId, "all")) as { userId: string }[];

  const userIDs = userIDsArray.map((_) => _.userId);

  return userIDs;
}

// get novels that other wrote for who wrote for the novel that I wrote for
async function getNovelsThatOtherWroteFor(novelIDs: string[]) {
  const novels: string[] = [];
  const userIDsWhoHasTheSameFavor: string[] = [];

  for (const novelId of novelIDs) {
    const userIDs = await getUsersWhoWroteForTheNovel(novelId);

    for (const userId of userIDs) {
      if (userIDsWhoHasTheSameFavor.includes(userId)) continue;

      userIDsWhoHasTheSameFavor.push(userId);

      const novelIDsUserWroteFor = await getNovelsUserWroteFor(userId);
      if (!novelIDsUserWroteFor) continue;

      novels.push(...novelIDsUserWroteFor);
    }
  }
  return novels;
}

function sortNovelIDsByReviewNo(novelIDs: string[][]) {
  const novelIDsThatExist = novelIDs.filter((_) => _); // without undefined element
  novelIDsThatExist.reverse();

  const novelIDsOrdered: string[] = [];
  for (const novelId of novelIDsThatExist) {
    novelIDsOrdered.push(...novelId);
  }
  return novelIDsOrdered;
}

function findNovelsManyUserWroteFor(novelIDs: string[]) {
  novelIDs.sort();
  // sorted by alphabet. the same novel IDs are placed side by side
  // count this same novel IDs and push it to array with the counting number as index
  // like this :   array [novelCountingNumber - 1] = [ novel1, novel2, ... ]

  const novelIDsToSort: string[][] = [];

  let currentId = "";
  let countNo = 0;
  novelIDs.forEach((_, idx) => {
    if (novelIDs.length === 1) {
      novelIDsToSort[0] = [_];
      return;
    }

    // novelIDs.length > 1 //
    if (idx === 0) {
      currentId = _;
      countNo = 1;
    } else if (_ !== currentId) {
      if (!novelIDsToSort[countNo - 1]) {
        novelIDsToSort[countNo - 1] = [currentId];
      } else {
        novelIDsToSort[countNo - 1] = [...novelIDsToSort[countNo - 1], currentId];
      }

      currentId = _;
      countNo = 1;
    } else if (_ === currentId) {
      countNo += 1;
    } else if (idx === novelIDs.length - 1) {
      // treat last element //
      //
      if (_ !== currentId && !novelIDsToSort[countNo - 1]) {
        // set previous element
        novelIDsToSort[countNo - 1] = [currentId];

        // set current element
        novelIDsToSort[0] = [...novelIDsToSort[0], _];
      } else if (_ !== currentId) {
        // set previous element
        novelIDsToSort[countNo - 1] = [...novelIDsToSort[countNo - 1], currentId];

        // set current element
        novelIDsToSort[0] = [...novelIDsToSort[0], _];
      } else if (_ === currentId && novelIDsToSort[countNo - 1]) {
        countNo += 1;
        novelIDsToSort[countNo - 1] = [currentId];
      } else if (_ === currentId) {
        countNo += 1;
        novelIDsToSort[countNo - 1] = [...novelIDsToSort[countNo - 1], currentId];
      }
    }
  });

  return sortNovelIDsByReviewNo(novelIDsToSort);
}

async function getNovelInfo(novelIDs: string[], limitedNo: number) {
  novelIDs.sort(() => 0.5 - Math.random()); // shuffle array

  const novels: NovelInDetail[] = [];
  for (const novelId of novelIDs) {
    const dbQuery = `SELECT novelId, novelImg, novelTitle, novelAuthor, novelGenre, novelDesc FROM novelInfo WHERE novelId = (?) LIMIT ${String(
      limitedNo,
    )}`;

    const novel = (await db(dbQuery, novelId, "first")) as NovelInDetail;

    novels.push(novel);
  }

  return novels;
}

export default async function getNovelsForLoginUser(loginUserId: string, limitedNo: number) {
  const novelIDsUserWroteFor = await getNovelsUserWroteFor(loginUserId);
  if (!novelIDsUserWroteFor) return;

  const novelIDsOtherWroteFor = await getNovelsThatOtherWroteFor(novelIDsUserWroteFor);

  const novelIDsManyUserWroteFor = findNovelsManyUserWroteFor(novelIDsOtherWroteFor);

  const novels = await getNovelInfo(novelIDsManyUserWroteFor, limitedNo);

  return novels;
}
