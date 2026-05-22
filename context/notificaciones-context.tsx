import React, { createContext, useContext, useState, useEffect } from "react";
import { getCurrentSession } from "@/services/auth.service";
import {
  getNotificaciones,
  getNotificacionesSinLeerCount,
  marcarComoLeida,
  marcarTodasComoLeidas,
  subscribeToNotificaciones,
  NotificacionData
} from "@/services/notificaciones.service";

interface NotificacionesContextType {
  notifications: NotificacionData[];
  unreadCount: number;
  loading: boolean;
  marcarComoLeida: (id: string) => Promise<void>;
  marcarTodasComoLeidas: () => Promise<void>;
  refrescar: () => Promise<void>;
}

const NotificacionesContext = createContext<NotificacionesContextType | undefined>(undefined);

export const NotificacionesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificacionData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const cargarDatos = async (uid: string) => {
    try {
      const [list, count] = await Promise.all([
        getNotificaciones(uid),
        getNotificacionesSinLeerCount(uid)
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch (e) {
      console.error("Error al refrescar notificaciones en context:", e);
    }
  };

  useEffect(() => {
    let desuscribir: (() => void) | undefined;

    async function iniciar() {
      try {
        const session = await getCurrentSession();
        if (session?.user?.id) {
          const uid = session.user.id;
          setUserId(uid);
          await cargarDatos(uid);
          setLoading(false);

          // Suscribirse en tiempo real
          desuscribir = subscribeToNotificaciones(uid, () => {
            cargarDatos(uid);
          });
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error inicializando el contexto de notificaciones:", error);
        setLoading(false);
      }
    }

    iniciar();

    return () => {
      if (desuscribir) desuscribir();
    };
  }, []);

  const handleMarcarComoLeida = async (id: string) => {
    // Actualización optimista de UI
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, leido: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    await marcarComoLeida(id);
    if (userId) await cargarDatos(userId);
  };

  const handleMarcarTodasComoLeidas = async () => {
    if (!userId) return;
    
    // Actualización optimista de UI
    setNotifications(prev => prev.map(n => ({ ...n, leido: true })));
    setUnreadCount(0);
    
    await marcarTodasComoLeidas(userId);
    await cargarDatos(userId);
  };

  const handleRefrescar = async () => {
    if (userId) {
      setLoading(true);
      await cargarDatos(userId);
      setLoading(false);
    }
  };

  return (
    <NotificacionesContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        marcarComoLeida: handleMarcarComoLeida,
        marcarTodasComoLeidas: handleMarcarTodasComoLeidas,
        refrescar: handleRefrescar
      }}
    >
      {children}
    </NotificacionesContext.Provider>
  );
};

export const useNotificacionesContext = () => {
  const context = useContext(NotificacionesContext);
  if (context === undefined) {
    throw new Error("useNotificacionesContext debe usarse dentro de un NotificacionesProvider");
  }
  return context;
};
