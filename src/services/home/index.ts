import getWritings from "./getWritings";
import getUserRanks from "./getUserRanks";
import getNovelListsOfUsers from "./getNovelListsOfUsers";
import getPopularNovelsInNovelTime from "./getPopularNovelsInNovelTime";
import getWeeklyNovelsFromPlatform from "./getWeeklyNovelsFromPlatform";

const writingHomeService = {
  getWritings,
  getUserRanks,
  getNovelListsOfUsers,
  getPopularNovelsInNovelTime,
  getWeeklyNovelsFromPlatform,
};

export default writingHomeService;
