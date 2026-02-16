# 🎯 Attack Demo - Two Windows Setup

## 📺 Visual Setup Guide

### **What You'll See:**
- **Window 1 (Admin):** Real-time attack monitoring dashboard
- **Window 2 (Attacker):** Execute attacks and see responses

---

## 🚀 Step-by-Step Setup (2 minutes)

### **Step 1: Open Window 1 - Admin Monitor**

1. **Open your browser** (Chrome, Edge, Firefox)
2. **Go to:** `http://localhost:3000`
3. **Login as Admin:**
   - Email: `admin@ecommerce.com`
   - Password: `admin123`
4. **Click "Attacks"** in the top navigation bar
5. **Keep this window visible** on the left side of your screen

**What you see:**
```
┌─────────────────────────────────────┐
│  E-Commerce Defense                 │
│  [Shop] [Dashboard] [Attacks] [BC]  │
├─────────────────────────────────────┤
│  🛡️ Real-Time Attack Monitor        │
│                                     │
│  Total Threats: 0                   │
│  Blocked: 0                         │
│  Shadow Banned: 0                   │
│  Monitored: 0                       │
│                                     │
│  📡 Live Threat Feed                │
│  No threats detected yet...         │
└─────────────────────────────────────┘
```

---

### **Step 2: Open Window 2 - Attacker**

**Option A: New Browser Window (Recommended)**
1. **Open a NEW browser window** (not tab)
2. **Go to:** `http://localhost:3000`
3. **Login as Attacker:**
   - Email: `attacker@example.com`
   - Password: `attacker123`
4. **Position this window** on the right side of your screen

**Option B: Incognito/Private Window**
1. **Open incognito/private window** (Ctrl+Shift+N in Chrome)
2. **Go to:** `http://localhost:3000`
3. **Login as Attacker**
4. **Position on right side**

**What you see:**
```
┌─────────────────────────────────────┐
│  E-Commerce Defense                 │
│  [Shop] [Cart]  attacker@example... │
├─────────────────────────────────────┤
│  Products                           │
│                                     │
│  [Laptop Pro 15]  $1299.99         │
│  [Wireless Mouse] $29.99           │
│  [USB-C Hub]      $49.99           │
│                                     │
└─────────────────────────────────────┘
```

---

### **Step 3: Arrange Windows Side-by-Side**

**Windows 10/11:**
- Drag Window 1 to **left edge** (it will snap to left half)
- Drag Window 2 to **right edge** (it will snap to right half)

**Or manually:**
- Resize both windows to half screen width
- Position them side by side

**Your screen should look like:**
```
┌──────────────────┬──────────────────┐
│   WINDOW 1       │   WINDOW 2       │
│   (Admin)        │   (Attacker)     │
│                  │                  │
│  Attack Monitor  │  Shop Page       │
│  📊 Charts       │  🛒 Products     │
│  📡 Live Feed    │  🔍 Console      │
│                  │                  │
└──────────────────┴──────────────────┘
```

---

### **Step 4: Open Console in Window 2**

**In Window 2 (Attacker):**
1. **Press F12** (or right-click → Inspect)
2. **Click "Console" tab** at the top
3. **Clear any messages** (click 🚫 icon)

**What you see:**
```
┌─────────────────────────────────────┐
│  Products Page                      │
│  [Laptop] [Mouse] [Hub]            │
├─────────────────────────────────────┤
│  Console ▼                          │
│  >                                  │
│  (ready to paste attack code)      │
└─────────────────────────────────────┘
```

---

## 🎯 Execute Attack (30 seconds)

### **In Window 2 Console, paste this:**

```javascript
// Rapid Request Attack
console.log('🔴 Starting attack...');
for(let i = 0; i < 50; i++) {
  fetch('http://localhost:5000/api/products')
    .then(r => r.json())
    .then(d => console.log(`✓ Request ${i+1} complete`))
    .catch(e => console.log(`✗ Request ${i+1} blocked`));
}
console.log('🔴 Attack launched! Watch admin window →');
```

**Press Enter**

---

## 👀 Watch Both Windows!

### **Window 1 (Admin) - You'll See:**

**Within 2-3 seconds:**
```
┌─────────────────────────────────────┐
│  🛡️ Real-Time Attack Monitor        │
│                                     │
│  Total Threats: 15 ⬆️               │
│  Blocked: 0                         │
│  Shadow Banned: 0                   │
│  Monitored: 15 ⬆️                   │
│                                     │
│  📊 Risk Score Trend                │
│  ████████░░ 45% ⬆️                  │
│                                     │
│  📡 Live Threat Feed                │
│  🔵 12:34:56 | MONITOR | 45%       │
│     Session: abc123...              │
│     Reasoning: Low risk - monitoring│
│                                     │
│  🟠 12:34:57 | THROTTLE | 68%      │
│     Session: abc123...              │
│     Reasoning: Medium risk - limit  │
│                                     │
│  🔴 12:34:58 | BLOCK | 87%         │
│     Session: abc123...              │
│     Reasoning: High risk - blocked  │
└─────────────────────────────────────┘
```

**After 10-15 seconds:**
- Statistics counters increase
- Risk score chart shows spike
- Threat feed fills with entries
- Colors change: Green → Blue → Orange → Red
- Action distribution pie chart updates

---

### **Window 2 (Attacker) - You'll See:**

**Console output:**
```
🔴 Starting attack...
🔴 Attack launched! Watch admin window →
✓ Request 1 complete
✓ Request 2 complete
✓ Request 3 complete
...
✓ Request 25 complete
✓ Request 26 complete
✗ Request 27 blocked
✗ Request 28 blocked
✗ Request 29 blocked
...
```

**What happens:**
- First 20-30 requests succeed (green checkmarks)
- System detects pattern
- Later requests get blocked (red X marks)
- Some requests slow down (throttled)

---

## 🎬 What You're Seeing

### **Real-Time Detection:**

**Phase 1 (Requests 1-10):**
- ✅ Requests succeed
- 🟢 Risk: 10-30% (Allow)
- System is learning

**Phase 2 (Requests 11-25):**
- ✅ Requests succeed but logged
- 🔵 Risk: 30-50% (Monitor)
- System is watching

**Phase 3 (Requests 26-35):**
- ⚠️ Requests slowed down
- 🟠 Risk: 50-70% (Throttle)
- System is limiting

**Phase 4 (Requests 36-50):**
- ❌ Requests blocked
- 🔴 Risk: 70-90% (Block)
- System is protecting

---

## 🎯 Try More Attacks

### **Attack 2: Failed Logins**

**In Window 2 console:**
```javascript
console.log('🔴 Credential stuffing attack...');
for(let i = 0; i < 10; i++) {
  setTimeout(() => {
    fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        email: 'admin@ecommerce.com',
        password: 'wrong' + i
      })
    }).then(r => console.log(`Attempt ${i+1}: ${r.status}`));
  }, i * 1000);
}
```

**Watch Window 1:** Failed login attempts appear, risk increases

---

### **Attack 3: Endpoint Scanning**

**In Window 2 console:**
```javascript
console.log('🔴 Scanning endpoints...');
['/api/products', '/api/cart', '/api/admin/dashboard', '/api/admin/users/export']
  .forEach((endpoint, i) => {
    setTimeout(() => {
      fetch('http://localhost:5000' + endpoint, {
        headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')}
      }).then(r => console.log(`${endpoint}: ${r.status}`));
    }, i * 500);
  });
```

**Watch Window 1:** Scanning pattern detected, 403 errors logged

---

## 📊 What to Look For

### **In Admin Window (Window 1):**

**Statistics Cards:**
- Numbers increase in real-time
- Color changes based on severity
- Counters update every second

**Risk Score Chart:**
- Line graph shows spikes
- Red line climbs during attacks
- Drops when attack stops

**Action Distribution:**
- Pie chart shows response types
- More red/orange during attacks
- Green when normal

**Live Threat Feed:**
- New threats at top
- Color-coded by severity
- Shows reasoning for each decision
- Session ID to track attacker

---

### **In Attacker Window (Window 2):**

**Console:**
- Success/failure messages
- Status codes (200, 403, etc.)
- Timing of responses
- Blocked requests

**Network Tab (F12 → Network):**
- See all requests
- Response times
- Status codes
- Headers

---

## 🎓 Understanding the System

### **What's Happening:**

1. **Attacker makes requests** (Window 2)
2. **Backend analyzes behavior** (in background)
3. **Risk score calculated** (based on patterns)
4. **Decision made autonomously** (allow/monitor/throttle/block)
5. **WebSocket sends update** (real-time)
6. **Admin sees threat** (Window 1)
7. **Response applied** (attacker sees result)

**All in under 1 second!**

---

## 🔍 Advanced Viewing

### **See Blockchain Audit:**

**In Window 1 (Admin):**
1. Click "Blockchain" in navbar
2. See all attacks logged
3. Expand blocks to see details
4. Verify chain integrity

### **See Dashboard Stats:**

**In Window 1 (Admin):**
1. Click "Dashboard" in navbar
2. See overall statistics
3. Deploy canaries
4. Export users (triggers canary alert)

---

## 💡 Tips

### **For Best Results:**

1. **Keep windows side-by-side** - See cause and effect
2. **Watch the timing** - Attacks appear within 1-2 seconds
3. **Try different attacks** - See different patterns
4. **Check blockchain** - See immutable audit trail
5. **Use different browsers** - Simulate different attackers

### **Troubleshooting:**

**Not seeing threats?**
- Make sure Attack Monitor page is open
- Check that attacker is logged in
- Verify backend is running (check terminal)
- Try refreshing admin window

**Attacks not blocked?**
- System needs 2+ requests to analyze
- First few requests always succeed
- Risk builds up over time
- Try more requests (50+)

---

## 🎉 Success Indicators

You know it's working when:
- ✅ Threats appear in Window 1 within 2 seconds
- ✅ Risk scores increase with each attack
- ✅ Charts update in real-time
- ✅ Attacker gets blocked after 30-40 requests
- ✅ Colors change from green → red
- ✅ Console shows blocked requests

---

## 📸 Screenshot Opportunity

**Perfect moment to capture:**
- Window 1 showing high risk threats
- Window 2 showing blocked requests
- Risk score chart spiking
- Live feed full of red/orange alerts

---

**Now you can see the defense system in action!** 🛡️

**Try it now:** Follow steps 1-4, then execute the attack! 🚀
