import React from "react";
import { useQueryState, parseAsString } from "nuqs";

export function useClientsViewState() {
  // Drawer States
  const [clientId, setClientId] = useQueryState("clientId", parseAsString);
  const [activeInvitationId, setActiveInvitationId] = React.useState(null);
  const [paymentClient, setPaymentClient] = React.useState(null);
  const [paymentDayClient, setPaymentDayClient] = React.useState(null);
  const [cancelPaymentTarget, setCancelPaymentTarget] = React.useState(null);
  const [removeCandidate, setRemoveCandidate] = React.useState(null);
  
  // Group States
  const [isGroupDrawerOpen, setIsGroupDrawerOpen] = React.useState(false);
  const [isCreateGroupDrawerOpen, setIsCreateGroupDrawerOpen] = React.useState(false);
  const [isMemberSelectionDrawerOpen, setIsMemberSelectionDrawerOpen] = React.useState(false);
  const [selectedGroupId, setSelectedGroupId] = React.useState("");
  const [newGroupName, setNewGroupName] = React.useState("");
  const [newGroupDesc, setNewGroupDesc] = React.useState("");
  const [memberSearch, setMemberSearch] = React.useState("");
  const [memberSelectionIds, setMemberSelectionIds] = React.useState([]);
  
  // Plan States
  const [isPlanDrawerOpen, setIsPlanDrawerOpen] = React.useState(false);
  const [planType, setPlanType] = React.useState(null);
  const [activeClientIds, setActiveClientIds] = React.useState([]);

  // Common UI states
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Payment Form States
  const [paymentAmount, setPaymentAmount] = React.useState("");
  const [paymentNote, setPaymentNote] = React.useState("");
  const [paymentPaidAt, setPaymentPaidAt] = React.useState("");
  const [paymentDay, setPaymentDay] = React.useState("");
  const [paymentBillingCycle, setPaymentBillingCycle] = React.useState("MONTHLY");

  const closeAll = React.useCallback(() => {
    setClientId(null);
    setActiveInvitationId(null);
    setPaymentClient(null);
    setPaymentDayClient(null);
    setCancelPaymentTarget(null);
    setRemoveCandidate(null);
    setIsGroupDrawerOpen(false);
    setIsCreateGroupDrawerOpen(false);
    setIsMemberSelectionDrawerOpen(false);
    setIsPlanDrawerOpen(false);
  }, [setClientId]);

  return {
    // Refs/IDs
    clientId,
    setClientId,
    activeInvitationId,
    setActiveInvitationId,
    paymentClient,
    setPaymentClient,
    paymentDayClient,
    setPaymentDayClient,
    cancelPaymentTarget,
    setCancelPaymentTarget,
    removeCandidate,
    setRemoveCandidate,

    // Toggles
    isGroupDrawerOpen,
    setIsGroupDrawerOpen,
    isCreateGroupDrawerOpen,
    setIsCreateGroupDrawerOpen,
    isMemberSelectionDrawerOpen,
    setIsMemberSelectionDrawerOpen,
    isPlanDrawerOpen,
    setIsPlanDrawerOpen,

    // Data
    selectedGroupId,
    setSelectedGroupId,
    newGroupName,
    setNewGroupName,
    newGroupDesc,
    setNewGroupDesc,
    memberSearch,
    setMemberSearch,
    memberSelectionIds,
    setMemberSelectionIds,
    planType,
    setPlanType,
    activeClientIds,
    setActiveClientIds,
    isSubmitting,
    setIsSubmitting,
    paymentAmount,
    setPaymentAmount,
    paymentNote,
    setPaymentNote,
    paymentPaidAt,
    setPaymentPaidAt,
    paymentDay,
    setPaymentDay,
    paymentBillingCycle,
    setPaymentBillingCycle,

    // Actions
    closeAll
  };
}
