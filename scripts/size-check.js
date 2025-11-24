#!/usr/bin/env node

import { readFileSync, statSync } from 'fs';
import { glob } from 'glob';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { minimatch } from 'minimatch';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// サイズ制限設定（より実用的な値に調整）
const LIMITS = {
	FILE_SIZE_KB: 50, // ファイルサイズ制限 (KB)
	FUNCTION_LINES: 75, // 関数の行数制限 (50→75に緩和)
	COMPONENT_LINES: 200, // Svelteコンポーネントの行数制限
	CLASS_LINES: 150, // クラスの行数制限
	SVELTE_SCRIPT_LINES: 150, // Svelteのscriptタグ内の行数制限 (100→150に緩和)
	EMAIL_TEMPLATE_LINES: 200 // メールテンプレート用の特別な制限
};

// 除外パターン
const EXCLUDE_PATTERNS = [
	'**/email/templates/**/*.ts', // メールテンプレートは本質的に長い
	'**/server/email/templates/**/*.ts',
	'**/server/dev-mailer.ts', // 開発用メーラーは除外
	'**/email-styles.ts', // メールスタイルは除外
	'**/*.test.ts', // テストファイルは除外
	'**/*.spec.ts',
	'**/migrations/**', // マイグレーションファイルは除外
	'**/seed.ts' // シードファイルは除外
];

// ファイルごとの特別な制限
const SPECIAL_LIMITS = {
	// エラーハンドラーは複雑になりやすい
	'**/error-handler*.ts': {
		FUNCTION_LINES: 100
	},
	// 設定検証は長くなりやすい
	'**/config-validation.ts': {
		FUNCTION_LINES: 100
	},
	// サービスクラスは長くなりやすい
	'**/*-service.ts': {
		CLASS_LINES: 200
	}
};

const COLOR = {
	RED: '\x1b[31m',
	YELLOW: '\x1b[33m',
	GREEN: '\x1b[32m',
	BLUE: '\x1b[34m',
	RESET: '\x1b[0m',
	BOLD: '\x1b[1m'
};

let hasWarnings = false;
let hasErrors = false;

// チェック結果を保存する配列
const results = [];

function log(message, color = COLOR.RESET) {
	console.log(`${color}${message}${COLOR.RESET}`);
}

function addResult(type, filePath, current, limit, lineNumber = null) {
	results.push({
		type,
		filePath,
		current,
		limit,
		lineNumber,
		severity: current > limit ? 'error' : 'warning'
	});
}

function formatBytes(bytes) {
	return `${(bytes / 1024).toFixed(1)}KB`;
}

// ファイルが除外パターンに一致するかチェック
function isExcluded(filePath) {
	return EXCLUDE_PATTERNS.some((pattern) => minimatch(filePath, pattern));
}

// ファイルの特別な制限を取得
function getSpecialLimits(filePath) {
	for (const [pattern, limits] of Object.entries(SPECIAL_LIMITS)) {
		if (minimatch(filePath, pattern)) {
			return { ...LIMITS, ...limits };
		}
	}
	return LIMITS;
}

// ファイルサイズチェック
function checkFileSize(filePath) {
	try {
		const stats = statSync(filePath);
		const sizeKB = stats.size / 1024;

		if (sizeKB > LIMITS.FILE_SIZE_KB) {
			addResult('file_size', filePath, sizeKB, LIMITS.FILE_SIZE_KB);
			hasErrors = true;
		} else if (sizeKB > LIMITS.FILE_SIZE_KB * 0.9) {
			addResult('file_size', filePath, sizeKB, LIMITS.FILE_SIZE_KB);
			hasWarnings = true;
		}
	} catch {
		// ファイルアクセスエラーは無視
	}
}

// コード構造チェック
function checkCodeStructure(filePath, content) {
	if (isExcluded(filePath)) return;

	const limits = getSpecialLimits(filePath);
	const lines = content.split('\n');

	// 関数チェック
	const functionPatterns = [
		/function\s+\w+\s*\(/g,
		/const\s+\w+\s*=\s*\([^)]*\)\s*=>/g,
		/const\s+\w+\s*=\s*async\s*\([^)]*\)\s*=>/g,
		/\w+\s*:\s*\([^)]*\)\s*=>/g, // メソッド定義パターン
		/async\s+\w+\s*\(/g
	];

	for (const pattern of functionPatterns) {
		const matches = content.matchAll(pattern);
		for (const match of matches) {
			const startLine = content.substring(0, match.index).split('\n').length;
			const functionLines = extractBlockLines(lines, startLine - 1);

			if (functionLines > limits.FUNCTION_LINES) {
				addResult('function', filePath, functionLines, limits.FUNCTION_LINES, startLine);
				hasErrors = true;
			} else if (functionLines > limits.FUNCTION_LINES * 0.8) {
				addResult('function', filePath, functionLines, limits.FUNCTION_LINES, startLine);
				hasWarnings = true;
			}
		}
	}

	// クラスチェック
	const classMatches = content.matchAll(/class\s+\w+/g);
	for (const match of classMatches) {
		const startLine = content.substring(0, match.index).split('\n').length;
		const classLines = extractBlockLines(lines, startLine - 1);

		if (classLines > limits.CLASS_LINES) {
			addResult('class', filePath, classLines, limits.CLASS_LINES, startLine);
			hasErrors = true;
		}
	}

	// Svelteコンポーネントチェック（script部分のみ）
	if (filePath.endsWith('.svelte')) {
		const scriptLines = extractSvelteScriptLines(content);
		if (scriptLines > limits.SVELTE_SCRIPT_LINES) {
			addResult('svelte_script', filePath, scriptLines, limits.SVELTE_SCRIPT_LINES);
			hasErrors = true;
		} else if (scriptLines > limits.SVELTE_SCRIPT_LINES * 0.8) {
			addResult('svelte_script', filePath, scriptLines, limits.SVELTE_SCRIPT_LINES);
			hasWarnings = true;
		}
	}
}

// Svelteのscriptタグ内の行数を取得
function extractSvelteScriptLines(content) {
	const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
	if (!scriptMatch) return 0;

	const scriptContent = scriptMatch[1];
	return scriptContent.split('\n').length;
}

// ブロック（関数、クラス）の行数を取得
function extractBlockLines(lines, startIndex) {
	let braceCount = 0;
	let lineCount = 0;
	let started = false;

	for (let i = startIndex; i < lines.length; i++) {
		const line = lines[i].trim();
		lineCount++;

		for (const char of line) {
			if (char === '{') {
				braceCount++;
				started = true;
			} else if (char === '}') {
				braceCount--;
				if (started && braceCount === 0) {
					return lineCount;
				}
			}
		}

		// 200行を超えたら強制終了（無限ループ防止）
		if (lineCount > 200) break;
	}

	return lineCount;
}

// 結果をソートして表示
function displaySortedResults() {
	if (results.length === 0) {
		return;
	}

	// 行数/サイズ順（降順）でソート
	const sortedResults = results.sort((a, b) => b.current - a.current);

	log(`📊 サイズチェック結果 (${sortedResults.length}件、サイズ降順):`, COLOR.BOLD);
	console.log();

	for (const result of sortedResults) {
		const icon = result.severity === 'error' ? '❌' : '⚠️';
		const color = result.severity === 'error' ? COLOR.RED : COLOR.YELLOW;

		let typeLabel;
		let unit;

		switch (result.type) {
			case 'file_size':
				typeLabel = 'ファイルサイズ超過';
				unit = 'KB';
				break;
			case 'function':
				typeLabel = '関数サイズ超過';
				unit = '行';
				break;
			case 'class':
				typeLabel = 'クラスサイズ超過';
				unit = '行';
				break;
			case 'svelte_script':
				typeLabel = 'Svelteスクリプトサイズ超過';
				unit = '行';
				break;
		}

		const locationInfo = result.lineNumber ? `:${result.lineNumber}` : '';
		const currentFormatted =
			result.type === 'file_size'
				? formatBytes(result.current * 1024)
				: `${Math.round(result.current)}${unit}`;
		const limitFormatted =
			result.type === 'file_size' ? `${result.limit}KB` : `${result.limit}${unit}`;

		log(`${icon} ${typeLabel}: ${result.filePath}${locationInfo}`, color);
		log(`   現在: ${currentFormatted}, 制限: ${limitFormatted}`, color);
	}

	console.log();
}

// メイン処理
async function main() {
	try {
		log(`${COLOR.BOLD}🔍 ファイル・コードサイズチェック開始${COLOR.RESET}`, COLOR.RESET);
		log(
			`📏 制限値: ファイル${LIMITS.FILE_SIZE_KB}KB, 関数${LIMITS.FUNCTION_LINES}行, Svelte<script>${LIMITS.SVELTE_SCRIPT_LINES}行, クラス${LIMITS.CLASS_LINES}行`
		);

		// 対象ファイルを収集
		const patterns = [
			'src/**/*.ts',
			'src/**/*.js',
			'src/**/*.svelte',
			'!node_modules/**',
			'!.svelte-kit/**',
			'!dist/**',
			'!build/**'
		];

		const files = await glob(patterns, { cwd: rootDir });

		// 除外されていないファイルの数をカウント
		const includedFiles = files.filter((file) => !isExcluded(file));

		log(`\n📂 ${includedFiles.length}個のファイルをチェック中...`);

		for (const file of files) {
			const filePath = join(rootDir, file);

			// ファイルサイズチェック
			checkFileSize(filePath);

			// コード構造チェック
			try {
				const content = readFileSync(filePath, 'utf-8');
				checkCodeStructure(file, content);
			} catch (error) {
				log(`📄 ファイル読み込みエラー: ${file} - ${error.message}`, COLOR.YELLOW);
			}
		}

		console.log();

		// 結果をソートして表示
		displaySortedResults();

		// 結果サマリー
		if (hasErrors) {
			log(`⚠️  サイズチェック警告: 制限を超過したファイルがあります`, COLOR.YELLOW);
			log(`📝 大きなファイルは今後リファクタリングを検討してください`, COLOR.YELLOW);
		} else if (hasWarnings) {
			log(`⚠️  サイズチェック警告: 制限に近いファイルがあります`, COLOR.YELLOW);
			log(`✅ 全体的には問題ありません`, COLOR.GREEN);
		} else {
			log(`✅ サイズチェック完了: すべてのファイルが制限内です`, COLOR.GREEN);
		}
	} catch (error) {
		log(`💥 エラー: ${error.message}`, COLOR.RED);
		process.exit(1);
	}
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch(console.error);
}
