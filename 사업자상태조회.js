// 사업자상태조회.js - 홈택스 사업자등록상태 조회 (휴폐업 확인)
// 로그인 없이 사업자번호만으로 조회 가능한 공개 API
//
// 실행:
//   nps 사업자상태조회.js                          (대화형 - 사업자번호 직접 입력)
//   nps --in input.json --start 사업자상태조회.js   (JSON 입력)
//
// input.json 예시:
//   { "bizNo": "1234567890" }              - 단건 조회
//   { "bizNo": "1234567890,0987654321" }   - 복수 조회 (쉼표 구분)
//
// 출력:
//   taxSt     : 00(정상), 01(폐업), 02(휴업), 90(미등록)
//   taxTypeCd : 01(일반), 02(간이), 03(면세), 06(비영리), 07(과특), 12(간이-세금계산서발급), 90(기타), 99(오류)

// 공통 유틸리티 로드
moduleLoader.loadEval("vm_test/nps_script/hometax/hometax_utils.js", "hometax_utils");

function startEngine(paramStr) {
    var inJson = {};
    try { inJson = JSON.parse(paramStr || "{}"); } catch(e) {}

    // 사업자번호 필수 체크
    var bizNoInput = inJson.bizNo || "";
    if (!bizNoInput) {
        return JSON.stringify({
            errYn: "Y",
            errMsg: "사업자번호(bizNo)를 입력해주세요. 예: {\"bizNo\":\"1234567890\"}"
        });
    }

    // 사업자번호 배열 파싱 (유틸 함수 사용)
    var arrBizNo = parseBizNoList(bizNoInput);

    if (arrBizNo.length === 0) {
        return JSON.stringify({ errYn: "Y", errMsg: "유효한 사업자번호가 없습니다." });
    }

    // ========== 설정 ==========
    var API_URL = "https://teht.hometax.go.kr/wqAction.do?actionId=ATTABZAA001R08&screenId=UTEABAAA13&popupYn=false&realScreenId=";
    var headers = {
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "ko,en;q=0.9,en-US;q=0.8",
        "Content-Type": "application/json;charset=UTF-8",
        "Referer": "https://hometax.go.kr/websquare/websquare.html?w2xPath=/ui/pp/index_pp.xml&tmIdx=47&tm2lIdx=4712080000&tm3lIdx=4712080100",
        "Host": "teht.hometax.go.kr",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    };

    var outJson = {
        errYn: "N",
        errMsg: "",
        list: []
    };

    console.log("[홈택스] 사업자상태조회 시작 (" + arrBizNo.length + "건)");

    // ========== 사업자번호별 조회 ==========
    for (var i = 0; i < arrBizNo.length; i++) {
        var bizNo = arrBizNo[i];

        if (i % 10 === 0 && arrBizNo.length > 1) {
            console.log("[홈택스] 조회중... (" + (i + 1) + "/" + arrBizNo.length + ")");
        }

        var out = {
            bizNo: bizNo,
            taxSt: "",
            taxTypeCd: "",
            taxTypeNm: "",
            closeDt: "",
            changeDt: "",
            searchDt: "",
            trtCntn: "",
            error: ""
        };

        try {
            // 요청 데이터 구성
            var postData = JSON.stringify({
                dongCode: "88",
                inqrTrgtClCd: "1",
                mobYn: "N",
                psbSearch: "Y",
                pubcUserNo: "",
                txprDscmNo: bizNo,
                userReqInfoVO: {}
            });

            // API 호출
            var res = http.post(API_URL, headers, postData);

            if (res.status !== 200) {
                out.taxTypeCd = "99";
                out.taxTypeNm = "오류";
                out.error = "HTTP " + res.status;
                outJson.list.push(out);
                continue;
            }

            var rdJson = JSON.parse(res.body);

            // 응답 파싱
            if (rdJson.resultMsg && rdJson.resultMsg.result &&
                rdJson.resultMsg.result.toUpperCase() === "S") {

                var trtCntn = rdJson.trtCntn || "";
                out.trtCntn = trtCntn;

                // 상태 판별 (유틸 함수 사용)
                var status = parseBizStatus(trtCntn);
                out.taxSt = status.st;
                out.closeDt = status.closeDt;

                if (status.st === "90") {
                    out.taxTypeNm = status.nm;
                    out.error = trtCntn;
                } else {
                    // 과세유형 판별 (유틸 함수 사용)
                    var taxType = parseTaxType(trtCntn);
                    out.taxTypeCd = taxType.cd;
                    out.taxTypeNm = taxType.nm;

                    // 전환일자 추출 (유틸 함수 사용)
                    out.changeDt = parseChangeDt(trtCntn);
                }
            }
            else {
                out.taxTypeCd = "99";
                out.taxTypeNm = "오류";
                out.error = "API 응답 오류: " + (rdJson.resultMsg ? rdJson.resultMsg.result : "unknown");
            }

        } catch (e) {
            out.taxTypeCd = "99";
            out.taxTypeNm = "오류";
            out.error = e.message;
        }

        // 조회일자 (유틸 함수 사용)
        out.searchDt = getToday();

        outJson.list.push(out);

        // 콘솔 출력 (유틸 함수 사용)
        console.log("[" + bizNo + "] " + getStatusText(out.taxSt, out.closeDt) + " / " + out.taxTypeNm + (out.error ? " / " + out.error : ""));
    }

    // 단건 조회 시 out 필드 추가 (하위 호환)
    if (outJson.list.length === 1) {
        outJson.out = outJson.list[0];
    }

    // 오류 건 체크
    var errorCount = 0;
    for (var j = 0; j < outJson.list.length; j++) {
        if (outJson.list[j].taxSt === "90" || outJson.list[j].taxTypeCd === "99") {
            errorCount++;
        }
    }
    if (errorCount > 0 && errorCount === outJson.list.length) {
        outJson.errYn = "Y";
        outJson.errMsg = outJson.list[0].error || outJson.list[0].trtCntn || "조회 실패";
    }

    console.log("\n[홈택스] 사업자상태조회 완료 (" + outJson.list.length + "건)");

    return JSON.stringify(outJson);
}

// --start 옵션 호환
var startProcess = startEngine;

// 직접 실행 시 (nps 사업자상태조회.js)
function main(input) {
    var inJson = {};
    try { inJson = JSON.parse(input || "{}"); } catch(e) {}

    // 사업자번호가 없으면 샘플로 안내
    if (!inJson.bizNo) {
        console.log("========================================");
        console.log("  홈택스 사업자등록상태 조회 (휴폐업 확인)");
        console.log("========================================");
        console.log("");
        console.log("사용법:");
        console.log("  nps --in '{\"bizNo\":\"1234567890\"}' --start 사업자상태조회.js");
        console.log("");
        console.log("복수 조회:");
        console.log("  nps --in '{\"bizNo\":\"1234567890,0987654321\"}' --start 사업자상태조회.js");
        console.log("");
        console.log("출력 필드:");
        console.log("  taxSt     : 00(정상), 01(폐업), 02(휴업), 90(미등록)");
        console.log("  taxTypeCd : 01(일반), 02(간이), 03(면세), 06(비영리)");
        console.log("             07(과특), 12(간이-세금계산서), 90(기타), 99(오류)");
        console.log("");
        return;
    }

    var result = startEngine(input);
    var resultJson = JSON.parse(result);

    console.log("\n========== 조회 결과 ==========");
    console.log(JSON.stringify(resultJson, null, 2));

    return result;
}
