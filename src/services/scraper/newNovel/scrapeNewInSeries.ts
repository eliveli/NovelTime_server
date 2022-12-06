import puppeteer from "puppeteer";
import dotenv from "dotenv";
import getCurrentTime from "../utils/getCurrentTime";
import { setNovel } from "../../novels";

dotenv.config(); // 여기(이 명령어를 실행한 파일)에서만 환경변수 사용 가능
// require("dotenv").config();

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

// 스크래퍼 시리즈용 (페이지네이션)-----------------------------------------------------------------------------//
export async function scrapeSeries(genreNO: string) {
  const browser = await puppeteer.launch({ headless: true });

  let totalPageNO = 1; // 전체 페이지 수
  let currentPageNO = 1; // 현재 페이지 넘버
  let totalNovelNO = 1; // 전체 작품 수
  let currentNovelNO = 1; // 현재 작품 넘버

  const novelListUrl = `https://series.naver.com/novel/categoryProductList.series?categoryTypeCode=genre&genreCode=${genreNO}&orderTypeCode=new&is&isFinished=true&page=`;

  interface aboutNovel {
    url: string;
    isEnd: boolean;
  }
  // 작품 리스트 : 작품 url, 완결여부 저장
  const novelList: aboutNovel[] = [];

  // 반복. 브라우저 컨텍스트 열고 닫기. out of memory 방지
  // 시크릿창. 캐시나 쿠키 등을 공유하지 않음.
  // <중요> puppeteer.launch({headless:true}) 설정해야 context.close()로 브라우저 데이터 지울 수 있음.
  while (true) {
    const context = await browser.createIncognitoBrowserContext(); // 시크릿창 열기
    const page = await context.newPage();

    await page.goto(novelListUrl + currentPageNO);

    // 총 작품 수 구하기
    const regex = /[^0-9]/g; // 숫자가 아닌 문자열을 선택하는 정규식
    const noElement = await page.waitForSelector("#content > div > div > div.total");
    const _novelNO = await page.evaluate((noElement) => noElement.textContent, noElement);
    totalNovelNO = _novelNO.replace(regex, ""); // 총 작품 수

    // 총 페이지 수 구하기
    const _totalNO: number = Math.floor(totalNovelNO / 25);
    totalPageNO = totalNovelNO % 25 !== 0 ? _totalNO + 1 : _totalNO;

    // console.log(totalPageNO, "totalPageNO", totalNovelNO, "totalNovelNO");

    // 목록 페이지 조회 반복
    while (currentPageNO <= totalPageNO) {
      console.log(currentPageNO, "현재 페이지 번호");

      // 마지막 페이지 작품 수
      let lastPageNovelNO = 1;
      if (currentPageNO === totalPageNO) {
        const lastList = await page.waitForSelector("#content > div > ul");
        lastPageNovelNO = await page.evaluate((lastList) => lastList.childElementCount, lastList);
      }
      // 목록에서 각 작품 정보(url, 완결여부) 가져오기
      for (let novelNO = 1; novelNO < 26; novelNO++) {
        if (currentPageNO === totalPageNO && lastPageNovelNO < novelNO) break;
        // 마지막페이지 작품 수가 25보다 작을 때 루프 탈출

        const urlElement = await page.waitForSelector(
          `#content > div > ul > li:nth-child(${novelNO}) > div > h3 > a`,
        );
        const novelURL = await page.evaluate(
          (urlElement) => urlElement.getAttribute("href"),
          urlElement,
        );

        const endElement = await page.waitForSelector(
          "#content > div > ul > li:nth-child(1) > div > h3 > a",
        );
        const _isEnd = await page.evaluate((endElement) => endElement.innerText, endElement);

        novelList.push({ url: novelURL, isEnd: !_isEnd.includes("미완결") });
        // console.log(novelList[novelNO - 1], "novel", novelNO);
      }

      // 다음 페이지 이동
      currentPageNO += 1;
      if (currentPageNO > totalPageNO) break;
      await page.goto(novelListUrl + currentPageNO);
    }

    // 로그인
    if (currentPageNO > totalPageNO) {
      // -시리즈 회원정보 입력
      // set id, pw
      let seriesID: string;
      let seriesPW: string;
      // handle undefined env variable
      if (process.env.SERIES_ID) {
        seriesID = process.env.SERIES_ID;
      } else {
        throw new Error("SERIES_ID env is not set");
      }
      if (process.env.SERIES_PW) {
        seriesPW = process.env.SERIES_PW;
      } else {
        throw new Error("SERIES_PW env is not set");
      }

      await page.goto("https://nid.naver.com/nidlogin.login");

      const idElement = await page.waitForSelector("#id");
      await page.evaluate(
        (seriesID, idElement) => (idElement.value = seriesID),
        seriesID,
        idElement,
      ); // id
      const pwElement = await page.waitForSelector("#pw");
      await page.evaluate(
        (seriesPW, pwElement) => (pwElement.value = seriesPW),
        seriesPW,
        pwElement,
      ); // password

      await page.click("#login_keep_wrap > div.keep_check > label"); // check 로그인상태유지
      await page.click("#frmNIDLogin > ul > li > div > div.btn_login_wrap"); // submit
      await page.waitForSelector("#frmNIDLogin > fieldset > span.btn_upload");
      await page.click("#frmNIDLogin > fieldset > span.btn_upload");
    }
    // ----------------------------------------------------------------//

    // 작품 상세페이지 조회 반복
    while (currentNovelNO <= totalNovelNO) {
      console.log(currentNovelNO, "currentNovelNO");
      await page.goto(`https://series.naver.com${novelList[currentNovelNO - 1].url}`);

      // 상세페이지 정보 읽기
      try {
        // get img
        const imgElement = await page.waitForSelector("#container > div.aside img");
        novelInfo.novelImg = await page.evaluate(
          (imgElement) => imgElement.getAttribute("src"),
          imgElement,
        );

        // get title : 제목 앞에 추가정보 붙은 경우 제외하고 가져오기
        const titleElement = await page.waitForSelector("#content > div.end_head > h2");
        novelInfo.novelTitle = await page.evaluate((titleElement) => {
          if (titleElement.childNodes.length !== 1) {
            const beforeTitle = titleElement.children[0].innerText;
            return titleElement.innerText.slice(beforeTitle.length);
          }
          return titleElement.innerText;
        }, titleElement);

        // get url, isEnd
        novelInfo.novelUrl = `https://series.naver.com${novelList[currentNovelNO - 1].url}`;
        novelInfo.novelIsEnd = novelList[currentNovelNO - 1].isEnd;

        // get desc : [더보기] 여부에 따라
        const descElement = await page.waitForSelector("#content > div.end_dsc > div:nth-child(1)");
        const _desc = await page.evaluate((descElement) => descElement.innerText, descElement);
        // [더보기] 버튼 있을 때 상세정보 받아오기
        if (_desc.slice(-3) === "더보기") {
          await page.click("#content > div.end_dsc > div:nth-child(1) span > a");
          await page.waitForSelector("#content > div.end_dsc.open > div:nth-last-child(1)");
          const moreDescElement = await page.waitForSelector(
            "#content > div.end_dsc > div:nth-last-child(1)",
          );
          const desc = await page.evaluate(
            (moreDescElement) => moreDescElement.innerText,
            moreDescElement,
          );
          novelInfo.novelDesc = desc.slice(0, -3); // '접기' 글자 제외
        }
        // [더보기] 없을 때 기존 정보 할당
        else {
          novelInfo.novelDesc = _desc;
        }

        // get author
        const authorElement = await page.waitForSelector(
          "#content > ul.end_info > li > ul > li:nth-child(3) > a",
        );
        novelInfo.novelAuthor = await page.evaluate(
          (authorElement) => authorElement.innerText,
          authorElement,
        );
        // get age
        const ageElement = await page.waitForSelector(
          "#content > ul.end_info > li > ul > li:nth-last-child(1)",
        );
        novelInfo.novelAge = await page.evaluate((ageElement) => ageElement.innerText, ageElement);

        // get genre : 로맨스, 로판, 판타지, 현판, 무협, 미스터리, 라이트노벨, BL
        const genreElement = await page.waitForSelector(
          "#content > ul.end_info > li > ul > li:nth-child(2) > span > a",
        );
        novelInfo.novelGenre = await page.evaluate(
          (genreElement) => genreElement.innerText,
          genreElement,
        );

        // set platform, id
        novelInfo.novelPlatform = "네이버 시리즈";
        novelInfo.novelId = getCurrentTime();

        console.log(novelInfo);

        // db 저장
        setNovel(novelInfo);

        currentNovelNO += 1; // 작품 번호 +1

        if (currentNovelNO % 100 === 0) break; // 작품 100번째 마다 loop 탈출. 시크릿창 여닫기
      } catch (err) {
        console.log(`${err} 현재작품: ${currentNovelNO}, 마지막작품: ${totalNovelNO}`);
        // 에러 발생 시 해당 작품은 통과. 시크릿창 여닫으며 다음 작품으로 넘어감
        currentNovelNO += 1; // 작품 번호 +1
        break;
      }
    }
    await context.close(); // 시크릿창 닫기
    if (totalNovelNO < currentNovelNO) break; // 전체 작품 조회 완료 후 루프 탈출
  }
  await browser.close();
}
