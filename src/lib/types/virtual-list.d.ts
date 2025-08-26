declare module '@sveltejs/svelte-virtual-list' {
  import type { SvelteComponentTyped } from 'svelte';

  interface VirtualListProps<T = any> {
    items: T[];
    rowHeight: number;
    height: number;
  }

  export default class VirtualList<T = any> extends SvelteComponentTyped<
    VirtualListProps<T>,
    {},
    { default: { item: T } }
  > {}
}

declare module '@sveltejs/svelte-virtual-list/VirtualList.svelte' {
  import type { SvelteComponentTyped } from 'svelte';

  interface VirtualListProps<T = any> {
    items: T[];
    rowHeight: number;
    height: number;
  }

  export default class VirtualList<T = any> extends SvelteComponentTyped<
    VirtualListProps<T>,
    {},
    { default: { item: T } }
  > {}
}


