# Playwright E2E Testing

## Overview

Automated tests for all major user flows. Runs on CI/CD with every PR.

## Test Cases

### 1. Basic Access
- [ ] Visit site → room list screen loads
- [ ] Select room → library Canvas renders
- [ ] My character sits at empty desk

### 2. Real-Time Presence
- [ ] Open second browser tab → user count +1
- [ ] Close tab → user count -1
- [ ] Character appears and disappears

### 3. Ambience Sound
- [ ] Drag slider → volume changes
- [ ] Click preset button → sliders auto-adjust
- [ ] Mute button → all sounds off

### 4. Pomodoro Timer
- [ ] Start button → countdown begins
- [ ] After 25min → switches to break mode
- [ ] Reset button → timer resets

### 5. Room System
- [ ] Room full → shows "Room is full" message
- [ ] Can select another room

## Running Tests

```bash
cd frontend
npx playwright test              # Run all tests
npx playwright test --ui         # UI mode (debugging)
npx playwright test --headed     # Watch browser while running
```

## CI/CD Integration

Runs automatically on every PR via GitHub Actions → see 08-deployment/ci-cd.md
