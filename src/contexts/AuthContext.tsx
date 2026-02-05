// Authentication Context for Firebase Auth
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updateEmail,
  updatePassword,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signup: (username: string, email: string, password: string) => Promise<void>;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (identifier: string) => Promise<void>;
  updateUsername: (newUsername: string) => Promise<void>;
  updateAccountEmail: (newEmail: string, currentPassword: string) => Promise<void>;
  updateAccountPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (currentPassword: string) => Promise<void>;
  userProfile: UserProfile | null;
}

interface UserProfile {
  username: string;
  email?: string; // Internal email, not shown to user
  createdAt: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Generate internal email from username (Firebase requires email)
  const generateEmail = (username: string): string => {
    // Clean username and create internal email
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${cleanUsername}@personal-finance.app`;
  };

  const normalizeUsername = (username: string) => username.trim().toLowerCase();

  const lookupEmailForUsername = async (username: string): Promise<string> => {
    const key = normalizeUsername(username);
    const usernameDoc = await getDoc(doc(db, 'usernames', key));
    if (usernameDoc.exists()) {
      const data = usernameDoc.data() as { email?: string };
      if (data?.email) {
        return data.email;
      }
    }
    return generateEmail(username);
  };

  // Signup function - username and password only
  const signup = async (username: string, email: string, password: string) => {
    try {
      // Validate username
      if (!username || username.trim().length < 3) {
        throw new Error('Username must be at least 3 characters long');
      }

      if (!email || !email.includes('@')) {
        throw new Error('Please provide a valid email address');
      }

      const usernameKey = normalizeUsername(username);
      const existingUsername = await getDoc(doc(db, 'usernames', usernameKey));
      if (existingUsername.exists()) {
        throw new Error('Username is already taken');
      }
      
      // Try to create user with generated email
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile with username
      await updateProfile(user, {
        displayName: username
      });

      // Store user profile in Firestore with username as key for lookup
      const userProfileData = {
        username: username.trim(),
        email,
        createdAt: new Date().toISOString()
      };

      // Store in users collection with UID
      await setDoc(doc(db, 'users', user.uid), userProfileData);
      
      // Also store username lookup for quick username check
      await setDoc(doc(db, 'usernames', usernameKey), {
        uid: user.uid,
        email
      });

      setUserProfile(userProfileData);
    } catch (error: any) {
      // Handle Firebase errors
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Username is already taken');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid username format');
      }
      throw new Error(error.message || 'Failed to create account');
    }
  };

  // Login function - username and password only
  const login = async (identifier: string, password: string) => {
    try {
      if (!identifier || !password) {
        throw new Error('Please enter your login details');
      }

      const email = identifier.includes('@')
        ? identifier.trim().toLowerCase()
        : await lookupEmailForUsername(identifier);
      
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      // Handle Firebase errors
      if (error.code === 'auth/user-not-found') {
        throw new Error('Username or password is incorrect');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Username or password is incorrect');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid username format');
      }
      throw new Error(error.message || 'Failed to login');
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to logout');
    }
  };

  const sendPasswordReset = async (identifier: string) => {
    try {
      if (!identifier) {
        throw new Error('Please enter your username or email');
      }
      const email = identifier.includes('@')
        ? identifier.trim().toLowerCase()
        : await lookupEmailForUsername(identifier);
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send reset email');
    }
  };

  const updateUsername = async (newUsername: string) => {
    if (!currentUser) throw new Error('No authenticated user');
    if (!newUsername || newUsername.trim().length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(newUsername.trim())) {
      throw new Error('Username can only contain letters, numbers, underscores, and hyphens');
    }

    const newKey = normalizeUsername(newUsername);
    const existing = await getDoc(doc(db, 'usernames', newKey));
    if (existing.exists()) {
      const existingData = existing.data() as { uid?: string };
      if (existingData.uid && existingData.uid !== currentUser.uid) {
        throw new Error('Username is already taken');
      }
    }

    const oldKey = userProfile?.username ? normalizeUsername(userProfile.username) : null;

    const batch = writeBatch(db);
    if (oldKey && oldKey !== newKey) {
      batch.delete(doc(db, 'usernames', oldKey));
    }
    batch.set(doc(db, 'usernames', newKey), {
      uid: currentUser.uid,
      email: currentUser.email
    });
    batch.update(doc(db, 'users', currentUser.uid), {
      username: newUsername.trim()
    });

    await batch.commit();
    await updateProfile(currentUser, { displayName: newUsername.trim() });
    setUserProfile((prev) => prev ? { ...prev, username: newUsername.trim() } : prev);
  };

  const updateAccountEmail = async (newEmail: string, currentPassword: string) => {
    if (!currentUser || !currentUser.email) throw new Error('No authenticated user');
    if (!newEmail || !newEmail.includes('@')) throw new Error('Please enter a valid email');
    if (!currentPassword) throw new Error('Please enter your current password');

    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);
    await updateEmail(currentUser, newEmail.trim().toLowerCase());

    await updateDoc(doc(db, 'users', currentUser.uid), {
      email: newEmail.trim().toLowerCase()
    });

    if (userProfile?.username) {
      await updateDoc(doc(db, 'usernames', normalizeUsername(userProfile.username)), {
        email: newEmail.trim().toLowerCase()
      });
    }

    setUserProfile((prev) => prev ? { ...prev, email: newEmail.trim().toLowerCase() } : prev);
  };

  const updateAccountPassword = async (currentPassword: string, newPassword: string) => {
    if (!currentUser || !currentUser.email) throw new Error('No authenticated user');
    if (!currentPassword) throw new Error('Please enter your current password');
    if (!newPassword || newPassword.length < 6) throw new Error('Password must be at least 6 characters');

    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);
    await updatePassword(currentUser, newPassword);
  };

  const deleteAccount = async (currentPassword: string) => {
    if (!currentUser || !currentUser.email) throw new Error('No authenticated user');
    if (!currentPassword) throw new Error('Please enter your current password');

    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);

    if (userProfile?.username) {
      await deleteDoc(doc(db, 'usernames', normalizeUsername(userProfile.username)));
    }
    await deleteDoc(doc(db, 'users', currentUser.uid));
    await deleteUser(currentUser);
    setUserProfile(null);
  };

  // Load user profile from Firestore
  const loadUserProfile = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data() as UserProfile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await loadUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    loading,
    signup,
    login,
    logout,
    sendPasswordReset,
    updateUsername,
    updateAccountEmail,
    updateAccountPassword,
    deleteAccount,
    userProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
