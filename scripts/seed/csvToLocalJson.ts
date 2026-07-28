/**
 * CSVから、ローカル専用Seedデータ（src/services/dev/seedData.local.json）を生成するスクリプト。
 *
 * seedData.local.jsonはIDによる相互参照（family.pickupLocationId、child.familyId等）を
 * 手作業で書く必要があり手間が大きいため、名前ベースで書けるCSVを用意し、
 * このスクリプトでID採番・紐づけを自動化する。
 *
 * 使い方:
 *   1. scripts/seed/csv/*.sample.csv をコピーして、同じディレクトリに
 *      拡張子.sample を外したファイルを作る（例: families.sample.csv → families.csv）
 *   2. Excel・Googleスプレッドシート等でCSVとして中身を編集する
 *      （family/pickupLocation/destinationの紐づけは、IDではなく「名前」で入力する）
 *   3. `npm run seed:from-csv` を実行する
 *      → src/services/dev/seedData.local.json を生成・上書きする
 *   4. `npm run seed:local` でFirestoreへ投入する
 *
 * CSV本体（*.csv、*.sample.csvを除く）は個人情報に近いデータになりうるため.gitignore対象。
 * events.csvは省略可（未作成の場合はイベント0件として出力する。日付は都度変わるため
 * 画面から作成する運用でもよい）。
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const CSV_DIR = resolve(SCRIPT_DIR, 'csv');
const OUTPUT_PATH = resolve(SCRIPT_DIR, '../../src/services/dev/seedData.local.json');

interface OutputPickupLocation {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
}

interface OutputDestination {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
}

interface OutputFamily {
  id: string;
  familyName: string;
  coachName: string | null;
  vehicleCapacity: number;
  pickupLocationId: string;
  isActive: boolean;
}

interface OutputChild {
  id: string;
  familyId: string;
  name: string;
  grade: number;
  isActive: boolean;
}

interface OutputEvent {
  id: string;
  name: string;
  date: string;
  destinationId: string;
}

/**
 * CSVテキストをレコード（ヘッダー名 → 値）の配列にパースする。
 * ダブルクォートで囲んだフィールド（カンマ・改行・""によるエスケープを含む）に対応する。
 */
function parseCsvText(text: string): Record<string, string>[] {
  const content = text.replace(/^\uFEFF/, ''); // Excel等が付与するBOMを除去
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (inQuotes) {
      if (char === '"') {
        if (content[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && content[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const nonEmptyRows = rows.filter((r) => r.some((cell) => cell.trim() !== ''));
  if (nonEmptyRows.length === 0) return [];

  const header = nonEmptyRows[0].map((h) => h.trim());
  return nonEmptyRows.slice(1).map((r) => {
    const record: Record<string, string> = {};
    header.forEach((key, i) => {
      record[key] = (r[i] ?? '').trim();
    });
    return record;
  });
}

/**
 * CSVファイルを読み込む。実データ（*.csv）が存在しない場合は、対応する
 * サンプル（*.sample.csv）をコピーして作成するよう案内するエラーで停止する。
 */
function readCsvFile(fileName: string): Record<string, string>[] {
  const filePath = resolve(CSV_DIR, fileName);
  if (!existsSync(filePath)) {
    const sampleFileName = fileName.replace(/\.csv$/, '.sample.csv');
    throw new Error(
      `scripts/seed/csv/${fileName} が見つかりません。` +
        `scripts/seed/csv/${sampleFileName} をコピーして作成してください。`
    );
  }
  return parseCsvText(readFileSync(filePath, 'utf-8'));
}

function requireField(record: Record<string, string>, key: string, context: string): string {
  const value = record[key];
  if (!value) {
    throw new Error(`${context}: 「${key}」が未入力です`);
  }
  return value;
}

function parseOptionalNumber(value: string | undefined, key: string, context: string): number | null {
  if (!value) return null;
  const n = Number(value);
  if (Number.isNaN(n)) {
    throw new Error(`${context}: 「${key}」を数値として解釈できません（値: "${value}"）`);
  }
  return n;
}

function parseRequiredInt(value: string, key: string, context: string): number {
  const n = Number(value);
  if (!Number.isInteger(n)) {
    throw new Error(`${context}: 「${key}」は整数で入力してください（値: "${value}"）`);
  }
  return n;
}

function parseBoolean(value: string | undefined, key: string, context: string): boolean {
  if (!value) return true; // 未入力はTRUE（在籍中）扱い
  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes'].includes(normalized)) return true;
  if (['false', '0', 'no'].includes(normalized)) return false;
  throw new Error(
    `${context}: 「${key}」をTRUE/FALSEとして解釈できません（値: "${value}"）`
  );
}

function buildPickupLocations(): {
  locations: OutputPickupLocation[];
  idByName: Map<string, string>;
} {
  const records = readCsvFile('pickup_locations.csv');
  const idByName = new Map<string, string>();
  const locations = records.map((record, index) => {
    const context = `pickup_locations.csv ${index + 2}行目`;
    const name = requireField(record, 'name', context);
    if (idByName.has(name)) {
      throw new Error(`${context}: 集合場所名「${name}」が重複しています`);
    }
    const id = `location-${index + 1}`;
    idByName.set(name, id);
    return {
      id,
      name,
      latitude: parseOptionalNumber(record.latitude, 'latitude', context),
      longitude: parseOptionalNumber(record.longitude, 'longitude', context),
    };
  });
  return { locations, idByName };
}

function buildDestinations(): {
  destinations: OutputDestination[];
  idByName: Map<string, string>;
} {
  const records = readCsvFile('destinations.csv');
  const idByName = new Map<string, string>();
  const destinations = records.map((record, index) => {
    const context = `destinations.csv ${index + 2}行目`;
    const name = requireField(record, 'name', context);
    if (idByName.has(name)) {
      throw new Error(`${context}: 目的地名「${name}」が重複しています`);
    }
    const id = `destination-${index + 1}`;
    idByName.set(name, id);
    return {
      id,
      name,
      latitude: parseOptionalNumber(record.latitude, 'latitude', context),
      longitude: parseOptionalNumber(record.longitude, 'longitude', context),
    };
  });
  return { destinations, idByName };
}

function buildFamilies(pickupLocationIdByName: Map<string, string>): {
  families: OutputFamily[];
  idByName: Map<string, string>;
} {
  const records = readCsvFile('families.csv');
  const idByName = new Map<string, string>();
  const families = records.map((record, index) => {
    const context = `families.csv ${index + 2}行目`;
    const familyName = requireField(record, 'familyName', context);
    if (idByName.has(familyName)) {
      throw new Error(`${context}: 家庭名「${familyName}」が重複しています`);
    }
    const pickupLocationName = requireField(record, 'pickupLocationName', context);
    const pickupLocationId = pickupLocationIdByName.get(pickupLocationName);
    if (!pickupLocationId) {
      throw new Error(
        `${context}: 集合場所名「${pickupLocationName}」がpickup_locations.csvに見つかりません`
      );
    }
    const id = `family-${index + 1}`;
    idByName.set(familyName, id);
    return {
      id,
      familyName,
      coachName: record.coachName ? record.coachName : null,
      vehicleCapacity: parseRequiredInt(
        requireField(record, 'vehicleCapacity', context),
        'vehicleCapacity',
        context
      ),
      pickupLocationId,
      isActive: parseBoolean(record.isActive, 'isActive', context),
    };
  });
  return { families, idByName };
}

function buildChildren(familyIdByName: Map<string, string>): OutputChild[] {
  const records = readCsvFile('children.csv');
  return records.map((record, index) => {
    const context = `children.csv ${index + 2}行目`;
    const familyName = requireField(record, 'familyName', context);
    const familyId = familyIdByName.get(familyName);
    if (!familyId) {
      throw new Error(`${context}: 家庭名「${familyName}」がfamilies.csvに見つかりません`);
    }
    const name = requireField(record, 'childName', context);
    const grade = parseRequiredInt(requireField(record, 'grade', context), 'grade', context);
    if (grade < 1 || grade > 6) {
      throw new Error(`${context}: 「grade」は1〜6で入力してください（値: "${grade}"）`);
    }
    return {
      id: `child-${index + 1}`,
      familyId,
      name,
      grade,
      isActive: parseBoolean(record.isActive, 'isActive', context),
    };
  });
}

function buildEvents(destinationIdByName: Map<string, string>): OutputEvent[] {
  const filePath = resolve(CSV_DIR, 'events.csv');
  if (!existsSync(filePath)) {
    console.log('[seed:from-csv] events.csvが見つからないため、イベント0件として出力します');
    return [];
  }
  const records = parseCsvText(readFileSync(filePath, 'utf-8'));
  return records.map((record, index) => {
    const context = `events.csv ${index + 2}行目`;
    const name = requireField(record, 'name', context);
    const date = requireField(record, 'date', context);
    const destinationName = requireField(record, 'destinationName', context);
    const destinationId = destinationIdByName.get(destinationName);
    if (!destinationId) {
      throw new Error(
        `${context}: 目的地名「${destinationName}」がdestinations.csvに見つかりません`
      );
    }
    return { id: `event-${index + 1}`, name, date, destinationId };
  });
}

function main(): void {
  const { locations: pickupLocations, idByName: pickupLocationIdByName } = buildPickupLocations();
  const { destinations, idByName: destinationIdByName } = buildDestinations();
  const { families, idByName: familyIdByName } = buildFamilies(pickupLocationIdByName);
  const children = buildChildren(familyIdByName);
  const events = buildEvents(destinationIdByName);

  const output = { pickupLocations, destinations, families, children, events };
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf-8');

  console.log(`[seed:from-csv] ${OUTPUT_PATH} を生成しました`);
  console.log(`[seed:from-csv]   集合場所: ${pickupLocations.length}件`);
  console.log(`[seed:from-csv]   目的地: ${destinations.length}件`);
  console.log(`[seed:from-csv]   家庭: ${families.length}件`);
  console.log(`[seed:from-csv]   子供: ${children.length}件`);
  console.log(`[seed:from-csv]   イベント: ${events.length}件`);
}

try {
  main();
} catch (error) {
  console.error('[seed:from-csv] 変換に失敗しました:', error instanceof Error ? error.message : error);
  process.exit(1);
}
