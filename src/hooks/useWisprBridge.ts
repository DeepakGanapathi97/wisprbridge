"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, isSupabaseConfigured, Session, Prompt } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

const LOCAL_STORAGE_SESSION_KEY = "wisprbridge_session_id";
const LOCAL_STORAGE_PAIR_CODE_KEY = "wisprbridge_pair_code";
const LOCAL_STORAGE_AUTO_COPY_KEY = "wisprbridge_auto_copy";
const LOCAL_STORAGE_MOCK_PROMPTS_KEY = "wisprbridge_mock_prompts";
const LOCAL_STORAGE_MOCK_USER_KEY = "wisprbridge_mock_user";

export function useWisprBridge() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [pairCode, setPairCode] = useState<string>("");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [autoCopyEnabled, setAutoCopyEnabled] = useState<boolean>(false);
  const [copyFeedbackId, setCopyFeedbackId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "kept">("all");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const lastPromptIdRef = useRef<string | null>(null);
  const autoCopyRef = useRef<boolean>(false);
  autoCopyRef.current = autoCopyEnabled;

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  // Initialize autoCopy preference
  useEffect(() => {
    const savedAutoCopy = localStorage.getItem(LOCAL_STORAGE_AUTO_COPY_KEY);
    if (savedAutoCopy !== null) {
      setAutoCopyEnabled(savedAutoCopy === "true");
    }
  }, []);

  const toggleAutoCopy = useCallback(() => {
    setAutoCopyEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(LOCAL_STORAGE_AUTO_COPY_KEY, String(next));
      showToast(next ? "Auto-Copy enabled: Incoming prompts copy instantly" : "Auto-Copy disabled");
      return next;
    });
  }, [showToast]);

  const generateRandomCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Helper to trigger clipboard copy
  const copyToClipboard = useCallback(
    async (text: string, id?: string, isAuto: boolean = false) => {
      try {
        await navigator.clipboard.writeText(text);
        if (id) {
          setCopyFeedbackId(id);
          setTimeout(() => {
            setCopyFeedbackId((current) => (current === id ? null : current));
          }, 2000);
        }
        showToast(isAuto ? "⚡ Auto-copied new prompt to clipboard!" : "📋 Copied prompt to clipboard!");
        
        if (id) {
          setPrompts((prev) =>
            prev.map((p) => (p.id === id ? { ...p, copied_count: p.copied_count + 1 } : p))
          );
          if (isSupabaseConfigured() && supabase) {
            supabase
              .from("wispr_prompts")
              .update({ copied_count: (prompts.find((p) => p.id === id)?.copied_count || 0) + 1 })
              .eq("id", id)
              .then();
          }
        }
      } catch (err) {
        console.error("Clipboard copy failed:", err);
        showToast("⚠️ Please click to allow clipboard access");
      }
    },
    [prompts, showToast]
  );

  // Fetch prompts for an active session
  const fetchPrompts = useCallback(async (sessionId: string) => {
    if (!sessionId) return;

    if (!isSupabaseConfigured() || !supabase) {
      const stored = localStorage.getItem(`${LOCAL_STORAGE_MOCK_PROMPTS_KEY}_${sessionId}`);
      if (stored) {
        try {
          const parsed: Prompt[] = JSON.parse(stored);
          const now = Date.now();
          const valid = parsed.filter((p) => p.is_kept || new Date(p.expires_at).getTime() > now);
          setPrompts(valid);
        } catch {
          setPrompts([]);
        }
      }
      return;
    }

    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("wispr_prompts")
        .select("*")
        .eq("session_id", sessionId)
        .or(`is_kept.eq.true,expires_at.gt.${nowIso}`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching prompts:", error.message);
        return;
      }

      if (data) {
        setPrompts(data as Prompt[]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }, []);

  // Listen to Supabase Auth state changes
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      const storedUser = localStorage.getItem(LOCAL_STORAGE_MOCK_USER_KEY);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          setUser(null);
        }
      }
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, authSession) => {
        setUser(authSession?.user ?? null);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Initialize or pair session
  const initSession = useCallback(async (forcedPairCode?: string, forceGuestCreate: boolean = false) => {
    setLoading(true);

    let targetPairCode = forcedPairCode;
    if (!targetPairCode && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlCode = urlParams.get("code") || urlParams.get("room");
      if (urlCode && urlCode.replace(/\D/g, "").length === 6) {
        targetPairCode = urlCode.replace(/\D/g, "");
      }
    }

    const savedSessionId = typeof window !== "undefined" ? localStorage.getItem(LOCAL_STORAGE_SESSION_KEY) : null;
    const savedPairCode = typeof window !== "undefined" ? localStorage.getItem(LOCAL_STORAGE_PAIR_CODE_KEY) : null;

    if (!isSupabaseConfigured() || !supabase) {
      // Local simulation mode
      let activeCode = targetPairCode || savedPairCode;
      if (!activeCode && forceGuestCreate) {
        activeCode = generateRandomCode();
      }

      if (activeCode) {
        const mockSession: Session = {
          id: `mock-sess-${activeCode}`,
          pair_code: activeCode,
          device_label: "Wispr Device",
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          is_active: true,
        };

        localStorage.setItem(LOCAL_STORAGE_PAIR_CODE_KEY, activeCode);
        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, mockSession.id);
        setSession(mockSession);
        setPairCode(activeCode);
        setIsConnected(true);
        fetchPrompts(mockSession.id);
      }
      setLoading(false);
      return;
    }

    try {
      let activeSession: Session | null = null;

      if (targetPairCode) {
        // Joining specific room/group code
        const { data, error } = await supabase
          .from("wispr_sessions")
          .select("*")
          .eq("pair_code", targetPairCode)
          .eq("is_active", true)
          .single();

        if (error || !data) {
          throw new Error("Invalid or expired 6-digit room code.");
        }
        activeSession = data as Session;
      } else if (savedSessionId) {
        // Reconnecting to previously joined room
        const { data } = await supabase
          .from("wispr_sessions")
          .select("*")
          .eq("id", savedSessionId)
          .eq("is_active", true)
          .single();

        if (data) {
          activeSession = data as Session;
        }
      } else if (forceGuestCreate) {
        // Explicitly requested guest room
        const newCode = generateRandomCode();
        const { data, error } = await supabase
          .from("wispr_sessions")
          .insert({
            pair_code: newCode,
            device_label: "Wispr Guest Session",
          })
          .select()
          .single();

        if (error || !data) throw error;
        activeSession = data as Session;
      }

      if (activeSession) {
        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, activeSession.id);
        localStorage.setItem(LOCAL_STORAGE_PAIR_CODE_KEY, activeSession.pair_code);
        setSession(activeSession);
        setPairCode(activeSession.pair_code);
        setIsConnected(true);
        await fetchPrompts(activeSession.id);
      } else {
        // Not in any room yet
        setSession(null);
        setPairCode("");
        setPrompts([]);
      }
    } catch (err: unknown) {
      console.error("Session init error:", err);
      const message = err instanceof Error ? err.message : "Failed to connect room";
      showToast(message);
    } finally {
      setLoading(false);
    }
  }, [fetchPrompts, showToast]);

  // Connect to an existing pair code
  const pairWithCode = async (code: string) => {
    const cleanCode = code.trim().replace(/\D/g, "");
    if (cleanCode.length !== 6) {
      showToast("Room code must be 6 digits");
      return false;
    }
    try {
      await initSession(cleanCode);
      showToast(`✨ Connected to room #${cleanCode}`);
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Pairing failed";
      showToast(`❌ ${msg}`);
      return false;
    }
  };

  // Sign In or Sign Up method
  const signInOrSignUp = async (email: string, pass: string, isSignUpMode: boolean) => {
    if (!isSupabaseConfigured() || !supabase) {
      const mockUser = { id: `user-${Date.now()}`, email } as User;
      setUser(mockUser);
      localStorage.setItem(LOCAL_STORAGE_MOCK_USER_KEY, JSON.stringify(mockUser));
      showToast(`✨ Welcome, ${email}!`);
      await initSession(undefined, true);
      return { success: true };
    }

    try {
      if (isSignUpMode) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pass,
        });
        if (error) throw error;
        if (data.user) {
          setUser(data.user);
          showToast("🎉 Account created! Signed in successfully.");
          await initSession(undefined, true);
          return { success: true };
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: pass,
        });
        if (error) {
          // If credentials don't exist, automatically sign up as requested
          if (error.message.toLowerCase().includes("invalid login credentials")) {
            const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
              email,
              password: pass,
            });
            if (!signUpErr && signUpData.user) {
              setUser(signUpData.user);
              showToast("🎉 Account automatically created & signed in!");
              await initSession(undefined, true);
              return { success: true };
            }
          }
          throw error;
        }
        if (data.user) {
          setUser(data.user);
          showToast(`👋 Welcome back, ${email}!`);
          await initSession(undefined, true);
          return { success: true };
        }
      }
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication error";
      return { success: false, error: msg };
    }
  };

  // Sign Out
  const signOut = async () => {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setPairCode("");
    setPrompts([]);
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    localStorage.removeItem(LOCAL_STORAGE_PAIR_CODE_KEY);
    localStorage.removeItem(LOCAL_STORAGE_MOCK_USER_KEY);
    showToast("Signed out successfully");
  };

  // Leave room (returns to gateway)
  const leaveRoom = () => {
    setSession(null);
    setPairCode("");
    setPrompts([]);
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    localStorage.removeItem(LOCAL_STORAGE_PAIR_CODE_KEY);
    showToast("Left room");
  };

  // Create a brand new session code
  const createNewPairCode = async () => {
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    localStorage.removeItem(LOCAL_STORAGE_PAIR_CODE_KEY);
    await initSession(undefined, true);
    showToast("🔑 Generated new 6-digit room code");
  };

  // Add a new prompt
  const addPrompt = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !session) return;

    const newPromptData: Prompt = {
      id: `prompt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      session_id: session.id,
      text: trimmed,
      is_kept: false,
      copied_count: 0,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };

    if (!isSupabaseConfigured() || !supabase) {
      const updated = [newPromptData, ...prompts];
      setPrompts(updated);
      localStorage.setItem(
        `${LOCAL_STORAGE_MOCK_PROMPTS_KEY}_${session.id}`,
        JSON.stringify(updated)
      );
      showToast("✨ Prompt synced!");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("wispr_prompts")
        .insert({
          session_id: session.id,
          text: trimmed,
          is_kept: false,
        })
        .select()
        .single();

      if (error) {
        showToast("Error saving prompt: " + error.message);
      } else if (data) {
        showToast("✨ Prompt synced to laptop!");
      }
    } catch (err) {
      console.error("Add prompt error:", err);
    }
  };

  // Toggle Keep status
  const toggleKeep = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setPrompts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_kept: nextStatus } : p))
    );

    if (selectedPrompt && selectedPrompt.id === id) {
      setSelectedPrompt((prev) => (prev ? { ...prev, is_kept: nextStatus } : null));
    }

    showToast(nextStatus ? "⭐ Marked as Kept (won't auto-delete)" : "⏳ 1-Hour self-destruct active");

    if (!isSupabaseConfigured() || !supabase) {
      if (session) {
        const stored = prompts.map((p) => (p.id === id ? { ...p, is_kept: nextStatus } : p));
        localStorage.setItem(
          `${LOCAL_STORAGE_MOCK_PROMPTS_KEY}_${session.id}`,
          JSON.stringify(stored)
        );
      }
      return;
    }

    try {
      await supabase.from("wispr_prompts").update({ is_kept: nextStatus }).eq("id", id);
    } catch (err) {
      console.error("Keep update error:", err);
    }
  };

  // Delete prompt
  const deletePrompt = async (id: string) => {
    setPrompts((prev) => prev.filter((p) => p.id !== id));
    if (selectedPrompt?.id === id) {
      setSelectedPrompt(null);
    }
    showToast("🗑️ Prompt deleted");

    if (!isSupabaseConfigured() || !supabase) {
      if (session) {
        const filtered = prompts.filter((p) => p.id !== id);
        localStorage.setItem(
          `${LOCAL_STORAGE_MOCK_PROMPTS_KEY}_${session.id}`,
          JSON.stringify(filtered)
        );
      }
      return;
    }

    try {
      await supabase.from("wispr_prompts").delete().eq("id", id);
    } catch (err) {
      console.error("Delete prompt error:", err);
    }
  };

  // Initial load
  useEffect(() => {
    initSession();
  }, [initSession]);

  // Realtime subscription setup
  useEffect(() => {
    if (!session?.id || !isSupabaseConfigured() || !supabase) return;

    const channel = supabase
      .channel(`wispr_prompts_${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "wispr_prompts",
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          const newPrompt = payload.new as Prompt;
          setPrompts((prev) => {
            if (prev.some((p) => p.id === newPrompt.id)) return prev;
            return [newPrompt, ...prev];
          });

          if (autoCopyRef.current && lastPromptIdRef.current !== newPrompt.id) {
            lastPromptIdRef.current = newPrompt.id;
            copyToClipboard(newPrompt.text, newPrompt.id, true);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "wispr_prompts",
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          const updated = payload.new as Prompt;
          setPrompts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          if (selectedPrompt?.id === updated.id) {
            setSelectedPrompt(updated);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "wispr_prompts",
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          const deletedId = (payload.old as { id: string })?.id;
          if (deletedId) {
            setPrompts((prev) => prev.filter((p) => p.id !== deletedId));
            if (selectedPrompt?.id === deletedId) {
              setSelectedPrompt(null);
            }
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [session?.id, copyToClipboard, selectedPrompt?.id]);

  // Heartbeat Polling: Refresh every 5 seconds
  useEffect(() => {
    if (!session?.id) return;

    const interval = setInterval(() => {
      fetchPrompts(session.id);
    }, 5000);

    return () => clearInterval(interval);
  }, [session?.id, fetchPrompts]);

  // Periodic TTL check (every 10 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setPrompts((prev) =>
        prev.filter((p) => p.is_kept || new Date(p.expires_at).getTime() > now)
      );
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  const filteredPrompts = prompts.filter((p) => {
    if (activeTab === "kept") return p.is_kept;
    return true;
  });

  return {
    user,
    session,
    pairCode,
    prompts: filteredPrompts,
    totalPromptsCount: prompts.length,
    keptPromptsCount: prompts.filter((p) => p.is_kept).length,
    loading,
    isConnected,
    autoCopyEnabled,
    toggleAutoCopy,
    copyFeedbackId,
    toastMessage,
    selectedPrompt,
    setSelectedPrompt,
    activeTab,
    setActiveTab,
    isAuthModalOpen,
    setIsAuthModalOpen,
    addPrompt,
    toggleKeep,
    deletePrompt,
    copyToClipboard,
    pairWithCode,
    createNewPairCode,
    signInOrSignUp,
    signOut,
    leaveRoom,
    startGuestRoom: () => initSession(undefined, true),
    isInRoom: Boolean(session && pairCode),
    isSupabaseConfigured: isSupabaseConfigured(),
  };
}
