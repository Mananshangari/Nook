---
name: Nook audience connect state
description: Audience tab must persist platform connections via ProfileContext, not local component state
---

The Audience tab originally used local `demoConnected` state to show the connected UI. This meant Home and Profile tabs never reflected connection status.

**Fix:** Call `connectPlatform()` from `useProfile()` when user connects a platform. This writes to AsyncStorage via ProfileContext so all tabs share the same state.

**Why:** `profile.connectedPlatforms` is the source of truth used by Home (teaser) and Profile (connected platforms list). Local component state is invisible to sibling tabs.

**How to apply:** Any cross-tab state (connections, settings, user data) must go through a context + AsyncStorage, never local useState.
