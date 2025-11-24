import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { events } from '$lib/server/db/schema';

export async function GET() {
	let event = await db.query.events.findFirst();
	if (!event) {
		// Auto-create if missing
		const [newEvent] = await db.insert(events).values({ name: 'LT Event' }).returning();
		event = newEvent;
	}
	return json(event);
}
