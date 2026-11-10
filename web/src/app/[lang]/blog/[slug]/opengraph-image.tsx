import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { getPost } from "@/features/blog/posts";

export const alt = "Supanext blog post";
export const size = { height: 630, width: 1200 };
export const contentType = "image/png";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  const image = post
    ? await readFile(
        join(process.cwd(), "public", "blog", `${post.slug}.jpg`),
        "base64",
      )
    : null;

  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#09090b",
        color: "white",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
        width: "100%",
      }}
    >
      {image ? (
        <img
          alt=""
          src={`data:image/jpeg;base64,${image}`}
          style={{
            height: "100%",
            objectFit: "cover",
            position: "absolute",
            width: "100%",
          }}
        />
      ) : null}
      <div
        style={{
          background: "rgba(0,0,0,.62)",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "flex-end",
          padding: "72px",
          position: "absolute",
          width: "100%",
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 18 }}>
          Supanext Blog
        </div>
        <div
          style={{
            fontSize: 68,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
          }}
        >
          {post?.title ?? "Post not found"}
        </div>
        <div
          style={{
            fontSize: 30,
            lineHeight: 1.4,
            marginTop: 20,
            opacity: 0.86,
          }}
        >
          {post?.description ?? ""}
        </div>
      </div>
    </div>,
    size,
  );
}
