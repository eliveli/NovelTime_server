export default function getCurrentTime(): string {
  const date = new Date();
  let year = date.getFullYear().toString();

  let month: string | number = date.getMonth() + 1;
  month = month < 10 ? "0" + month.toString() : month.toString();

  let day: string | number = date.getDate();
  day = day < 10 ? "0" + day.toString() : day.toString();

  let hour: string | number = date.getHours();
  hour = hour < 10 ? "0" + hour.toString() : hour.toString();

  let minites: string | number = date.getMinutes();
  minites = minites < 10 ? "0" + minites.toString() : minites.toString();

  let seconds: string | number = date.getSeconds();
  seconds = seconds < 10 ? "0" + seconds.toString() : seconds.toString();

  let milliseconds: string | number = date.getMilliseconds();
  milliseconds =
    milliseconds < 10
      ? "00" + milliseconds.toString()
      : milliseconds < 100
      ? "0" + milliseconds.toString()
      : milliseconds.toString();

  return year + month + day + hour + minites + seconds + milliseconds;
}
