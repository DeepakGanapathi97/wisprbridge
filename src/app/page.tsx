"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import { useWisprBridge } from "@/hooks/useWisprBridge";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import { InputBar } from "@/components/InputBar";
import { PromptCard } from "@/components/PromptCard";
import { PromptModal } from "@/components/PromptModal";
import { PairingModal } from "@/components/PairingModal";
import { SettingsModal } from "@/components/SettingsModal";
import { AuthModal } from "@/components/AuthModal";
import { WelcomeGateway } from "@/components/WelcomeGateway";
import { BottomNav } from "@/components/BottomNav";
import { Toast } from "@/components/Toast";
import { Sparkles, MessageSquareDashed } from "lucide-react";

export default function WisprBridgeHome() {
  const {
    user,
    pairCode,
    prompts,
    totalPromptsCount,
    keptPromptsCount,
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
    startGuestRoom,
    isInRoom,
    isSupabaseConfigured,
  } = useWisprBridge();

  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Handle copy with optional light particle effect
  const handleCopy = (text: string, id: string) => {
    copyToClipboard(text, id);
    try {
      confetti({
        particleCount: 22,
        spread: 45,
        origin: { y: 0.8 },
        colors: ["#3b82f6", "#10b981", "#6366f1"],
        ticks: 120,
        gravity: 1.2,
      });
    } catch {
      // Ignore if canvas is unavailable
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pb-24 sm:pb-12">
      {/* 1. GATEWAY MODE: If user has not joined a room and is not logged in */}
      {!isInRoom && !loading ? (
        <main className="flex-1 flex flex-col justify-center">
          <WelcomeGateway
            onJoinRoom={pairWithCode}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onStartGuestRoom={startGuestRoom}
          />
        </main>
      ) : !isInRoom && loading ? (
        <div className="my-auto flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium">Connecting to WisprBridge...</p>
        </div>
      ) : (
        /* 2. ACTIVE BRIDGE WORKSPACE */
        <>
          {/* Google Eloquent Styled Header */}
          <Header
            isConnected={isConnected}
            pairCode={pairCode}
            autoCopyEnabled={autoCopyEnabled}
            onToggleAutoCopy={toggleAutoCopy}
            onOpenPairModal={() => setIsPairModalOpen(true)}
            onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            userEmail={user?.email}
            onSignOut={signOut}
            onLeaveRoom={leaveRoom}
            isSupabaseConfigured={isSupabaseConfigured}
          />

          {/* Main Content Area */}
          <main className="flex-1 w-full max-w-3xl mx-auto flex flex-col">
            {/* Tab Selection */}
            <TabBar
              activeTab={activeTab}
              onChangeTab={setActiveTab}
              totalCount={totalPromptsCount}
              keptCount={keptPromptsCount}
            />

            {/* Whisper Flow Speech-to-Text Input Bar */}
            <InputBar onAddPrompt={addPrompt} />

            {/* Prompts Feed */}
            <div className="px-4 sm:px-6 flex-1 flex flex-col gap-3">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                  <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-medium">Connecting to WisprBridge...</p>
                </div>
              ) : prompts.length === 0 ? (
                <div className="my-auto py-16 px-6 text-center rounded-3xl bg-white/70 border border-slate-200/60 border-dashed flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                    <MessageSquareDashed className="w-6 h-6 stroke-[1.75]" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-800">
                    {activeTab === "kept" ? "No kept prompts yet" : "No prompts in this room yet"}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
                    {activeTab === "kept"
                      ? "Click the bookmark icon on any prompt card to pin it permanently."
                      : "Speak using Whisper Flow on your mobile keyboard or type in the input bar above. It will appear here instantly."}
                  </p>
                  {activeTab === "all" && (
                    <div className="mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-[11px] text-slate-600 font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Tip: Prompts auto-delete after 1 hour unless kept</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {prompts.map((prompt) => (
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt}
                      isCopied={copyFeedbackId === prompt.id}
                      onCopy={handleCopy}
                      onToggleKeep={toggleKeep}
                      onDelete={deletePrompt}
                      onClickCard={setSelectedPrompt}
                    />
                  ))}
                </div>
              )}
            </div>
          </main>

          {/* Floating Prompt Reader Modal */}
          <PromptModal
            prompt={selectedPrompt}
            onClose={() => setSelectedPrompt(null)}
            onCopy={handleCopy}
            onToggleKeep={toggleKeep}
            onDelete={deletePrompt}
            isCopied={selectedPrompt ? copyFeedbackId === selectedPrompt.id : false}
          />

          {/* Pairing Room & Group Modal */}
          <PairingModal
            isOpen={isPairModalOpen}
            onClose={() => setIsPairModalOpen(false)}
            currentCode={pairCode}
            onPairWithCode={pairWithCode}
            onGenerateNewCode={createNewPairCode}
          />

          {/* Settings Modal */}
          <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            autoCopyEnabled={autoCopyEnabled}
            onToggleAutoCopy={toggleAutoCopy}
            isSupabaseConfigured={isSupabaseConfigured}
            onPurgeExpired={() => {}}
          />

          {/* Responsive Mobile Bottom Navigation */}
          <BottomNav
            onOpenPairModal={() => setIsPairModalOpen(true)}
            onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          />
        </>
      )}

      {/* Floating Auth Modal (Sign In / Sign Up) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSignInOrSignUp={signInOrSignUp}
      />

      {/* Realtime Toast Notifications */}
      <Toast message={toastMessage} />
    </div>
  );
}
