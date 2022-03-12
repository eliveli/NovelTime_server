import pool from "../configs/db";

const query = {
  insertNovel: "INSERT INTO novelInfo values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
  getNovels: " SELECT * FROM novelInfo WHERE novelTitle like (?) ",
  getNovel: " SELECT * FROM novelInfo WHERE novelId = (?) ",
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

export const setNovel = async (novelInfo: novelInfo) => {
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
          "", // platform2
          "", // platform3
          novelInfo.novelUrl,
          "", // url2
          "", // url3
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
      console.log(`not connected due to error: ${err}`);
    });
};

export const getNovels = (novelTitle: string) =>
  new Promise(async (resolve) => {
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
        console.log(`not connected due to error: ${err}`);
      });
  });

export const getNovel = (novelId: string) =>
  new Promise(async (resolve) => {
    await pool
      .getConnection()
      .then((connection) => {
        connection
          .query(query.getNovel, novelId)
          .then((data) => {
            resolve(data[0]);

            // When done with the connection, release it.
            connection.release();
          })

          .catch((err) => {
            console.log(err);
            connection.release();
          });
      })
      .catch((err) => {
        console.log(`not connected due to error: ${err}`);
      });
  });
