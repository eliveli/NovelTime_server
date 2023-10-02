import changeHourTimeTo12 from "./changeHourTimeTo12";

export default function getCurrentTime() {
  const date = new Date();
  const year: string = date.getFullYear().toString();

  let month: string | number = date.getMonth() + 1;
  month = month < 10 ? `0${month.toString()}` : month.toString();

  let day: string | number = date.getDate();
  day = day < 10 ? `0${day.toString()}` : day.toString();

  let hour: string | number = date.getHours();
  hour = hour < 10 ? `0${hour.toString()}` : hour.toString();

  let minites: string | number = date.getMinutes();
  minites = minites < 10 ? `0${minites.toString()}` : minites.toString();

  let seconds: string | number = date.getSeconds();
  seconds = seconds < 10 ? `0${seconds.toString()}` : seconds.toString();

  function setMilliseconds(inputMilliseconds: number) {
    if (inputMilliseconds < 10) {
      return `00${inputMilliseconds.toString()}`;
    }
    if (inputMilliseconds < 100) {
      return `0${inputMilliseconds.toString()}`;
    }
    return inputMilliseconds.toString();
  }

  let milliseconds: string | number = date.getMilliseconds();
  milliseconds = setMilliseconds(milliseconds);

  return year + month + day + hour + minites + seconds + milliseconds;
}

export function getCurrentTimeExceptMilliSec() {
  const date = new Date();
  const year: string = date.getFullYear().toString();

  let month: string | number = date.getMonth() + 1;
  month = month < 10 ? `0${month.toString()}` : month.toString();

  let day: string | number = date.getDate();
  day = day < 10 ? `0${day.toString()}` : day.toString();

  let hour: string | number = date.getHours();
  hour = hour < 10 ? `0${hour.toString()}` : hour.toString();

  let minutes: string | number = date.getMinutes();
  minutes = minutes < 10 ? `0${minutes.toString()}` : minutes.toString();

  let seconds: string | number = date.getSeconds();
  seconds = seconds < 10 ? `0${seconds.toString()}` : seconds.toString();

  return year + month + day + hour + minutes + seconds;
}

// in below three, parameter "dateTime" was made by getCurrentTimeExceptMilliSec above
export function extractCreateDate(dateTime: string) {
  const yearInCreateDate = dateTime.substring(2, 4);
  const monthInCreateDate = dateTime.substring(4, 6);
  const dayInCreateDate = dateTime.substring(6, 8);
  const createDate = `${yearInCreateDate}.${monthInCreateDate}.${dayInCreateDate}`;
  return createDate;
}

function extractCreateTime(dateTime: string) {
  const hourInCreateDate = dateTime.substring(8, 10);
  const minutesInCreateDate = dateTime.substring(10, 12);
  const createTime = changeHourTimeTo12(hourInCreateDate, minutesInCreateDate);
  return createTime;
}

export function splitDateTime(dateTime: string) {
  const createDate = extractCreateDate(dateTime);
  const createTime = extractCreateTime(dateTime);
  return { createDate, createTime };
}
