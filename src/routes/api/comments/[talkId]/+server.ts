import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { comments } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET({ params }) {
	const { talkId } = params;
	const allComments = await db.query.comments.findMany({
		where: eq(comments.talkId, talkId),
		orderBy: [asc(comments.createdAt)]
	});
	return json(allComments);
}

export async function POST({ params, request }) {
	const { talkId } = params;
	const { message, displayName } = await request.json();

	const [newComment] = await db
		.insert(comments)
		.values({
			talkId,
			message,
			displayName
		})
		.returning();

	return json(newComment);
}
