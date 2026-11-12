import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { dhakaHour, todayInDhaka, type IsoDate } from '@/domain/date';

export interface TodayInfo {
  today: IsoDate;
  hour: number;
}

function read(): TodayInfo {
  const now = new Date();
  return { today: todayInDhaka(now), hour: dhakaHour(now) };
}

/**
 * Today's date and hour in Dhaka. Refreshes whenever the screen regains focus,
 * so a screen left open overnight shows the new day when revisited.
 */
export function useToday(): TodayInfo {
  const [info, setInfo] = useState(read);

  useFocusEffect(
    useCallback(() => {
      const next = read();
      setInfo((current) =>
        current.today === next.today && current.hour === next.hour ? current : next,
      );
    }, []),
  );

  return info;
}
