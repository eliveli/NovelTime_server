import {
  getNovelListsOfUsersFromDB,
  getNovelsByNovelId,
  getNovelsByNovelIdFromDB,
} from "../getNovelListsOfUsers";
import getUserNameAndImg from "../shared/getUserNameAndImg";

// it("check type of novelIsEnd", async () => {
//   const novelList = await getNovelsByNovelIdFromDB("20220225081951109");
//   const { novelIsEnd } = novelList;
//   console.log("typeof novelIsEnd:", typeof novelIsEnd);
//   console.log("novelIsEnd:", novelIsEnd);
//   // expect(novelIsEnd).toBeTruthy();
//   // expect(novelIsEnd).toBeFalsy();
// });

it("get novel lists of users", async () => {
  const novelLists = await getNovelListsOfUsersFromDB();

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

  console.log("novelListComposed:", novelListComposed);
});
