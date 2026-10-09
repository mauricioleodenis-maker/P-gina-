declare module '*.mdx' {
  import type { ComponentType } from 'react';
  export const meta: { title: string; description: string; date: string; tags?: string[] };
  const Component: ComponentType;
  export default Component;
}
