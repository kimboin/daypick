import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-shell">
      <section className="hero-card">
        <span className="eyebrow">Not Found</span>
        <h1 className="hero-title">방을 찾을 수 없습니다</h1>
        <p className="hero-text">초대코드를 다시 확인하거나 새 방을 생성해 주세요.</p>
        <div className="cta-row">
          <Link href="/join" className="button">
            초대코드 입력
          </Link>
          <Link href="/" className="button-secondary">
            첫 화면으로
          </Link>
        </div>
      </section>
    </div>
  );
}
