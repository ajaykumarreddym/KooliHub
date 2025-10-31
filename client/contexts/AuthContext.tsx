import { getProfile, isAdmin, supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "admin" | "user" | "guest";
  phone: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdminUser: boolean;
  profileError: string | null;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, fullName?: string) => Promise<any>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearProfileError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  isAuthenticated: false,
  isAdminUser: false,
  profileError: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
  clearProfileError: () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const isRefreshingRef = useRef(false);

  const clearProfileError = () => {
    setProfileError(null);
    retryCountRef.current = 0;
  };

  const refreshProfile = async () => {
    if (
      !user ||
      isRefreshingRef.current ||
      retryCountRef.current >= maxRetries
    ) {
      return;
    }

    isRefreshingRef.current = true;

    try {
      console.log(
        "Fetching profile for user:",
        user.id,
        "Retry:",
        retryCountRef.current,
      );
      setProfileError(null);

      const profileData = await getProfile(user.id);
      console.log("Profile data fetched:", profileData);
      setProfile(profileData);
      retryCountRef.current = 0; // Reset retry count on success

      const adminStatus = await isAdmin(user.id);
      console.log("Admin status:", adminStatus);
      setIsAdminUser(adminStatus);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Error fetching profile:", {
        message: errorMessage,
        errorType: typeof error,
        userId: user.id,
        userEmail: user.email,
        retryCount: retryCountRef.current,
        fullError: error,
      });

      setProfileError(errorMessage);
      retryCountRef.current += 1;

      // Check if it's a database connection error or table missing
      if (
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("Could not find the table") ||
        errorMessage.includes('relation "public.profiles" does not exist') ||
        errorMessage.includes("net::ERR_INSUFFICIENT_RESOURCES")
      ) {
        console.warn(
          "Database connection issues or tables not found - using fallback values",
        );
        setProfile(null);
        setIsAdminUser(user.email === "hello.krsolutions@gmail.com");
        setProfileError("Database not set up. Please run the database setup.");
        isRefreshingRef.current = false;
        return;
      }

      // If profile doesn't exist, try to create it (but only if database is accessible)
      if (
        errorMessage.includes("No rows returned") &&
        retryCountRef.current < 2
      ) {
        console.log("Profile not found, creating new profile...");
        try {
          await createUserProfile(user);
          // Retry fetching profile
          const profileData = await getProfile(user.id);
          setProfile(profileData);
          retryCountRef.current = 0;
          const adminStatus = await isAdmin(user.id);
          setIsAdminUser(adminStatus);
          setProfileError(null);
        } catch (createError) {
          console.error("Error creating profile:", createError);
          setProfile(null);
          setIsAdminUser(user.email === "hello.krsolutions@gmail.com");
          setProfileError("Failed to create user profile");
        }
      } else {
        // Only use email fallback if we absolutely can't get the profile
        setProfile(null);
        setIsAdminUser(user.email === "hello.krsolutions@gmail.com");

        if (retryCountRef.current >= maxRetries) {
          setProfileError(
            "Max retries reached. Please check your database setup.",
          );
        }
      }
    } finally {
      isRefreshingRef.current = false;
    }
  };

  const createUserProfile = async (user: User) => {
    console.log("Creating profile for user:", user.email);

    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email || "",
          full_name: user.user_metadata?.full_name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          phone: user.user_metadata?.phone || null,
          role: user.email === "hello.krsolutions@gmail.com" ? "admin" : "user",
        },
        {
          onConflict: "id",
        },
      )
      .select()
      .single();

    if (error) {
      console.error("Error creating profile:", error);
      throw error;
    }

    console.log("Profile created/updated:", data);
    return data;
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        refreshProfile();
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Reset retry count on auth state change
      retryCountRef.current = 0;
      isRefreshingRef.current = false;

      if (session?.user) {
        await refreshProfile();
      } else {
        setProfile(null);
        setIsAdminUser(false);
        setProfileError(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []); // Remove user dependency to prevent infinite loops

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsAdminUser(false);
    setProfileError(null);
    retryCountRef.current = 0;
    isRefreshingRef.current = false;
    
    // Clear location data from localStorage on logout
    localStorage.removeItem('userLocation');
    
    // Clear cart data on logout
    localStorage.removeItem('cart');
    
    // Clear any other user-specific data
    localStorage.removeItem('wishlist');
  };

  const value = {
    user,
    profile,
    session,
    loading,
    isAuthenticated: !!user,
    isAdminUser,
    profileError,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    clearProfileError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
