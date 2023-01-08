export default async function sleep(seconds: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, seconds * 2000);
  });
}
