import puppeteer, { ElementHandle } from "puppeteer";
import dotenv from "dotenv";
import { setNovel } from "../../services/novels";
import getCurrentTime from "./getCurrentTime";

dotenv.config(); // 여기(이 명령어를 실행한 파일)에서만 환경변수 사용 가능

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

interface SystemError {
  name: string;
}

// 공유하기 카카페용------------------------------------------------------------------------------------------------//
async function shareKakape(inputUrl: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage(); // 창 열기
  page.setDefaultTimeout(10000); // 대기 시간 줄이기

  await page.goto("https://page.kakao.com/main"); // 카카오페이지 이동

  // 카카페 로그인 바로 하기 : 작품url 이동 시 로그인이 필요한 작품은 바로 홈으로 가기 때문
  const loginBtn = (await page.waitForSelector(
    "#kpw-header > div > div > button > div:nth-child(3)",
  )) as ElementHandle<HTMLDivElement>; // wait object load
  // loginBtn null error handling
  if (!loginBtn) {
    throw new Error("login 버튼 null 에러");
  }

  const newPagePromise = new Promise((x) => page.once("popup", x)); // declare promise for popup event

  await loginBtn.click(); // click, a new tab/window opens
  const newPage = (await newPagePromise) as puppeteer.Page; // declare new tab/window, now you can work with it

  // -카카페 회원정보 입력
  // set id, pw
  let kakaoID: string;
  let kakaoPW: string;
  // handle undefined env variable
  if (process.env.KAKAO_ID) {
    kakaoID = process.env.KAKAO_ID;
  } else {
    throw new Error("KAKAO_ID env is not set");
  }
  if (process.env.KAKAO_PW) {
    kakaoPW = process.env.KAKAO_PW;
  } else {
    throw new Error("KAKAO_PW env is not set");
  }

  const idElement = await newPage.waitForSelector("#id_email_2");
  await newPage.evaluate((kakaoID, idElement) => (idElement.value = kakaoID), kakaoID, idElement); // email
  const pwElement = await newPage.waitForSelector("#id_password_3");
  await newPage.evaluate((kakaoPW, pwElement) => (pwElement.value = kakaoPW), kakaoPW, pwElement); // password
  await newPage.click(
    "#login-form > fieldset > div.set_login > div > label > span.ico_account.ico_check",
  ); // check 로그인상태유지
  await newPage.click("#login-form > fieldset > div.wrap_btn > button.btn_g.btn_confirm.submit"); // submit

  // -----------------------------------------------------------------------------------------//

  // url 확인 : 직행 url 또는 간접 url (via공유하기 : 그 중 url 복사 눌러도 url만 나오지는 않음)
  const directUrl = "page.kakao.com/home?seriesId=";
  const indirectUrl = "link-page.kakao.com/goto_view?series_id=";
  if (!(inputUrl.includes(directUrl) || inputUrl.includes(indirectUrl))) {
    throw new Error("주소가 올바르지 않아요.");
  }

  // set url : 간접 url은 작품 번호를 잘라내어 직접 url로 만들기
  let novelUrl = inputUrl;
  if (inputUrl.includes(indirectUrl)) {
    novelUrl = `https://${directUrl}${inputUrl.slice(
      inputUrl.indexOf(indirectUrl) + indirectUrl.length,
      inputUrl.indexOf("&referrer"),
    )}`;
  }
  novelInfo.novelUrl = novelUrl;

  try {
    console.log(novelUrl, "novelurl");
    await new Promise((resolve) => setTimeout(resolve, 1500)); // 새창에서 로그인 완료할 때까지 대기
    // 작품페이지 이동
    await page.goto(novelUrl);

    page.setDefaultTimeout(3000); // 대기 시간 줄이기
    await page.waitForSelector(
      "#root > div.jsx-885677927.mainContents.mainContents_pc.hiddenMenuContent > div > div > div.css-sgpdfd > div > div.css-1y42t5x > img",
    );
  } catch {
    // 타임아웃 에러 시 주소 오류
    try {
      await page.waitForSelector("#login_id");
    } catch (error) {
      const err = error as SystemError;
      if (err.name === "TimeoutError") {
        throw new Error("주소가 올바르지 않아요"); // 오류 표시 후 실행 종료
      }
    }
  }
  page.setDefaultTimeout(10000); // 대기 시간 원래대로

  // 작품 정보 읽기
  // get img
  const imgElement = await page.waitForSelector(
    "#root > div.jsx-885677927.mainContents.mainContents_pc.hiddenMenuContent > div > div > div.css-sgpdfd > div > div.css-1y42t5x > img",
  );
  const _imgUrl = await page.evaluate((imgElement) => imgElement.getAttribute("src"), imgElement);

  novelInfo.novelImg = _imgUrl.slice(0, _imgUrl.indexOf("&filename=th1"));

  // get title
  const titleElement = await page.waitForSelector(
    "#root > div.jsx-885677927.mainContents.mainContents_pc.hiddenMenuContent > div > div > div.css-sgpdfd > div > div.css-1ydjg2i > div.css-4cffwv > h2",
  );
  novelInfo.novelTitle = await page.evaluate(
    (titleElement) => titleElement.innerText,
    titleElement,
  );

  // get author
  const authorElement = await page.waitForSelector(
    "#root > div.jsx-885677927.mainContents.mainContents_pc.hiddenMenuContent > div > div > div.css-sgpdfd > div.css-knfhfe > div.css-1ydjg2i > div.css-1nlm7ol > div.css-ymlwac > div:nth-child(2)",
  );
  novelInfo.novelAuthor = await page.evaluate(
    (authorElement) => authorElement.innerText,
    authorElement,
  );

  // get desc, age
  await page.click(
    "#root > div.jsx-885677927.mainContents.mainContents_pc.hiddenMenuContent > div > div > div.css-sgpdfd > div.css-knfhfe > div.css-1ydjg2i > div.css-1nlm7ol > div.css-82j595 > button.css-nxuz68",
  );
  const descElement = await page.waitForSelector(
    "div.jsx-3755015728.descriptionBox.descriptionBox_pc.lineHeight",
  );
  novelInfo.novelDesc = await page.evaluate((descElement) => descElement.innerText, descElement);
  const ageElement = await page.waitForSelector(
    ".modalBody > div > div > table > tbody > tr.jsx-3755015728.first > td.jsx-3755015728.contentCol > div:nth-child(4) > div:nth-child(2)",
  );
  novelInfo.novelAge = await page.evaluate((ageElement) => ageElement.innerText, ageElement);

  // get genre : 로맨스, 로판, 판타지, 현판, 무협
  // 카카페는 BL이 작품소개에 로맨스 분류됨 : 작품제목에 BL이 있으면 장르 나누기
  const genreElement = await page.waitForSelector(
    "div.modalBody > div > div > table > tbody > tr.jsx-3755015728.first > td.jsx-3755015728.contentCol > div:nth-child(2) > div:nth-child(2)",
  );
  const inputGenre = await page.evaluate((genreElement) => genreElement.innerText, genreElement);
  const genre = novelInfo.novelTitle.includes("[BL]")
    ? "BL"
    : inputGenre.includes("로맨스")
    ? "로맨스"
    : inputGenre.includes("로판")
    ? "로판"
    : inputGenre.includes("판타지")
    ? "판타지"
    : inputGenre.includes("현판")
    ? "현판"
    : inputGenre.includes("무협")
    ? "무협"
    : "기타";
  novelInfo.novelGenre = genre;

  await page.click("i.jsx-3114325382.modalClose.modalClose_pc.title > img");

  // get isEnd
  const endElement = await page.waitForSelector(
    "#root > div.jsx-885677927.mainContents.mainContents_pc.hiddenMenuContent > div > div > div.css-sgpdfd > div > div.css-1ydjg2i > div.css-1nlm7ol > div.css-ymlwac > div:nth-child(1)",
  );
  const _isEnd = await page.evaluate((endElement) => endElement.textContent, endElement);
  novelInfo.novelIsEnd = _isEnd.includes("완결");

  // set platform, id
  novelInfo.novelPlatform = "카카오페이지";
  novelInfo.novelId = getCurrentTime();

  console.log(novelInfo);

  // db 저장
  setNovel(novelInfo);

  await browser.close(); // 브라우저 닫기
}

// 공유하기 시리즈용-----------------------------------------------------------------------------//
async function shareSeries(inputUrl: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage(); // 창 열기
  page.setDefaultTimeout(10000); // 대기 시간 줄이기

  // 로그인
  const login = () =>
    new Promise<void>(async (resolve) => {
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

      // 타임아웃 에러 시 주소 오류
      try {
        await page.waitForSelector("#id");
      } catch (error) {
        const err = error as SystemError;
        if (err.name === "TimeoutError") {
          throw new Error("주소가 올바르지 않아요"); // 오류 표시 후 실행 종료
        }
      }
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
      resolve();
    });

  // ----------------------------------------------------------------//

  // 작품 완결 여부 확인 : 작품 검색 페이지에서 작품 제목 옆 완결 표시 확인
  // const checkEnd = (novelTitle: string) => {
  //   return new Promise(async (resolve) => {
  //     // 작품 검색
  //     await page.goto("https://series.naver.com/search/search.series?t=novel&q=" + novelTitle);
  //     console.log(novelTitle, "noveltitle");

  //     const isEnd = await page.evaluate(async (novelTitle) => {
  //       // 검색된 작품 중 일치하는 제목 탐색
  //       let srchIdx = 1;
  //       while (true) {
  //         const targetElement = await page.waitForSelector(
  //           `#content > div.com_srch > div.bs > ul > li:nth-child(${srchIdx.toString()}) > div > h3 > a`,
  //         );
  //         const isTarget = targetElement.innerText.includes(novelTitle + " (");
  //         if (isTarget) break;
  //         else if (srchIdx > 25) {
  //           throw new Error("검색 결과가 1페이지에 없을 수 있습니다");
  //         }
  //         srchIdx += 1;
  //       }
  //       // 완결 여부 반환
  //       return !document
  //         .querySelector(
  //           `#content > div.com_srch > div.bs > ul > li:nth-child(${srchIdx.toString()}) > div > h3 > a`,
  //         )
  //         .innerText.includes("미완결");
  //     }, novelTitle);
  //     novelInfo.novelIsEnd = isEnd;
  //     console.log(isEnd, "isEnd");
  //     resolve();
  //     page.goBack();
  //   });
  // };

  // url 확인 : 직행 url 또는 간접 url (via공유하기)
  if (
    !(
      inputUrl.includes("series.naver.com/novel/detail.series?productNo=") ||
      inputUrl.includes("naver.me/")
    )
  ) {
    throw new Error("주소가 올바르지 않아요.");
  }

  // set url : 간접 url은 url 부분만 잘라내어 넣기
  let novelUrl = inputUrl;
  if (inputUrl.includes("naver.me/")) {
    novelUrl = `https://${inputUrl.slice(inputUrl.indexOf("naver.me/"))}`;
  }
  novelInfo.novelUrl = novelUrl;

  try {
    // 작품페이지 이동
    await page.goto(novelUrl);

    page.setDefaultTimeout(1000); // 대기 시간 줄이기
    await page.waitForSelector("#container > div.aside img");
  } catch (err) {
    // 성인작품일 경우 로그인
    novelInfo.novelAge = "청소년 이용불가";
    await login();
    await new Promise((resolve) => setTimeout(resolve, 500)); // 로그인 후 페이지 리다이렉트 됨. 잠시 대기 후 상세페이지로 이동해야 에러 안 남.
  }
  page.setDefaultTimeout(10000); // 대기 시간 원래대로

  // 상세페이지 정보 읽기
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

  // get isEnd
  const endElement = await page.waitForSelector(
    "#content > ul.end_info > li > ul > li:nth-child(1) > span",
  );
  novelInfo.novelIsEnd = await page.evaluate(
    (endElement) => endElement.innerText === "완결",
    endElement,
  );

  // [방법2] 완결 여부를 검색 페이지에서 확인하기
  // await checkEnd(novelInfo.novelTitle);
  // await page.waitForSelector("#content > div.end_dsc > div:nth-child(1)");

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

  await browser.close();
}

// 공유하기 리디용 : 리디는 직접 작품별 url 넣어야 함. 공유하기 버튼 없음 ------------------//
async function shareRidi(inputUrl: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage(); // 창 열기
  page.setDefaultTimeout(10000); // 대기 시간 줄이기

  // 로그인 : 성인작품일 때 실행
  const login = () =>
    new Promise<void>(async (resolve) => {
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

      // 타임아웃 에러 시 주소 오류
      try {
        await page.waitForSelector("#login_id");
      } catch (error) {
        const err = error as SystemError;
        if (err.name === "TimeoutError") {
          throw new Error("시간초과. 주소가 올바르지 않아요"); // 오류 표시 후 실행 종료
        }
      }

      const idElement = await page.waitForSelector("#login_id");
      await page.evaluate((ridiID, idElement) => (idElement.value = ridiID), ridiID, idElement);
      const pwElement = await page.waitForSelector("#login_pw");
      await page.evaluate((ridiPW, pwElement) => (pwElement.value = ridiPW), ridiPW, pwElement);
      await page.click("#login > form > div > div > label > input[type=checkbox]"); // check 로그인상태유지
      await page.click("#login > form > button"); // submit
      resolve();
    });
  // ----------------------------------------------------------------//

  // url 확인
  let novelUrl;
  if (!inputUrl.includes("ridibooks.com/books/")) {
    throw new Error("주소가 올바르지 않아요.");
  }
  // set url : "?" 부터 문자 제외
  const mainIndx = inputUrl.indexOf("ridibooks.com/books/");
  const filterIdx = inputUrl.indexOf("?");
  let novelNO;
  novelNO =
    filterIdx !== -1 ? inputUrl.slice(mainIndx + 20, filterIdx) : inputUrl.slice(mainIndx + 20);
  novelUrl = `https://ridibooks.com/books/${novelNO}`;
  novelInfo.novelUrl = novelUrl;

  try {
    // 작품페이지 이동
    await page.goto(novelUrl);

    page.setDefaultTimeout(1000); // 대기 시간 줄이기
    await page.waitForSelector(
      "#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_thumbnail_wrap > div.header_thumbnail.book_macro_200.detail_scalable_thumbnail > div > div > div > img",
    );
  } catch (err) {
    // 성인작품일 경우 로그인
    novelInfo.novelAge = "청소년 이용불가";
    await login();
    await new Promise((resolve) => setTimeout(resolve, 500)); // 로그인 후 페이지 리다이렉트 됨. 잠시 대기 후 상세페이지로 이동해야 에러 안 남.
  }
  page.setDefaultTimeout(10000); // 대기 시간 원래대로

  // 상세페이지 정보 읽기
  // get img
  const imgElement = await page.waitForSelector(
    "#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_thumbnail_wrap > div.header_thumbnail.book_macro_200.detail_scalable_thumbnail > div > div > div > img",
  );

  novelInfo.novelImg = await page.evaluate(
    (imgElement) => imgElement.getAttribute("src"),
    imgElement,
  );

  // get isEnd : element의 class에 따라 완결/미완 다름. 표시 없는 작품은 완결로 표시.
  novelInfo.novelIsEnd = await page.evaluate(() => {
    const notEndElement = document.querySelector(
      "#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_info_wrap > div:nth-child(4) > p.metadata.metadata_info_series_complete_wrap > span.metadata_item.not_complete",
    );
    return notEndElement === null;
  });

  // get desc
  const descElement = await page.waitForSelector(
    "article.detail_box_module.detail_introduce_book #introduce_book > p",
  );
  const desc = await page.evaluate((descElement) => {
    // 첫 줄에 제목 + 로맨스 가이드 있을 때 그 부분 제외
    if (
      descElement.children[0].tagName === "SPAN" &&
      descElement.innerText.includes(">\n로맨스 가이드\n\n")
    ) {
      const _idx = descElement.innerText.indexOf(">\n로맨스 가이드\n\n");
      return descElement.innerText.slice(_idx + 11);
    }
    // 첫 줄 제목 제외
    if (
      descElement.children[0].tagName === "SPAN" &&
      (descElement.children.length === 1 || descElement.children[1].tagName !== "IMG")
    ) {
      const _idx = descElement.innerText.indexOf(">\n");
      return descElement.innerText.slice(_idx + 2);
    }
    // 첫 줄에 제목, 둘째 줄에 이미지, 셋째 넷째 비어있을 때 제외
    if (
      descElement.children[0].tagName === "SPAN" &&
      descElement.children[1].tagName === "IMG" &&
      descElement.children[2].tagName === "BR" &&
      descElement.children[3].tagName === "BR"
    ) {
      const _idx = descElement.innerText.indexOf(">\n\n\n");
      return descElement.innerText.slice(_idx + 4);
    }
  }, descElement);

  // get keywords
  const keywords = await page.evaluate(() => {
    const keywordList = document.querySelectorAll(
      "#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_box_module.detail_keyword.js_detail_keyword_module > ul > li",
    );
    let keywords = "";
    filterKeyword: for (let i = 0; i < keywordList.length; i++) {
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
      for (let j = 0; j < exceptKeys.length; j++) {
        if (keyword.includes(exceptKeys[j])) continue filterKeyword;
        if (exceptKeys[j] === exceptKeys[exceptKeys.length - 1]) {
          keywords += `${keyword} `;
        }
      }
    }
    return keywords;
  });

  // set desc only : 기존 작품소개에 키워드가 포함되어 있거나 받아온 키워드가 없다면
  if (desc.includes("#") || desc.includes("키워드") || keywords === "") {
    novelInfo.novelDesc = desc;
  }
  // set desc with keywords
  else {
    novelInfo.novelDesc = `${keywords}\n\n${desc}`;
  }

  // get author
  const authorElement = await page.waitForSelector(
    "#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_info_wrap > div:nth-child(4) > p.metadata.metadata_writer > span > a",
  );
  novelInfo.novelAuthor = await page.evaluate(
    (authorElement) => authorElement.innerText,
    authorElement,
  );
  // get age : 앞서 청불 표시를 안 했으면
  if (novelInfo.novelAge === "") {
    const notiElement = await page.waitForSelector("#notice_component > ul > li");
    const notification = await page.evaluate((notiElement) => notiElement.innerText, notiElement);
    novelInfo.novelAge = notification.includes("15세")
      ? "15세 이용가"
      : notification.includes("12세")
      ? "12세 이용가"
      : "전체 이용가";
  }

  // get genre
  const genreElement = await page.waitForSelector(
    "#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_info_wrap > p",
  );
  const inputGenre = await page.evaluate((genreElement) => genreElement.innerText, genreElement);
  // 찾는 순서 중요 : 로판이 로맨스에, 현판이 판타지 장르에 포함되어 있음
  const genre = inputGenre.includes("로판")
    ? "로판"
    : inputGenre.includes("로맨스")
    ? "로맨스"
    : inputGenre.includes("무협")
    ? "무협"
    : inputGenre.includes("라이트노벨")
    ? "라이트노벨"
    : inputGenre.includes("BL")
    ? "BL"
    : inputGenre.includes("현대") || inputGenre.includes("게임") || inputGenre.includes("스포츠")
    ? "현판"
    : inputGenre.includes("판타지")
    ? "판타지"
    : "기타";
  novelInfo.novelGenre = genre;

  // get title : 장르 BL일 경우 제목 앞에 BL 표시
  const titleElement = await page.waitForSelector(
    "#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_info_wrap > div.info_title_wrap > h3",
  );
  let novelTitle = await page.evaluate((titleElement) => titleElement.innerText, titleElement);
  if (genre === "BL") {
    novelTitle = `[BL] ${novelTitle}`;
  }
  novelInfo.novelTitle = novelTitle;

  // set platform, id
  novelInfo.novelPlatform = "리디북스";
  novelInfo.novelId = getCurrentTime();

  console.log(novelInfo);

  // db 저장
  setNovel(novelInfo);

  await browser.close();
}

//--------------------------------------------------------------------------
// 공유하기 조아라용 : 조아라는 무료 연재작이 많아 사용자들에게는 작품 검색 안 되게 해야할 듯. DB에는 저장해 두더라도..
async function shareJoara(inputUrl: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage(); // 창 열기
  page.setDefaultTimeout(10000); // 대기 시간 줄이기

  // 로그인
  const login = () =>
    new Promise<void>(async (resolve) => {
      // set id, pw
      let joaraID: string;
      let joaraPW: string;
      // handle undefined env variable
      if (process.env.JOARA_ID) {
        joaraID = process.env.JOARA_ID;
      } else {
        throw new Error("JOARA_ID env is not set");
      }
      if (process.env.JOARA_PW) {
        joaraPW = process.env.JOARA_PW;
      } else {
        throw new Error("JOARA_PW env is not set");
      }

      await page.type(
        "#root > div > div > div > div.input-group > input[type=text]:nth-child(1)",
        joaraID,
      );
      await page.type(
        "#root > div > div > div > div.input-group > input[type=password]:nth-child(2)",
        joaraPW,
      );

      await page.click("#root > div > div > div > button"); // submit
      resolve();
    });

  // url 확인 : 직접 또는 간접 url (via공유하기) : "https://www.joara.com/book/1607139" or "http://s.joara.com/1BASN"
  if (!inputUrl.includes("joara.com/")) {
    throw new Error("주소가 올바르지 않아요.");
  }

  // set url
  novelInfo.novelUrl = inputUrl;

  try {
    // 작품페이지 이동
    await page.goto(inputUrl);

    page.setDefaultTimeout(1000); // 대기 시간 줄이기
    await page.waitForSelector(
      // 로그인 안내 창(19세 작품 아니어도 뜸)
      "#root > div > div.modal-background > div > div.contents > button",
    );
  } catch (error) {
    const err = error as SystemError;
    if (err.name === "TimeoutError") {
      throw new Error("시간초과. 주소가 올바르지 않아요"); // 오류 표시 후 실행 종료
    }
  }

  await page.click("#root > div > div.modal-background > div > div.contents > button"); // 로그인 안내 확인
  await login();
  page.setDefaultTimeout(100000); // 대기 시간 원래대로

  // 상세페이지 정보 읽기
  // get img
  const imgElement = await page.waitForSelector(
    "#root > div > div.subpage-container.work-detail > div.content-info > div.content-info-top > div.cover > img",
  );
  novelInfo.novelImg = await page.evaluate(
    (imgElement) => imgElement.getAttribute("src"),
    imgElement,
  );

  // get title
  const titleElement = await page.waitForSelector(
    "#root > div > div.subpage-container.work-detail > div.content-info.mw-work-detail > div.content-info-top > div.detail > div.title > span:nth-child(2)",
  );
  novelInfo.novelTitle = await page.evaluate(
    (titleElement) => titleElement.innerText,
    titleElement,
  );

  // get desc
  try {
    page.setDefaultTimeout(1000);
    const moreDescBtn = await page.waitForSelector(
      "#root > div > div.subpage-container.work-detail > div.content-info.mw-work-detail > div.content-info-bottom > ul > li > div > div.arrow",
    );
    // 더보기 버튼이 있으면 버튼 클릭. 버튼 클릭 전후 element는 동일하나 줄바꿈이 다름.
    if (moreDescBtn !== null) {
      await page.click(
        "#root > div > div.subpage-container.work-detail > div.content-info.mw-work-detail > div.content-info-bottom > ul > li > div > div.arrow",
      );
    }
  } catch (e) {
    console.log(`작품소개 더보기 버튼 없을 경우${e}`);
    page.setDefaultTimeout(10000);
  }
  const descElement = await page.waitForSelector("#book-intro-content");
  const desc = await page.evaluate((descElement) => descElement.innerText, descElement);
  // get keywords
  const keywords = await page.evaluate(() => {
    const keywordList = document.querySelectorAll("#book-keyword-content > div");
    let keywords = "";
    for (let i = 0; i < keywordList.length; i++) {
      const keyword = keywordList[i].textContent;
      keywords += `#${keyword} `;
    }
    return keywords;
  });
  // set desc only : 기존 작품소개에 키워드가 포함되어 있거나 받아온 키워드가 없다면
  if (desc.includes("#") || desc.includes("키워드") || keywords === "") {
    novelInfo.novelDesc = desc;
  }
  // set desc with keywords
  else {
    novelInfo.novelDesc = `${keywords}\n\n${desc}`;
  }

  // get age : 청불 or 전체
  const adultElement = await page.evaluate(
    () =>
      document.querySelector(
        "#root > div > div.subpage-container > div.content-info > div.content-info-top > div.cover > span > img",
      ), // 표지 위 19금 아이콘
  );
  novelInfo.novelAge = adultElement !== null ? "청소년 이용불가" : "전체 이용가";

  // get isEnd : 제목 오른쪽 아이콘 순회하며 완결 아이콘 찾기
  novelInfo.novelIsEnd = await page.evaluate(() => {
    const iconList = document.querySelectorAll(
      "#root > div > div.subpage-container > div.content-info > div.content-info-top > div.detail > div.icon-tag > div > img",
    );
    let isEnd = false;
    for (let i = 0; i < iconList.length; i++) {
      if (
        iconList[i].getAttribute("src") === "https://cf.joara.com/book_icon/mobile_icon_v4_e.png"
      ) {
        isEnd = true;
        break;
      } // 완결 아이콘
    }
    return isEnd;
  });

  // get author
  const authorElement = await page.waitForSelector(
    "#root > div > div.subpage-container > div.content-info > div.content-info-top > div.detail > div.writer > span:nth-child(2)",
  );
  novelInfo.novelAuthor = await page.evaluate(
    (authorElement) => authorElement.innerText,
    authorElement,
  );

  // get genre : 로맨스, 로판, 판타지, 현판, 무협, 미스터리, 라이트노벨, BL
  const genreElement = await page.waitForSelector(
    "#root > div > div.subpage-container > div.content-info > div.content-info-top > div.detail > div.title > span.category",
  );
  const inputGenre = await page.evaluate((genreElement) => genreElement.innerText, genreElement);

  // 찾는 순서 중요 : 로판이 로맨스에, 현판이 판타지 장르에 포함되어 있음
  const genre = inputGenre.includes("패러디")
    ? "패러디"
    : inputGenre.includes("로판")
    ? "로판"
    : inputGenre.includes("로맨스")
    ? "로맨스"
    : inputGenre.includes("게임") || inputGenre.includes("스포츠")
    ? "현판"
    : inputGenre.includes("판타지") || inputGenre.includes("퓨전") || inputGenre.includes("역사")
    ? "판타지"
    : inputGenre.includes("무협")
    ? "무협"
    : inputGenre.includes("라이트노벨")
    ? "라이트노벨"
    : inputGenre.includes("BL")
    ? "BL"
    : `extra|${inputGenre.slice(1, -1)}`; // 장르 구분 안 한 작품은 (extra|받아온장르이름)으로 넣기
  novelInfo.novelGenre = genre;

  // set platform, id
  novelInfo.novelPlatform = "조아라";
  novelInfo.novelId = getCurrentTime();

  console.log(novelInfo);

  // db 저장
  setNovel(novelInfo);

  await browser.close();
}

export { shareKakape, shareSeries, shareRidi, shareJoara };
