import { DbDataService } from './db-client';
import type { DataService } from './types';

// Singleton instance
export const dataService: DataService = new DbDataService();
