import type { MDXComponents } from "mdx/types";

const components = {
  a: (props) => (
    <a className="font-medium underline underline-offset-4" {...props} />
  ),
  blockquote: (props) => (
    <blockquote
      className="text-muted-foreground my-6 border-l-2 pl-5 italic"
      {...props}
    />
  ),
  code: (props) => (
    <code
      className="bg-muted rounded px-1.5 py-0.5 font-mono text-sm"
      {...props}
    />
  ),
  h1: (props) => (
    <h1 className="mt-10 text-4xl font-bold tracking-tight" {...props} />
  ),
  h2: (props) => (
    <h2 className="mt-10 text-3xl font-semibold tracking-tight" {...props} />
  ),
  h3: (props) => (
    <h3 className="mt-8 text-2xl font-semibold tracking-tight" {...props} />
  ),
  h4: (props) => (
    <h4 className="mt-8 text-xl font-semibold tracking-tight" {...props} />
  ),
  ol: (props) => <ol className="my-5 list-decimal space-y-2 pl-6" {...props} />,
  p: (props) => (
    <p className="text-foreground/90 my-5 text-base leading-8" {...props} />
  ),
  ul: (props) => <ul className="my-5 list-disc space-y-2 pl-6" {...props} />,
} satisfies MDXComponents;

export function useMDXComponents(): MDXComponents {
  return components;
}
