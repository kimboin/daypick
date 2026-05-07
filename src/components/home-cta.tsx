import Link from "next/link";

export function HomeCta() {
  return (
    <div className="page-shell">
      <section className="hero-card">
        <span className="eyebrow">Group Schedule Matcher</span>
        <h1 className="hero-title">친구들이랑 약속 날짜, 한 번에 맞추기</h1>
        <p className="hero-text">
          방장이 날짜 범위를 정하고 초대코드를 공유하면, 모두가 가능한 날짜가 자동으로 모입니다.
          채팅방에서 날짜를 하나씩 물어볼 필요 없이 겹치는 후보만 바로 볼 수 있습니다.
        </p>
        <div className="cta-row">
          <Link href="/create" className="button">
            초대코드 만들기
          </Link>
          <Link href="/join" className="button-secondary">
            초대코드 입력
          </Link>
        </div>
      </section>
    </div>
  );
}
