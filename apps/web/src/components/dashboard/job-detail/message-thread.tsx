"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, User } from "lucide-react";
import type { Message } from "@/lib/supabase-server";

type MessageThreadProps = {
  messages: Message[];
  currentUserId?: string;
};

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MessageThread({ messages, currentUserId }: MessageThreadProps) {
  if (messages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No messages yet. Start a conversation with the other party.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" />
          Messages ({messages.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {messages.map((message) => {
          const isOwnMessage = currentUserId === message.sender_id;

          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  isOwnMessage
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <div className="flex items-center gap-2 text-xs opacity-80">
                  <User className="h-3 w-3" />
                  <span>{message.sender?.name || "Unknown"}</span>
                  <span>·</span>
                  <span>{formatTime(message.created_at)}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {message.content}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
