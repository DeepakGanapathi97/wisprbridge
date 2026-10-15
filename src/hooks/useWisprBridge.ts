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
  const [hasPendingAutoCopy, setHasPendingAutoCopy] = useState<boolean>(false);
  const [copyFeedbackId, setCopyFeedbackId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "kept">("all");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const pendingCopyRef = useRef<{ id?: string; text: string } | null>(null);
  const lastAutoCopiedIdRef = useRef<string | null>(null);
  const isInitialFetchRef = useRef<boolean>(true);
  const autoCopyRef = useRef<boolean>(false);
  autoCopyRef.current = autoCopyEnabled;

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  // Web Audio pleasant confirmation chime
  const playAutoCopyChime = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch {
      // Audio might be constrained until first user gesture; safe to ignore
    }
  }, []);

  // Robust clipboard writer (Async Clipboard API + execCommand fallback)
  const writeToSystemClipboard = useCallback(async (text: string): Promise<boolean> => {
    // 1. Try modern async Clipboard API
    if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.warn("navigator.clipboard.writeText blocked or failed, attempting fallback:", err);
      }
    }

    // 2. Fallback to synchronous textarea execCommand('copy')
    if (typeof document !== "undefined") {
      try {
        const el = document.createElement("textarea");
        el.value = text;
        el.setAttribute("readonly", "");
        el.style.position = "fixed";
        el.style.top = "-9999px";
        el.style.left = "-9999px";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.focus();
        el.select();
        const success = document.execCommand("copy");
        document.body.removeChild(el);
        if (success) return true;
      } catch (err) {
        console.warn("execCommand fallback failed:", err);
      }
    }

    return false;
  }, []);

  // Increment copied_count for metrics
  const incrementCopiedCount = useCallback((id: string) => {
    setPrompts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, copied_count: (p.copied_count || 0) + 1 } : p))
    );
    if (isSupabaseConfigured() && supabase) {
      const client = supabase;
      client
        .from("wispr_prompts")
        .select("copied_count")
        .eq("id", id)
        .single()
        .then(({ data }) => {
          const currentCount = data?.copied_count ?? 0;
          client
            .from("wispr_prompts")
            .update({ copied_count: currentCount + 1 })
            .eq("id", id)
            .then();
        });
    }
  }, []);

  // Centralized auto-copy execution
  const handleAutoCopy = useCallback(
    async (prompt: Prompt) => {
      if (!autoCopyRef.current) return;
      if (lastAutoCopiedIdRef.current === prompt.id) return;

      const ok = await writeToSystemClipboard(prompt.text);
      if (ok) {
        lastAutoCopiedIdRef.current = prompt.id;
        pendingCopyRef.current = null;
        setHasPendingAutoCopy(false);
        setCopyFeedbackId(prompt.id);
        setTimeout(() => {
          setCopyFeedbackId((curr) => (curr === prompt.id ? null : curr));
        }, 2000);
        showToast("⚡ Auto-copied to clipboard! Ready to paste (Ctrl+V)");
        playAutoCopyChime();
        incrementCopiedCount(prompt.id);
      } else {
        // Tab not focused; queue for auto-copy upon window focus or click
        pendingCopyRef.current = { id: prompt.id, text: prompt.text };
        setHasPendingAutoCopy(true);
        showToast("⚡ New prompt waiting — click window to copy to clipboard");
      }
    },
    [showToast, playAutoCopyChime, writeToSystemClipboard, incrementCopiedCount]
  );

  // Focus and user gesture listener to flush any pending auto-copy
  useEffect(() => {
    const flushPendingCopy = async () => {
      if (!pendingCopyRef.current || !autoCopyRef.current) return;
      const target = pendingCopyRef.current;
      const ok = await writeToSystemClipboard(target.text);
      if (ok) {
        if (target.id) {
          lastAutoCopiedIdRef.current = target.id;
          setCopyFeedbackId(target.id);
          setTimeout(() => {
            setCopyFeedbackId((curr) => (curr === target.id ? null : curr));
          }, 2000);
          incrementCopiedCount(target.id);
        }
        pendingCopyRef.current = null;
        setHasPendingAutoCopy(false);
        showToast("⚡ Auto-copied to clipboard! Ready to paste (Ctrl+V)");
        playAutoCopyChime();
      }
    };

    window.addEventListener("focus", flushPendingCopy);
    window.addEventListener("pointerdown", flushPendingCopy);
    window.addEventListener("keydown", flushPendingCopy);
    const handleVis = () => {
      if (document.visibilityState === "visible") {
        flushPendingCopy();
      }
    };
    document.addEventListener("visibilitychange", handleVis);

    return () => {
      window.removeEventListener("focus", flushPendingCopy);
      window.removeEventListener("pointerdown", flushPendingCopy);
      window.removeEventListener("keydown", flushPendingCopy);
      document.removeEventListener("visibilitychange", handleVis);
    };
  }, [showToast, playAutoCopyChime, writeToSystemClipboard, incrementCopiedCount]);

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
      autoCopyRef.current = next;
      localStorage.setItem(LOCAL_STORAGE_AUTO_COPY_KEY, String(next));

      if (next) {
        // When enabled in active user gesture, immediately flush pending or copy newest prompt
        if (pendingCopyRef.current) {
          const target = pendingCopyRef.current;
          writeToSystemClipboard(target.text).then((ok) => {
            if (ok) {
              if (target.id) lastAutoCopiedIdRef.current = target.id;
              pendingCopyRef.current = null;
              setHasPendingAutoCopy(false);
              showToast("⚡ Auto-copied pending prompt to clipboard!");
              playAutoCopyChime();
            }
          });
        } else if (prompts.length > 0) {
          const newest = prompts[0];
          writeToSystemClipboard(newest.text).then((ok) => {
            if (ok) {
              lastAutoCopiedIdRef.current = newest.id;
              setCopyFeedbackId(newest.id);
              setTimeout(() => {
                setCopyFeedbackId((curr) => (curr === newest.id ? null : curr));
              }, 2000);
              showToast("⚡ Auto-Copy ON: Latest prompt copied to clipboard!");
              playAutoCopyChime();
            } else {
              showToast("Auto-Copy enabled: Incoming prompts copy instantly");
            }
          });
        } else {
          showToast("Auto-Copy enabled: Incoming prompts copy instantly");
        }
      } else {
        pendingCopyRef.current = null;
        setHasPendingAutoCopy(false);
        showToast("Auto-Copy disabled");
      }
      return next;
    });
  }, [prompts, showToast, playAutoCopyChime, writeToSystemClipboard]);

  const generateRandomCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Helper to trigger 1-click clipboard copy
  const copyToClipboard = useCallback(
    async (text: string, id?: string, isAuto: boolean = false) => {
      const success = await writeToSystemClipboard(text);
      if (success) {
        if (id) {
          setCopyFeedbackId(id);
          setTimeout(() => {
            setCopyFeedbackId((current) => (current === id ? null : current));
          }, 2000);
          incrementCopiedCount(id);
        }
        showToast(isAuto ? "⚡ Auto-copied to clipboard! Ready to paste (Ctrl+V)" : "📋 Copied prompt to clipboard!");
        playAutoCopyChime();
      } else {
        showToast("⚠️ Could not access clipboard. Please check browser permissions.");
      }
    },
    [showToast, playAutoCopyChime, writeToSystemClipboard, incrementCopiedCount]
  );

  // Fetch prompts for an active session (evaluated on load & 5s polling)
  const fetchPrompts = useCallback(
    async (sessionId: string) => {
      if (!sessionId) return;

      if (!isSupabaseConfigured() || !supabase) {
        const stored = localStorage.getItem(`${LOCAL_STORAGE_MOCK_PROMPTS_KEY}_${sessionId}`);
        if (stored) {
          try {
            const parsed: Prompt[] = JSON.parse(stored);
            const now = Date.now();
            const valid = parsed.filter((p) => p.is_kept || new Date(p.expires_at).getTime() > now);
            setPrompts(valid);

            if (autoCopyRef.current && valid.length > 0) {
              const newest = valid[0];
              if (!isInitialFetchRef.current && newest.id !== lastAutoCopiedIdRef.current) {
                handleAutoCopy(newest);
              }
            }
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
          const list = data as Prompt[];
          setPrompts(list);

          if (list.length > 0) {
            const newest = list[0];
            if (isInitialFetchRef.current) {
              // On initial load of room, remember newest id so historical prompts are not spammed
              lastAutoCopiedIdRef.current = newest.id;
              isInitialFetchRef.current = false;
            } else if (autoCopyRef.current && newest.id !== lastAutoCopiedIdRef.current) {
              // Fresh prompt arrived via 5s heartbeat polling!
              handleAutoCopy(newest);
            }
          }
        }
      } catch (err) {
        console.error("Fetch error:", err);
      }
    },
    [handleAutoCopy]
  );

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
    isInitialFetchRef.current = true;
    pendingCopyRef.current = null;
    setHasPendingAutoCopy(false);

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
        // Explicitly requested room creation
        const newCode = generateRandomCode();
        const { data, error } = await supabase
          .from("wispr_sessions")
          .insert({
            pair_code: newCode,
            device_label: user ? `Wispr Room (${user.email})` : "Wispr Guest Session",
            user_id: user?.id ?? null,
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
    pendingCopyRef.current = null;
    lastAutoCopiedIdRef.current = null;
    setHasPendingAutoCopy(false);
    isInitialFetchRef.current = true;
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
    pendingCopyRef.current = null;
    lastAutoCopiedIdRef.current = null;
    setHasPendingAutoCopy(false);
    isInitialFetchRef.current = true;
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    localStorage.removeItem(LOCAL_STORAGE_PAIR_CODE_KEY);
    showToast("Left room");
  };

  // Create a brand new session code
  const createNewPairCode = async () => {
    pendingCopyRef.current = null;
    lastAutoCopiedIdRef.current = null;
    setHasPendingAutoCopy(false);
    isInitialFetchRef.current = true;
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

          if (autoCopyRef.current && lastAutoCopiedIdRef.current !== newPrompt.id) {
            handleAutoCopy(newPrompt);
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
  }, [session?.id, handleAutoCopy, selectedPrompt?.id]);

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
    hasPendingAutoCopy,
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
