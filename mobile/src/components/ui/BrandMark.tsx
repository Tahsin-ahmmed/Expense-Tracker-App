import { Image } from 'react-native';

import { t } from '@/i18n';

const LOGO = require('@/assets/images/logo-mark.png');

export interface BrandMarkProps {
  /** Width and height in dp. */
  size?: number;
  /** Hide from screen readers when the app name is shown next to it. Default: true. */
  decorative?: boolean;
}

/** The HisabBondhu wallet logo (transparent, works on light and dark backgrounds). */
export function BrandMark({ size = 40, decorative = true }: BrandMarkProps) {
  return (
    <Image
      source={LOGO}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessible={!decorative}
      accessibilityRole={decorative ? undefined : 'image'}
      accessibilityLabel={decorative ? undefined : t('app.name')}
      testID="brand-mark"
    />
  );
}
