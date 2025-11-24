import { writable, get } from 'svelte/store';
import type { DataService, Event, Talk, SlideState, Comment, EventState } from './types';

export class MockDataService implements DataService {
	private event: Event = {
		id: 'mock-event-id',
		name: 'Mock LT Event'
	};

	private talks = writable<Talk[]>([]);
	private comments = writable<Comment[]>([]);
	private slideStates = writable<Record<string, SlideState>>({});
	private eventState = writable<EventState>({
		eventId: 'mock-event-id',
		currentTalkId: null
	});

	constructor() {
		// Seed some data
		this.talks.set([
			{
				id: 'talk-1',
				eventId: 'mock-event-id',
				orderIndex: 0,
				name: '山田 太郎',
				title: 'SvelteKitの魅力',
				slideUrl: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf' // Sample PDF
			},
			{
				id: 'talk-2',
				eventId: 'mock-event-id',
				orderIndex: 1,
				name: '鈴木 花子',
				title: 'Tailwind CSS Tips',
				slideUrl: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
			}
		]);
	}

	async getEvent(): Promise<Event> {
		return this.event;
	}

	async getTalks(): Promise<Talk[]> {
		return get(this.talks);
	}

	async addTalk(talk: Omit<Talk, 'id' | 'eventId' | 'orderIndex'>): Promise<Talk> {
		const currentTalks = get(this.talks);
		const newTalk: Talk = {
			...talk,
			id: crypto.randomUUID(),
			eventId: this.event.id,
			orderIndex: currentTalks.length
		};
		this.talks.update((t) => [...t, newTalk]);
		return newTalk;
	}

	async updateTalk(
		id: string,
		talk: Partial<Omit<Talk, 'id' | 'eventId' | 'orderIndex'>>
	): Promise<Talk> {
		let updatedTalk: Talk | null = null;
		this.talks.update((current) => {
			return current.map((t) => {
				if (t.id === id) {
					updatedTalk = { ...t, ...talk };
					return updatedTalk;
				}
				return t;
			});
		});
		if (!updatedTalk) throw new Error('Talk not found');
		return updatedTalk;
	}

	async updateTalkOrder(talkIds: string[]): Promise<void> {
		this.talks.update((current) => {
			const map = new Map(current.map((t) => [t.id, t]));
			return talkIds
				.map((id, index) => {
					const t = map.get(id);
					if (t) return { ...t, orderIndex: index };
					return null;
				})
				.filter((t): t is Talk => t !== null);
		});
	}

	async deleteTalk(talkId: string): Promise<void> {
		this.talks.update((t) => t.filter((item) => item.id !== talkId));
	}

	async getCurrentTalkId(): Promise<string | null> {
		return get(this.eventState).currentTalkId;
	}

	async setCurrentTalkId(talkId: string | null): Promise<void> {
		this.eventState.update((s) => ({ ...s, currentTalkId: talkId }));
	}

	async getSlideState(talkId: string): Promise<SlideState> {
		const states = get(this.slideStates);
		return states[talkId] || { talkId, currentPage: 1 };
	}

	async updateSlidePage(talkId: string, page: number): Promise<void> {
		this.slideStates.update((s) => ({
			...s,
			[talkId]: { talkId, currentPage: page }
		}));
	}

	async getComments(talkId: string): Promise<Comment[]> {
		return get(this.comments).filter((c) => c.talkId === talkId);
	}

	async addComment(talkId: string, message: string, displayName?: string): Promise<Comment> {
		const newComment: Comment = {
			id: crypto.randomUUID(),
			talkId,
			message,
			displayName: displayName || 'Anonymous',
			createdAt: new Date().toISOString()
		};
		this.comments.update((c) => [...c, newComment]);
		return newComment;
	}

	subscribeToSlideState(talkId: string, callback: (state: SlideState) => void): () => void {
		return this.slideStates.subscribe((states) => {
			const state = states[talkId] || { talkId, currentPage: 1 };
			callback(state);
		});
	}

	subscribeToComments(talkId: string, callback: (comments: Comment[]) => void): () => void {
		return this.comments.subscribe((all) => {
			callback(all.filter((c) => c.talkId === talkId));
		});
	}

	subscribeToCurrentTalk(callback: (talkId: string | null) => void): () => void {
		return this.eventState.subscribe((s) => callback(s.currentTalkId));
	}
}
