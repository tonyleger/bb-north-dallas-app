import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Phone, MessageSquare, Mail, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Client } from "@shared/schema";
import { FOLLOWUP_TEMPLATES, renderTemplate, getTemplate, type FollowupTemplate } from "@/lib/followup-templates";

interface ContactActionButtonsProps {
  client: Client;
  suggestedTemplate?: FollowupTemplate;
  onLogged?: () => void;
}

export function ContactActionButtons({ client, suggestedTemplate, onLogged }: ContactActionButtonsProps) {
  const { toast } = useToast();
  const [callOutcome, setCallOutcome] = useState<string>("connected");
  const [textOpen, setTextOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [callOutcomeOpen, setCallOutcomeOpen] = useState(false);

  const [textBody, setTextBody] = useState("");
  const [textCopied, setTextCopied] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailCopied, setEmailCopied] = useState(false);

  const clientName = client.firstName || "Contact";
  const clientPhone = client.phone || "";
  const clientEmail = client.email || "";

  // Get contact log mutation
  const contactLogMutation = useMutation({
    mutationFn: async (payload: any) => {
      const now = new Date().toISOString();
      return apiRequest("/api/contact-logs", {
        method: "POST",
        body: JSON.stringify({
          clientId: client.id,
          ...payload,
          createdAt: now,
        }),
      });
    },
    onSuccess: (log) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact-logs", client.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients", client.id] });
      onLogged?.();
    },
  });

  const handleCallClick = async () => {
    // Open phone dialer
    if (clientPhone) {
      window.open(`tel:${clientPhone}`);
    }

    // Show outcome dialog instead of logging immediately
    setCallOutcomeOpen(true);
  };

  const handleCallOutcomeChange = async (outcome: string) => {
    // Log the call with the selected outcome
    await contactLogMutation.mutateAsync({
      type: "call",
      direction: "outbound",
      outcome,
    });
    setCallOutcome(outcome);
    setCallOutcomeOpen(false);
    toast({ title: "Call logged", description: `Call outcome recorded as ${outcome}.` });
  };

  const handleTextOpen = () => {
    let initialBody = "";
    if (suggestedTemplate?.channel === "text") {
      initialBody = renderTemplate(suggestedTemplate.body, { FirstName: client.firstName || "" });
    } else {
      initialBody = renderTemplate(
        "Hi {FirstName}, this is from Budget Blinds North Dallas! Would love to chat about your window treatment needs.",
        { FirstName: client.firstName || "" }
      );
    }
    setTextBody(initialBody);
    setTextOpen(true);
  };

  const handleTextSend = async () => {
    await contactLogMutation.mutateAsync({
      type: "text",
      direction: "outbound",
      outcome: "sent",
      notes: textBody,
    });
    if (clientPhone) {
      const encoded = encodeURIComponent(textBody);
      window.open(`sms:${clientPhone}?body=${encoded}`);
    }
    toast({ title: "Text sent", description: "SMS logged." });
    setTextOpen(false);
    setTextBody("");
  };

  const handleTextCopyAndMark = async () => {
    await navigator.clipboard.writeText(textBody);
    await contactLogMutation.mutateAsync({
      type: "text",
      direction: "outbound",
      outcome: "sent",
      notes: textBody,
    });
    setTextCopied(true);
    toast({ title: "Copied & logged", description: "Text copied to clipboard and activity logged." });
    setTimeout(() => setTextCopied(false), 2000);
    setTextOpen(false);
    setTextBody("");
  };

  const handleEmailOpen = () => {
    let initialSubject = "";
    let initialBody = "";
    if (suggestedTemplate?.channel === "email") {
      initialSubject = renderTemplate(suggestedTemplate.subject || "", { FirstName: client.firstName || "" });
      initialBody = renderTemplate(suggestedTemplate.body, { FirstName: client.firstName || "" });
    } else {
      initialSubject = "Budget Blinds North Dallas — Let's Talk About Your Windows";
      initialBody = renderTemplate(
        "Hi {FirstName},\n\nWould love to discuss your window treatment needs and schedule a free in-home consultation.\n\nLooking forward to hearing from you!\n\nBest,\nBudget Blinds North Dallas",
        { FirstName: client.firstName || "" }
      );
    }
    setEmailSubject(initialSubject);
    setEmailBody(initialBody);
    setEmailOpen(true);
  };

  const handleEmailSend = async () => {
    await contactLogMutation.mutateAsync({
      type: "email",
      direction: "outbound",
      outcome: "sent",
      notes: emailBody,
    });
    if (clientEmail) {
      const subjectEncoded = encodeURIComponent(emailSubject);
      const bodyEncoded = encodeURIComponent(emailBody);
      window.open(`mailto:${clientEmail}?subject=${subjectEncoded}&body=${bodyEncoded}`);
    }
    toast({ title: "Email opened", description: "Email logged." });
    setEmailOpen(false);
    setEmailSubject("");
    setEmailBody("");
  };

  const handleEmailCopyAndMark = async () => {
    const emailText = `Subject: ${emailSubject}\n\n${emailBody}`;
    await navigator.clipboard.writeText(emailText);
    await contactLogMutation.mutateAsync({
      type: "email",
      direction: "outbound",
      outcome: "sent",
      notes: emailBody,
    });
    setEmailCopied(true);
    toast({ title: "Copied & logged", description: "Email copied to clipboard and activity logged." });
    setTimeout(() => setEmailCopied(false), 2000);
    setEmailOpen(false);
    setEmailSubject("");
    setEmailBody("");
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCallClick}
          disabled={!clientPhone}
          className="flex items-center gap-2"
          title={clientPhone ? "Click to call" : "No phone number"}
        >
          <Phone className="w-4 h-4" />
          Call
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleTextOpen}
          disabled={!clientPhone}
          className="flex items-center gap-2"
          title={clientPhone ? "Click to text" : "No phone number"}
        >
          <MessageSquare className="w-4 h-4" />
          Text
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleEmailOpen}
          disabled={!clientEmail}
          className="flex items-center gap-2"
          title={clientEmail ? "Click to email" : "No email address"}
        >
          <Mail className="w-4 h-4" />
          Email
        </Button>
      </div>

      {/* Call outcome dialog */}
      <Dialog open={callOutcomeOpen} onOpenChange={setCallOutcomeOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>How did the call go?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleCallOutcomeChange("connected")}
            >
              Connected
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleCallOutcomeChange("no_answer")}
            >
              No Answer
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleCallOutcomeChange("left_voicemail")}
            >
              Left Voicemail
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Text dialog */}
      <Dialog open={textOpen} onOpenChange={setTextOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Text Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="text-body" className="text-xs text-muted-foreground">
                Message ({textBody.length} chars)
              </Label>
              <Textarea
                id="text-body"
                value={textBody}
                onChange={(e) => setTextBody(e.target.value)}
                placeholder="Enter your message..."
                className="mt-2 h-24 resize-none"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleTextCopyAndMark} disabled={!textBody}>
              <Copy className="w-4 h-4 mr-1" />
              Copy & Mark Sent
            </Button>
            <Button size="sm" onClick={handleTextSend} disabled={!textBody}>
              Open in Text App
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email dialog */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="email-subject" className="text-xs">
                Subject
              </Label>
              <Input
                id="email-subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject..."
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email-body" className="text-xs">
                Body
              </Label>
              <Textarea
                id="email-body"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Email message..."
                className="mt-1 h-32 resize-none"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleEmailCopyAndMark} disabled={!emailBody}>
              <Copy className="w-4 h-4 mr-1" />
              Copy & Mark Sent
            </Button>
            <Button size="sm" onClick={handleEmailSend} disabled={!emailBody}>
              Open in Email App
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
