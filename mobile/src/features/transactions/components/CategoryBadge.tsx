import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui';
import type { CategoryId } from '@/domain/category';
import { radius } from '@/theme';

import { CATEGORY_APPEARANCE } from '../categoryAppearance';

export interface CategoryBadgeProps {
  categoryId: CategoryId;
  size?: number;
}

/** Round tinted badge with the category's icon. */
export function CategoryBadge({ categoryId, size = 40 }: CategoryBadgeProps) {
  const appearance = CATEGORY_APPEARANCE[categoryId];
  return (
    <View
      style={[
        styles.badge,
        { width: size, height: size, backgroundColor: `${appearance.color}1F` },
      ]}>
      <Icon name={appearance.icon} size={size * 0.5} color={appearance.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
});
