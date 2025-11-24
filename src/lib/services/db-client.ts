import type { DataService, Event, Talk, SlideState, Comment } from './types';

export class DbDataService implements DataService {
	// Polling intervals
	private readonly POLL_INTERVAL = 1000;

	async getEvent(): Promise<Event> {
		const res = await fetch('/api/event');
		return res.json();
	}

	async getTalks(): Promise<Talk[]> {
		const res = await fetch('/api/talks');
		return res.json();
	}

	async addTalk(talk: Omit<Talk, 'id' | 'eventId' | 'orderIndex'>): Promise<Talk> {
		const res = await fetch('/api/talks', {
			method: 'POST',
			body: JSON.stringify(talk)
		});
		return res.json();
	}

	async updateTalk(
		id: string,
		talk: Partial<Omit<Talk, 'id' | 'eventId' | 'orderIndex'>>
	): Promise<Talk> {
		const res = await fetch(`/api/talks/${id}`, {
			method: 'PUT',
			body: JSON.stringify(talk)
		});
		return res.json();
	}

	async updateTalkOrder(talkIds: string[]): Promise<void> {
		await fetch('/api/talks/reorder', {
			method: 'POST',
			body: JSON.stringify({ talkIds })
		});
	}

	async deleteTalk(talkId: string): Promise<void> {
		await fetch(`/api/talks/${talkId}`, { method: 'DELETE' });
	}

	async getCurrentTalkId(): Promise<string | null> {
		const res = await fetch('/api/state/event');
		const data = await res.json();
		return data.currentTalkId;
	}

	async setCurrentTalkId(talkId: string | null): Promise<void> {
		await fetch('/api/state/event', {
			method: 'POST',
			body: JSON.stringify({ currentTalkId: talkId })
		});
	}

	async getSlideState(talkId: string): Promise<SlideState> {
		const res = await fetch(`/api/state/slide/${talkId}`);
		return res.json();
	}

	async updateSlidePage(talkId: string, page: number): Promise<void> {
		await fetch(`/api/state/slide/${talkId}`, {
			method: 'POST',
			body: JSON.stringify({ currentPage: page })
		});
	}

	async getComments(talkId: string): Promise<Comment[]> {
		const res = await fetch(`/api/comments/${talkId}`);
		return res.json();
	}

	async addComment(talkId: string, message: string, displayName?: string): Promise<Comment> {
		const res = await fetch(`/api/comments/${talkId}`, {
			method: 'POST',
			body: JSON.stringify({ message, displayName })
		});
		return res.json();
	}

	// Polling Implementations

	subscribeToSlideState(talkId: string, callback: (state: SlideState) => void): () => void {
		let active = true;
		const poll = async () => {
			if (!active) return;
			try {
				const state = await this.getSlideState(talkId);
				callback(state);
			} catch (e) {
				console.error(e);
			}
			if (active) setTimeout(poll, this.POLL_INTERVAL);
		};
		poll();
		return () => {
			active = false;
		};
	}

	subscribeToComments(talkId: string, callback: (comments: Comment[]) => void): () => void {
		let active = true;
		const poll = async () => {
			if (!active) return;
			try {
				const comments = await this.getComments(talkId);
				callback(comments);
			} catch (e) {
				console.error(e);
			}
			if (active) setTimeout(poll, this.POLL_INTERVAL);
		};
		poll();
		return () => {
			active = false;
		};
	}

	subscribeToCurrentTalk(callback: (talkId: string | null) => void): () => void {
		let active = true;
		const poll = async () => {
			if (!active) return;
			try {
				const id = await this.getCurrentTalkId();
				callback(id);
			} catch (e) {
				console.error(e);
			}
			if (active) setTimeout(poll, this.POLL_INTERVAL);
		};
		poll();
		return () => {
			active = false;
		};
	}
}
