import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  onSnapshot,
  getDocFromServer,
  query,
  where
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Product, Order, BotSettings, CustomerLead, AppointmentBooking } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with explicit database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Error Handling Specification
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
  return errInfo;
}

// Test initial connection as required by specification
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or internet connection.");
    }
  }
}
testConnection();

// ================= MULTI-TENANT CLOUD REPOSITORY =================

/**
 * Sync or update merchant profile in Firestore
 */
export async function syncUserProfile(user: FirebaseUser, extra: { name?: string; storeName?: string; industry?: string; role?: string }) {
  const userRef = doc(db, 'users', user.uid);
  try {
    const existing = await getDoc(userRef);
    if (!existing.exists()) {
      const payload = {
        uid: user.uid,
        email: user.email || '',
        name: extra.name || user.displayName || 'Merchant',
        storeName: extra.storeName || `${user.displayName || 'My'} Store`,
        industry: extra.industry || 'fashion',
        role: extra.role || 'merchant',
        planTier: 'starter',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(userRef, payload);
      return payload;
    } else {
      return existing.data();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    return null;
  }
}

/**
 * Seed initial catalog to Firestore if the merchant's store is fresh
 */
export async function seedInitialStoreProducts(storeId: string, initialProducts: Product[]) {
  if (!initialProducts || initialProducts.length === 0) return;
  try {
    for (const prod of initialProducts) {
      const prodRef = doc(db, 'stores', storeId, 'products', prod.id);
      await setDoc(prodRef, {
        ...prod,
        storeId,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  } catch (err) {
    console.warn('[Firestore] Notice during initial seeding:', err);
  }
}

/**
 * Subscribe to merchant store products in Firestore
 */
export function subscribeToStoreProducts(
  storeId: string, 
  onUpdate: (products: Product[]) => void,
  fallbackSeed?: Product[]
) {
  const collRef = collection(db, 'stores', storeId, 'products');
  let hasSeeded = false;

  return onSnapshot(collRef, async (snapshot) => {
    const items: Product[] = [];
    snapshot.forEach(d => {
      items.push(d.data() as Product);
    });

    if (items.length > 0) {
      onUpdate(items);
    } else if (snapshot.empty && fallbackSeed && fallbackSeed.length > 0 && !hasSeeded) {
      hasSeeded = true;
      // Seed initial products so the merchant starts with a rich catalog
      await seedInitialStoreProducts(storeId, fallbackSeed);
      onUpdate(fallbackSeed);
    }
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, `stores/${storeId}/products`);
  });
}

/**
 * Save product to Firestore for the active merchant store
 */
export async function saveStoreProduct(storeId: string, product: Product) {
  const prodRef = doc(db, 'stores', storeId, 'products', product.id);
  try {
    await setDoc(prodRef, {
      ...product,
      storeId,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `stores/${storeId}/products/${product.id}`);
    return false;
  }
}

/**
 * Delete product from Firestore
 */
export async function deleteStoreProduct(storeId: string, productId: string) {
  const prodRef = doc(db, 'stores', storeId, 'products', productId);
  try {
    await deleteDoc(prodRef);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `stores/${storeId}/products/${productId}`);
    return false;
  }
}

/**
 * Subscribe to merchant store orders in Firestore
 */
export function subscribeToStoreOrders(storeId: string, onUpdate: (orders: Order[]) => void) {
  const collRef = collection(db, 'stores', storeId, 'orders');
  return onSnapshot(collRef, (snapshot) => {
    const items: Order[] = [];
    snapshot.forEach(d => {
      items.push(d.data() as Order);
    });
    if (items.length > 0) {
      onUpdate(items);
    }
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, `stores/${storeId}/orders`);
  });
}

/**
 * Save or update order in Firestore
 */
export async function saveStoreOrder(storeId: string, order: Order) {
  const orderRef = doc(db, 'stores', storeId, 'orders', order.id);
  try {
    await setDoc(orderRef, {
      ...order,
      storeId,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `stores/${storeId}/orders/${order.id}`);
    return false;
  }
}

/**
 * Save merchant store settings to Firestore
 */
export async function saveStoreSettings(storeId: string, settings: BotSettings) {
  const setRef = doc(db, 'stores', storeId, 'settings', 'current');
  try {
    await setDoc(setRef, {
      ...settings,
      storeId,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `stores/${storeId}/settings/current`);
    return false;
  }
}

/**
 * Load merchant store settings from Firestore
 */
export async function loadStoreSettings(storeId: string): Promise<Partial<BotSettings> | null> {
  const setRef = doc(db, 'stores', storeId, 'settings', 'current');
  try {
    const snap = await getDoc(setRef);
    if (snap.exists()) {
      return snap.data() as Partial<BotSettings>;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `stores/${storeId}/settings/current`);
  }
  return null;
}
