import puppeteer, { ElementHandle, Puppeteer } from "puppeteer";
import dotenv from "dotenv";
import getCurrentTime from "./getCurrentTime";
import { setNovel } from "../../../novels";
import { loginController } from "../../../../controllers/user";

dotenv.config(); // 여기(이 명령어를 실행한 파일)에서만 환경변수 사용 가능
// require("dotenv").config();

let isCategoryLoopEnd = false; // 전체 카테고리별 목록페이지 조회완료 여부

const totalPageNO: number[] = []; // 필터 별 전체 페이지 수(참고용)
let totalNovelNO = 0; // 전체 작품 수 : 0으로 해야 함. 필터 별 작품 수 추가하여 계산
let currentPageNO = 1; // 현재 페이지 넘버
let currentNovelNO = 1; // 현재 작품 넘버

// 작품 리스트 : 작품 url 저장
const novelList: Array<{ url: string }> = [
  // { url: "/books/777097927" },
];

async function login(page: puppeteer.Page) {
  // set id, pw
  let ridiID: string;
  let ridiPW: string;
  // handle undefined env variable
  if (process.env.RIDI_ID) {
    ridiID = process.env.RIDI_ID;
  } else {
    throw new Error("RIDI_ID env is not set");
  }
  if (process.env.RIDI_PW) {
    ridiPW = process.env.RIDI_PW;
  } else {
    throw new Error("RIDI_PW env is not set");
  }

  await page.goto(
    "https://ridibooks.com/account/login?return_url=https%3A%2F%2Fridibooks.com%2Fcategory%2Fbooks%2F1703%3Forder%3Drecent%26page%3D1",
  );

  const idElement = await page.waitForSelector("#login_id");
  await page.evaluate(
    (platformID, element) => {
      element.value = platformID;
    },
    ridiID,
    idElement,
  );
  const pwElement = await page.waitForSelector("#login_pw");
  await page.evaluate(
    (platformPW, element) => {
      element.value = platformPW;
    },
    ridiPW,
    pwElement,
  );
  await page.click("#login > form > div > div > label > input[type=checkbox]"); // check 로그인상태유지
  await page.click("#login > form > button"); // submit
}

async function searchByCategory(page: puppeteer.Page, genreNOs: string[]) {
  categoryLoop: for (let ctgIdx = 0; ctgIdx < genreNOs.length; ctgIdx += 1) {
    // 카테고리별 목록 페이지 전체 조회 완료라면 다시 조회하지 않음 : 시크릿창 닫고 새로 열 때 표시 필요
    if (isCategoryLoopEnd) break;

    // 목록페이지 url // with 최신순(최신화등록일), 성인 제외
    const novelListUrl = `https://ridibooks.com/category/books/${genreNOs[ctgIdx]}?order=recent&adult_exclude=y&page=`;

    // 목록 페이지 이동
    // 페이지 이동 후 대기 시간 필요. 소설 url을 읽어 올 dom이 load되어야 함
    await page.goto(novelListUrl + String(currentPageNO), { waitUntil: "networkidle0" });

    // 소설 목록 카드형으로 보기
    //  -> 페이지 별 모든 소설을 가능한 한 작은 화면에 보이기
    //    -> PageDown 누르는 횟수 줄이기 && 줄어든 횟수만큼 다루기 쉽게 하기
    if (currentPageNO === 1) {
      await page.waitForSelector(
        "#__next > main > div > section > div > ul > div > button:nth-child(2)",
      ); // 꼭 필요함
      await page.click("#__next > main > div > section > div > ul > div > button:nth-child(2)");
    }

    // 카테고리 내 목록 페이지 조회 반복
    while (true) {
      console.log(currentPageNO, "현재 페이지 번호");

      // 각 페이지에서 작품 url 가져오기
      for (let novelNO = 1; novelNO < 61; novelNO += 1) {
        try {
          // in order to read dom elements from page
          await page.waitForSelector(
            "#__next > main > div > section > ul > li:nth-child(1) > div > div > div > h3 > a",
          ); // 페이지의 첫번째 소설 element load 후

          for (let i = 1; i < 16; i += 1) {
            await page.keyboard.press("PageDown", { delay: 100 });
          }

          const novelElHandle = await page.waitForSelector(
            `#__next > main > div > section > ul > li:nth-child(${novelNO}) > div > div > div > h3 > a`,
          );

          const novelURLunClean = await page.evaluate(
            (elHandle) => elHandle.getAttribute("href"),
            novelElHandle,
          );
          // url : "?" 부터 문자 제외
          const novelURL = novelURLunClean.slice(0, novelURLunClean.indexOf("?"));

          novelList.push({ url: novelURL });
          console.log("noveNO: ", novelNO, " novelURL: ", novelURL);
        } catch (err) {
          console.log(err, "읽어올 작품이 더 없을 확률 높음");

          // 읽어올 작품이 더 없을 때 현재 필터의 조회 종료
          // 직전 페이지가 마지막 페이지일 때
          if (novelNO === 1) {
            totalPageNO.push(currentPageNO - 1); // 해당 필터의 전체 페이지 수 표시
            totalNovelNO += (currentPageNO - 1) * 60; // 전체 작품 수에 해당 필터의 작품 수 추가
          }
          // 현재 페이지가 마지막 페이지일 때
          if (novelNO !== 1) {
            totalPageNO.push(currentPageNO); // 해당 필터의 전체 페이지 수 표시
            totalNovelNO += (currentPageNO - 1) * 60 + (novelNO - 1); // 전체 작품 수에 해당 필터의 작품 수 추가
          }

          console.log("totalPageNO: ", totalPageNO, " totalNovelNO: ", totalNovelNO);
          currentPageNO = 1; // 현재 작품 넘버 1로 리셋

          continue categoryLoop; // 다음 카테고리 조회
        }
      }
      // 다음 페이지 이동
      currentPageNO += 1;
      await page.goto(novelListUrl + String(currentPageNO), { waitUntil: "networkidle0" });
      await page.waitForSelector(
        "#__next > main > div > section > ul > li:nth-child(1) > div > div > div > h3 > a",
      ); // 페이지의 첫번째 소설 element load 후
    }
  }
}

async function getImg(page: puppeteer.Page) {
  const imgElement = await page.waitForSelector(
    "#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_thumbnail_wrap > div.header_thumbnail.book_macro_200.detail_scalable_thumbnail > div > div > div > img",
  );
  const img: string = await page.evaluate((element) => element.getAttribute("src"), imgElement);
  return img;
}

async function getTitle(page: puppeteer.Page) {
  const titleElement = await page.waitForSelector(
    "#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_info_wrap > div.info_title_wrap > h3",
  );
  const title: string = await page.evaluate((element) => element.innerText, titleElement);

  return title;
}

// element의 class에 따라 완결/미완 다름. 표시 없는 작품은 완결로 표시.
async function getIsEnd(page: puppeteer.Page) {
  const isEnd = await page.evaluate(() => {
    const notEndElement = document.querySelector(
      "#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_info_wrap > div:nth-child(4) > p.metadata.metadata_info_series_complete_wrap > span.metadata_item.not_complete",
    );
    return notEndElement === null;
  });

  return isEnd;
}

async function getDesc(page: puppeteer.Page) {
  const descElement = await page.waitForSelector(
    "article.detail_box_module.detail_introduce_book #introduce_book > p",
  );

  const desc: string = await page.evaluate((element) => {
    // 첫 줄에 제목 + 로맨스 가이드 있을 때 그 부분 제외
    if (
      element.children[0].tagName === "SPAN" &&
      element.innerText.includes(">\n로맨스 가이드\n\n")
    ) {
      const idxForSettingStart: number = element.innerText.indexOf(">\n로맨스 가이드\n\n");
      return element.innerText.slice(idxForSettingStart + 11);
    }
    // 첫 줄 제목 제외
    if (
      element.children[0].tagName === "SPAN" &&
      (element.children.length === 1 || element.children[1].tagName !== "IMG")
    ) {
      const idxForSettingStart: number = element.innerText.indexOf(">\n");
      return element.innerText.slice(idxForSettingStart + 2);
    }
    // 첫 줄에 제목, 둘째 줄에 이미지, 셋째 넷째 비어있을 때 제외
    if (
      element.children[0].tagName === "SPAN" &&
      element.children[1].tagName === "IMG" &&
      element.children[2].tagName === "BR" &&
      element.children[3].tagName === "BR"
    ) {
      const idxForSettingStart: number = element.innerText.indexOf(">\n\n\n");
      return element.innerText.slice(idxForSettingStart + 4);
    }
    return "";
  }, descElement);

  const keywords = await page.evaluate(() => {
    const keywordList = document.querySelectorAll(
      "#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_box_module.detail_keyword.js_detail_keyword_module > ul > li",
    );
    let keywordSet = "";
    filterKeyword: for (let i = 0; i < keywordList.length; i += 1) {
      const keyword = keywordList[i].textContent;
      if (keyword === null) {
        throw new Error("키워드가 없는데도 반복문 실행됨");
      }
      const exceptKeys = [
        "만원",
        "3000",
        "리뷰",
        "별점",
        "평점",
        "연재",
        "단행본",
        "무료",
        "2013",
        "2015",
        "권이하",
        "년출간",
      ];
      for (let j = 0; j < exceptKeys.length; j += 1) {
        if (keyword.includes(exceptKeys[j])) continue filterKeyword;
        if (exceptKeys[j] === exceptKeys[exceptKeys.length - 1]) {
          keywordSet += `${keyword} `;
        }
      }
    }
    return keywordSet;
  });

  // set desc only : 기존 작품소개에 키워드가 포함되어 있거나 받아온 키워드가 없다면
  if (desc.includes("#") || desc.includes("키워드") || keywords === "") {
    return desc;
  }
  // set desc with keywords
  return `${keywords}\n\n${desc}`;
}

async function getAuthor(page: puppeteer.Page) {
  const authorElement = await page.waitForSelector(
    "#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_info_wrap > div:nth-child(4) > p.metadata.metadata_writer > span > a",
  );

  const author: string = await page.evaluate((element) => element.innerText, authorElement);

  return author;
}

function divideAge(noti: string) {
  if (noti.includes("15세")) return "15세 이용가";
  if (noti.includes("12세")) return "12세 이용가";
  return "전체 이용가";
}

async function getAge(page: puppeteer.Page) {
  const ageElement = await page.waitForSelector("#notice_component > ul > li");
  const notification: string = await page.evaluate((element) => element.innerText, ageElement);

  const age = divideAge(notification);

  return age;
}

async function getGenre(
  page: puppeteer.Page,
  genreElement: puppeteer.ElementHandle<Element> | null,
) {
  if (genreElement) return;

  const genre = await page.evaluate((element) => element.innerText, genreElement);

  if (genre.includes("로판")) return "로판";
  if (genre.includes("로맨스")) return "로맨스";
  if (genre.includes("무협")) return "무협";
  if (genre.includes("라이트노벨")) return "라이트노벨";
  if (genre.includes("BL")) return "BL";
  if (genre.includes("현대") || genre.includes("게임") || genre.includes("스포츠")) {
    return "현판";
  }
  if (genre.includes("판타지")) return "판타지";
  return "기타";
}

async function VisitDetailPages(page: puppeteer.Page) {
  const novelInfo = {
    novelId: "",
    novelImg: "",
    novelTitle: "",
    novelDesc: "",
    novelAuthor: "",
    novelAge: "",
    novelGenre: "",
    novelIsEnd: false,
    novelPlatform: "",
    novelUrl: "",
  };

  while (isCategoryLoopEnd && totalNovelNO >= currentNovelNO) {
    console.log(
      `currentNovelNO: ${currentNovelNO}, totalNovelNO: ${totalNovelNO}, totalPageNoList:${totalPageNO}`,
    );
    try {
      // set url
      novelInfo.novelUrl = `https://ridibooks.com${novelList[currentNovelNO - 1].url}`;

      // go to detail page
      // 로그인 후 페이지 리다이렉트 됨. 잠시 대기 후 상세페이지로 이동해야 에러 안 남.
      await new Promise((resolve) => {
        setTimeout(resolve, 500);
      });
      await page.goto(novelInfo.novelUrl);

      // 상세페이지 정보 읽기

      novelInfo.novelImg = await getImg(page);

      novelInfo.novelTitle = await getTitle(page);

      novelInfo.novelIsEnd = await getIsEnd(page);

      novelInfo.novelDesc = await getDesc(page);

      novelInfo.novelAuthor = await getAuthor(page);

      novelInfo.novelAge = await getAge(page);

      // get genre
      const genreElement = await page.waitForSelector(
        "#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_info_wrap > p",
      );

      novelInfo.novelGenre = await getGenre(page, genreElement);

      // set platform, id
      novelInfo.novelPlatform = "리디북스";
      novelInfo.novelId = getCurrentTime();

      console.log(novelInfo);

      // db 저장
      await setNovel(novelInfo);

      currentNovelNO += 1; // 작품 번호 +1

      if (currentNovelNO % 100 === 0) break; // 작품 100번째 마다 loop 탈출. 시크릿창 여닫기
    } catch (err) {
      console.log(err, `\n 현재작품: ${currentNovelNO}, 마지막작품: ${totalNovelNO}`);
      // 에러 발생 시 해당 작품은 통과. 시크릿창 여닫으며 다음 작품으로 넘어감
      currentNovelNO += 1; // 작품 번호 +1
      break;
    }
  }
}

// 스크래퍼 리디용 (페이지네이션)-----------------------------------------------------------------------------//
export async function scrapeRidi(genreNOs: string[]) {
  const browser = await puppeteer.launch({ headless: true });

  // 반복. 브라우저 컨텍스트 열고 닫기. out of memory 방지
  // 시크릿창. 캐시나 쿠키 등을 공유하지 않음.
  // <중요> puppeteer.launch({headless:true}) 설정해야 context.close()로 브라우저 데이터 지울 수 있음.
  while (true) {
    const context = await browser.createIncognitoBrowserContext(); // 시크릿창 열기
    const page = await context.newPage();
    page.setDefaultTimeout(30000); // 마지막번호+1 작품(없음) 조회 시 대기 시간 줄이기

    await login(page);

    await searchByCategory(page, genreNOs);

    await VisitDetailPages(page);

    // 카테고리 전체 조회 완료 시 표시 : 조회 완료 후 시크릿창 한 번 닫기 위해 이 위치에 넣음
    if (!isCategoryLoopEnd) {
      isCategoryLoopEnd = true;
    }
    await context.close(); // 시크릿창 닫기
    if (totalNovelNO < currentNovelNO) break; // 전체 작품 조회 완료 후 브라우저 닫기
  }
  await browser.close();
}
