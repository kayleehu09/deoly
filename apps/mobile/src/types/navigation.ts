import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Signup: undefined;
  MainTabs: NavigatorScreenParams<TabParamList>;
  Activity: undefined;
  DeolyArchive: undefined;
  FriendProfile: {
    userId: string;
    user?: {
      id: string;
      username: string;
      displayName: string;
      profileImageUrl: string;
      bio?: string;
    };
    friendship?: {
      friendshipId: string;
      direction: 'incoming' | 'outgoing' | 'accepted';
      status: 'pending' | 'accepted' | 'declined';
    };
  };
  ProfileFriends: undefined;
  BlockedUsers: undefined;
  Settings: undefined;
  PostComposer: {
    imageUri: string;
  };
  PostDetail: {
    postId: string;
  };
};

export type TabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  CreatePostTab: undefined;
  PrayerTab: undefined;
  ProfileTab: undefined;
};
