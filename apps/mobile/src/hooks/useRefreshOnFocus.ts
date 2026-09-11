import { useCallback } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect as useNavigationFocusEffect } from '@react-navigation/native';

// Reload focused data on foregrounding as well as navigation (including temporary photo links).
export function useFocusEffect(effect: () => void | (() => void)) {
  useNavigationFocusEffect(useCallback(() => {
    let cleanup = effect();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') { cleanup?.(); cleanup = effect(); }
    });
    return () => { cleanup?.(); subscription.remove(); };
  }, [effect]));
}
