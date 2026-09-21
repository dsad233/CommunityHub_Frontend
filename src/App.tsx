import { useEffect, useState } from "react";
import "./App.css";
import { useNavigate } from "react-router-dom";
import { imageDecodeToUrl } from "./utils";
import { Loading } from "./components";

type TCategoriesRes = {
  key: string;
  name: string;
  count: number;
};

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
    views: number;
    likes: number;
    comments: number;
  };
}[];

type TodayCounts = {
  users: number;
  posts: number;
  comments: number;
  likes: number;
};

type TPopulerUsers = {
  nickname: string;
  posts: number;
  role: string;
};

export default function App() {
  const navigate = useNavigate();
  // const isSession = getWithExpiry("ack");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [inputSearch, setInputSearch] = useState<string>("");
  const [categories, setCategories] = useState<Array<TCategoriesRes>>([]);
  // const [selectCategory, setSelectCategory] = useState<string>("");
  const [posts, setPosts] = useState<TPosts>([]);
  const [userCount, setUserCount] = useState<number>(0);
  const [commentCount, setCommentCount] = useState<number>(0);
  const [todayCounts, setTodayCounts] = useState<TodayCounts>({
    users: 0,
    posts: 0,
    comments: 0,
    likes: 0,
  });

  const [populerUsers, setPopulerUsers] = useState<Array<TPopulerUsers>>([]);

  const handlerSearch = async () => {
    await fetch(
      `/api/posts?page=1&pages=4&isPublic=ALL&orderBy=NEW&search=${inputSearch}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
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
          setPosts(response.data.posts);
          return res;
        }
      });
  };

  useEffect(() => {
    const requestCategory = async () => {
      await fetch("/api/posts/count/category", {
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

    const requestPosts = async () => {
      await fetch(`/api/posts?page=1&pages=5&isPublic=ALL&orderBy=NEW`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
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
            setPosts(response.data.posts);
            return res;
          }
        });
    };

    const requestUserCount = async () => {
      await fetch("/api/globals/users/count", {
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
            setUserCount(response.count);
            return res;
          }
        });
    };

    const requestCommentCount = async () => {
      await fetch("/api/globals/comments/count", {
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
            setCommentCount(response.count);
            return res;
          }
        });
    };

    const requestTodayCounts = async () => {
      await fetch("/api/globals/todays/count", {
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
            setTodayCounts(response.data);
            return res;
          }
        });
    };

    const requestPopulerUsers = async () => {
      await fetch("/api/globals/populars/post", {
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
            setPopulerUsers(response.data);
            return res;
          }
        });
    };

    requestCategory();
    requestPosts();
    requestUserCount();
    requestCommentCount();
    requestTodayCounts();
    requestPopulerUsers();
  }, [inputSearch]);

  return (
    <>
      {isLoading ? (
        <Loading />
      ) : (
        <div className="app">
          <main className="main-layout">
            <section className="hero">
              <div className="hero-content">
                <span className="badge">PUBLIC COMMUNITY</span>
                <h2>오늘의 이야기와 인기 주제를 한눈에 확인하세요.</h2>
                <p>
                  최신 게시글, 카테고리별 인기 주제, 활발한 사용자 정보를
                  메인에서 빠르게 볼 수 있도록 구성한 커뮤니티 홈입니다.
                </p>

                <div className="search-box">
                  <input
                    type="text"
                    placeholder="게시글, 닉네임, 카테고리 검색"
                    onChange={(e) => setInputSearch(e.target.value)}
                  />
                  <button onClick={handlerSearch}>검색</button>
                </div>
              </div>

              <div className="hero-stats">
                <div className="stat-card">
                  <strong>
                    {userCount.toLocaleString("ko-KR", {
                      maximumFractionDigits: 4,
                    })}
                  </strong>
                  <span>전체 사용자</span>
                </div>
                <div className="stat-card">
                  <strong>
                    {todayCounts.posts.toLocaleString("ko-KR", {
                      maximumFractionDigits: 4,
                    })}
                  </strong>
                  <span>오늘 게시글</span>
                </div>
                <div className="stat-card">
                  <strong>
                    {commentCount.toLocaleString("ko-KR", {
                      maximumFractionDigits: 4,
                    })}
                  </strong>
                  <span>전체 댓글</span>
                </div>
              </div>
            </section>

            <section className="content-grid">
              <div className="left-column">
                <section className="panel">
                  <div className="section-header">
                    <h3>카테고리</h3>
                    {/* <a href="/">전체 보기</a> */}
                  </div>

                  <div className="category-grid">
                    {categories.map((category) => (
                      <article
                        key={category.key}
                        className="category-card"
                        // onClick={() => {
                        //   navigate(`/posts?category=${category.key}`);
                        // }}
                      >
                        <span className="category-key">{category.key}</span>
                        <strong>{category.name}</strong>
                        <p>
                          {category.count.toLocaleString("ko-KR", {
                            maximumFractionDigits: 4,
                          })}
                          개의 게시글
                        </p>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="panel">
                  <div className="section-header">
                    <h3>최신 게시글</h3>
                    <a href="/posts">더 보기</a>
                  </div>

                  <div className="post-list">
                    {posts.map((post) => (
                      <article
                        key={post.id}
                        className="post-card"
                        onClick={() => navigate(`/posts/${post.id}`)}
                      >
                        <div className="post-top">
                          <span
                            className={`post-category ${post.category.key.toLowerCase()}`}
                          >
                            {post.category.name}
                          </span>
                          <span className="post-time">{post.createdAt}</span>
                        </div>

                        <h4>{post.title}</h4>
                        <p>{post.context}</p>

                        <div className="post-bottom">
                          <div className="author-info">
                            <div className="avatar">
                              {post.users.image ? (
                                <img
                                  src={
                                    imageDecodeToUrl(post.users.image) as string
                                  }
                                />
                              ) : (
                                <span className="avatar-text">
                                  {post.users.nickname.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <strong>{post.users.nickname}</strong>
                            </div>
                          </div>

                          <div className="post-meta">
                            <span>댓글 {post.count.comments}</span>
                            <span>좋아요 {post.count.likes}</span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </div>

              <aside className="right-column">
                <section className="panel side-panel">
                  <div className="section-header">
                    <h3>인기 작성자</h3>
                  </div>

                  <div className="user-rank-list">
                    {populerUsers.map((user, index) => (
                      <div key={user.nickname} className="user-rank-item">
                        <span className="rank">#{index + 1}</span>
                        <div>
                          <strong>{user.nickname}</strong>
                          <p>
                            {user.role} · 게시글{" "}
                            {user.posts.toLocaleString("ko-KR", {
                              maximumFractionDigits: 4,
                            })}
                            개
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="panel side-panel">
                  <div className="section-header">
                    <h3>오늘의 활동</h3>
                  </div>

                  <div className="mini-stats">
                    <div>
                      <strong>
                        {todayCounts.comments.toLocaleString("ko-KR", {
                          maximumFractionDigits: 4,
                        })}
                      </strong>
                      <span>새 댓글</span>
                    </div>
                    <div>
                      <strong>
                        {todayCounts.users.toLocaleString("ko-KR", {
                          maximumFractionDigits: 4,
                        })}
                      </strong>
                      <span>새 회원</span>
                    </div>
                    <div>
                      <strong>
                        {todayCounts.likes.toLocaleString("ko-KR", {
                          maximumFractionDigits: 4,
                        })}
                      </strong>
                      <span>좋아요</span>
                    </div>
                  </div>
                </section>
              </aside>
            </section>
          </main>
        </div>
      )}
    </>
  );
}
