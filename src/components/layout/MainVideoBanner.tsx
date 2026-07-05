/** YouTube 메인 배너 — watch?v=9D3bsg8R1-o */
const YOUTUBE_VIDEO_ID = "9D3bsg8R1-o";

export default function MainVideoBanner() {
  const embedSrc = `https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1`;

  return (
    <section className="main-video-banner" aria-label="메인 소개 영상">
      <div className="main-video-banner-frame">
        <iframe
          className="main-video-banner-embed"
          src={embedSrc}
          title="Nationality Engine 소개 영상"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
      <p className="main-video-banner-caption">
        메인 배너 · YouTube 재생 (음소거 자동재생 · 클릭하여 소리 켜기)
      </p>
    </section>
  );
}
