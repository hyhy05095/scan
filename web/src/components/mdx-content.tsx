"use client";

import { getMDXComponent } from "mdx-bundler/client";
import { createElement, useMemo } from "react";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as jsxRuntime from "react/jsx-runtime";

import { useMDXComponents } from "@/mdx-components";

export function MdxContent({ code }: { code: string }) {
  // Use Next's renderer instance, including during server-side prerendering.
  const Content = useMemo(
    () => getMDXComponent(code, { React, ReactDOM, _jsx_runtime: jsxRuntime }),
    [code],
  );
  return createElement(Content, { components: useMDXComponents() });
}
