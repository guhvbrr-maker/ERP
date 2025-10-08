import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChatChannelList } from "@/components/chat/ChatChannelList";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { NewChannelDialog } from "@/components/chat/NewChannelDialog";

export default function Chat() {
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [openNewChannelDialog, setOpenNewChannelDialog] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: channels, isLoading: channelsLoading } = useQuery({
    queryKey: ["chatChannels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_channels")
        .select(`
          *,
          department:departments(name),
          chat_channel_members!inner(user_id)
        `)
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["chatMessages", selectedChannelId],
    queryFn: async () => {
      if (!selectedChannelId) return [];
      
      const { data, error } = await supabase
        .from("chat_messages")
        .select(`
          *,
          user:users!chat_messages_user_id_fkey(email)
        `)
        .eq("channel_id", selectedChannelId)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedChannelId,
  });

  const selectedChannel = channels?.find((c) => c.id === selectedChannelId);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar - Channel List */}
      <div className="w-64 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Chat Interno</h2>
            <Button size="sm" variant="ghost" onClick={() => setOpenNewChannelDialog(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Canais de comunicação
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {channelsLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Carregando...</div>
          ) : (
            <ChatChannelList
              channels={channels || []}
              selectedChannelId={selectedChannelId}
              onSelectChannel={setSelectedChannelId}
            />
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChannelId ? (
          <>
            {/* Chat Header */}
            <div className="border-b p-4 bg-card">
              <h3 className="font-semibold"># {selectedChannel?.name}</h3>
              {selectedChannel?.description && (
                <p className="text-sm text-muted-foreground">
                  {selectedChannel.description}
                </p>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {messagesLoading ? (
                <div className="text-center text-muted-foreground">
                  Carregando mensagens...
                </div>
              ) : (
                <ChatMessages messages={messages || []} currentUserId={currentUser?.id} />
              )}
            </div>

            {/* Message Input */}
            <div className="border-t p-4 bg-card">
              <ChatInput channelId={selectedChannelId} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Bem-vindo ao Chat Interno</h3>
              <p>Selecione um canal para começar a conversar</p>
            </div>
          </div>
        )}
      </div>

      <NewChannelDialog
        open={openNewChannelDialog}
        onOpenChange={setOpenNewChannelDialog}
      />
    </div>
  );
}
