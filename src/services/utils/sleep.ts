export default async function sleep(milliSeconds: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, milliSeconds);
  });
}
