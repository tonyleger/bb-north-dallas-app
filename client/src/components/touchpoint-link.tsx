import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTouchpointUrl, getTouchpointCalendarUrl, hasTouchpointLink } from "@/lib/touchpoint";
import type { Client } from "@shared/schema";

interface TouchpointLinkProps {
  client: Client;
  variant?: "default" | "calendar";
}

export function TouchpointLink({ client, variant = "default" }: TouchpointLinkProps) {
  if (!hasTouchpointLink(client)) {
    return null;
  }

  if (variant === "calendar") {
    const url = getTouchpointCalendarUrl(client);
    if (!url) return null;
    return (
      <Button
        asChild
        variant="outline"
        size="sm"
        className="border-[#0099CC] text-[#0099CC] hover:bg-[#0099CC]/10"
      >
        <a href={url} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="w-4 h-4 mr-2" />
          TouchPoint Calendar
        </a>
      </Button>
    );
  }

  const url = getTouchpointUrl(client);
  if (!url) return null;

  return (
    <Button
      asChild
      variant="outline"
      size="sm"
      className="border-[#0099CC] text-[#0099CC] hover:bg-[#0099CC]/10"
    >
      <a href={url} target="_blank" rel="noopener noreferrer">
        <ExternalLink className="w-4 h-4 mr-2" />
        Open in TouchPoint
      </a>
    </Button>
  );
}
