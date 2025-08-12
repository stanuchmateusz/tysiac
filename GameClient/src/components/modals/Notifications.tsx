import { useNotification } from "../../utils/NotificationContext";

export default function Notifications() {
  const { notifications } = useNotification();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map((n, i) => (
        <div
          key={i}
          className={`px-4 py-2 rounded shadow text-white ${
            n.type === "error"
              ? "bg-red-500"
              : n.type === "success"
              ? "bg-green-500"
              : "bg-blue-500"
          }`}
        >
          {n.message}
        </div>
      ))}
    </div>
  );
}