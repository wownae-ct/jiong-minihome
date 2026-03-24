# [5-3] K8s 서비스 전환 작업 기록

**날짜**: 2026-03-24 ~ 2026-03-25
**목표**: docker-compose(VM) → K8s 클러스터로 portfolio-web 서비스 이관

## 완료 항목

### 소스코드 수정
- **profile.ts**: `/uploads/` 상대경로 validation 제거 — S3 URL만 허용하도록 변경
- **docker-compose.yml**: NFS 볼륨 마운트 제거 (`/mnt/nfs_data/uploads`, `/mnt/nfs_data/logs`)
- **Jenkinsfile**: kaniko 빌드에 `MINIO_IMAGE_HOSTNAME`, `MINIO_PUBLIC_URL` build-arg 추가
- **레거시 코드 정리**: `useHashState.ts`, `types/index.ts` 삭제, `Skeleton.tsx` 정리, `.env.example` 업데이트

### 인프라 작업
- **nginx proxy_pass 전환**: `location /` → `http://20.20.20.250:80` (Istio IngressGW)
- **ECR credentials 자동 갱신**: Jenkinsfile에 `Update ECR Secret` 스테이지 추가
- **DB 마이그레이션**: `/uploads/` → MinIO S3 URL 변환 (이전 세션에서 완료 확인)

### 트러블슈팅
1. **_next/image 400 Bad Request**
   - 원인: kaniko 빌드에 MINIO build-arg 미전달 → `remotePatterns`이 `localhost`로 빌드됨
   - 해결: Jenkinsfile에 `--build-arg MINIO_IMAGE_HOSTNAME`, `--build-arg MINIO_PUBLIC_URL` 추가

2. **_next/image 404 Not Found**
   - 원인: Pod에서 `http://jiun2.ddns.net/s3/...` 접근 불가 (nginx port 80 미오픈 + hairpin NAT)
   - 진단: Pod → MinIO 직접(20.20.20.232:9000) OK, Pod → nginx(20.20.20.230:80) Connection Refused
   - 해결 방안 (진행중):
     - CoreDNS hosts override: `jiun2.ddns.net → 20.20.20.230`
     - nginx에 port 80 server 블록 추가 (`/s3/` location, 내부 LAN만 allow)

## 미완료 / 다음 단계
- [ ] CoreDNS override 적용 및 검증
- [ ] nginx port 80 `/s3/` 블록 추가
- [ ] 이미지 로딩 최종 확인
- [ ] E2E 테스트
- [ ] [5-4] VM 정리 및 webhook 재활성화
