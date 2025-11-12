# Style Component

Help me style a component for the Expenses Made Easy app.

**Remember**: This is React Native, NOT web! Use StyleSheet, not CSS.

## React Native Styling Rules

### ❌ DON'T Use (Web):
```jsx
<div className="button">
<p style="color: red">
<button onClick={}>
```

### ✅ DO Use (React Native):
```jsx
<View style={styles.container}>
<Text style={styles.text}>
<TouchableOpacity onPress={}>
```

## Current Design System

### Colors
```javascript
Primary: '#ea580c'      // Orange
Background: '#f9fafb'   // Light gray
Text: '#1f2937'         // Dark gray
Border: '#e5e7eb'       // Light border
Success: '#10b981'      // Green
Error: '#ef4444'        // Red
Business: '#3b82f6'     // Blue
Personal: '#10b981'     // Green
```

### Common Patterns

**Card Style:**
```javascript
card: {
  backgroundColor: '#fff',
  borderRadius: 16,
  padding: 20,
  borderWidth: 1,
  borderColor: '#e5e7eb',
  marginBottom: 16,
}
```

**Button Style:**
```javascript
button: {
  backgroundColor: '#ea580c',
  borderRadius: 12,
  padding: 16,
  alignItems: 'center',
}
```

**Input Style:**
```javascript
input: {
  backgroundColor: '#fff',
  borderWidth: 2,
  borderColor: '#e5e7eb',
  borderRadius: 12,
  padding: 16,
  fontSize: 16,
}
```

## Process

1. Check existing screens for similar components
2. Use StyleSheet.create() at bottom of file
3. Follow the color scheme above
4. Test on both light backgrounds
5. Make sure text is readable

What component would you like to style?
