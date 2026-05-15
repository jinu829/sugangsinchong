package com.example.demo;

// Spring Boot 실행 및 웹 계층에 필요한 라이브러리
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.context.annotation.Bean;

// 세션 관리 (로그인 상태 유지)
import jakarta.servlet.http.HttpSession;

// 날짜/시간, 컬렉션 라이브러리
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

// ──────────────────────────────────────────────
// 애플리케이션 진입점
// Spring Boot를 시작하는 메인 클래스
// ──────────────────────────────────────────────
@SpringBootApplication
public class DemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }

    // 프론트엔드(다른 포트)에서의 요청을 허용하는 CORS 전역 설정
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins("*")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS");
            }
        };
    }
}

// ──────────────────────────────────────────────
// 랭킹 기록 데이터 구조
// 사용자 이름, 남은 시간(초), 완료 시각을 담는다.
// ──────────────────────────────────────────────
class RankingEntry {
    final String username;
    final long remainingSeconds;
    final String completedAt;

    RankingEntry(String username, long remainingSeconds, String completedAt) {
        this.username = username;
        this.remainingSeconds = remainingSeconds;
        this.completedAt = completedAt;
    }
}

// ──────────────────────────────────────────────
// 게임 세션 및 랭킹 관리 (메모리 저장소)
//
// 로그인 시 게임 시작 시각을 기록하고,
// 모든 신청 완료 시 남은 시간을 계산해 랭킹에 저장한다.
// 남은 시간이 많을수록(빠를수록) 높은 순위이다.
// ──────────────────────────────────────────────
class RankingManager {

    // 사용자별 게임 시작 시각 (key: username, value: 시작 LocalDateTime)
    static final Map<String, LocalDateTime> GAME_START_TIMES = new ConcurrentHashMap<>();

    // 완료된 사용자 랭킹 목록 (남은 시간 내림차순 유지)
    static final List<RankingEntry> RANKING = Collections.synchronizedList(new ArrayList<>());

    // 로그인 시 호출 — 게임 시작 시각을 기록한다.
    static void recordStart(String username) {
        GAME_START_TIMES.put(username, LocalDateTime.now());
    }

    // 모든 신청 완료 시 호출 — 남은 시간을 랭킹에 등록한다.
    // 이미 등록된 사용자는 중복 등록하지 않는다.
    // 등록 성공 시 true, 중복이면 false 반환.
    static boolean recordFinish(String username, long remainingSeconds) {
        boolean alreadyRecorded = RANKING.stream().anyMatch(e -> e.username.equals(username));
        if (alreadyRecorded)
            return false;

        String completedAt = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));
        RANKING.add(new RankingEntry(username, remainingSeconds, completedAt));

        // 남은 시간 많은 순(빠를수록 높은 순위)으로 정렬
        RANKING.sort((a, b) -> Long.compare(b.remainingSeconds, a.remainingSeconds));
        return true;
    }
}

// ──────────────────────────────────────────────
// 로그인 컨트롤러
//
// 이름을 입력받아 세션에 저장하고 게임 시작 시각을 기록한다.
// 비밀번호 없이 이름만으로 로그인하는 단순 방식이다.
//
// 흐름:
// 1. 페이지 로드 → GET /api/auth/status 로 로그인 여부 확인
// 2. 미로그인 → POST /api/auth/login 으로 이름 제출
// 3. 로그아웃 → POST /api/auth/logout
// ──────────────────────────────────────────────
@RestController
@RequestMapping("/api/auth")
class AuthController {

    // 세션에 저장할 사용자 키
    static final String SESSION_USER_KEY = "loggedInUser";

    // GET /api/auth/status
    // 현재 세션에 로그인 정보가 있는지 확인한다.
    // 응답 예시 (로그인됨): { "loggedIn": true, "username": "홍길동" }
    // 응답 예시 (미로그인): { "loggedIn": false, "username": null }
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> checkStatus(HttpSession session) {
        String username = (String) session.getAttribute(SESSION_USER_KEY);
        Map<String, Object> result = new HashMap<>();
        result.put("loggedIn", username != null);
        result.put("username", username);
        return ResponseEntity.ok(result);
    }

    // POST /api/auth/login
    // 이름을 받아 세션에 저장하고 게임 시작 시각을 기록한다.
    // 요청 body: { "username": "홍길동" }
    // 성공 응답: { "success": true, "username": "홍길동" }
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestBody Map<String, String> body,
            HttpSession session) {

        String username = body.get("username");

        // 이름이 비어있으면 거부
        if (username == null || username.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", "이름을 입력해주세요."));
        }

        username = username.trim();

        // 세션에 사용자 이름 저장 및 게임 시작 시각 기록
        session.setAttribute(SESSION_USER_KEY, username);
        RankingManager.recordStart(username);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("username", username);
        result.put("message", "로그인 성공");
        return ResponseEntity.ok(result);
    }

    // POST /api/auth/logout
    // 세션을 삭제하여 로그아웃 처리한다.
    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(Map.of("message", "로그아웃 되었습니다."));
    }
}

// ──────────────────────────────────────────────
// 랭킹 컨트롤러
//
// 모든 신청을 끝낸 사용자의 이름과 남은 시간을 랭킹으로 제공한다.
// 기본 URL: /api/ranking
//
// 흐름:
// 1. 프론트엔드가 모든 신청 완료 감지
// 2. POST /api/ranking/submit 으로 남은 시간(초) 전송
// 3. GET /api/ranking 으로 전체 순위 조회
// 4. GET /api/ranking/me 로 내 순위 조회
// ──────────────────────────────────────────────
@RestController
@RequestMapping("/api/ranking")
class RankingController {

    // POST /api/ranking/submit
    // 모든 신청 완료 시 남은 시간을 제출하여 랭킹에 등록한다.
    // 요청 body: { "remainingSeconds": 95 }
    // 성공 응답: { "success": true, "username": "홍길동", "remainingSeconds": 95,
    // "message": "랭킹에 등록되었습니다!" }
    @PostMapping("/submit")
    public ResponseEntity<Map<String, Object>> submitScore(
            @RequestBody Map<String, Object> body,
            HttpSession session) {

        String username = (String) session.getAttribute(AuthController.SESSION_USER_KEY);

        // 로그인 여부 확인
        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "로그인이 필요합니다."));
        }

        // remainingSeconds 값 파싱
        Object rawSeconds = body.get("remainingSeconds");
        if (rawSeconds == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", "remainingSeconds 값이 필요합니다."));
        }

        long remainingSeconds;
        try {
            remainingSeconds = Long.parseLong(rawSeconds.toString());
        } catch (NumberFormatException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", "remainingSeconds는 숫자여야 합니다."));
        }

        // 랭킹 등록 (중복 방지 포함)
        boolean recorded = RankingManager.recordFinish(username, remainingSeconds);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("username", username);
        result.put("remainingSeconds", remainingSeconds);
        result.put("message", recorded ? "랭킹에 등록되었습니다!" : "이미 등록된 기록이 있습니다.");
        return ResponseEntity.ok(result);
    }

    // GET /api/ranking
    // 전체 랭킹을 남은 시간 내림차순으로 반환한다.
    // 응답 예시:
    // [{ "rank": 1, "username": "홍길동", "remainingSeconds": 95, "completedAt":
    // "10:01:05" },
    // { "rank": 2, "username": "이영희", "remainingSeconds": 72, "completedAt":
    // "10:01:28" }]
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getRanking() {
        List<Map<String, Object>> result = new ArrayList<>();
        int rank = 1;

        for (RankingEntry entry : RankingManager.RANKING) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("rank", rank++);
            item.put("username", entry.username);
            item.put("remainingSeconds", entry.remainingSeconds);
            item.put("completedAt", entry.completedAt);
            result.add(item);
        }

        return ResponseEntity.ok(result);
    }

    // GET /api/ranking/me
    // 현재 로그인한 사용자의 순위를 반환한다.
    // 아직 완료하지 않은 경우 rank: -1 을 반환한다.
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getMyRanking(HttpSession session) {
        String username = (String) session.getAttribute(AuthController.SESSION_USER_KEY);

        if (username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "로그인이 필요합니다."));
        }

        List<RankingEntry> ranking = RankingManager.RANKING;
        for (int i = 0; i < ranking.size(); i++) {
            if (ranking.get(i).username.equals(username)) {
                RankingEntry entry = ranking.get(i);
                Map<String, Object> result = new LinkedHashMap<>();
                result.put("rank", i + 1);
                result.put("username", entry.username);
                result.put("remainingSeconds", entry.remainingSeconds);
                result.put("completedAt", entry.completedAt);
                return ResponseEntity.ok(result);
            }
        }

        // 완료 기록 없음
        return ResponseEntity.ok(Map.of(
                "rank", -1,
                "username", username,
                "message", "아직 완료하지 않았습니다."));
    }
}
