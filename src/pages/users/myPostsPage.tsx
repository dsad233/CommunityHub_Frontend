import { useEffect, useState } from "react";
import "../../styles/users/myPostsPage.css";
import { useNavigate } from "react-router-dom";
import { getVisiblePages, getWithExpiry } from "@src/utils";
import { Loading } from "@src/components";
import Pagination from "@src/components/pagination";

type TMyPost = {
  id: string;
  title: string;
  context: string | null;
  category: {
    key: string;
    name: string;
  };
  isPublic: string;
  createdAt: string;
  count: {
    comments: number;
    likes: number;
    views: number;
  };
};

export type TStatePosts = {
  public: number;
  private: number;
};

export default function MyPostsPage() {
  const navigate = useNavigate();
  const isSession = getWithExpiry("ack");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [writePosts, setWritePosts] = useState<Array<TMyPost>>([]);
  const [count, setCount] = useState<number>(0);
  const [statePosts, setStatePosts] = useState<TStatePosts>({
    public: 0,
    private: 0,
  });
  const [inputSearch, setInputSearch] = useState<string>("");
  const [selectCategory, setSelectCategory] = useState<string>("ALL");
  const [selectIsPublic, setSelectIsPublic] = useState<string>("ALL");
  const [selectOrder, setSelectOrder] = useState<string>("NEW");

  const [page, setPage] = useState<number>(1);
  const [pages, setPages] = useState<number>(10);

  const totalPages = Math.ceil(count / pages);

  const deletePost = async (
    postId: string,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();

    if (!isSession) {
      alert("로그인 후 이용 가능합니다.");
      return;
    }

    const message = confirm("게시글을 삭제하시겠습니까?");

    if (!message) return;

    await fetch(`/api/posts/${encodeURIComponent(postId)}/remove`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${isSession}`,
      },
    })
      .then(async (res) => {
        if (res.status > 200 && res.status < 500) {
          const response = await res.json();
          alert(response.error || response.message);
          setIsLoading(false);
        } else if (res.status >= 500) {
          alert("서버 에러가 발생하였습니다. 잠시 후 다시 시도해주세요.");
          return;
        } else {
          return res;
        }
      })
      .then((res) => {
        if (res?.ok) {
          setIsLoading(false);
          alert("게시글이 삭제 완료 되었습니다.");
          window.location.reload();
          return res;
        }
      });
  };

  useEffect(() => {
    if (!isSession) {
      alert("로그인이 필요한 페이지입니다.");
      navigate("/signin");
      return;
    }

    const requestWritePosts = async () => {
      await fetch(
        `/api/users/write/posts?page=${encodeURIComponent(page)}&pages=${encodeURIComponent(pages)}&search=${encodeURIComponent(inputSearch)}&category=${encodeURIComponent(selectCategory)}&isPublic=${encodeURIComponent(selectIsPublic)}&orderBy=${encodeURIComponent(selectOrder)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${isSession}`,
          },
        },
      )
        .then(async (res) => {
          if (res.status > 200 && res.status < 500) {
            const response = await res.json();
            alert(response.error || response.message);
            setIsLoading(false);
          } else if (res.status >= 500) {
            alert("서버 에러가 발생하였습니다. 잠시 후 다시 시도해주세요.");
            return;
          } else {
            return res;
          }
        })
        .then(async (res) => {
          if (res?.ok) {
            setIsLoading(false);
            const response = await res.json();
            setWritePosts(response.data?.posts);
            setStatePosts(response.data?.countState);
            setPage(response.data?.paginations.page);
            setPages(response.data?.paginations.pages);
            setCount(response.data?.paginations.count);
            return res;
          }
        });
    };

    requestWritePosts();
  }, [
    page,
    pages,
    inputSearch,
    selectCategory,
    selectIsPublic,
    selectOrder,
    isSession,
    navigate,
  ]);

  const visiblePages = getVisiblePages(page, totalPages);

  const handleMovePage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {isLoading ? (
        <Loading />
      ) : (
        <main className="my-posts-page">
          <section className="my-posts-shell">
            <header className="my-posts-hero">
              <div className="my-posts-hero-main">
                <span className="my-posts-badge">MY PAGE</span>
                <h1>내 게시글 전체보기</h1>
                <p>
                  내가 작성한 게시글을 한곳에서 확인하고, 수정하거나 원문으로
                  바로 이동할 수 있어요.
                </p>
              </div>

              <div className="my-posts-summary">
                <div className="summary-card">
                  <strong>
                    {count.toLocaleString("ko-KR", {
                      maximumFractionDigits: 4,
                    })}
                  </strong>
                  <span>전체 게시글</span>
                </div>
                <div className="summary-card">
                  <strong>
                    {statePosts.public.toLocaleString("ko-KR", {
                      maximumFractionDigits: 4,
                    })}
                  </strong>
                  <span>공개 글</span>
                </div>
                <div className="summary-card">
                  <strong>
                    {statePosts.private.toLocaleString("ko-KR", {
                      maximumFractionDigits: 4,
                    })}
                  </strong>
                  <span>비공개 글</span>
                </div>
              </div>
            </header>

            <section className="my-posts-toolbar">
              <div className="toolbar-left">
                <button
                  className={`toolbar-chip ${selectIsPublic === "ALL" ? "active" : ""}`}
                  onClick={() => setSelectIsPublic("ALL")}
                >
                  전체
                </button>

                <button
                  className={`toolbar-chip ${selectIsPublic === "PUBLIC" ? "active" : ""}`}
                  onClick={() => setSelectIsPublic("PUBLIC")}
                >
                  공개
                </button>

                <button
                  className={`toolbar-chip ${selectIsPublic === "PRIVATE" ? "active" : ""}`}
                  onClick={() => setSelectIsPublic("PRIVATE")}
                >
                  비공개
                </button>
              </div>

              <div className="toolbar-right">
                <select
                  aria-label="카테고리 선택"
                  onChange={(e) => setSelectCategory(e.target.value)}
                >
                  <option value="ALL">전체 카테고리</option>
                  <option value="FREE">자유</option>
                  <option value="SPORTS">스포츠</option>
                  <option value="GAME">게임</option>
                </select>

                <input
                  type="text"
                  placeholder="제목 또는 본문 검색"
                  aria-label="게시글 검색"
                  onChange={(e) => setInputSearch(e.target.value)}
                />

                <select
                  aria-label="정렬 선택"
                  onChange={(e) => setSelectOrder(e.target.value)}
                >
                  <option value="NEW">최신순</option>
                  <option value="OLD">오래된순</option>
                  <option value="POPULAR">인기순</option>
                  <option value="COMMENTS">댓글 많은순</option>
                  <option value="LIKES">좋아요 많은순</option>
                </select>
              </div>
            </section>

            <section className="my-posts-list-section">
              <div className="my-posts-list-head">
                <h2>게시글 목록</h2>
                <span>{writePosts.length}개</span>
              </div>

              <div className="my-posts-list">
                {writePosts.map((post) => (
                  <article className="my-post-card" key={post.id}>
                    <div className="my-post-top">
                      <div className="my-post-meta">
                        <span
                          className={`post-category ${post.category.key.toLowerCase()}`}
                        >
                          {post.category.name}
                        </span>
                        <span
                          className={`post-visibility ${post.isPublic === "TRUE" ? "public" : "private"}`}
                        >
                          {post.isPublic === "TRUE" ? "공개" : "비공개"}
                        </span>
                      </div>

                      <span className="post-time">{post.createdAt}</span>
                    </div>

                    <a href={`/posts/${post.id}`} className="post-title-link">
                      <h3>{post.title}</h3>
                    </a>

                    <p className="post-context">
                      {post.context || "본문이 없는 게시글입니다."}
                    </p>

                    <div className="post-stats">
                      <span>댓글 {post.count.comments}</span>
                      <span>좋아요 {post.count.likes}</span>
                      <span>조회수 {post.count.views}</span>
                    </div>

                    <div className="post-actions">
                      <a
                        href={`/posts/${post.id}`}
                        className="post-action-btn primary"
                      >
                        게시글 보기
                      </a>
                      <button
                        type="button"
                        className="post-action-btn ghost"
                        onClick={() =>
                          navigate(
                            `/posts/update/${encodeURIComponent(post.id)}`,
                          )
                        }
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        className="post-action-btn danger"
                        onClick={(e) => deletePost(post.id, e)}
                      >
                        삭제
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <Pagination
              page={page}
              totalPages={totalPages}
              visiblePages={visiblePages}
              onMovePage={handleMovePage}
              ariaLabel="내 게시글 페이지 이동"
            />
          </section>
        </main>
      )}
    </>
  );
}
