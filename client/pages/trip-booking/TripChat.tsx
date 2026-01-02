import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, User, Phone, MoreVertical, Loader2, Check, CheckCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  trip_id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

interface TripInfo {
  id: string;
  driver_id: string;
  departure_time: string;
  driver: {
    id: string;
    full_name: string;
    avatar_url?: string;
    phone?: string;
  };
  route: {
    departure_location: string;
    arrival_location: string;
  };
}

const QUICK_REPLIES = [
  "I'm on my way",
  "Running 5 mins late",
  "Where are you?",
  "I've arrived",
  "Thank you!",
];

export default function TripChat() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [tripInfo, setTripInfo] = useState<TripInfo | null>(null);
  const [otherUserId, setOtherUserId] = useState<string>("");
  const [otherUser, setOtherUser] = useState<{ full_name: string; avatar_url?: string; phone?: string } | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tripId && user) {
      fetchTripInfo();
      fetchMessages();
      const cleanup = subscribeToMessages();

    return () => {
        cleanup?.();
    };
    }
  }, [tripId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const fetchTripInfo = async () => {
    if (!tripId) return;

    try {
      const { data, error } = await supabase
        .from("trips")
        .select(`
          id,
          driver_id,
          departure_time,
          driver:profiles!trips_driver_id_fkey(
            id,
            full_name,
            avatar_url,
            phone
          ),
          route:routes!trips_route_id_fkey(
            departure_location,
            arrival_location
          )
        `)
        .eq("id", tripId)
        .single();

      if (error) throw error;
      
      const tripData = data as any;
      setTripInfo({
        ...tripData,
        driver: Array.isArray(tripData.driver) ? tripData.driver[0] : tripData.driver,
        route: Array.isArray(tripData.route) ? tripData.route[0] : tripData.route
      });
      
      // Determine other user (driver if I'm passenger, find passenger if I'm driver)
      if (user) {
        const driver = Array.isArray(tripData.driver) ? tripData.driver[0] : tripData.driver;
        if (tripData.driver_id !== user.id) {
          // I'm a passenger, chat with driver
          setOtherUserId(tripData.driver_id);
          setOtherUser(driver);
        } else {
          // I'm the driver, need to find passenger from bookings
          const { data: bookingData } = await supabase
            .from("trip_bookings")
            .select(`
              passenger:profiles!trip_bookings_passenger_id_fkey(
                id,
                full_name,
                avatar_url,
                phone
              )
            `)
            .eq("trip_id", tripId)
            .eq("booking_status", "confirmed")
            .limit(1)
            .single();
          
          if (bookingData?.passenger) {
            const passenger = Array.isArray(bookingData.passenger) ? bookingData.passenger[0] : bookingData.passenger;
            setOtherUserId(passenger.id);
            setOtherUser(passenger);
          }
        }
      }
    } catch (error: any) {
      console.error("Error fetching trip info:", error);
    }
  };

  const fetchMessages = async () => {
    if (!tripId || !user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("trip_messages")
        .select("*")
        .eq("trip_id", tripId)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      if (data && data.length > 0) {
        const unreadIds = data
          .filter(m => m.receiver_id === user.id && !m.is_read)
          .map(m => m.id);
        
        if (unreadIds.length > 0) {
      await supabase
        .from("trip_messages")
        .update({ is_read: true, read_at: new Date().toISOString() })
            .in("id", unreadIds);
        }
      }
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    if (!tripId || !user) return;

    const channel = supabase
      .channel(`trip-chat-${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trip_messages",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          
          if (newMsg.sender_id === user.id || newMsg.receiver_id === user.id) {
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            
            // Mark as read if I'm the receiver
            if (newMsg.receiver_id === user.id) {
              supabase
                .from("trip_messages")
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq("id", newMsg.id)
                .then();
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "trip_messages",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          const updatedMsg = payload.new as Message;
          setMessages((prev) => 
            prev.map(m => m.id === updatedMsg.id ? updatedMsg : m)
          );
        }
      )
      .subscribe((status) => {
        setIsOnline(status === 'SUBSCRIBED');
      });

    return () => {
      channel.unsubscribe();
    };
  };

  const sendMessage = async (text: string) => {
    if (!tripId || !user || !otherUserId || !text.trim()) return;

    try {
      setSending(true);
      const tempId = `temp-${Date.now()}`;
      
      // Optimistic update
      const tempMessage: Message = {
        id: tempId,
        trip_id: tripId,
        sender_id: user.id,
        receiver_id: otherUserId,
        message_text: text.trim(),
        is_read: false,
        read_at: null,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage("");

      const { data, error } = await supabase
        .from("trip_messages")
        .insert({
          trip_id: tripId,
          sender_id: user.id,
          receiver_id: otherUserId,
          message_text: text.trim(),
          is_read: false,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Replace temp message with real one
      setMessages(prev => 
        prev.map(m => m.id === tempId ? data : m)
      );
    } catch (error: any) {
      console.error("Error sending message:", error);
      // Remove failed message
      setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')));
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    if (newMessage.trim()) {
      sendMessage(newMessage);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickReply = (reply: string) => {
    sendMessage(reply);
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "h:mm a");
  };

  const formatDateDivider = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  const shouldShowDateDivider = (currentMsg: Message, prevMsg?: Message) => {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.created_at).toDateString();
    const prevDate = new Date(prevMsg.created_at).toDateString();
    return currentDate !== prevDate;
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#137fec]" />
            <p className="text-gray-600 dark:text-gray-400">Loading conversation...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-2xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full h-9 w-9 sm:h-10 sm:w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {otherUser?.avatar_url ? (
              <img
                  src={otherUser.avatar_url}
                  alt={otherUser.full_name}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover"
              />
            ) : (
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
            )}
            
              <div className="flex-1 min-w-0">
                <h1 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                  {otherUser?.full_name || "Chat"}
              </h1>
                <div className="flex items-center gap-1.5">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    isOnline ? "bg-green-500" : "bg-gray-400"
                  )} />
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {isOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </div>
            </div>

            {otherUser?.phone && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(`tel:${otherUser.phone}`)}
                className="rounded-full h-9 w-9 sm:h-10 sm:w-10"
              >
                <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            )}
          </div>

          {/* Trip info bar */}
          {tripInfo?.route && (
            <div className="max-w-2xl mx-auto px-3 sm:px-4 pb-2">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                  <span className="font-medium">{tripInfo.route.departure_location}</span>
                  {" → "}
                  <span className="font-medium">{tripInfo.route.arrival_location}</span>
                </p>
              </div>
            </div>
          )}
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto w-full p-3 sm:p-4 space-y-3 sm:space-y-4">
          {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 mb-4">
                  <Send className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  No messages yet.<br />Start the conversation!
                </p>
            </div>
          ) : (
              messages.map((message, index) => {
              const isMe = message.sender_id === user?.id;
                const showDate = shouldShowDateDivider(message, messages[index - 1]);
              
              return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="flex justify-center my-4">
                        <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs px-3 py-1 rounded-full">
                          {formatDateDivider(message.created_at)}
                        </span>
                      </div>
                    )}
                    <div className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                          "max-w-[80%] sm:max-w-[70%] rounded-2xl px-3 sm:px-4 py-2",
                      isMe
                            ? "bg-[#137fec] text-white rounded-br-sm"
                            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-sm"
                    )}
                  >
                        <p className="text-sm sm:text-base break-words">{message.message_text}</p>
                        <div className={cn(
                          "flex items-center justify-end gap-1 mt-1",
                        isMe ? "text-white/70" : "text-gray-500 dark:text-gray-400"
                        )}>
                          <span className="text-[10px] sm:text-xs">
                            {formatMessageTime(message.created_at)}
                          </span>
                          {isMe && (
                            message.is_read ? (
                              <CheckCheck className="h-3 w-3 text-blue-300" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )
                          )}
                        </div>
                      </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick Replies */}
        <div className="max-w-2xl mx-auto w-full px-3 sm:px-4 py-2">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {QUICK_REPLIES.map((reply) => (
              <button
                key={reply}
                onClick={() => handleQuickReply(reply)}
                disabled={!otherUserId || sending}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap disabled:opacity-50 transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <div className="max-w-2xl mx-auto flex gap-2 sm:gap-3">
            <input
              ref={inputRef}
              type="text"
              placeholder={otherUserId ? "Type a message..." : "Cannot send messages"}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={!otherUserId}
              className="flex-1 h-11 sm:h-12 px-4 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#137fec] focus:border-transparent disabled:opacity-50"
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || !otherUserId || sending}
              className="h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-[#137fec] hover:bg-[#137fec]/90 p-0"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
              ) : (
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </Layout>
  );
}
