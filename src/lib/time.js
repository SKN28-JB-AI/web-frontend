// ---------------------------------------------------------------------- //
// 시간 표시 / 소요시간 계산 공용 유틸
// ---------------------------------------------------------------------- //

/** ISO → "2026. 6. 10. 14:03:22" (로컬 시간) */
export function fmtDateTime(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("ko-KR", { hour12: false });
  } catch {
    return iso;
  }
}

/** ISO → "14:03:22" (로컬 시간, 시각만) */
export function fmtTime(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleTimeString("ko-KR", { hour12: false });
  } catch {
    return iso;
  }
}

/** 시작~종료(미종료 시 현재까지) 경과 초. 시작이 없으면 null */
export function elapsedSec(startIso, endIso) {
  if (!startIso) return null;
  const s = new Date(startIso).getTime();
  const e = endIso ? new Date(endIso).getTime() : Date.now();
  if (Number.isNaN(s) || Number.isNaN(e)) return null;
  return Math.max(0, (e - s) / 1000);
}

/** 초 → "1시간 2분 3초" / "2분 3초" / "45초" */
export function fmtDuration(sec) {
  if (sec == null || Number.isNaN(sec)) return "-";
  const t = Math.round(sec);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  if (h > 0) return `${h}시간 ${m}분 ${s}초`;
  if (m > 0) return `${m}분 ${s}초`;
  return `${s}초`;
}
