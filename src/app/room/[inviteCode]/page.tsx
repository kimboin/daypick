import Link from "next/link";
import { notFound } from "next/navigation";
import { SharePanel } from "@/components/share-panel";
import { formatDisplayDate } from "@/lib/date";
import { getRoomResults } from "@/lib/storage";

type Props = {
  params: Promise<{ inviteCode: string }>;
  searchParams: Promise<{ created?: string }>;
};

export default async function RoomPage({ params, searchParams }: Props) {
  const { inviteCode } = await params;
  const { created } = await searchParams;
  const results = await getRoomResults(inviteCode);

  if (!results) {
    notFound();
  }

  return (
    <div className="page-shell">
      <section className="hero-card">
        <span className="eyebrow">Room Result</span>
        <h1 className="hero-title">초대코드 {results.inviteCode}</h1>
        <p className="hero-text">
          방장 <strong>{results.hostName}</strong> 님이 설정한 범위는 {results.startDate}부터 {results.endDate}
          까지입니다. 아래에서 모두 가능한 날짜와 각자 선택한 일정을 확인할 수 있습니다.
        </p>
        <div className="cta-row">
          <Link href="/join" className="button">
            다른 친구 입력하기
          </Link>
          <Link href="/" className="button-secondary">
            첫 화면으로
          </Link>
        </div>
      </section>

      <div style={{ marginTop: 20 }}>
        <SharePanel inviteCode={results.inviteCode} created={created === "1"} />
      </div>

      <div className="layout-grid">
        <div className="stack" style={{ flexDirection: "column" }}>
          <section className="summary-card">
            <h3>모두 가능한 날짜</h3>
            {results.commonDates.length > 0 ? (
              <div className="tag-list">
                {results.commonDates.map((date) => (
                  <span key={date} className="tag highlight">
                    {formatDisplayDate(date)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="section-text">아직 모두가 겹치는 날짜는 없습니다.</p>
            )}
          </section>

          <section className="summary-card">
            <h3>날짜별 가능 인원</h3>
            <div className="tag-list">
              {results.rankedDates.map((entry) => (
                <span key={entry.date} className="rank-tag">
                  {formatDisplayDate(entry.date)} · {entry.count}명
                </span>
              ))}
            </div>
          </section>
        </div>

        <aside className="summary-card">
          <h3>참여 현황</h3>
          <p className="subtle">총 {results.participants.length}명 참여</p>
          <div className="participant-list" style={{ marginTop: 12 }}>
            {results.participants.map((participant) => (
              <span key={participant.id} className="tag">
                {participant.nickname}
                {participant.isHost ? " (방장)" : ""}
              </span>
            ))}
          </div>
        </aside>
      </div>

      <section className="panel" style={{ marginTop: 20 }}>
        <h2>참여자별 가능한 날짜</h2>
        <div className="participant-grid">
          {results.participants.map((participant) => (
            <article key={participant.id} className="participant-card">
              <h3>
                {participant.nickname}
                {participant.isHost ? " (방장)" : ""}
              </h3>
              <div className="tag-list">
                {participant.availableDates.map((date) => (
                  <span key={date} className="tag">
                    {formatDisplayDate(date)}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
