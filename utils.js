// 쿠키 저장소
let cookieStore = {};

/**
 * 쿠키 문자열을 파싱하여 저장
 * @param {string} cookieString - Set-Cookie 헤더 값
 */
function parseCookies(cookieString) {
    const cookies = {};
    if (!cookieString) return cookies;
    
    const cookieArr = cookieString.split(';');
    cookieArr.forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
            cookies[name] = value;
            // C++ 쿠키 API를 사용하여 쿠키 설정
            http.setCookie(name, value);
        }
    });
    return cookies;
}

/**
 * 저장된 쿠키를 문자열로 변환
 * @returns {string} 쿠키 문자열
 */
function getCookieString() {
    // C++ 쿠키 API를 사용하여 쿠키 가져오기
    return http.getCookies();
}

// 시간 관련 유틸리티 함수
function getTimeStamp_nts() {
    var d = new Date();
    var s =
        leadingZeros(d.getFullYear(), 4) + '' +
        leadingZeros(d.getMonth() + 1, 2) + '' +
        leadingZeros(d.getDate(), 2) + '' +
        leadingZeros(d.getHours(), 2) + '' +
        leadingZeros(d.getMinutes(), 2) + '' +
        leadingZeros(d.getSeconds(), 2);
    return s;
}

function leadingZeros(n, digits) {
    var zero = '';
    n = n.toString();
    if (n.length < digits) {
        for (var i = 0; i < digits - n.length; i++)
            zero += '0';
    }
    return zero + n;
}

// Base64 인코딩/디코딩 유틸리티
const Base64 = {
    // private property
    _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

    // public method for encoding
    encode : function (input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        while (i < input.length) {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output +
                this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
        }

        return output;
    },

    // public method for decoding
    decode : function (input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {
            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }
        }

        return output;
    }
};

// HTTP 관련 유틸리티 함수
function formatHeaders(headers) {
    if (!headers) return 'No headers';
    return Object.entries(headers)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
}

// JSON 포맷팅 함수
function formatJSON(obj) {
    return JSON.stringify(obj, null, 2);
}

// JSON 파싱 함수
function parseJSON(str) {
    try {
        return JSON.parse(str);
    } catch (e) {
        throw new Error("JSON parse error: " + e.message);
    }
}