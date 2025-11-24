export interface Event {
	id: string;
	name: string;
}

export interface Talk {
	id: string;
	eventId: string;
	orderIndex: number;
	name: string;
	title: string;
	slideUrl: string;
}

export interface SlideState {
	talkId: string;
	currentPage: number;
}

export interface Comment {
	id: string;
	talkId: string;
	displayName: string;
	message: string;
	createdAt: string; // ISO string
}

export interface EventState {
	eventId: string;
	currentTalkId: string | null;
}

export interface DataService {
	// Event
	getEvent(): Promise<Event>;

	// Talks
	getTalks(): Promise<Talk[]>;
	addTalk(talk: Omit<Talk, 'id' | 'eventId' | 'orderIndex'>): Promise<Talk>;
	updateTalk(id: string, talk: Partial<Omit<Talk, 'id' | 'eventId' | 'orderIndex'>>): Promise<Talk>;
	updateTalkOrder(talkIds: string[]): Promise<void>;
	deleteTalk(talkId: string): Promise<void>;

	// State
	getCurrentTalkId(): Promise<string | null>;
	setCurrentTalkId(talkId: string | null): Promise<void>;

	// Slide
	getSlideState(talkId: string): Promise<SlideState>;
	updateSlidePage(talkId: string, page: number): Promise<void>;

	// Comments
	getComments(talkId: string): Promise<Comment[]>;
	addComment(talkId: string, message: string, displayName?: string): Promise<Comment>;

	// Subscriptions (Mocking Realtime)
	subscribeToSlideState(talkId: string, callback: (state: SlideState) => void): () => void;
	subscribeToComments(talkId: string, callback: (comments: Comment[]) => void): () => void;
	subscribeToCurrentTalk(callback: (talkId: string | null) => void): () => void;
}
