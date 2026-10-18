import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { User } from 'firebase/auth'
import { db } from '@/config/firebase'
import { UserPlanTier } from '@/types/auth'
import { uidTagOf } from '@/config/planCatalog'
import { cleanFirestoreDoc } from './cloudProjectService'
import { API_BASE } from '@/config/api'

/**
 * Enterprise-Grade Cloud Sync Service for User Identity & Plan Tiers
 * Adheres strictly to the "Read-on-Auth / Write-on-Action" pattern
 * to guarantee 0 infinite loops and 0 unexpected billing costs.
 */

export interface CloudUserProfile {
  uid: string
  email: string
  displayName: string
  photoURL?: string | null
  planTier: UserPlanTier
  role: 'user' | 'admin'
  licenseKeyUsed?: string | null
  subscriptionExpiresAt?: string | null
  subscriptionPeriod?: 'monthly' | 'yearly' | 'lifetime'
  subscriptionStatus?: 'active' | 'expired' | 'trial'
  uidTag?: string
  createdAt?: any
  updatedAt?: any
}

/**
 * Read the user's authoritative profile from Firestore ONCE upon login
 * Cost: Exactly 1 Firestore Read per session
 */
export async function fetchUserCloudProfile(user: User): Promise<CloudUserProfile> {
  const userRef = doc(db, 'users', user.uid)
  const uidTag = uidTagOf(user.uid)

  let isSuperAdmin = false
  try {
    const tokenResult = await user.getIdTokenResult()
    isSuperAdmin = Boolean(tokenResult.claims.admin || tokenResult.claims.role === 'admin')

    // Attempt background claims sync with server for auto-provisioning
    try {
      const res = await fetch(`${API_BASE}/api/auth/sync-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenResult.token}`,
        },
      })
      if (res.ok) {
        const serverProfile = await res.json()
        if (serverProfile.claimsUpdated) {
          await user.getIdToken(true)
        }
        if (serverProfile.role === 'admin' || serverProfile.admin) {
          isSuperAdmin = true
        }
      }
    } catch {
      // Non-blocking
    }
  } catch {
    // Non-blocking
  }

  try {
    const snapshot = await getDoc(userRef)

    if (snapshot.exists()) {
      const data = snapshot.data() as Partial<CloudUserProfile>
      const role = isSuperAdmin ? 'admin' : (data.role === 'admin' ? 'admin' : (data.role || 'user'))
      let planTier = data.planTier || (isSuperAdmin ? 'admin' : 'free')

      // Check if subscription has expired
      const expiresAt = data.subscriptionExpiresAt ? new Date(data.subscriptionExpiresAt).getTime() : null
      if (expiresAt && expiresAt < Date.now() && planTier !== 'free' && planTier !== 'admin') {
        planTier = 'free'
      }

      return {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Nhà Sáng Tạo',
        photoURL: user.photoURL || undefined,
        planTier,
        role,
        licenseKeyUsed: data.licenseKeyUsed || null,
        subscriptionExpiresAt: data.subscriptionExpiresAt || null,
        subscriptionPeriod: data.subscriptionPeriod,
        subscriptionStatus: data.subscriptionStatus || (expiresAt && expiresAt < Date.now() ? 'expired' : 'active'),
        uidTag: data.uidTag || uidTag,
      }
    }

    // First-time user: initialize document on cloud
    const newProfile: CloudUserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'Nhà Sáng Tạo',
      photoURL: user.photoURL || null,
      planTier: isSuperAdmin ? 'admin' : 'free',
      role: isSuperAdmin ? 'admin' : 'user',
      licenseKeyUsed: null,
      uidTag,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    await setDoc(userRef, cleanFirestoreDoc(newProfile), { merge: true })
    return newProfile
  } catch (err) {
    console.warn('⚠️ [CloudSync Note]: Firestore read unavailable, fallback to memory/auth:', err)
    return {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'Nhà Sáng Tạo',
      planTier: isSuperAdmin ? 'admin' : 'free',
      role: isSuperAdmin ? 'admin' : 'user',
      uidTag,
    }
  }
}

/**
 * Persist an upgraded plan tier directly to Firestore
 * Triggered ONLY on user action (License Key Redeem or Bank Webhook confirmation)
 * Cost: Exactly 1 Firestore Write
 */
export async function updateUserCloudPlan(
  uid: string,
  tier: UserPlanTier,
  licenseKeyUsed?: string
): Promise<boolean> {
  if (!uid) return false

  try {
    const userRef = doc(db, 'users', uid)
    await setDoc(
      userRef,
      {
        planTier: tier,
        licenseKeyUsed: licenseKeyUsed || null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )
    return true
  } catch (err) {
    console.warn('⚠️ [CloudSync Error]: Failed to persist plan to Firestore:', err)
    return false
  }
}
