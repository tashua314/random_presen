#!/usr/bin/env tsx
/**
 * ui_blueprint.json から url_design.tsv を生成するスクリプト
 *
 * 使い方:
 *   tsx scripts/generate-url-design.ts
 *   または
 *   pnpm run generate-url-design
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// __dirname の代替（ES modules）
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 型定義
interface RouteRequirement {
	route: string;
	name: string;
	概要: string;
	目的: string;
	必要権限: string[];
}

interface UIBlueprint {
	routes: {
		一覧: string[];
		要件: RouteRequirement[];
	};
}

// ファイルパス
const projectRoot = resolve(__dirname, '..');
const inputFile = join(projectRoot, 'docs', 'ui_blueprint.json');
const outputFile = join(projectRoot, 'docs', 'url_design.tsv');

// ui_blueprint.json を読み込む
console.log('📖 Reading ui_blueprint.json...');
let blueprint: UIBlueprint;
try {
	const content = readFileSync(inputFile, 'utf-8');
	blueprint = JSON.parse(content);
} catch (error) {
	console.error('❌ Error reading ui_blueprint.json:', (error as Error).message);
	process.exit(1);
}

// routes.要件 を取得
if (!blueprint.routes || !Array.isArray(blueprint.routes.要件)) {
	console.error('❌ Invalid structure: routes.要件 not found');
	process.exit(1);
}

const requirements = blueprint.routes.要件;
console.log(`✅ Found ${requirements.length} routes`);

// TSV ヘッダー（url_design_old.tsv と同じ形式）
const tsvLines: string[] = ['route\tname\t概要\t目的'];

// データ行を生成
for (const req of requirements) {
	const route = req.route || '';
	const name = req.name || '';
	const overview = req.概要 || '';
	const purpose = req.目的 || '';

	tsvLines.push(`${route}\t${name}\t${overview}\t${purpose}`);
}

// TSV ファイルに書き込む
const tsvContent = tsvLines.join('\n') + '\n';

try {
	writeFileSync(outputFile, tsvContent, 'utf-8');
	console.log('✅ Generated url_design.tsv successfully!');
	console.log(`📄 Output: ${outputFile}`);
	console.log(`📊 Total routes: ${requirements.length}`);
} catch (error) {
	console.error('❌ Error writing url_design.tsv:', (error as Error).message);
	process.exit(1);
}
