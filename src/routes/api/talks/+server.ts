import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { talks, events } from '$lib/server/db/schema';
import { asc } from 'drizzle-orm';

export async function GET() {
	const allTalks = await db.query.talks.findMany({
		orderBy: [asc(talks.orderIndex)]
	});
	return json(allTalks);
}

export async function POST({ request }) {
	const data = await request.json();

	// Ensure event exists (Mock event for now)
	let event = await db.query.events.findFirst();
	if (!event) {
		const [newEvent] = await db.insert(events).values({ name: 'LT Event' }).returning();
		event = newEvent;
	}

	const [newTalk] = await db
		.insert(talks)
		.values({
			eventId: event.id,
			orderIndex: (await db.select().from(talks)).length, // Simple append
			name: data.name,
			title: data.title,
			slideUrl: data.slideUrl
		})
		.returning();

	return json(newTalk);
}
