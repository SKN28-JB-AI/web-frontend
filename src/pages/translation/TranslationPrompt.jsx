import { PlaceholderPrompt } from "../../components/Placeholder.jsx";

export default function TranslationPrompt() {
  return (
    <PlaceholderPrompt
      title="다국어 변환 (Translation Agent)"
      subtitle="생성된 콘텐츠를 타겟 시장 언어로 자동 현지화합니다."
      placeholder="번역할 콘텐츠 또는 지시를 입력하세요…"
    />
  );
}
