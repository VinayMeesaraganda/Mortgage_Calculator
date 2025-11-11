// Authentication Context for Firebase Auth
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signup: (username: string, password: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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

  // Signup function - username and password only
  const signup = async (username: string, password: string) => {
    try {
      // Validate username
      if (!username || username.trim().length < 3) {
        throw new Error('Username must be at least 3 characters long');
      }

      // Check if username already exists
      const email = generateEmail(username);
      
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
        email: email,
        createdAt: new Date().toISOString()
      };

      // Store in users collection with UID
      await setDoc(doc(db, 'users', user.uid), userProfileData);
      
      // Also store username lookup for quick username check
      await setDoc(doc(db, 'usernames', username.trim().toLowerCase()), {
        uid: user.uid,
        email: email
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
  const login = async (username: string, password: string) => {
    try {
      // Generate email from username
      const email = generateEmail(username);
      
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
    userProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

