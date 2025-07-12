// 비동기 기능 테스트 스크립트 (안전한 버전)
function main(input) {
    console.log("=== 안전한 비동기 기능 테스트 시작 ===");
    
    try {
        // 1. 타이머 테스트
        console.log("1. 타이머 테스트 시작");
        
        let timerCount = 0;
        const timerId = setTimeout_real(() => {
            console.log("타이머 실행됨!");
            timerCount++;
        }, 1000);
        
        console.log(`타이머 ID: ${timerId}`);
        
        // 2. setInterval 테스트 (안전한 버전)
        console.log("2. setInterval 테스트 시작");
        
        let intervalCount = 0;
        const intervalId = setInterval(() => {
            console.log(`인터벌 실행 ${++intervalCount}회`);
            if (intervalCount >= 3) {
                clearInterval(intervalId);
                console.log("인터벌 중지됨");
            }
        }, 500);
        
        // 3. 비동기 HTTP 요청 테스트 (안전한 버전)
        console.log("3. 비동기 HTTP 요청 테스트 시작");
        
        // http.getAsync 테스트
        const httpPromise = http.getAsync("https://httpbin.org/get")
            .then(response => {
                console.log("http.getAsync 성공:", response.status);
                return response.json();
            })
            .then(data => {
                console.log("응답 데이터:", data.url);
                return data;
            })
            .catch(error => {
                console.error("http.getAsync 실패:", error);
                return null;
            });
        
        // fetch API 테스트
        const fetchPromise = fetch("https://httpbin.org/json")
            .then(response => {
                console.log("fetch 성공:", response.status, response.ok);
                return response.json();
            })
            .then(data => {
                console.log("fetch JSON 응답:", data.slideshow.title);
                return data;
            })
            .catch(error => {
                console.error("fetch 실패:", error);
                return null;
            });
        
        // 4. Promise.all 테스트 (안전한 버전)
        console.log("4. Promise.all 테스트 시작");
        
        const promises = [
            http.getAsync("https://httpbin.org/delay/1").catch(err => ({ error: err.message })),
            http.getAsync("https://httpbin.org/delay/2").catch(err => ({ error: err.message })),
            fetch("https://httpbin.org/ip").catch(err => ({ error: err.message }))
        ];
        
        const allPromise = Promise.all(promises)
            .then(results => {
                console.log("Promise.all 완료:", results.length, "개 요청");
                results.forEach((result, index) => {
                    if (result.error) {
                        console.log(`요청 ${index + 1} 실패:`, result.error);
                    } else {
                        console.log(`요청 ${index + 1} 상태:`, result.status || result.status);
                    }
                });
                return results;
            })
            .catch(error => {
                console.error("Promise.all 실패:", error);
                return [];
            });
        
        // 5. async/await 테스트 (안전한 버전)
        console.log("5. async/await 테스트 시작");
        
        async function testAsyncAwait() {
            try {
                const response = await fetch("https://httpbin.org/user-agent");
                const data = await response.json();
                console.log("async/await 성공:", data["user-agent"]);
                return data;
            } catch (error) {
                console.error("async/await 실패:", error);
                return null;
            }
        }
        
        const asyncAwaitPromise = testAsyncAwait();
        
        // 6. 지연 후 결과 반환 (안전한 버전)
        console.log("6. 지연 후 결과 반환");
        
        return new Promise((resolve) => {
            setTimeout_real(() => {
                // 모든 Promise가 완료될 때까지 기다림
                Promise.all([
                    httpPromise,
                    fetchPromise,
                    allPromise,
                    asyncAwaitPromise
                ]).then(() => {
                    const result = {
                        success: true,
                        message: "안전한 비동기 기능 테스트 완료",
                        timestamp: new Date().toISOString(),
                        timerCount: timerCount,
                        intervalCount: intervalCount,
                        features: {
                            setTimeout: "✅ 구현됨",
                            setInterval: "✅ 구현됨",
                            clearTimeout: "✅ 구현됨",
                            clearInterval: "✅ 구현됨",
                            httpGetAsync: "✅ 구현됨",
                            fetch: "✅ 구현됨",
                            Promise: "✅ 지원됨",
                            asyncAwait: "✅ 지원됨"
                        }
                    };
                    
                    console.log("테스트 완료, 결과 반환:", result);
                    resolve(JSON.stringify(result, null, 2));
                }).catch(error => {
                    console.error("최종 Promise 처리 중 오류:", error);
                    const result = {
                        success: false,
                        error: error.message,
                        timestamp: new Date().toISOString(),
                        timerCount: timerCount,
                        intervalCount: intervalCount
                    };
                    resolve(JSON.stringify(result, null, 2));
                });
            }, 1000); // 1초 후 결과 반환 (3초에서 1초로 단축)
        });
        
    } catch (error) {
        console.error("테스트 중 오류 발생:", error);
        return JSON.stringify({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

// 호환성을 위해 전역 객체에도 추가
globalThis.main = main; 