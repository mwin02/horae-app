import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TYPOGRAPHY, RADIUS } from '@/constants/theme';

interface CategoryChipProps {
  name: string;
  color: string;
}

export function CategoryChip({ name, color }: CategoryChipProps): React.ReactElement {
  return (
    <View style={[styles.container, { backgroundColor: color + '26' }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
  },
});
