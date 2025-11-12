# Slash Commands Available

Custom shortcuts for this project. Use by typing `/command-name` in Claude Code.

## Available Commands

### `/context`
**Get full project context**
- Reminds me this is React Native/Expo (NOT Next.js)
- Reviews tech stack and architecture
- Shows current project status
- Lists important files and patterns

**When to use**: Start of every session or when I seem confused about the tech stack

---

### `/add-feature`
**Add a new feature to the app**
- Reviews existing code patterns
- Plans feature implementation
- Ensures compatibility with Business/Personal profiles
- Follows React Native best practices

**When to use**: When you want to add a new screen or capability

---

### `/fix-bug`
**Debug and fix issues**
- Diagnoses common problems
- Checks Business/Personal filtering
- Reviews Supabase queries
- Tests the fix thoroughly

**When to use**: When something's broken or not working as expected

---

### `/supabase-help`
**Supabase database help**
- Reviews database schema
- Checks RLS policies
- Debugs queries
- Tests authentication

**When to use**: Database errors, 500 errors, or data not showing up

---

### `/style-component`
**Style React Native components**
- Provides design system colors
- Shows common component patterns
- Explains React Native styling (NOT CSS)
- Ensures consistency with app design

**When to use**: Creating new UI components or updating styles

---

### `/enable-profiles`
**Enable the Profile/Industry feature**
- Step-by-step activation guide
- Database setup instructions
- Code uncommenting steps
- Testing checklist

**When to use**: When ready to activate the pending profile feature

---

### `/quick-ref`
**Quick reference guide**
- Common commands and patterns
- Component usage
- File locations
- Color scheme
- Supabase query examples

**When to use**: Need a quick reminder of something

---

## How to Use

1. **Type the command**: Just type `/command-name` (e.g., `/context`)
2. **I'll expand it**: The full instructions load automatically
3. **Provide details**: Answer any questions I ask based on the command

## Examples

```
You: /context
Me: [Loads full context about React Native/Expo setup]

You: /add-feature
I want to add a budget tracker
Me: [Follows add-feature workflow to implement it]

You: /fix-bug
The expenses aren't showing up
Me: [Follows debug workflow to diagnose and fix]
```

## Tips

- **Use `/context` at the start** of each session so I remember this is React Native
- **Chain commands**: Use `/context` then `/add-feature` for best results
- **Commands work instantly**: No need to explain the whole project every time

## Create Your Own

Add new commands by creating `.md` files in `.claude/commands/`:

```bash
.claude/commands/my-command.md
```

Then use it with `/my-command`

---

**Pro Tip**: Start every new chat session with `/context` so I know this is React Native and not Next.js!
