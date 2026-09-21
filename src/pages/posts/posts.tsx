import { useEffect, useState } from "react";
import "../../styles/posts/posts.css";
import { useNavigate } from "react-router-dom";
import { getVisiblePages, getWithExpiry, imageDecodeToUrl } from "@src/utils";
import { Loading } from "@src/components";
import Pagination from "@src/components/pagination";

type TPosts = {
  id: string;
  title: string;
  context: string | null;
  category: {
    key: string;
    name: string;
  };
  createdAt: string;
  users: { nickname: string; image: string | null };
  count: {
    comments: number;
    likes: number;
    views: number;
  };
}[];

export type TOrderBy = {
  NEW: string;
  POPULAR: string;
  COMMENTS: string;
  VIEWS: string;
};

export type TCategory = {
  key: string;
  name: string;
};

export default function Posts() {
  const navigate = useNavigate();
  const isSession = getWithExpiry("ack");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [posts, setPosts] = useState<TPosts>([]);
  const [count, setCount] = useState<number>(0);
  const [categories, setCategories] = useState<Array<TCategory>>([]);
  const [inputSearch, setInputSearch] = useState<string>("");
  const [selectCategory, setSelectCategory] = useState<string>("ALL");
  const [selectIsPublic, setSelectIsPublic] = useState<string>("PUBLIC");
  const [selectOrder, setSelectOrder] = useState<string>("NEW");
  const [todayNewPosts, setTodayNewPosts] = useState<number>(0);
  const [popularCategory, setPopularCategory] = useState<number>(0);

  const [page, setPage] = useState<number>(1);
  const [pages, setPages] = useState<number>(10);

  const totalPages = Math.ceil(count / pages);

  useEffect(() => {
    const requestPosts = async () => {
      await fetch(
        `/api/posts?page=${encodeURIComponent(page)}&pages=${encodeURIComponent(pages)}&search=${encodeURIComponent(inputSearch)}&category=${encodeURIComponent(selectCategory)}&isPublic=${encodeURIComponent(selectIsPublic)}&orderBy=${encodeURIComponent(selectOrder)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${isSession}`,
          },
          credentials: "include",
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
            setPosts(response.data?.posts);
            setCount(response.data?.paginations.count);
            setPage(response.data?.paginations.page);
            setPages(response.data?.paginations.pages);
            return res;
          }
        });
    };
    const requestCategories = async () => {
      await fetch("/api/posts/categories", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
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
        .then(async (res) => {
          if (res?.ok) {
            setIsLoading(false);
            const response = await res.json();
            setCategories(response.data);
            return res;
          }
        });
    };

    const todayPostsCount = async () => {
      await fetch("/api/globals/todays/post/count", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
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
        .then(async (res) => {
          if (res?.ok) {
            setIsLoading(false);
            const response = await res.json();
            setTodayNewPosts(response.count);
            return res;
          }
        });
    };

    const requestPopularCategory = async () => {
      await fetch("/api/categories/popular", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
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
        .then(async (res) => {
          if (res?.ok) {
            setIsLoading(false);
            const response = await res.json();
            setPopularCategory(response.category);
            return res;
          }
        });
    };

    requestPosts();
    requestCategories();
    todayPostsCount();
    requestPopularCategory();
  }, [
    page,
    pages,
    inputSearch,
    selectCategory,
    selectIsPublic,
    selectOrder,
    isSession,
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
        <main className="posts-page">
          <section className="posts-shell">
            <header className="posts-hero">
              <div className="posts-hero-copy">
                <span className="posts-badge">COMMUNITY POSTS</span>
                <h1>관심 있는 이야기를 빠르게 찾아보세요</h1>
                <p>
                  자유, 스포츠, 게임 카테고리의 최신 글과 인기 글을 한곳에서
                  확인할 수 있는 게시글 페이지입니다.
                </p>
              </div>

              <button
                type="button"
                className="posts-create-btn"
                onClick={() => navigate("/posts/create")}
              >
                게시글 작성
              </button>
            </header>

            <section className="posts-toolbar">
              <div className="posts-search-wrap">
                <input
                  type="text"
                  className="posts-search-input"
                  placeholder="제목, 내용, 작성자 검색"
                  onChange={(e) => setInputSearch(e.target.value)}
                />
              </div>

              <div className="posts-toolbar-actions">
                <select
                  className="posts-select"
                  value={selectOrder}
                  onChange={(e) => setSelectOrder(e.target.value)}
                >
                  <option value="NEW">최신순</option>
                  <option value="POPULAR">인기순</option>
                  <option value="COMMENTS">댓글순</option>
                  <option value="VIEWS">조회순</option>
                </select>

                <select
                  className="posts-select"
                  value={selectIsPublic}
                  onChange={(e) => setSelectIsPublic(e.target.value)}
                >
                  {/* <option value="PUBLIC">공개 글</option> */}
                  <option value="ALL">전체 글</option>
                </select>
              </div>
            </section>

            <section
              className="posts-category-bar"
              aria-label="게시글 카테고리"
            >
              {categories?.map((category) => (
                <button
                  key={category.key}
                  type="button"
                  className={`posts-category-chip ${category.key === selectCategory ? "is-active" : ""}`}
                  onClick={() => setSelectCategory(category.key)}
                >
                  {category.name}
                </button>
              ))}
            </section>

            <section className="posts-summary-row">
              <div className="posts-summary-card">
                <strong>
                  {count.toLocaleString("ko-KR", { maximumFractionDigits: 4 })}
                </strong>
                <span>전체 게시글</span>
              </div>
              <div className="posts-summary-card">
                <strong>
                  {todayNewPosts.toLocaleString("ko-KR", {
                    maximumFractionDigits: 4,
                  })}
                </strong>
                <span>오늘 등록된 글</span>
              </div>
              <div className="posts-summary-card">
                <strong>{popularCategory}</strong>
                <span>가장 활발한 카테고리</span>
              </div>
            </section>

            <section className="posts-list-section">
              <div className="posts-list-head">
                <h2>전체 게시글</h2>
                <p>검색과 필터를 사용해서 원하는 글을 빠르게 찾을 수 있어요.</p>
              </div>

              <div className="posts-list">
                {posts.map((post) => (
                  <article
                    className="posts-item"
                    key={post.id}
                    onClick={() =>
                      navigate(`/posts/${encodeURIComponent(post.id)}`)
                    }
                  >
                    <div className="posts-item-top">
                      <span
                        className={`posts-item-category ${post.category.key.toLowerCase()}`}
                      >
                        {post.category.name}
                      </span>
                      <span className="posts-item-date">{post.createdAt}</span>
                    </div>

                    <h3>{post.title}</h3>
                    <p>{post.context}</p>

                    <div className="posts-item-bottom">
                      <div className="posts-item-author">
                        <div className="posts-item-avatar">
                          {post.users.image ? (
                            <img
                              src={imageDecodeToUrl(post.users.image) as string}
                            />
                          ) : (
                            <span className="posts-item-avatar-text">
                              {post.users.nickname.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <strong>{post.users.nickname}</strong>
                      </div>

                      <div className="posts-item-meta">
                        <span>댓글 {post.count.comments}</span>
                        <span>좋아요 {post.count.likes}</span>
                        <span>조회 {post.count.views}</span>
                      </div>
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
