/**
 * Firestore のコレクション名およびドキュメント・コレクションパス構築用ヘルパー
 */

// ルートコレクション名
export const FIRESTORE_COLLECTIONS = {
  FAMILIES: 'families',
  CHILDREN: 'children',
  PICKUP_LOCATIONS: 'pickupLocations',
  DESTINATIONS: 'destinations',
  EVENTS: 'events',
  STAFF_USERS: 'staffUsers',
} as const;

// サブコレクション名
export const FIRESTORE_SUB_COLLECTIONS = {
  RESPONSES: 'responses',
  CARPOOLS: 'carpools',
} as const;

export const firestorePaths = {
  /**
   * families コレクションパス
   */
  familiesCollection: () => FIRESTORE_COLLECTIONS.FAMILIES,

  /**
   * family ドキュメントパス
   */
  familyDocument: (familyId: string) => `${FIRESTORE_COLLECTIONS.FAMILIES}/${familyId}`,

  /**
   * children コレクションパス
   */
  childrenCollection: () => FIRESTORE_COLLECTIONS.CHILDREN,

  /**
   * child ドキュメントパス
   */
  childDocument: (childId: string) => `${FIRESTORE_COLLECTIONS.CHILDREN}/${childId}`,

  /**
   * pickupLocations コレクションパス
   */
  pickupLocationsCollection: () => FIRESTORE_COLLECTIONS.PICKUP_LOCATIONS,

  /**
   * pickupLocation ドキュメントパス
   */
  pickupLocationDocument: (locationId: string) => `${FIRESTORE_COLLECTIONS.PICKUP_LOCATIONS}/${locationId}`,

  /**
   * destinations コレクションパス
   */
  destinationsCollection: () => FIRESTORE_COLLECTIONS.DESTINATIONS,

  /**
   * destination ドキュメントパス
   */
  destinationDocument: (destinationId: string) => `${FIRESTORE_COLLECTIONS.DESTINATIONS}/${destinationId}`,

  /**
   * events コレクションパス
   */
  eventsCollection: () => FIRESTORE_COLLECTIONS.EVENTS,

  /**
   * event ドキュメントパス
   */
  eventDocument: (eventId: string) => `${FIRESTORE_COLLECTIONS.EVENTS}/${eventId}`,

  /**
   * responses コレクションパス (Event配下)
   */
  responsesCollection: (eventId: string) => `${FIRESTORE_COLLECTIONS.EVENTS}/${eventId}/${FIRESTORE_SUB_COLLECTIONS.RESPONSES}`,

  /**
   * response ドキュメントパス (Event配下)
   */
  responseDocument: (eventId: string, familyId: string) => `${firestorePaths.responsesCollection(eventId)}/${familyId}`,

  /**
   * carpools コレクションパス (Event配下)
   */
  carpoolsCollection: (eventId: string) => `${FIRESTORE_COLLECTIONS.EVENTS}/${eventId}/${FIRESTORE_SUB_COLLECTIONS.CARPOOLS}`,

  /**
   * carpool ドキュメントパス (Event配下)
   */
  carpoolDocument: (eventId: string, carpoolId: string) => `${firestorePaths.carpoolsCollection(eventId)}/${carpoolId}`,

  /**
   * staffUsers コレクションパス
   */
  staffUsersCollection: () => FIRESTORE_COLLECTIONS.STAFF_USERS,

  /**
   * staffUser ドキュメントパス
   */
  staffUserDocument: (uid: string) => `${FIRESTORE_COLLECTIONS.STAFF_USERS}/${uid}`,
} as const;
