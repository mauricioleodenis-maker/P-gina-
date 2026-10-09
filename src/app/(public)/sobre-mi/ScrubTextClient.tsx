'use client';
import { ScrubText } from '@/components/public/sections/ScrubText';

export function ScrubTextClient({ text }: { text: string }) {
  return <ScrubText text={text} className="font-serif text-3xl leading-snug md:text-4xl" />;
}
