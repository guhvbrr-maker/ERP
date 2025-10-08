import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Hash, Lock } from "lucide-react";

interface ChatChannelListProps {
  channels: any[];
  selectedChannelId: string | null;
  onSelectChannel: (channelId: string) => void;
}

export function ChatChannelList({ channels, selectedChannelId, onSelectChannel }: ChatChannelListProps) {
  return (
    <div className="space-y-1 p-2">
      {channels.map((channel) => (
        <Button
          key={channel.id}
          variant={selectedChannelId === channel.id ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => onSelectChannel(channel.id)}
        >
          <div className="flex items-center gap-2 w-full">
            {channel.is_private ? (
              <Lock className="h-4 w-4 flex-shrink-0" />
            ) : (
              <Hash className="h-4 w-4 flex-shrink-0" />
            )}
            <span className="truncate flex-1 text-left">{channel.name}</span>
            {channel.channel_type === "department" && channel.department && (
              <Badge variant="outline" className="text-xs">
                {channel.department.name}
              </Badge>
            )}
          </div>
        </Button>
      ))}
    </div>
  );
}
