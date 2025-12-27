<script lang="ts">
	import { onMount } from 'svelte';
	import QRCode from 'qrcode';

	export let url: string;
	export let size: number = 120;

	let dataUrl: string = '';

	$: if (url) {
		generateQR(url);
	}

	async function generateQR(text: string) {
		try {
			dataUrl = await QRCode.toDataURL(text, {
				width: size,
				margin: 1,
				color: {
					dark: '#0ea5e9', // sky-500
					light: '#0f172a' // slate-900
				}
			});
		} catch (err) {
			console.error('QR code generation failed:', err);
		}
	}

	onMount(() => {
		if (url) generateQR(url);
	});
</script>

{#if dataUrl}
	<img src={dataUrl} alt="QR Code" width={size} height={size} class="rounded" />
{/if}
