import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { eventStates, events } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
	let event = await db.query.events.findFirst();
	if (!event) {
		const [newEvent] = await db.insert(events).values({ name: 'LT Event' }).returning();
		event = newEvent;
	}

	const state = await db.query.eventStates.findFirst({
		where: eq(eventStates.eventId, event.id)
	});
	return json(state || { currentTalkId: null });
}

export async function POST({ request }) {
	const { currentTalkId } = await request.json();

	let event = await db.query.events.findFirst();
	if (!event) {
		const [newEvent] = await db.insert(events).values({ name: 'LT Event' }).returning();
		event = newEvent;
	}

	// Upsert state
	const existing = await db.query.eventStates.findFirst({
		where: eq(eventStates.eventId, event.id)
	});

	if (existing) {
		await db
			.update(eventStates)
			.set({ currentTalkId, updatedAt: new Date() })
			.where(eq(eventStates.id, existing.id));
	} else {
		await db.insert(eventStates).values({
			eventId: event.id,
			currentTalkId
		});
	}

	return json({ success: true });
}
