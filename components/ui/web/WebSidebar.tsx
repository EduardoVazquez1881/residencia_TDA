import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Link, usePathname, router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { logout } from '@/services/auth.service';
import { useNotificacionesContext } from '@/context/notificaciones-context';

const MENU_ITEMS = [
  { name: 'Inicio', icon: 'home-outline', route: '/prueba' },
  { name: 'Expedientes', icon: 'folder-open-outline', route: '/expedientes' },
  { name: 'Alumnos', icon: 'people-outline', route: '/alumnos' },
  { name: 'Plantillas', icon: 'document-text-outline', route: '/mis-plantillas' },
  { name: 'Historial Bitácoras', icon: 'reader-outline', route: '/reportes' },
  { name: 'Notificaciones', icon: 'notifications-outline', route: '/notificaciones' },
  { name: 'Perfil', icon: 'person-circle-outline', route: '/perfil' },
];

interface MenuItemProps {
  item: typeof MENU_ITEMS[0];
  isActive: boolean;
  isCollapsed: boolean;
  colors: any;
  isDark: boolean;
  badgeCount?: number;
}

const MenuItem = ({ item, isActive, isCollapsed, colors, isDark, badgeCount }: MenuItemProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href={item.route as any} asChild>
      <TouchableOpacity
        activeOpacity={0.7}
        {...({
          onMouseEnter: () => setIsHovered(true),
          onMouseLeave: () => setIsHovered(false),
        } as any)}
        style={StyleSheet.flatten([
          styles.menuItem,
          isCollapsed && styles.menuItemCollapsed,
          isActive && { backgroundColor: `${colors.primary}15` },
          !isActive && isHovered && { backgroundColor: isDark ? '#ffffff08' : '#f8fafc' },
          isActive && { borderRightColor: colors.primary, borderRightWidth: 3 }
        ])}
      >
        <View style={styles.menuIconContainer}>
          <Ionicons 
            name={item.icon as any} 
            size={22} 
            color={isActive ? colors.primary : (isHovered ? colors.primary : colors.textSecondary)} 
          />
          {badgeCount !== undefined && badgeCount > 0 && isCollapsed && (
            <View style={[styles.badgeCollapsed, { backgroundColor: colors.error }]}>
              <Text style={styles.badgeTextCollapsed}>{badgeCount}</Text>
            </View>
          )}
        </View>
        {!isCollapsed && (
          <View style={styles.menuTextContainer}>
            <Text style={[
              styles.menuText,
              { 
                color: isActive ? colors.primary : (isHovered ? colors.text : colors.textSecondary), 
                fontWeight: isActive ? '700' : '500' 
              }
            ]}>
              {item.name}
            </Text>
            {badgeCount !== undefined && badgeCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.error }]}>
                <Text style={styles.badgeText}>{badgeCount}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Link>
  );
};

export const WebSidebar = () => {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme as 'light' | 'dark'];
  const isDark = colorScheme === 'dark';
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Consumir el conteo global de no leídos
  const { unreadCount } = useNotificacionesContext();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <View style={[
      styles.sidebar, 
      { 
        width: isCollapsed ? 80 : 260,
        backgroundColor: isDark ? colors.backgroundSecondary : '#fff', 
        borderRightColor: colors.border 
      }
    ]}>
      
      {/* BRANDING & TOGGLE */}
      <View style={[styles.branding, isCollapsed && styles.brandingCollapsed]}>
        {!isCollapsed && (
          <>
            <View style={[styles.iconWrapper, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="apps-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.brandTitle, { color: colors.text }]}>Residencia TDA</Text>
              <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>Dashboard</Text>
            </View>
          </>
        )}

        <TouchableOpacity 
          style={[styles.toggleBtn, { backgroundColor: isDark ? '#ffffff08' : '#f8fafc' }]}
          onPress={() => setIsCollapsed(!isCollapsed)}
        >
          <Ionicons 
            name={isCollapsed ? "menu-outline" : "chevron-back-outline"} 
            size={20} 
            color={colors.text} 
          />
        </TouchableOpacity>
      </View>

      {/* MENU */}
      <View style={styles.menuContainer}>
        {MENU_ITEMS.map((item) => (
          <MenuItem 
            key={item.route} 
            item={item} 
            isActive={pathname === item.route} 
            isCollapsed={isCollapsed}
            colors={colors}
            isDark={isDark}
            badgeCount={item.name === 'Notificaciones' ? unreadCount : undefined}
          />
        ))}
      </View>

      {/* FOOTER */}
      <View style={[styles.footer, isCollapsed && styles.footerCollapsed]}>
        <TouchableOpacity 
          style={[styles.logoutBtn, isCollapsed && styles.logoutBtnCollapsed]} 
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color={colors.error} />
          {!isCollapsed && (
            <Text style={[styles.logoutText, { color: colors.error }]}>Cerrar Sesión</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    height: '100vh' as any,
    borderRightWidth: 1,
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky' as any,
    top: 0,
    transitionProperty: 'width',
    transitionDuration: '0.3s',
  } as any,
  branding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 24,
    height: 90,
  },
  brandingCollapsed: {
    padding: 16,
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 11,
  },
  toggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  menuContainer: {
    flex: 1,
    paddingVertical: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 12,
    marginVertical: 2,
    transitionProperty: 'background-color',
    transitionDuration: '0.2s',
  } as any,
  menuItemCollapsed: {
    paddingHorizontal: 0,
    justifyContent: 'center',
    gap: 0,
  },
  menuIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuText: {
    fontSize: 14,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  badgeCollapsed: {
    position: 'absolute',
    top: -4,
    right: -6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTextCollapsed: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  footerCollapsed: {
    padding: 16,
    alignItems: 'center',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoutBtnCollapsed: {
    justifyContent: 'center',
    gap: 0,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
