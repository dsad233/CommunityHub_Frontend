import { useNavigate } from "react-router-dom";
import "../../styles/common/notFound.css";

export default function NotFound() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    /*
      직접 URL로 404 페이지에 진입했을 때는
      navigate(-1)이 외부 사이트로 이동하거나 이동할 페이지가 없을 수 있어
      홈으로 보내는 fallback을 둡니다.
    */
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/", { replace: true });
  };

  return (
    <main className="not-found-page">
      <section className="not-found-card" aria-labelledby="not-found-title">
        <span className="not-found-badge">PAGE NOT FOUND</span>

        <h1 id="not-found-title">페이지를 찾을 수 없습니다</h1>

        <p className="not-found-description">
          주소가 잘못 입력되었거나, 요청하신 페이지가 이동 또는 삭제되었을 수
          있습니다.
        </p>

        <div className="not-found-actions">
          <button
            type="button"
            className="not-found-button not-found-button--secondary"
            onClick={handleGoBack}
          >
            이전 페이지
          </button>

          <button
            type="button"
            className="not-found-button not-found-button--primary"
            onClick={() => navigate("/", { replace: true })}
          >
            홈으로 이동
          </button>
        </div>

        <p className="not-found-help">
          문제가 계속되면 주소를 다시 확인한 뒤 시도해주세요.
        </p>
      </section>
    </main>
  );
}
