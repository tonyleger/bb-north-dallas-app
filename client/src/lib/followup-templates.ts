export interface FollowupTemplate {
  type: string; // matches follow_ups.type
  channel: "call" | "text" | "email";
  label: string; // short label for the stage
  subject?: string; // for email only
  body: string;
  callScript?: string; // for calls, brief suggested talking-point script
}

export const FOLLOWUP_TEMPLATES: FollowupTemplate[] = [
  // Day 0 - Immediate call
  {
    type: "new_lead_day0_call",
    channel: "call",
    label: "Day 0 - Initial Call",
    body: "",
    callScript: "Hi {FirstName}, this is [Your Name] from Budget Blinds North Dallas! I saw your interest come through and wanted to reach out personally. We'd love to learn more about your window treatment project. Do you have a quick minute to chat?",
  },
  // 1 hour text
  {
    type: "new_lead_1hr_text",
    channel: "text",
    label: "1 Hour - Follow-up Text",
    body: "Hi {FirstName}! This is Budget Blinds North Dallas. Sorry I missed you earlier — thought I'd catch you via text. When's a good time to chat about your window treatment needs?",
  },
  // Day 1 - Call
  {
    type: "new_lead_day1_call",
    channel: "call",
    label: "Day 1 - Reconnect Call",
    body: "",
    callScript: "Hi {FirstName}, checking in again — this is [Your Name] from Budget Blinds. We specialize in beautiful, energy-efficient window treatments for homes in North Dallas. Would love to schedule a free in-home consultation when it works for you.",
  },
  // Day 1 - Text
  {
    type: "new_lead_day1_text",
    channel: "text",
    label: "Day 1 - Text Reminder",
    body: "Hi {FirstName}! Just reaching out again about your window treatments. We offer free consultations and have tons of beautiful options. Reply when you're ready to chat!",
  },
  // Day 3 - Call
  {
    type: "new_lead_day3_call",
    channel: "call",
    label: "Day 3 - Value Call",
    body: "",
    callScript: "{FirstName}, this is [Your Name] from Budget Blinds North Dallas. I wanted to touch base and share some info about how our treatments can help with energy efficiency and light control. Would be great to set up a quick visit. Does this week work for you?",
  },
  // Day 3 - Text
  {
    type: "new_lead_day3_text",
    channel: "text",
    label: "Day 3 - Product Text",
    body: "Hi {FirstName}! At Budget Blinds, we offer plantation shutters, cellular shades, roller blinds & more. All custom-fit for your home. Still interested in a free consultation?",
  },
  // Day 7 - Text
  {
    type: "new_lead_day7_text",
    channel: "text",
    label: "Day 7 - Check-in Text",
    body: "Hey {FirstName}, hope you're doing well! Just checking in — are you still planning to look at window treatments for your home? Happy to help whenever it works for you!",
  },
  // Day 30 - Call
  {
    type: "new_lead_day30_call",
    channel: "call",
    label: "Day 30 - Gentle Reminder Call",
    body: "",
    callScript: "{FirstName}, this is [Your Name] with Budget Blinds. I wanted to check in — it's been a few weeks since you first expressed interest. Just wanted to make sure you didn't need any help with your window treatment project. I'd love to set something up.",
  },
  // Day 30 - Text
  {
    type: "new_lead_day30_text",
    channel: "text",
    label: "Day 30 - Follow-up Text",
    body: "Hi {FirstName}, it's been a bit — are you still planning to look at window treatments? Happy to swing by and show you some gorgeous options whenever works best for you!",
  },
  // Day 44 - Text
  {
    type: "new_lead_day44_text",
    channel: "text",
    label: "Day 44 - Engagement Text",
    body: "{FirstName}, this is Budget Blinds North Dallas. Wanted to reach out one more time — we have some beautiful new collections and can get you a quote super quick. What day works to chat?",
  },
  // Day 58 - Text
  {
    type: "new_lead_day58_text",
    channel: "text",
    label: "Day 58 - Last Check Text",
    body: "Hi {FirstName}! Final check — are you still looking to update your window treatments? If you'd like a free estimate, we're here to help. Just let us know!",
  },
  // Day 72 - Text
  {
    type: "new_lead_day72_text",
    channel: "text",
    label: "Day 72 - Extended Engagement Text",
    body: "Hi {FirstName}! It's been a while. If you're still interested in window treatments, I'd love to help. No pressure — just wanted to let you know we're here when you're ready!",
  },
  // Day 86 - Text (last touch before auto-inactive)
  {
    type: "new_lead_day86_text",
    channel: "text",
    label: "Day 86 - Final Outreach Text",
    body: "{FirstName}, this is your final outreach from Budget Blinds North Dallas. If you'd like to move forward with a free consultation, we're ready to help. Feel free to reach out anytime!",
  },
  // Existing post-sale follow-ups (preserved)
  {
    type: "day1_thank_you",
    channel: "email",
    label: "Day 1 - Thank You",
    subject: "Thank You for Choosing Budget Blinds North Dallas",
    body: "Hi {FirstName},\n\nThank you for choosing Budget Blinds for your window treatment needs! We're excited to help bring your vision to life.\n\nIf you have any questions about your order or installation, please don't hesitate to reach out.\n\nBest regards,\nBudget Blinds North Dallas Team",
  },
  {
    type: "day3_checkin",
    channel: "email",
    label: "Day 3 - Check-in",
    subject: "How's Your Order Going?",
    body: "Hi {FirstName},\n\nJust checking in to see if you have any questions about your new window treatments or upcoming installation.\n\nWe're here to help! Feel free to reach out anytime.\n\nBest,\nBudget Blinds North Dallas",
  },
  {
    type: "day7_value",
    channel: "email",
    label: "Day 7 - Value Share",
    subject: "Tips to Maximize Your New Window Treatments",
    body: "Hi {FirstName},\n\nWanted to share a few quick tips for maintaining and getting the most out of your new window treatments:\n\n1. Regular light dusting keeps them looking beautiful\n2. Use motorized controls to optimize energy efficiency\n3. Layer treatments for added privacy and light control\n\nLet us know if you'd like to add or adjust anything!\n\nBest,\nBudget Blinds North Dallas",
  },
  {
    type: "day14_final",
    channel: "email",
    label: "Day 14 - Final Follow-up",
    subject: "We Want Your Feedback!",
    body: "Hi {FirstName},\n\nWe hope you're loving your new window treatments! Your satisfaction is our top priority.\n\nIf you ever need adjustments, repairs, or want to add more treatments elsewhere in your home, we're just a call away.\n\nThanks for your business!\n\nBudget Blinds North Dallas Team",
  },
];

export function renderTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  Object.entries(vars).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{${key}}`, "g"), value || "");
  });
  return result;
}

export function getTemplate(type: string): FollowupTemplate | undefined {
  return FOLLOWUP_TEMPLATES.find(t => t.type === type);
}
