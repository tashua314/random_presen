import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { slideStates } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function GET({ params }) {
	const { talkId } = params;
	const state = await db.query.slideStates.findFirst({
		where: eq(slideStates.talkId, talkId)
	});
	return json(state || { talkId, currentPage: 1 });
}

export async function POST({ params, request }) {
	const { talkId } = params;
	const { currentPage } = await request.json();

	const existing = await db.query.slideStates.findFirst({
		where: eq(slideStates.talkId, talkId)
	});

	if (existing) {
		await db
			.update(slideStates)
			.set({ currentPage, updatedAt: new Date() })
			.where(eq(slideStates.id, existing.id));
	} else {
		await db.insert(slideStates).values({
			talkId,
			currentPage
		});
	}

	return json({ success: true });
}
