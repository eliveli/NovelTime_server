import pool from "./connect";
const query = {
  insertNovel: "INSERT INTO novelInfo values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
  getNovels: " SELECT * FROM novelInfo WHERE novelTitle like (?) ",
};

interface novelInfo {
  novelId: string;
  novelImg: string;
  novelTitle: string;
  novelDesc: string;
  novelAuthor: string;
  novelAge: string;
  novelGenre: string;
  novelIsEnd: boolean;
  novelPlatform: string;
  novelUrl: string;
}

const setNovel = async (novelInfo: novelInfo) => {
  await pool
    .getConnection()
    .then((connection) => {
      connection
        .query(query.insertNovel, [
          novelInfo.novelId,
          novelInfo.novelImg,
          novelInfo.novelTitle,
          novelInfo.novelDesc,
          novelInfo.novelAuthor,
          novelInfo.novelAge,
          novelInfo.novelGenre,
          novelInfo.novelIsEnd,
          novelInfo.novelPlatform,
          "", //platform2
          "", //platform3
          novelInfo.novelUrl,
          "", //url2
          "", //url3
          0,
          0,
        ])
        .then((res) => {
          // When done with the connection, release it.
          connection.release();
        })

        .catch((err) => {
          console.log(err);
          connection.release();
        });
    })
    .catch((err) => {
      console.log("not connected due to error: " + err);
    });
};

const getNovels = (novelTitle: string) => {
  return new Promise(async (resolve) => {
    await pool
      .getConnection()
      .then((connection) => {
        connection
          .query(query.getNovels, `%${novelTitle}%`)
          .then((data) => {
            resolve(data);

            // When done with the connection, release it.
            connection.release();
          })

          .catch((err) => {
            console.log(err);
            connection.release();
          });
      })
      .catch((err) => {
        console.log("not connected due to error: " + err);
      });
  });
};

export { setNovel, getNovels };
