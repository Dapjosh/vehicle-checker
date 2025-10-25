import { doc, getDoc, setDoc, collection, query, getDocs, where, orderBy, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { UserData, InspectionCategory, Organization, InspectionReport } from './definitions';
import { defaultInspectionCategories } from './definitions';
import { SUPER_ADMIN_UID } from './config';

/**
 * Retrieves user data from the Firestore 'users' collection.
 * It also handles the special case for the Super Admin.
 * @param uid The user's Firebase Authentication UID.
 * @returns A UserData object or null if the user document is not found.
 */
export async function getUserData(uid: string): Promise<UserData | null> {
    if (!uid) return null;

    if (SUPER_ADMIN_UID && uid === SUPER_ADMIN_UID) {
        return {
            uid: SUPER_ADMIN_UID,
            email: 'super@admin.com', // This can be a placeholder
            role: 'super_admin',
            orgId: 'SUPER_ORG',
            displayName: 'Super Admin',
        };
    }
    
    try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            return userSnap.data() as UserData;
        }

        console.warn(`[getUserData] No user document found for UID: ${uid}. This may be expected during signup.`);
        return null;

    } catch (error) {
        console.error(`[getUserData] Error fetching user document for UID ${uid}:`, error);
        return null;
    }
}


export async function getOrgUsers(orgId: string): Promise<UserData[]> {
    if (orgId === 'SUPER_ORG') {
        return []; // Super admin org has no other members.
    }
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('orgId', '==', orgId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as UserData);
}


// Checklist Management
export async function getChecklist(orgId: string): Promise<InspectionCategory[]> {
  // Super Admins don't have their own checklist; they see the default template.
  if (orgId === 'SUPER_ORG') {
      return defaultInspectionCategories;
  }
  
  const checklistRef = doc(db, `organizations/${orgId}/checklist/config`);
  
  try {
    const docSnap = await getDoc(checklistRef);

    if (docSnap.exists() && docSnap.data().categories) {
      return docSnap.data().categories as InspectionCategory[];
    } else {
      await setChecklist(orgId, defaultInspectionCategories);
      return defaultInspectionCategories;
    }
  } catch (error) {
    console.error("[getChecklist] Error getting or creating checklist:", error);
    return defaultInspectionCategories;
  }
}

export async function setChecklist(orgId: string, categories: InspectionCategory[]): Promise<void> {
  if (orgId === 'SUPER_ORG') return; // Do not write checklists for the super org.
  const checklistRef = doc(db, `organizations/${orgId}/checklist/config`);
  await setDoc(checklistRef, { categories });
}

export async function getInspectionReports(orgId: string): Promise<InspectionReport[]> {
    if (!orgId || orgId === 'SUPER_ORG') {
        return [];
    }
    const reportsRef = collection(db, `organizations/${orgId}/inspections`);
    const q = query(reportsRef, orderBy('submittedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InspectionReport));
}

/**
 * Checks if the SUPER_ORG document exists and creates it if it doesn't.
 * This is a critical function to ensure the Super Admin can operate.
 * @param superAdminUid The UID of the Super Admin.
 */
export async function ensureSuperOrgExists(superAdminUid: string): Promise<void> {
  const superOrgRef = doc(db, 'organizations', 'SUPER_ORG');
  try {
    const docSnap = await getDoc(superOrgRef);
    if (!docSnap.exists()) {
      console.log("SUPER_ORG document not found. Creating it now...");
      await setDoc(superOrgRef, {
        name: 'Super Admin Organization',
        createdAt: serverTimestamp(),
        createdBy: superAdminUid,
      });
      console.log("SUPER_ORG document created successfully.");
    }
  } catch (error) {
    console.error("Error ensuring SUPER_ORG exists:", error);
  }
}
