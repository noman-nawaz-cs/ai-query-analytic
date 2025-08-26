// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
	}
}

declare module '@sveltejs/svelte-virtual-list' {
	import type { SvelteComponent } from 'svelte';
	const VirtualList: typeof SvelteComponent;
	export default VirtualList;
}

declare module '@sveltejs/svelte-virtual-list/VirtualList.svelte' {
	import type { SvelteComponent } from 'svelte';
	const VirtualList: typeof SvelteComponent;
	export default VirtualList;
}

export {};
