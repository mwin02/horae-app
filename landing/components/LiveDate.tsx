'use client';

import { useEffect, useState } from 'react';

/**
 * Renders today's date as "Sunday, May 10" — matches the in-app date header.
 * Renders an empty string until the client hydrates so the server-rendered
 * HTML doesn't lock to whatever date the build happened on.
 */
export function LiveDate({ className }: { className?: string }) {
  const [text, setText] = useState('');

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    setText(fmt.format(new Date()));
  }, []);

  return <span className={className}>{text}</span>;
}
