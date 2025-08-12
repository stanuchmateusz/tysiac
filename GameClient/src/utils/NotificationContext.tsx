import { createContext, useContext, useState } from "react";

type Notification = { message: string; type?: "info" | "success" | "error" };

const NotificationContext = createContext<{
  notify: (notification: Notification) => void;
  notifications: Notification[];
  remove: (index: number) => void;
}>({
  notify: () => {},
  notifications: [],
  remove: () => {},
});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = (notification: Notification) => {
    setNotifications((prev) => [...prev, notification]);
    setTimeout(() => remove(0), 3000); // auto-remove after 3s
  };

  const remove = (index: number) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <NotificationContext.Provider value={{ notify, notifications, remove }}>
      {children}
    </NotificationContext.Provider>
  );
};