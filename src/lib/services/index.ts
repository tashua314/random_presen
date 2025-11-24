import { MockDataService } from './mock';
import type { DataService } from './types';

// Singleton instance
export const dataService: DataService = new MockDataService();
