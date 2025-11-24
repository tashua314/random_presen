import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { talks } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function POST({ request }) {
	const { talkIds } = await request.json();

	// Transaction would be better, but for now sequential updates
	for (let i = 0; i < talkIds.length; i++) {
		await db.update(talks).set({ orderIndex: i }).where(eq(talks.id, talkIds[i]));
	}

	return json({ success: true });
}
