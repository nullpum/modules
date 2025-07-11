// 동적 모듈 로딩 (loadEval 방식 - 원격 지원)
moduleLoader.loadEval(__script_path + '/utils.js', 'utils');
moduleLoader.loadEval(__script_path + '/common/common.js', 'common');

// 세션 관리를 위한 전역 변수
let pkcEncSsn = "";
let retStr = "";

console.log("getTimeStamp_nts:", getTimeStamp_nts());
print_test("============");

// CMS 서명 테스트
function hometaxLogin(inputObj) {
    console.log('Starting CMS signature test...');
    try {
        // 인증서와 개인키 로드
        console.log('Loading certificate and key files...');
        //const certData = file.readBinaryWithOption(__script_path + "/nullpum.der", "base64").replaceAll("\n","");
        //const keyData = file.readBinaryWithOption(__script_path + "/nullpum.key", "base64").replaceAll("\n","");
        //const password = "nfriend!2021";

        const certData = inputObj.cert_der;
        const keyData = inputObj.key_der;
        const password = inputObj.cert_pw;

        console.log("\nPOST request...");
        try {
            // 기본 헤더 설정
            const headers = {
                'Connection': 'keep-alive',
                'Accept': 'application/json',
                'Content-Type': 'application/json;charset=UTF-8',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'Accept-Language': 'ko,en;q=0.9,en-US;q=0.8',            
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0'
            };

            const response = http.post(
                "https://hometax.go.kr/wqAction.do?actionId=ATXPPZXA001R01&screenId=UTXPPABA14",
                headers,
                JSON.stringify({})
            );
            
            // 응답을 JSON으로 파싱 시도
            try {
                const jsonResponse = JSON.parse(response.body);
                pkcEncSsn = jsonResponse["pkcEncSsn"];
            } catch (parseError) {
                console.log("Raw Response (hex):", Array.from(response.body).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' '));
            }
        } catch (error) {
            console.error("POST Error:", error);
        }

        if (!certData || !keyData) {
            throw new Error('Failed to load certificate or key files');
        }
        // CMS 서명 수행
        var signData = sign.rsaSign(keyData, password, pkcEncSsn, "BASE64");
        signData = decodeURIComponent(signData);

        var serial = sign.getCertInfo(certData, keyData, password, "SERIAL", "HEX");
        var v_cert = sign.getCertInfo(certData, keyData, password, "DER2PEM", "BASE64");    
        var v_rnd  = sign.getCertInfo(certData, keyData, password, "VID", "BASE64");    

        var v_logstr = pkcEncSsn + "$" + serial.toLowerCase() + "$" + getTimeStamp_nts() + "$" + signData;
        v_logstr = encode.encodeBase64(v_logstr, "UTF-8");

        try {
            var pdata = "";
            pdata += "logSgnt=" + encodeURIComponent(v_logstr);		 
            pdata += "&cert=" + encodeURIComponent(v_cert).replace(/%20/gm, "+");
            pdata += "&randomEnc=" + encodeURIComponent(v_rnd);	 
            pdata += "&pkcLoginYnImpv=Y";
            pdata += "&pkcLgnClCd=04";
            pdata += "&ssoStatus=";
            pdata += "&portalStatus=";
            pdata += "&scrnId=UTXPPABA01";
            pdata += "&userScrnRslnXcCnt=1920";
            pdata += "&userScrnRslnYcCnt=1080";  

            // 헤더 수정
            const headers = {
                'Connection': 'keep-alive',
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Accept-Language': 'ko-KR',            
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0'
            };

            const response = http.post(
                "https://hometax.go.kr/pubcLogin.do?domain=hometax.go.kr&mainSys=Y&" + getTimeStamp_nts(),
                headers,
                pdata
            );
        } catch (error) {
            console.error("POST Error:", error);
        }

        console.log("[홈택스] 회원정보 조회 중입니다.");

        try {
            // 기본 헤더 설정
            const headers = {
                'Connection': 'keep-alive',
                'Accept': 'application/json',
                'Content-Type': 'application/json;charset=UTF-8',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'Accept-Language': 'ko,en;q=0.9,en-US;q=0.8',            
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0'
            };

            const response = http.post(
                "https://www.hometax.go.kr/wqAction.do?actionId=ATXPPAAA001R035&screenId=index&popupYn=false",
                headers,
                JSON.stringify({})
            );
            
            console.log("Response Body Length:", response.body.length);
            console.log("Response Body ", decodeURIComponent(response.body));
            retStr = decodeURIComponent(response.body)
        } catch (error) {
            console.error("POST Error:", error);
        }

        return retStr;
    } catch (error) {
        console.error('rsaSign Signature Error:', error.message);
        throw error;
    }
}

function main(inputStr) {
    // 입력 문자열을 JSON으로 파싱
    let outputObj = {};
    let inputObj = JSON.parse(inputStr);
    try {
        console.log('Starting hometaxLogin.......:::' + JSON.stringify(inputObj));
        const result = hometaxLogin(inputObj);
        console.log('\nhometaxLogin completed successfully!');
        // JSON 객체를 다시 문자열로 변환
        let output = JSON.stringify(result);
        return output;
    } catch (error) {
        console.error('Test execution failed:', error.message);
        let output = JSON.stringify(outObj);
        return output;
    }
}

globalThis.main = main;