import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, StyleSheet, View } from 'react-native';

import { LoadingScreen } from '../components/LoadingScreen';
import { colors, radii, spacing, typography } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';
import { ActivityScreen } from '../screens/ActivityScreen';
import { CreatePostCameraScreen } from '../screens/CreatePostCameraScreen';
import { DeolyArchiveScreen } from '../screens/DeolyArchiveScreen';
import { FriendProfileScreen } from '../screens/FriendProfileScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { PostComposerScreen } from '../screens/PostComposerScreen';
import { PrayerPlaceholderScreen } from '../screens/PrayerPlaceholderScreen';
import { ProfileFriendsScreen } from '../screens/ProfileFriendsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SignupScreen } from '../screens/SignupScreen';
import type { RootStackParamList, TabParamList } from '../types/navigation';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabBarItem({
  routeName,
  color,
  focused
}: {
  routeName: keyof TabParamList;
  color: string;
  focused: boolean;
}) {
  if (routeName === 'CreatePostTab') {
    return (
      <View style={styles.tabSlot}>
        <View style={[styles.centerActionButton, focused && styles.centerActionButtonFocused]}>
          <Ionicons name="camera" size={26} color={colors.text} />
        </View>
      </View>
    );
  }

  if (routeName === 'PrayerTab') {
    return (
      <View style={styles.tabSlot}>
        <FontAwesome6 name="hands-praying" size={20} color={color} />
      </View>
    );
  }

  const iconName: Record<Exclude<keyof TabParamList, 'CreatePostTab' | 'PrayerTab'>, keyof typeof Ionicons.glyphMap> = {
    HomeTab: focused ? 'home' : 'home-outline',
    SearchTab: focused ? 'search' : 'search-outline',
    ProfileTab: focused ? 'person' : 'person-outline'
  };

  return (
    <View style={styles.tabSlot}>
      <Ionicons name={iconName[routeName]} size={22} color={color} />
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          height: Platform.select({
            ios: 88,
            android: 78,
            default: 78
          }),
          paddingTop: 12,
          paddingBottom: Platform.select({
            ios: 16,
            android: 12,
            default: 12
          }),
          paddingHorizontal: spacing.md,
          backgroundColor: colors.surface,
          borderTopColor: colors.border
        },
        tabBarShowLabel: false,
        tabBarItemStyle: {
          flex: 1,
          height: 56,
          alignItems: 'center',
          justifyContent: 'center'
        },
        tabBarLabelStyle: {
          fontFamily: typography.bodyFamily,
          fontSize: 12,
          fontWeight: '600'
        },
        tabBarIcon: ({ color, focused }) => <TabBarItem routeName={route.name} color={color} focused={focused} />
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="SearchTab" component={SearchScreen} options={{ title: 'Search' }} />
      <Tab.Screen name="CreatePostTab" component={CreatePostCameraScreen} options={{ title: 'Create Post' }} />
      <Tab.Screen name="PrayerTab" component={PrayerPlaceholderScreen} options={{ title: 'Prayer' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    border: colors.border,
    primary: colors.accent,
    text: colors.text
  }
};

export function AppNavigator() {
  const { isAuthenticated, isRestoring } = useAuth();

  if (isRestoring) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootStack.Navigator>
        {isAuthenticated ? (
          <>
            <RootStack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
            <RootStack.Screen name="Activity" component={ActivityScreen} options={{ headerShown: false }} />
            <RootStack.Screen name="DeolyArchive" component={DeolyArchiveScreen} options={{ headerShown: false }} />
            <RootStack.Screen name="FriendProfile" component={FriendProfileScreen} options={{ headerShown: false }} />
            <RootStack.Screen name="ProfileFriends" component={ProfileFriendsScreen} options={{ headerShown: false }} />
            <RootStack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
            <RootStack.Screen
              name="PostComposer"
              component={PostComposerScreen}
              options={{
                title: 'New Post',
                headerShadowVisible: false,
                headerStyle: {
                  backgroundColor: colors.background
                },
                headerTintColor: colors.text
              }}
            />
          </>
        ) : (
          <RootStack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabSlot: {
    width: '100%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center'
  },
  centerActionButton: {
    width: 64,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4
    },
    elevation: 4
  },
  centerActionButtonFocused: {
    backgroundColor: colors.accentSoft
  }
});
