// hometax_utils.js - 홈택스 공통 유틸리티
// moduleLoader.loadEval("./hometax_utils.js", "hometax_utils") 로 로드

// 오늘 날짜 (YYYYMMDD)
function getToday() {
    var now = new Date();
    var y = now.getFullYear();
    var m = ("0" + (now.getMonth() + 1)).slice(-2);
    var d = ("0" + now.getDate()).slice(-2);
    return "" + y + m + d;
}

// 사업자번호 포맷 (하이픈 제거, 10자리)
function cleanBizNo(bizNo) {
    return (bizNo || "").trim().replace(/-/g, "");
}

// 사업자번호 배열 파싱 (쉼표 구분 지원)
function parseBizNoList(bizNoInput) {
    return (bizNoInput || "").split(",").map(function(s) {
        return cleanBizNo(s);
    }).filter(function(s) {
        return s.length > 0;
    });
}

// 과세유형 판별
function parseTaxType(trtCntn) {
    if (trtCntn.indexOf("부가가치세 일반과세자") > -1) {
        return { cd: "01", nm: "부가가치세 일반과세자" };
    }
    if (trtCntn.indexOf("부가가치세 간이과세자") > -1) {
        if (trtCntn.indexOf("세금계산서 발급사업자") > -1) {
            return { cd: "12", nm: "간이과세자(세금계산서발급)" };
        }
        return { cd: "02", nm: "부가가치세 간이과세자" };
    }
    if (trtCntn.indexOf("부가가치세 면세사업자") > -1) {
        return { cd: "03", nm: "부가가치세 면세사업자" };
    }
    if (trtCntn.indexOf("부가가치세 과특사업자") > -1 ||
        trtCntn.indexOf("부가가치세 과세특례자") > -1) {
        return { cd: "07", nm: "부가가치세 과세특례자" };
    }
    if (trtCntn.indexOf("고유번호가 부여된 단체") > -1) {
        return { cd: "06", nm: "비영리법인" };
    }
    return { cd: "90", nm: "기타유형" };
}

// 휴폐업 상태 판별
function parseBizStatus(trtCntn) {
    if (trtCntn === "사업을 하지 않고 있습니다." ||
        trtCntn === "국세청에 등록되지 않은 사업자등록번호입니다.") {
        return { st: "90", nm: "미등록사업자", closeDt: "" };
    }
    if (trtCntn.indexOf("폐업자") > -1) {
        var closeDt = "";
        if (trtCntn.indexOf("폐업일자:") > -1) {
            closeDt = trtCntn.split("폐업일자:")[1].split(")")[0].replace(/-/g, "");
        }
        return { st: "01", nm: "폐업", closeDt: closeDt };
    }
    if (trtCntn.indexOf("휴업자") > -1) {
        return { st: "02", nm: "휴업", closeDt: "" };
    }
    return { st: "00", nm: "정상영업", closeDt: "" };
}

// 전환일자 추출
function parseChangeDt(trtCntn) {
    if (trtCntn.indexOf("전환된 날짜는") > -1) {
        return trtCntn.split("전환된 날짜는")[1].split(" 입니다.")[0]
            .replace(/ /g, "").replace(/년/g, "").replace(/월/g, "").replace(/일/g, "").trim();
    }
    if (trtCntn.indexOf("가능한 날짜는") > -1) {
        return trtCntn.split("가능한 날짜는")[1].split(" 부터입니다.")[0]
            .replace(/ /g, "").replace(/년/g, "").replace(/월/g, "").replace(/일/g, "").trim();
    }
    return "";
}

// 상태코드 → 표시 텍스트
function getStatusText(taxSt, closeDt) {
    switch (taxSt) {
        case "00": return "정상영업";
        case "01": return "폐업 (" + (closeDt || "") + ")";
        case "02": return "휴업";
        case "90": return "미등록";
        default:   return "오류";
    }
}
