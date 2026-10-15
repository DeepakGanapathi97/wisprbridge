"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, isSupabaseConfigured, Session, Prompt } from "@/lib/supabase";

const LOCAL_STORAGE_SESSION_KEY = "wisprbridge_session_id";
const LOCAL_STORAGE_PAIR_CODE_KEY = "wisprbridge_pair_code";
const LOCAL_STORAGE_AUTO_COPY_KEY = "wisprbridge_auto_copy";
const LOCAL_STORAGE_MOCK_PROMPTS_KEY = "wisprbridge_mock_prompts";

export function useWisprBridge() {
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

  // Generate 6-digit random code
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
        
        // Optimistically increment copied_count
        if (id) {
          setPrompts((prev) =>
            prev.map((p) => (p.id === id ? { ...p, copied_count: p.copied_count + 1 } : p))
          );
          if (isSupabaseConfigured() && supabase) {
            supabase
              .from("prompts")
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

  // Fetch prompts for a session
  const fetchPrompts = useCallback(async (sessionId: string) => {
    if (!sessionId) return;

    if (!isSupabaseConfigured() || !supabase) {
      // Offline / Demo mode with localStorage
      const stored = localStorage.getItem(`${LOCAL_STORAGE_MOCK_PROMPTS_KEY}_${sessionId}`);
      if (stored) {
        try {
          const parsed: Prompt[] = JSON.parse(stored);
          const now = new Date().getTime();
          // Filter out expired unkept prompts
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

  // Create or load session
  const initSession = useCallback(async (forcedPairCode?: string) => {
    setLoading(true);

    let targetPairCode = forcedPairCode;
    if (!targetPairCode && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlCode = urlParams.get("code") || urlParams.get("room");
      if (urlCode && urlCode.replace(/\D/g, "").length === 6) {
        targetPairCode = urlCode.replace(/\D/g, "");
      }
    }

    if (!isSupabaseConfigured() || !supabase) {
      // Local simulation mode
      let activeCode = targetPairCode || localStorage.getItem(LOCAL_STORAGE_PAIR_CODE_KEY);
      if (!activeCode) {
        activeCode = generateRandomCode();
      }
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
      setLoading(false);
      return mockSession;
    }

    try {
      let activeSession: Session | null = null;

      if (targetPairCode) {
        // Pairing with specific code
        const { data, error } = await supabase
          .from("wispr_sessions")
          .select("*")
          .eq("pair_code", targetPairCode)
          .eq("is_active", true)
          .single();

        if (error || !data) {
          throw new Error("Invalid or expired 6-digit pair code.");
        }
        activeSession = data as Session;
      } else {
        const savedSessionId = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
        if (savedSessionId) {
          const { data } = await supabase
            .from("wispr_sessions")
            .select("*")
            .eq("id", savedSessionId)
            .eq("is_active", true)
            .single();

          if (data) {
            activeSession = data as Session;
          }
        }

        // If no active session found, create a new one
        if (!activeSession) {
          const newCode = generateRandomCode();
          const { data, error } = await supabase
            .from("wispr_sessions")
            .insert({
              pair_code: newCode,
              device_label: "Wispr Mobile Session",
            })
            .select()
            .single();

          if (error || !data) {
            throw error || new Error("Failed to create session");
          }
          activeSession = data as Session;
        }
      }

      if (activeSession) {
        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, activeSession.id);
        localStorage.setItem(LOCAL_STORAGE_PAIR_CODE_KEY, activeSession.pair_code);
        setSession(activeSession);
        setPairCode(activeSession.pair_code);
        setIsConnected(true);
        await fetchPrompts(activeSession.id);
      }
    } catch (err: unknown) {
      console.error("Session init error:", err);
      const message = err instanceof Error ? err.message : "Failed to connect session";
      showToast(message);
    } finally {
      setLoading(false);
    }
  }, [fetchPrompts, showToast]);

  // Connect to an existing pair code
  const pairWithCode = async (code: string) => {
    const cleanCode = code.trim().replace(/\D/g, "");
    if (cleanCode.length !== 6) {
      showToast("Pair code must be 6 digits");
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

  // Create a brand new session code
  const createNewPairCode = async () => {
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    localStorage.removeItem(LOCAL_STORAGE_PAIR_CODE_KEY);
    await initSession();
    showToast("🔑 Generated new 6-digit pair code");
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
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour TTL
    };

    if (!isSupabaseConfigured() || !supabase) {
      // Local fallback
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

          // Check for auto-copy
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

  // Heartbeat Polling: Refresh every 5 seconds as specified by user
  useEffect(() => {
    if (!session?.id) return;

    const interval = setInterval(() => {
      fetchPrompts(session.id);
    }, 5000);

    return () => clearInterval(interval);
  }, [session?.id, fetchPrompts]);

  // Periodic TTL check (every 10 seconds to auto-remove expired prompts locally)
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
    addPrompt,
    toggleKeep,
    deletePrompt,
    copyToClipboard,
    pairWithCode,
    createNewPairCode,
    isSupabaseConfigured: isSupabaseConfigured(),
  };
}
