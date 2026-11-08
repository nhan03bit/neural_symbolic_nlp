import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { jsxRenderer } from "hono/jsx-renderer";

import neuralNet from "./routes/neural-net/index";
import simpleChat from "./routes/simple-chat";
import bpeTokenize from "./routes/bpe-tokenize";
import trainEmbed from "./routes/train-embed";
import trainTransformer from "./routes/train-transformer";
import neuralSymbolic from "./routes/neural-symbolic";
import { warmUp } from "./routes/neural-symbolic/train";

const app = new Hono();

app.use("/static/*", serveStatic({ root: "./dist" }));

app.get(
  "*",
  jsxRenderer(({ children }) => {
    return (
      <html lang="en">
        <head>
          <meta charSet="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>Hono JSX Renderer</title>
          {/* In <head>, not #root: the client render() replaces #root's children. */}
          {import.meta.env.PROD && (
            <link rel="stylesheet" href="/static/index.css" />
          )}
        </head>
        <body>{children}</body>
      </html>
    );
  }),
);

app.get("/", (c) =>
  c.render(
    <>
      <div id="root">
        {import.meta.env.PROD && (
          <script type="module" src="/static/client.js" />
        )}
        {!import.meta.env.PROD && (
          <script type="module" src="/src/client/index.tsx" />
        )}
      </div>
    </>,
  ),
);

app.notFound((c) =>
  c.render(
    <>
      <div id="root">
        {import.meta.env.PROD && (
          <script type="module" src="/static/client.js" />
        )}
        {!import.meta.env.PROD && (
          <script type="module" src="/src/client/index.tsx" />
        )}
      </div>
    </>,
  ),
);

export const _routes = app.route("/", simpleChat).route("/", neuralNet).route("/", bpeTokenize).route("/", trainEmbed).route("/", trainTransformer).route("/", neuralSymbolic);

export type App = typeof _routes;
export default app;

if (import.meta.env.PROD) {
  const port = Number(process.env.PORT || 3000);
  // 0.0.0.0, not Node's default "::": Render's port scan looks for an IPv4 listener and logs
  // "No open HTTP ports detected on 0.0.0.0" when it sees only the IPv6 one.
  serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, () => {
    console.log(`Server started on http://localhost:${port}`);
    // After listening, so the host sees the port open; the first request then finds it built.
    setTimeout(warmUp, 0);
  });
}
