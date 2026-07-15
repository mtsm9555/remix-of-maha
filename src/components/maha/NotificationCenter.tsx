import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Brain,
  Search,
  Eye,
} from "lucide-react";

export type NotificationType =
  | "success"
  | "warning"
  | "info"
  | "memory"
  | "vision";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: NotificationType;
}

interface Props {
  notifications: NotificationItem[];
}

function getIcon(type: NotificationType) {
  switch (type) {
    case "success":
      return (
        <CheckCircle2
          size={18}
          className="text-green-400"
        />
      );

    case "warning":
      return (
        <AlertTriangle
          size={18}
          className="text-orange-400"
        />
      );

    case "memory":
      return (
        <Brain
          size={18}
          className="text-cyan-400"
        />
      );

    case "vision":
      return (
        <Eye
          size={18}
          className="text-purple-400"
        />
      );

    default:
      return (
        <Search
          size={18}
          className="text-cyan-300"
        />
      );
  }
}

export default function NotificationCenter({
  notifications,
}: Props) {
  return (
    <div className="bg-[#0B1118] border border-[#152533] rounded-xl h-full flex flex-col">

      {/* Header */}
      <div className="border-b border-[#152533] p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell
            size={18}
            className="text-cyan-300"
          />

          <span className="tracking-[0.2em] text-cyan-300 text-sm">
            NOTIFICATION CENTER
          </span>
        </div>

        <span className="text-xs text-slate-400">
          {notifications.length}
        </span>
      </div>

      {/* Notifications */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {notifications.map((item) => (
          <div
            key={item.id}
            className="bg-[#081018] border border-[#152533] rounded-lg p-3 hover:border-cyan-500 transition-all"
          >
            <div className="flex items-start gap-3">

              {getIcon(item.type)}

              <div className="flex-1">
                <div className="text-white text-sm">
                  {item.title}
                </div>

                <div className="text-slate-400 text-xs mt-1">
                  {item.message}
                </div>

                <div className="flex items-center gap-1 mt-2 text-[10px] text-cyan-400">
                  <Clock size={10} />
                  {item.time}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}