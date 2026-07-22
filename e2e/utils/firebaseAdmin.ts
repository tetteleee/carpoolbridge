import * as admin from 'firebase-admin';

const EMULATOR_PROJECT_ID = 'demo-carpoolbridge-e2e';

/**
 * Firestore Emulatorへ直接書き込むためのAdmin SDKインスタンスを取得する。
 * Admin SDKはFirestore Security Rulesの影響を受けないため、
 * 本来は管理者がFirebase Consoleから行うstaffUsers登録を、
 * Security Rulesを介さずにテストコードから再現できる。
 */
export function getEmulatorFirestore() {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

  const app =
    admin.apps.find((a) => a?.name === 'e2e') ??
    admin.initializeApp({ projectId: EMULATOR_PROJECT_ID }, 'e2e');

  return app.firestore();
}
