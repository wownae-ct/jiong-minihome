#!/bin/bash
# disk-monitor.sh - 디스크 사용량 모니터링 및 자동 정리
#
# 설치:
#   chmod +x /opt/scripts/disk-monitor.sh
#   crontab -e → */30 * * * * /opt/scripts/disk-monitor.sh
#
# 동작:
#   - 80% 이상: 경고 로그 기록 + Docker 디스크 상세 정보
#   - 90% 이상: 긴급 자동 정리 (댕글링 이미지, 빌드 캐시)

THRESHOLD_WARN=80
LOG_MAX_SIZE=10485760  # 10MB
THRESHOLD_CRITICAL=90
MOUNT_POINT="/"
LOG_FILE="/var/log/disk-monitor.log"

# 로그 파일 크기 제한 (10MB 초과 시 로테이션)
if [ -f "${LOG_FILE}" ]; then
    LOG_SIZE=$(stat -c%s "${LOG_FILE}" 2>/dev/null || echo 0)
    if [ "${LOG_SIZE}" -gt "${LOG_MAX_SIZE}" ]; then
        mv "${LOG_FILE}" "${LOG_FILE}.old"
    fi
fi

USAGE=$(df "${MOUNT_POINT}" | awk 'NR==2 {print $5}' | sed 's/%//')
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

if [ "${USAGE}" -ge "${THRESHOLD_WARN}" ]; then
    echo "[${TIMESTAMP}] WARNING: Disk usage at ${USAGE}% (threshold: ${THRESHOLD_WARN}%)" >> "${LOG_FILE}"

    # Docker 디스크 상세 정보 기록
    echo "[${TIMESTAMP}] Docker disk usage:" >> "${LOG_FILE}"
    docker system df >> "${LOG_FILE}" 2>&1

    # 이미지 크기 순 상위 10개 기록
    echo "[${TIMESTAMP}] Top images by size:" >> "${LOG_FILE}"
    docker images --format "{{.Repository}}:{{.Tag}}\t{{.Size}}" \
        | sort -k2 -h -r \
        | head -10 >> "${LOG_FILE}" 2>&1

    # 90% 이상이면 긴급 정리
    if [ "${USAGE}" -ge "${THRESHOLD_CRITICAL}" ]; then
        echo "[${TIMESTAMP}] CRITICAL: Running emergency cleanup (${USAGE}%)" >> "${LOG_FILE}"
        docker image prune -f >> "${LOG_FILE}" 2>&1
        docker builder prune --force --keep-storage 1gb >> "${LOG_FILE}" 2>&1

        USAGE_AFTER=$(df "${MOUNT_POINT}" | awk 'NR==2 {print $5}' | sed 's/%//')
        echo "[${TIMESTAMP}] After cleanup: ${USAGE_AFTER}%" >> "${LOG_FILE}"
    fi
fi
