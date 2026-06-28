"use client";

/**
 * Module 8: Dialer UI - Complete Implementation with Real Twilio Integration
 * Glassmorphic design with click-to-call, dial pad, and live call controls
 * Integrated with LeadsQueue for streamlined calling workflow
 */

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import DialPad from "@/components/dialer/DialPad";
import LeadsQueue from "@/components/dialer/LeadsQueue";
import DispositionModal from "@/components/dialer/DispositionModal";
import UpdateLeadModal from "@/components/dialer/UpdateLeadModal";
import ManualCallDispositionModal from "@/components/dialer/ManualCallDispositionModal";
import { getDialerClient } from "@/lib/telephony/client-factory";

interface Contact {
  id: string;
  businessName: string;
  contactName: string | null;
  phoneE164: string;
  country: string;
}

interface CurrentLead {
  id: string;
  businessName: string;
  phone: string;
  leadStatus: string;
  notes?: string | null;
}

type CallStatus = "idle" | "connecting" | "ringing" | "connected" | "ended";
type CallType = "contact" | "lead" | "manual";

function DialerContent() {
  
  const searchParams = useSearchParams();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const isCallActive = ["connecting", "ringing", "connected"].includes(callStatus);
  const [activeNumber, setActiveNumber] = useState<string>("");
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showDisposition, setShowDisposition] = useState(false);
  const [completedCallId, setCompletedCallId] = useState<string | null>(null);
  const [dialerReady, setDialerReady] = useState(false);
  const [dialerError, setDialerError] = useState<string | null>(null);
  const [prefilledNumber, setPrefilledNumber] = useState<string>("");

  // Lead-specific state
  const [callType, setCallType] = useState<CallType>("manual");
  const [currentLead, setCurrentLead] = useState<CurrentLead | null>(null);
  const [showUpdateLead, setShowUpdateLead] = useState(false);
  const [showManualCallModal, setShowManualCallModal] = useState(false);
  const [leadsQueueKey, setLeadsQueueKey] = useState(0); // For triggering refresh

  const dialerClientRef = useRef<any>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Prevent page reload during active call
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isCallActive) {
        e.preventDefault();
        e.returnValue = "You have an active call. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isCallActive]);

  const initDialer = async () => {
    try {
      setDialerReady(false);
      setDialerError(null);

      const client = getDialerClient();
      dialerClientRef.current = client;

      // Set up event listeners
      client.on("registered", () => {
        setDialerReady(true);
        console.log("Dialer registered and ready");
      });

      client.on("ringing", (payload: any) => {
        console.log("🔔 RINGING EVENT - Call is ringing on other end:", payload);
        setCallStatus("ringing");
      });

      client.on("connected", (payload: any) => {
        console.log("✅ CONNECTED EVENT - Call answered by other party:", payload);
        setCallStatus("connected");
        setCompletedCallId(payload.callId);
      });

      client.on("disconnected", (payload: any) => {
        console.log("Call disconnected:", payload);

        // Only show modals if call was actually connected or ringing
        if (callStatus === "connected" || callStatus === "ringing") {
          // Set status to ended
          setCallStatus("ended");
          if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
          }

          // Show appropriate modal based on call type
          if (callType === "lead" && currentLead) {
            // Lead call - show update modal
            setShowUpdateLead(true);
          } else if (callType === "manual") {
            // Manual call - show manual disposition modal (saves to leads)
            setShowManualCallModal(true);
          } else {
            // Contact call - show standard disposition modal
            setShowDisposition(true);
          }
        } else {
          // Call never connected, just reset state
          setCallStatus("idle");
          setActiveNumber("");
          setActiveContact(null);
          setCallDuration(0);
          setCurrentLead(null);
          setCallType("manual");
        }
      });

      client.on("error", (payload: any) => {
        setDialerError(payload.message || "An error occurred");
        setCallStatus("idle");
        console.error("Dialer error:", payload);
      });

      // Initialize with token endpoint
      await client.initialize("/api/voice/token");
    } catch (error) {
      console.error("Failed to initialize dialer:", error);
      setDialerError(error instanceof Error ? error.message : "Failed to initialize");
    }
  };

  // Initialize Twilio dialer
  useEffect(() => {
    initDialer();

    return () => {
      if (dialerClientRef.current) {
        dialerClientRef.current.destroy();
      }
    };
  }, []);

  // Fetch contacts for queue
  useEffect(() => {
    fetchContacts();
  }, []);

  // Handle URL parameter for pre-filled number
  useEffect(() => {
    const numberParam = searchParams.get("number");
    if (numberParam) {
      setPrefilledNumber(numberParam);
      console.log("📞 Pre-filled number from URL:", numberParam);
    }
  }, [searchParams]);

  // Call duration timer - ONLY starts when truly connected (answered)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStatus === "connected") {
      console.log("⏱️ Starting call timer - call is connected");
      interval = setInterval(() => {
        setCallDuration((prev) => {
          const newDuration = prev + 1;
          if (newDuration % 10 === 0) {
            console.log(`⏱️ Call duration: ${newDuration}s`);
          }
          return newDuration;
        });
      }, 1000);
    } else {
      console.log(`⏱️ Timer stopped - status is: ${callStatus}`);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [callStatus]);

  const fetchContacts = async () => {
    try {
      const response = await fetch("/api/contacts?limit=20");
      const data = await response.json();
      if (response.ok) {
        setContacts(data.contacts);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  };

  const handleCall = async (phoneNumber: string, contact?: Contact) => {
    if (!dialerClientRef.current || !dialerReady) {
      alert("Dialer is not ready. Please wait or refresh the page.");
      return;
    }

    try {
      setCallStatus("connecting");
      setActiveNumber(phoneNumber);
      setActiveContact(contact || null);
      setCallDuration(0);
      setDialerError(null);
      setCallType("manual"); // Manual dial pad call

      // Place call via Twilio
      await dialerClientRef.current.call(phoneNumber, {
        From: process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || "+12404282817",
      });

      // Don't manually set to "ringing" here - let the Twilio "ringing" event handle it
      // Status stays as "connecting" until we get the ringing event
    } catch (error) {
      console.error("Error placing call:", error);
      setDialerError(error instanceof Error ? error.message : "Failed to place call");
      setCallStatus("idle");
    }
  };

  const handleLeadCall = async (phoneNumber: string, leadId: string, businessName: string) => {
    if (!dialerClientRef.current || !dialerReady) {
      alert("Dialer is not ready. Please wait or refresh the page.");
      return;
    }

    try {
      // Fetch full lead details
      const response = await fetch(`/api/leads/${leadId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error("Failed to fetch lead details");
      }

      setCallStatus("connecting");
      setActiveNumber(phoneNumber);
      setCallDuration(0);
      setDialerError(null);
      setCallType("lead");
      setCurrentLead({
        id: leadId,
        businessName: businessName,
        phone: phoneNumber,
        leadStatus: data.lead.leadStatus,
        notes: data.lead.notes,
      });

      // Place call via Twilio
      await dialerClientRef.current.call(phoneNumber, {
        From: process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || "+12404282817",
      });
    } catch (error) {
      console.error("Error placing lead call:", error);
      setDialerError(error instanceof Error ? error.message : "Failed to place call");
      setCallStatus("idle");
    }
  };

  const handleHangup = () => {
    if (dialerClientRef.current) {
      dialerClientRef.current.hangup();
    }
    // Don't manually trigger disposition here - let the "disconnected" event handle it
  };

  const handleToggleMute = () => {
    if (dialerClientRef.current) {
      const newMuted = !isMuted;
      dialerClientRef.current.setMute(newMuted);
      setIsMuted(newMuted);
    }
  };

  const handleDispositionComplete = () => {
    setShowDisposition(false);
    setCallStatus("idle");
    setActiveNumber("");
    setActiveContact(null);
    setCallDuration(0);
    setCompletedCallId(null);
    setCallType("manual");
  };


  const handleUpdateLead = async (status: string, notes: string) => {
    if (!currentLead) return;

    try {
      const response = await fetch(`/api/leads/${currentLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadStatus: status,
          notes: notes,
          lastContactedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update lead");
      }

      // Close modal and reset state
      setShowUpdateLead(false);
      setCallStatus("idle");
      setActiveNumber("");
      setCallDuration(0);
      setCurrentLead(null);
      setCallType("manual");

      // Trigger leads queue refresh
      setLeadsQueueKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error updating lead:", error);
      throw error;
    }
  };

  const handleDeleteLead = async () => {
    if (!currentLead) return;

    try {
      const response = await fetch(`/api/leads/${currentLead.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete lead");
      }

      // Close modal and reset state
      setShowUpdateLead(false);
      setCallStatus("idle");
      setActiveNumber("");
      setCallDuration(0);
      setCurrentLead(null);
      setCallType("manual");

      // Trigger leads queue refresh
      setLeadsQueueKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error deleting lead:", error);
      throw error;
    }
  };

  const handleManualCallSave = async (businessName: string, status: string, notes: string) => {
    try {
      // Create new lead from manual call
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leads: [{
            business_name: businessName,
            phone: activeNumber,
            category: null,
            address: null,
            place_id: null,
            rating: null,
            review_count: null,
            social_only: false,
            website: null,
            business_status: "N/A",
          }],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save lead");
      }

      const data = await response.json();

      // If lead was saved, update its status and notes
      if (data.saved > 0) {
        // Find the newly created lead by phone number
        const leadsResponse = await fetch(`/api/leads/queue?leadStatus=new`);
        const leadsData = await leadsResponse.json();

        const newLead = leadsData.leads.find((l: any) => l.phone === activeNumber);

        if (newLead) {
          // Update the lead with status and notes
          await fetch(`/api/leads/${newLead.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              leadStatus: status,
              notes: notes,
              lastContactedAt: new Date().toISOString(),
            }),
          });
        }
      }

      // Close modal and reset state
      setShowManualCallModal(false);
      setCallStatus("idle");
      setActiveNumber("");
      setCallDuration(0);
      setCallType("manual");

      // Trigger leads queue refresh
      setLeadsQueueKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error saving manual call to leads:", error);
      throw error;
    }
  };


  return (
    <AppLayout
      dialerReady={dialerReady}
      dialerError={dialerError}
      onReconnect={() => {
        if (dialerClientRef.current) {
          dialerClientRef.current.destroy();
        }
        initDialer();
      }}
    >
      <div className="p-3 md:p-6 max-w-7xl mx-auto">

        <div className="grid lg:grid-cols-5 gap-4 md:gap-6">
          {/* Dial Pad - Full width on mobile, 2 cols on desktop */}
          <div className="lg:col-span-2">
            <DialPad
              onCall={handleCall}
              disabled={isCallActive}
              initialNumber={prefilledNumber}
              isInCall={isCallActive}
              callStatus={callStatus as "connecting" | "ringing" | "connected"}
              activeNumber={activeNumber}
              activeContact={activeContact?.businessName || currentLead?.businessName}
              callDuration={callDuration}
              isMuted={isMuted}
              onHangup={handleHangup}
              onToggleMute={handleToggleMute}
            />
          </div>

          {/* Leads Queue - Replaces Contact Queue */}
          <div className="hidden lg:block lg:col-span-3">
            <LeadsQueue
              key={leadsQueueKey}
              onCall={handleLeadCall}
              disabled={isCallActive}
              onLeadUpdate={() => setLeadsQueueKey((prev) => prev + 1)}
            />
          </div>
        </div>

        {/* Disposition Modal - For contact/manual calls */}
        {showDisposition && completedCallId && (
          <DispositionModal
            callId={completedCallId}
            contact={activeContact}
            phoneNumber={activeNumber}
            duration={callDuration}
            onClose={handleDispositionComplete}
          />
        )}

        {/* Update Lead Modal - For lead calls */}
        {showUpdateLead && currentLead && (
          <UpdateLeadModal
            leadId={currentLead.id}
            businessName={currentLead.businessName}
            phone={currentLead.phone}
            currentStatus={currentLead.leadStatus}
            currentNotes={currentLead.notes}
            onClose={() => {
              setShowUpdateLead(false);
              setCallStatus("idle");
              setActiveNumber("");
              setCallDuration(0);
              setCurrentLead(null);
              setCallType("manual");
            }}
            onUpdate={handleUpdateLead}
            onDelete={handleDeleteLead}
          />
        )}

        {/* Manual Call Disposition Modal - For manual dial pad calls */}
        {showManualCallModal && (
          <ManualCallDispositionModal
            phoneNumber={activeNumber}
            duration={callDuration}
            onClose={() => {
              setShowManualCallModal(false);
              setCallStatus("idle");
              setActiveNumber("");
              setCallDuration(0);
              setCallType("manual");
            }}
            onSave={handleManualCallSave}
          />
        )}
      </div>
    </AppLayout>
  );
}

export default function DialerPage() {
  return (
    <Suspense fallback={
      <AppLayout dialerReady={false} dialerError={null} onReconnect={() => {}}>
        <div className="p-6 max-w-7xl mx-auto">
          <div className="glass-card p-12 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white/60 text-sm">Loading dialer...</p>
          </div>
        </div>
      </AppLayout>
    }>
      <DialerContent />
    </Suspense>
  );
}
