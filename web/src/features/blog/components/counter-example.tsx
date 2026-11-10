"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export default function CounterExample() {
  const [count, setCount] = useState(0);

  return (
    <div className="my-6 flex items-center gap-3 rounded-lg border p-4">
      <Button onClick={() => setCount((value) => value + 1)} type="button">
        Increment
      </Button>
      <output
        className="min-w-8 text-center font-mono text-lg"
        aria-live="polite"
      >
        {count}
      </output>
      <Button
        onClick={() => setCount((value) => value - 1)}
        type="button"
        variant="outline"
      >
        Decrement
      </Button>
    </div>
  );
}
