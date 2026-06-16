import 'react-native-reanimated';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider } from '@/context/auth-context';
import { AiChatProvider } from '@/context/ai-chat-context';
import { ConsentProvider } from '@/context/consent-context';
import { ProfileProvider } from '@/context/profile-context';
import { ProtectionProvider } from '@/context/protection-context';
import { ReferralRewardsProvider } from '@/context/referral-rewards-context';
import { SubscriptionProvider } from '@/context/subscription-context';
import { DeltexThemeProvider, useDeltexTheme } from '@/theme/deltex-theme';

function ThemedStatusBar() {
  const { resolvedTheme } = useDeltexTheme();

  return <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DeltexThemeProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <ProfileProvider>
              <ConsentProvider>
                <ReferralRewardsProvider>
                  <ProtectionProvider>
                    <AiChatProvider>
                      <ThemedStatusBar />
                      <Stack screenOptions={{ headerShown: false }} />
                    </AiChatProvider>
                  </ProtectionProvider>
                </ReferralRewardsProvider>
              </ConsentProvider>
            </ProfileProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </DeltexThemeProvider>
    </GestureHandlerRootView>
  );
}
