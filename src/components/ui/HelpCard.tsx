import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface ActionButton {
  label: string;
  onPress: () => void;
}

interface Props {
  title: string;
  children?: React.ReactNode;
  onDismiss?: () => void;
  actions?: ActionButton[];
}

export default function HelpCard({ title, children, onDismiss, actions = [] }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} accessibilityLabel="Dismiss help">
            <Text style={styles.dismiss}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      {children ? <View style={styles.body}>{children}</View> : null}
      {actions.length > 0 && (
        <View style={styles.actions}>
          {actions.map((a) => (
            <TouchableOpacity key={a.label} style={styles.actionBtn} onPress={a.onPress}>
              <Text style={styles.actionText}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
  },
  dismiss: {
    color: '#92400E',
    fontSize: 16,
    padding: 4,
  },
  body: {
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
  },
});

