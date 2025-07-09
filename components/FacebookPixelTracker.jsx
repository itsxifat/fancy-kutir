'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import * as fbq from '@/lib/fbpixel';

const FacebookPixelTracker = () => {
  const pathname = usePathname();

  useEffect(() => {
    fbq.pageview();
  }, [pathname]);

  return null;
};

export default FacebookPixelTracker;
