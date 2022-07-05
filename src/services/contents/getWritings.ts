/* eslint-disable no-restricted-syntax */
import pool from "../../configs/db";
import { query } from "./contents.utils";

type Writing = {
  writingId: string;
  userId: string;
  createDate: string;
  writingTitle: string;
  writingImg: string;
  writingDesc: string;
  novelId: string;
  likeNO: number;
  commentNO: number;
  talkOrRecommend: "T" | "R";
};
function divideWritings(writings: Writing[], number: number, order = 1) {
  const talks = [];
  const recommends = [];
  for (const writing of writings) {
    if (writing.talkOrRecommend === "T") {
      talks.push(writing);
    }
    if (writing.talkOrRecommend === "R") {
      recommends.push(writing);
    }

    // when requesting writings from userPageHome page, "order" is always 1
    // otherwise requesting from userPageWritings page, "order" will be 1 or bigger one
    //   because if an user clicks the "more" button writings in next order will be required
    if (talks.length >= number * order && recommends.length >= number * order) {
      break;
    }
  }

  // set the lists as requested after setting the arrays of talks and recommends
  const newTalks = talks.slice(number * (order - 1), number * order);
  const newRecommends = recommends.slice(number * (order - 1), number * order);

  return [newTalks, newRecommends];
}

export default function getWritings(userId: string) {
  return new Promise<any>(async (resolve) => {
    await pool
      .getConnection()
      .then((connection) => {
        connection
          .query(query.getWritings, userId)
          .then((data) => {
            const writings = data.slice(0, data.length);
            const dividedWritings = divideWritings(writings, 4);
            resolve(dividedWritings);

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
}
