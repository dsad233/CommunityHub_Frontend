import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Dropcursor } from "@tiptap/extension-dropcursor";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";
import "../../styles/posts/postCreate.css";
import { getWithExpiry } from "@src/utils";
import { Loading } from "@src/components";

type TPendingImage = {
  id: string;
  file: File;
  previewUrl: string;
  base64: string;
};

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),

      imageId: {
        default: null,

        parseHTML: (element) => {
          return element.getAttribute("data-image-id");
        },

        renderHTML: (attributes) => {
          if (!attributes.imageId) {
            return {};
          }

          return {
            "data-image-id": attributes.imageId,
          };
        },
      },

      width: {
        default: null,

        parseHTML: (element) => {
          return (
            element.getAttribute("data-width") ||
            element.getAttribute("width") ||
            element.style.width ||
            null
          );
        },

        renderHTML: (attributes) => {
          if (!attributes.width) {
            return {};
          }

          return {
            "data-width": attributes.width,
          };
        },
      },

      height: {
        default: null,

        parseHTML: (element) => {
          return (
            element.getAttribute("data-height") ||
            element.getAttribute("height") ||
            element.style.height ||
            null
          );
        },

        renderHTML: (attributes) => {
          if (!attributes.height) {
            return {};
          }

          return {
            "data-height": attributes.height,
          };
        },
      },
    };
  },
});

export default function PostCreate() {
  const navigate = useNavigate();
  const isSession = getWithExpiry("ack");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [title, setTitle] = useState<string>("");
  const [category, setCategory] = useState<string>("FREE");
  const [isPublic, setIsPublic] = useState<string>("TRUE");

  const [pendingImages, setPendingImages] = useState<TPendingImage[]>([]);

  const editor = useEditor({
    extensions: [
      StarterKit,

      Dropcursor.configure({
        color: "#6366f1",
        width: 3,
      }),

      CustomImage.configure({
        inline: false,
        allowBase64: false,

        resize: {
          enabled: true,
          directions: ["top-left", "top-right", "bottom-left", "bottom-right"],
          minWidth: 120,
          minHeight: 80,
          alwaysPreserveAspectRatio: true,
        },
      }),
    ],

    content: "<p></p>",

    editorProps: {
      /*
        외부 페이지, Word, Google Docs의 HTML/CSS는 사용하지 않고
        클립보드의 순수 텍스트만 직접 삽입합니다.
      */
      handlePaste: (view, event) => {
        const clipboardText = event.clipboardData?.getData("text/plain");

        if (!clipboardText) {
          return false;
        }

        event.preventDefault();

        const normalizedText = clipboardText
          .replace(/\r\n/g, "\n")
          .replace(/\r/g, "\n");

        const lines = normalizedText.split("\n");

        /*
          기존에 선택된 텍스트가 있다면 먼저 제거합니다.
        이후 현재 커서 위치에 한 줄씩 삽입하고 줄마다 문단을 나눕니다.
        빈 줄은 빈 문단으로 유지됩니다.
        */
        let transaction = view.state.tr.deleteSelection();

        lines.forEach((line, index) => {
          if (line.length > 0) {
            transaction = transaction.insertText(
              line,
              transaction.selection.from,
            );
          }

          if (index < lines.length - 1) {
            transaction = transaction.split(transaction.selection.from);
          }
        });

        view.dispatch(transaction.scrollIntoView());

        return true;
      },

      transformPastedText: (text) => {
        return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      },
    },
  });

  const clearImageSelection = () => {
    if (!editor) {
      return;
    }

    const { state, view } = editor;

    if (!(state.selection instanceof NodeSelection)) {
      return;
    }

    const selectionPosition = Math.min(
      state.selection.from,
      state.doc.content.size,
    );

    view.dispatch(
      state.tr.setSelection(
        TextSelection.near(state.doc.resolve(selectionPosition)),
      ),
    );
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const dataUrl = String(reader.result || "");
        const base64 = dataUrl.split(",")[1];

        if (!base64) {
          reject(new Error("이미지 Base64 변환에 실패했습니다."));
          return;
        }

        resolve(base64);
      };

      reader.onerror = () => {
        reject(new Error("이미지 파일을 읽지 못했습니다."));
      };

      reader.readAsDataURL(file);
    });
  };

  const handleChooseImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 선택할 수 있습니다.");
      e.target.value = "";
      return;
    }

    const maxFileSize = 5 * 1024 * 1024;

    if (file.size > maxFileSize) {
      alert("이미지는 5MB 이하만 업로드할 수 있습니다.");
      e.target.value = "";
      return;
    }

    if (!editor) {
      alert("에디터를 불러오는 중입니다.");
      e.target.value = "";
      return;
    }

    try {
      const base64 = await fileToBase64(file);

      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);

      setPendingImages((previous) => [
        ...previous,
        {
          id,
          file,
          previewUrl,
          base64,
        },
      ]);

      editor
        .chain()
        .focus()
        .insertContent({
          type: "image",
          attrs: {
            src: previewUrl,
            alt: file.name,
            imageId: id,
          },
        })
        .run();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "이미지 처리 중 오류가 발생했습니다.";

      alert(message);
    } finally {
      e.target.value = "";
    }
  };

  const convertEditorHtmlToRequestData = (html: string) => {
    const documentNode = new DOMParser().parseFromString(html, "text/html");

    const paragraphElements =
      documentNode.querySelectorAll<HTMLParagraphElement>("p");

    paragraphElements.forEach((paragraphElement) => {
      const text = paragraphElement.textContent?.trim() ?? "";
      const hasChildElement = paragraphElement.children.length > 0;

      if (!text && !hasChildElement) {
        paragraphElement.innerHTML = "&nbsp;";
      }
    });

    const imageElements =
      documentNode.querySelectorAll<HTMLImageElement>("img");

    const images: string[] = [];

    imageElements.forEach((imageElement) => {
      const imageId = imageElement.getAttribute("data-image-id");

      if (!imageId) {
        return;
      }

      const pendingImage = pendingImages.find((image) => image.id === imageId);

      if (!pendingImage) {
        imageElement.remove();
        return;
      }

      const imageIndex = images.length;

      images.push(pendingImage.base64);

      imageElement.setAttribute("src", `image://${imageIndex}`);

      const savedWidth =
        imageElement.getAttribute("data-width") ||
        imageElement.getAttribute("width") ||
        imageElement.style.width;

      if (savedWidth) {
        const width = savedWidth.endsWith("%")
          ? savedWidth
          : savedWidth.endsWith("px")
            ? savedWidth
            : `${savedWidth}px`;

        imageElement.setAttribute("data-width", width);
        imageElement.style.width = width;
      }

      const savedHeight =
        imageElement.getAttribute("data-height") ||
        imageElement.getAttribute("height") ||
        imageElement.style.height;

      if (savedHeight) {
        const height = savedHeight.endsWith("%")
          ? savedHeight
          : savedHeight.endsWith("px")
            ? savedHeight
            : `${savedHeight}px`;

        imageElement.setAttribute("data-height", height);
        imageElement.style.height = height;
      }

      imageElement.removeAttribute("data-image-id");
    });

    return {
      context: documentNode.body.innerHTML,
      images,
    };
  };

  const revokePreviewUrls = () => {
    pendingImages.forEach((pendingImage) => {
      URL.revokeObjectURL(pendingImage.previewUrl);
    });
  };

  const handlePostCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isSession) {
      alert("로그인이 필요한 페이지입니다.");
      navigate("/signin");
      return;
    }

    if (!editor) {
      alert("에디터를 불러오는 중입니다.");
      return;
    }

    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (editor.isEmpty) {
      alert("본문을 입력해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);

      const htmlWithPreviewUrls = editor.getHTML();

      const { context, images } =
        convertEditorHtmlToRequestData(htmlWithPreviewUrls);

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${isSession}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          context,
          category,
          isPublic,
          images,
        }),
      });

      const response = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          response.error || response.message || "게시글 등록에 실패했습니다.",
        );
      }

      revokePreviewUrls();

      alert("게시글이 등록되었습니다.");
      navigate("/posts");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "게시글 등록 중 오류가 발생했습니다.";

      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isSession) {
      alert("로그인이 필요한 페이지입니다.");
      navigate("/signin", { replace: true });
    }
  }, [isSession, navigate]);

  useEffect(() => {
    return () => {
      pendingImages.forEach((pendingImage) => {
        URL.revokeObjectURL(pendingImage.previewUrl);
      });
    };
  }, [pendingImages]);

  if (!isSession) {
    return <Loading />;
  }

  return (
    <main className="create-post-page">
      <section className="create-post-shell">
        <aside className="create-post-aside">
          <span className="create-post-badge">WRITE POST</span>

          <h1>새 게시글 작성</h1>

          <p>
            텍스트와 이미지를 자유롭게 배치해서 나만의 게시글을 작성해보세요.
          </p>

          <div className="create-post-guide">
            <div className="create-post-guide-item">
              <strong>이미지를 본문에 추가</strong>

              <span>
                원하는 위치에 커서를 둔 뒤 이미지 추가 버튼을 눌러주세요.
              </span>
            </div>

            <div className="create-post-guide-item">
              <strong>크기와 위치 조절</strong>

              <span>
                이미지를 클릭하면 네 모서리에 표시되는 점을 드래그해 크기를 바꿀
                수 있습니다.
              </span>
            </div>

            <div className="create-post-guide-item">
              <strong>줄바꿈과 공백 유지</strong>

              <span>
                엔터로 만든 빈 줄과 문단 간격도 게시글에 그대로 저장됩니다.
              </span>
            </div>
          </div>
        </aside>

        <section
          className="create-post-card"
          aria-labelledby="create-post-title"
        >
          <div className="create-post-head">
            <span className="create-post-badge create-post-badge--soft">
              POST FORM
            </span>

            <h2 id="create-post-title">게시글 정보</h2>

            <p>이미지, 문단, 빈 줄을 작성한 그대로 저장할 수 있습니다.</p>
          </div>

          <form className="create-post-form" onSubmit={handlePostCreate}>
            <div className="create-post-field">
              <label htmlFor="title">제목</label>

              <input
                id="title"
                name="title"
                type="text"
                placeholder="예: 여행 사진과 함께 남기는 후기"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="create-post-row">
              <div className="create-post-field">
                <label htmlFor="category">카테고리</label>

                <select
                  id="category"
                  name="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="FREE">자유</option>
                  <option value="SPORTS">스포츠</option>
                  <option value="GAME">게임</option>
                </select>
              </div>

              <div className="create-post-field">
                <span className="create-post-label">공개 여부</span>

                <div className="create-post-radio-group">
                  <label className="create-post-radio">
                    <input
                      type="radio"
                      name="isPublic"
                      value="TRUE"
                      checked={isPublic === "TRUE"}
                      onChange={(e) => setIsPublic(e.target.value)}
                      disabled={isSubmitting}
                    />

                    <span>공개</span>
                  </label>

                  <label className="create-post-radio">
                    <input
                      type="radio"
                      name="isPublic"
                      value="FALSE"
                      checked={isPublic === "FALSE"}
                      onChange={(e) => setIsPublic(e.target.value)}
                      disabled={isSubmitting}
                    />

                    <span>비공개</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="create-post-field">
              <div className="create-post-editor-head">
                <label>본문</label>

                <button
                  type="button"
                  className="create-post-image-upload-btn"
                  onClick={handleChooseImage}
                  disabled={isSubmitting}
                >
                  이미지 추가
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageSelect}
                  disabled={isSubmitting}
                  hidden
                />
              </div>

              <div
                className="post-rich-editor"
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) {
                    clearImageSelection();
                  }
                }}
              >
                <EditorContent editor={editor} />
              </div>

              <small>
                외부 텍스트를 붙여넣으면 서식은 제거되고 텍스트만 입력됩니다.
                이미지는 클릭 후 모서리를 드래그해 크기를 조절할 수 있습니다.
              </small>
            </div>

            <div className="create-post-actions">
              <button
                type="button"
                className="create-post-cancel-btn"
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
              >
                취소
              </button>

              <button
                type="submit"
                className="create-post-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? "게시글 등록 중..." : "게시글 등록"}
              </button>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}
