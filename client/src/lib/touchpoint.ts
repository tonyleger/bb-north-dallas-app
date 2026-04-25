// TouchPoint CRM URL helpers

export function getTouchpointUrl(client: {
  touchpointLeadId?: string | null;
  touchpointOpportunityId?: string | null;
}): string | null {
  if (client.touchpointOpportunityId) {
    return `https://tpt.gohfc.com/sales/opportunities/${client.touchpointOpportunityId}/detail`;
  }
  if (client.touchpointLeadId) {
    return `https://tpt.gohfc.com/sales/leads/${client.touchpointLeadId}/detail`;
  }
  return null;
}

export function getTouchpointCalendarUrl(client: {
  touchpointLeadId?: string | null;
}): string | null {
  if (!client.touchpointLeadId) return null;
  return `https://tpt.gohfc.com/calendar/main?previousRoute=%252Fsales%252Fleads%252F${client.touchpointLeadId}%252Fdetail`;
}

export function hasTouchpointLink(client: {
  touchpointLeadId?: string | null;
  touchpointOpportunityId?: string | null;
}): boolean {
  return !!(client.touchpointLeadId || client.touchpointOpportunityId);
}
