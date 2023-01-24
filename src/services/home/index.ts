import getWritings from "./getWritings";
import getUserRankOfWritings from "./getUserRanks";
import getNovelListsOfUsers from "./getNovelListsOfUsers";
import getPopularNovelsInNovelTime from "./getPopularNovelsInNovelTime";
import getWeeklyNovelsFromPlatform from "./getWeeklyNovelsFromPlatform";

const writingHomeService = {
  getWritings,
  getUserRankOfWritings,
  getNovelListsOfUsers,
  getPopularNovelsInNovelTime,
  getWeeklyNovelsFromPlatform,
};

export default writingHomeService;
