'use client';
import { useEffect } from 'react';

export default function ClientScript({ scriptCode }) {
  useEffect(() => {
    try {
      // Create and execute a function from the injected vanillajs HTML script safely
      const executeScript = new Function(scriptCode);
      executeScript();
    } catch (e) {
      console.error("Javascript hydration error from raw HTML inject:", e);
    }
  }, [scriptCode]);

  return null;
}
