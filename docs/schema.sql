-- ============================================
-- 미니홈피 DB 스키마 (MariaDB)
-- ============================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- --------------------------------------------
-- 1. 회원 테이블
-- --------------------------------------------
CREATE TABLE users (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NULL,              -- OAuth 사용자는 NULL
    nickname        VARCHAR(50) NOT NULL UNIQUE,
    profile_image   VARCHAR(500) NULL,
    bio             TEXT NULL,
    role            ENUM('admin', 'user') DEFAULT 'user',
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at   DATETIME NULL,

    INDEX idx_users_email (email),
    INDEX idx_users_nickname (nickname)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------
-- 2. OAuth 계정 연동 테이블
-- --------------------------------------------
CREATE TABLE oauth_accounts (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED NOT NULL,
    provider        VARCHAR(50) NOT NULL,           -- 'kakao', 'naver', 'google'
    provider_id     VARCHAR(255) NOT NULL,          -- OAuth 제공자의 사용자 ID
    access_token    TEXT NULL,
    refresh_token   TEXT NULL,
    expires_at      DATETIME NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_oauth_provider (provider, provider_id),
    INDEX idx_oauth_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------
-- 3. 리프레시 토큰 테이블 (세션 관리)
-- --------------------------------------------
CREATE TABLE refresh_tokens (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED NOT NULL,
    token           VARCHAR(500) NOT NULL UNIQUE,
    expires_at      DATETIME NOT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_refresh_user (user_id),
    INDEX idx_refresh_expires (expires_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------
-- 4. 방명록 테이블
-- --------------------------------------------
CREATE TABLE guestbook_entries (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED NULL,              -- 회원
    guest_name      VARCHAR(50) NULL,               -- 비회원용
    guest_password  VARCHAR(255) NULL,              -- 비회원 삭제용 비밀번호
    content         TEXT NOT NULL,
    is_private      BOOLEAN DEFAULT FALSE,          -- 비밀글
    is_deleted      BOOLEAN DEFAULT FALSE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_guestbook_user (user_id),
    INDEX idx_guestbook_created (created_at DESC),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------
-- 5. 게시판 카테고리 테이블
-- --------------------------------------------
CREATE TABLE board_categories (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT NULL,
    sort_order      INT DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_category_slug (slug),
    INDEX idx_category_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 기본 카테고리 삽입
INSERT INTO board_categories (name, slug, description, sort_order) VALUES
('자유게시판', 'free', '자유롭게 이야기를 나눠보세요', 1),
('질문답변', 'qna', '궁금한 점을 질문해주세요', 2),
('정보공유', 'info', '유용한 정보를 공유해주세요', 3);

-- --------------------------------------------
-- 6. 게시글 테이블
-- --------------------------------------------
CREATE TABLE posts (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id     INT UNSIGNED NOT NULL,
    user_id         INT UNSIGNED NULL,
    title           VARCHAR(200) NOT NULL,
    content         MEDIUMTEXT NOT NULL,
    view_count      INT UNSIGNED DEFAULT 0,
    like_count      INT UNSIGNED DEFAULT 0,
    comment_count   INT UNSIGNED DEFAULT 0,
    is_pinned       BOOLEAN DEFAULT FALSE,          -- 공지 고정
    is_private      BOOLEAN DEFAULT FALSE,
    is_deleted      BOOLEAN DEFAULT FALSE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_posts_category (category_id),
    INDEX idx_posts_user (user_id),
    INDEX idx_posts_created (created_at DESC),
    INDEX idx_posts_pinned (is_pinned, created_at DESC),
    FULLTEXT INDEX ft_posts_search (title, content),
    FOREIGN KEY (category_id) REFERENCES board_categories(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------
-- 7. 댓글 테이블 (대댓글 지원)
-- --------------------------------------------
CREATE TABLE comments (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id         INT UNSIGNED NOT NULL,
    user_id         INT UNSIGNED NULL,
    parent_id       INT UNSIGNED NULL,              -- 대댓글용 (NULL이면 일반 댓글)
    content         TEXT NOT NULL,
    depth           TINYINT UNSIGNED DEFAULT 0,     -- 0: 댓글, 1: 대댓글
    like_count      INT UNSIGNED DEFAULT 0,
    is_deleted      BOOLEAN DEFAULT FALSE,          -- soft delete (삭제된 댓글입니다)
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_comments_post (post_id, created_at),
    INDEX idx_comments_user (user_id),
    INDEX idx_comments_parent (parent_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------
-- 8. 일기장 테이블
-- --------------------------------------------
CREATE TABLE diary_entries (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED NOT NULL,
    title           VARCHAR(200) NULL,
    content         TEXT NOT NULL,
    mood            VARCHAR(20) NULL,               -- 'happy', 'sad', 'neutral', 'angry', 'excited'
    weather         VARCHAR(20) NULL,               -- 'sunny', 'cloudy', 'rainy', 'snowy'
    is_public       BOOLEAN DEFAULT FALSE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_diary_user (user_id, created_at DESC),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------
-- 9. 좋아요 테이블
-- --------------------------------------------
CREATE TABLE likes (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED NOT NULL,
    target_type     ENUM('post', 'comment', 'guestbook', 'diary') NOT NULL,
    target_id       INT UNSIGNED NOT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_likes_user_target (user_id, target_type, target_id),
    INDEX idx_likes_target (target_type, target_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------
-- 10. 첨부파일 테이블
-- --------------------------------------------
CREATE TABLE attachments (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED NULL,
    target_type     ENUM('post', 'diary', 'profile', 'guestbook') NULL,
    target_id       INT UNSIGNED NULL,
    original_name   VARCHAR(255) NOT NULL,
    stored_name     VARCHAR(255) NOT NULL,          -- 서버에 저장된 파일명
    file_path       VARCHAR(500) NOT NULL,
    file_size       INT UNSIGNED NULL,
    mime_type       VARCHAR(100) NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_attachments_target (target_type, target_id),
    INDEX idx_attachments_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------
-- 11. 알림 테이블
-- --------------------------------------------
CREATE TABLE notifications (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED NOT NULL,
    type            VARCHAR(50) NOT NULL,           -- 'comment', 'reply', 'like', 'guestbook'
    actor_id        INT UNSIGNED NULL,              -- 알림을 발생시킨 사용자
    target_type     VARCHAR(50) NULL,
    target_id       INT UNSIGNED NULL,
    message         VARCHAR(500) NULL,
    link            VARCHAR(500) NULL,
    is_read         BOOLEAN DEFAULT FALSE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_notifications_user (user_id, is_read, created_at DESC),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------
-- 12. 방문자 기록 테이블
-- --------------------------------------------
CREATE TABLE visitor_logs (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    visitor_ip      VARCHAR(50) NULL,
    user_id         INT UNSIGNED NULL,
    user_agent      VARCHAR(500) NULL,
    page_path       VARCHAR(255) NULL,
    visited_at      DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_visitor_date (visited_at),
    INDEX idx_visitor_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 일별 방문자 통계 테이블
CREATE TABLE visitor_stats (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    visit_date      DATE NOT NULL UNIQUE,
    total_count     INT UNSIGNED DEFAULT 0,
    unique_count    INT UNSIGNED DEFAULT 0,

    INDEX idx_stats_date (visit_date DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------
-- 13. 관리자용 설정 테이블
-- --------------------------------------------
CREATE TABLE site_settings (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    setting_key     VARCHAR(100) NOT NULL UNIQUE,
    setting_value   TEXT NULL,
    description     VARCHAR(255) NULL,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 기본 설정값 삽입
INSERT INTO site_settings (setting_key, setting_value, description) VALUES
('site_title', '나의 미니홈피', '사이트 제목'),
('site_description', 'IT 인프라 엔지니어의 미니홈피입니다', '사이트 설명'),
('allow_guest_guestbook', 'true', '비회원 방명록 작성 허용'),
('bgm_url', NULL, '배경음악 URL'),
('today_count', '0', '오늘 방문자 수'),
('total_count', '0', '총 방문자 수');
