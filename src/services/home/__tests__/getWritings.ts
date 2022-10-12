import getWritings from "../getWritings";

it("getWritings", async () => {
  const writings = await getWritings("R");
  console.log("writings:", writings);
});
