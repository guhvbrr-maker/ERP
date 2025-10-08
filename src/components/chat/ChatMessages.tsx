import { useEffect, useRef } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";

interface ChatMessagesProps {
  messages: any[];
  currentUserId?: string;
}

export function ChatMessages({ messages, currentUserId }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const isCurrentUser = message.user_id === currentUserId;
        
        return (
          <div
            key={message.id}
            className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : ""}`}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback>{getInitials(message.user?.email || "??")}</AvatarFallback>
            </Avatar>
            <div className={`flex-1 max-w-[70%] ${isCurrentUser ? "items-end" : ""}`}>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-sm font-medium">
                  {message.user?.email?.split("@")[0] || "Usuário"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(message.created_at), "HH:mm")}
                </span>
              </div>
              <div
                className={`rounded-lg p-3 ${
                  isCurrentUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.message}</p>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
