import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  X,
  Settings,
  Trash2,
  MoreVertical,
  Package,
  Gift,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  notificationService,
  subscribeToNotifications,
  markNotificationAsRead,
  requestNotificationPermission,
  type NotificationData,
} from "@/lib/notification-service";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface NotificationCenterProps {
  className?: string;
  showBadge?: boolean;
}

const getNotificationIcon = (type: NotificationData["type"]) => {
  switch (type) {
    case "success":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "error":
      return <XCircle className="h-4 w-4 text-red-600" />;
    case "warning":
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    case "order":
      return <Package className="h-4 w-4 text-blue-600" />;
    case "promotion":
      return <Gift className="h-4 w-4 text-purple-600" />;
    default:
      return <Info className="h-4 w-4 text-gray-600" />;
  }
};

const getNotificationBgColor = (type: NotificationData["type"]) => {
  switch (type) {
    case "success":
      return "bg-green-50 border-green-200";
    case "error":
      return "bg-red-50 border-red-200";
    case "warning":
      return "bg-yellow-50 border-yellow-200";
    case "order":
      return "bg-blue-50 border-blue-200";
    case "promotion":
      return "bg-purple-50 border-purple-200";
    default:
      return "bg-gray-50 border-gray-200";
  }
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  className,
  showBadge = true,
}) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    // Check current permission status
    setHasPermission(notificationService.isPermissionGranted());

    // Subscribe to notification updates
    const unsubscribe = subscribeToNotifications((updatedNotifications) => {
      setNotifications(updatedNotifications);
    });

    return unsubscribe;
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setHasPermission(granted);
    if (granted) {
      toast.success("Notifications enabled successfully!");
    } else {
      toast.error("Notification permission denied");
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    markNotificationAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
    toast.success("All notifications marked as read");
  };

  const handleDeleteNotification = (notificationId: string) => {
    notificationService.deleteNotification(notificationId);
    toast.success("Notification deleted");
  };

  const handleClearAll = () => {
    notificationService.clearAllNotifications();
    toast.success("All notifications cleared");
  };

  const formatTimestamp = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const NotificationItem: React.FC<{ notification: NotificationData }> = ({
    notification,
  }) => (
    <div
      className={cn(
        "p-3 border rounded-lg transition-colors hover:bg-gray-50",
        !notification.read && getNotificationBgColor(notification.type),
        notification.read && "bg-white border-gray-200",
      )}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon(notification.type)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p
                className={cn(
                  "text-sm",
                  !notification.read
                    ? "font-semibold text-gray-900"
                    : "font-medium text-gray-700",
                )}
              >
                {notification.title}
              </p>
              <p className="text-sm text-gray-600 mt-1">{notification.body}</p>
              <p className="text-xs text-gray-500 mt-2">
                {formatTimestamp(notification.timestamp)}
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!notification.read && (
                  <DropdownMenuItem
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Mark as read
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => handleDeleteNotification(notification.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("relative", className)}>
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {showBadge && unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs"
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!hasPermission && (
                    <>
                      <DropdownMenuItem onClick={handleRequestPermission}>
                        <Bell className="h-4 w-4 mr-2" />
                        Enable notifications
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {notifications.length > 0 && (
                    <DropdownMenuItem
                      onClick={handleClearAll}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear all
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <ScrollArea className="h-96">
          <div className="p-4">
            {!hasPermission && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Bell className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800">
                      Enable Notifications
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Get notified about order updates, offers, and more
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 border-yellow-300 text-yellow-800 hover:bg-yellow-100"
                      onClick={handleRequestPermission}
                    >
                      Enable Now
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No notifications yet</p>
                <p className="text-gray-400 text-xs mt-1">
                  We'll notify you about order updates and offers
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
