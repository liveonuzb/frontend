import React, { useState, useEffect, useRef } from "react";
import { some } from "lodash";
import { useLocation } from "react-router";
import {
  MessageCircleIcon,
  XIcon,
  SendIcon,
  SparklesIcon,
  BotIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function FloatingAiChat() {
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Salom! Men Liveon AI yordamchisiman. Sizga qanday yordam bera olaman?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const shouldHide = React.useMemo(
    () =>
      some(
        ["/auth", "/user", "/coach", "/admin"],
        (prefix) => pathname.startsWith(prefix),
      ),
    [pathname],
  );

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (shouldHide && isOpen) {
      setIsOpen(false);
    }
  }, [isOpen, shouldHide]);

  if (shouldHide) {
    return null;
  }

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = { role: "user", text: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Tushunarli! Bizning platformamiz orqali siz o'zingizga mos murabbiy topishingiz va AI orqali ovqatlanishingizni nazorat qilishingiz mumkin. Bepul ro'yxatdan o'tishni xohlaysizmi?",
        },
      ]);
    }, 1500);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Messages Popup */}
      <div
        className={`mb-4 transition-all duration-300 origin-bottom-right ${isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"}`}
      >
        <Card className="w-[320px] sm:w-[350px] shadow-2xl border-border/50 bg-background/95 backdrop-blur-xl overflow-hidden flex flex-col h-[450px]">
          {/* Header */}
          <div className="bg-primary p-4 text-primary-foreground flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-full">
                <BotIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-none">Liveon AI</h3>
                <p className="text-[10px] text-primary-foreground/70 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>{" "}
                  Onlayn
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-black/10 text-white rounded-full h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Chat Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-muted/10">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3 text-sm shadow-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card border border-border/50 rounded-bl-sm"
                  }`}
                >
                  {msg.role === "ai" && (
                    <SparklesIcon className="h-3 w-3 text-primary mb-1 inline-block mr-1" />
                  )}
                  {msg.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-card border border-border/50 rounded-2xl rounded-bl-sm p-4 w-16 flex gap-1 items-center justify-center">
                  <span
                    className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></span>
                  <span
                    className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></span>
                  <span
                    className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-background border-t border-border/30 shrink-0">
            <form onSubmit={handleSend} className="relative flex items-center">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Savol bering..."
                className="pr-10 bg-muted/30 border-none rounded-full focus-visible:ring-primary h-10"
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-1 h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-white"
                disabled={!inputValue.trim() || isTyping}
              >
                <SendIcon className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </Card>
      </div>

      {/* Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-14 w-14 rounded-full shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all duration-300 ${
          isOpen
            ? "rotate-90 scale-90 bg-muted text-foreground"
            : "hover:scale-105 hover:shadow-[0_0_30px_rgba(var(--primary),0.5)]"
        }`}
        size="icon"
      >
        {isOpen ? (
          <XIcon className="h-6 w-6" />
        ) : (
          <MessageCircleIcon className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}
