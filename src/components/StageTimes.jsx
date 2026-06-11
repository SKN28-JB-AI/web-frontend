import { elapsedSec, fmtDuration, fmtTime } from "../lib/time.js";

/**
 * 파이프라인 단계의 시작 → 완료 시각과 소요시간 한 줄 표시.
 * 진행 중이면 완료 대신 "…", 소요시간은 현재까지 경과로 표시한다.
 */
export function StageTimes({ stage }) {
  if (!stage?.started_at) return <span className="stage-times">-</span>;
  const running = stage.status === "in_progress";
  const sec = stage.duration_sec ?? elapsedSec(stage.started_at, stage.finished_at);
  return (
    <span className="stage-times">
      {fmtTime(stage.started_at)} → {stage.finished_at ? fmtTime(stage.finished_at) : "…"}
      {sec != null && (
        <span className="stage-dur">
          {" "}· {fmtDuration(sec)}{running ? " 경과" : ""}
        </span>
      )}
    </span>
  );
}
