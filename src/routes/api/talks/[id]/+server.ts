import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { talks } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT({ params, request }) {
	const { id } = params;
	const data = await request.json();

	const [updatedTalk] = await db
		.update(talks)
		.set({
			name: data.name,
			title: data.title,
			slideUrl: data.slideUrl
		})
		.where(eq(talks.id, id))
		.returning();

	return json(updatedTalk);
}

export async function DELETE({ params }) {
	const { id } = params;
	await db.delete(talks).where(eq(talks.id, id));
	return json({ success: true });
}
