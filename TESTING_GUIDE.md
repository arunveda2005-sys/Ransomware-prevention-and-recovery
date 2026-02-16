# Testing Guide - E-Commerce Defense Platform

Complete guide to testing all features of the platform.

## 🧪 Test Scenarios

### Scenario 1: Normal User Flow (Low Risk)

**Objective**: Verify normal e-commerce operations generate low risk scores

**Steps**:
1. Open http://localhost:3000
2. Click "Login"
3. Login as user: `user@example.com` / `user123`
4. Browse products (click around)
5. Add 2-3 items to cart
6. Go to cart
7. Click checkout
8. Logout

**Expected Results**:
- ✅ All operations complete successfully
- ✅ Risk scores < 30% in Attack Monitor
- ✅ Actions: "allow" or "monitor"
- ✅ No blocks or shadow bans

---

### Scenario 2: Admin Dashboard Overview

**Objective**: Verify admin can access all monitoring features

**Steps**:
1. Login as admin: `admin@ecommerce.com` / `admin123`
2. Click "Dashboard" in navbar
3. Observe statistics (users, products, orders, threats)
4. Check blockchain stats
5. Click "Attacks" in navbar
6. Observe real-time monitor (may be empty initially)
7. Click "Blockchain" in navbar
8. Observe blockchain blocks

**Expected Results**:
- ✅ Dashboard shows correct statistics
- ✅ Blockchain shows genesis block + any mined blocks
- ✅ Attack monitor displays (even if empty)
- ✅ All navigation works

---

### Scenario 3: Smart Canary Deployment

**Objective**: Deploy and verify canary records

**Steps**:
1. Login as admin
2. Go to Dashboard
3. In "Deploy Smart Canaries" section:
   - Set count to 50
   - Click "Deploy Canaries"
4. Wait for success message
5. Check statistics update

**Expected Results**:
- ✅ Success toast notification
- ✅ "Deployed 50 canaries" message
- ✅ Backend console shows generation progress
- ✅ MongoDB has 50 new users with `is_canary: true`

---

### Scenario 4: Canary Breach Detection 🚨

**Objective**: Trigger canary alert by accessing honeypot records

**Steps**:
1. Login as admin
2. Go to Dashboard
3. Deploy canaries (if not already done)
4. Go to "Attacks" page (keep this open)
5. Go back to Dashboard
6. Click "Export Users (Monitored)" button
7. Watch Attack Monitor page

**Expected Results**:
- ✅ Red alert banner appears on Attack Monitor
- ✅ "🚨 BREACH DETECTED - CANARY TRIGGERED"
- ✅ Shows number of canaries accessed
- ✅ Toast notification appears
- ✅ Event logged to blockchain
- ✅ Alert disappears after 30 seconds

---

### Scenario 5: Real-Time Threat Detection

**Objective**: Generate activity and watch real-time detection

**Setup**: Have two browser windows open:
- Window 1: Admin logged in, on Attack Monitor page
- Window 2: User logged in

**Steps**:
1. In Window 2 (user):
   - Browse products
   - Add items to cart
   - Go to cart
   - Go back to products
   - Repeat several times
2. In Window 1 (admin):
   - Watch threats appear in real-time
   - Observe risk scores
   - See actions taken
   - Watch charts update

**Expected Results**:
- ✅ Threats appear in live feed within seconds
- ✅ Risk score chart updates
- ✅ Action distribution pie chart updates
- ✅ Statistics counters increment
- ✅ Each threat shows:
  - Timestamp
  - Action (chip with color)
  - Risk score percentage
  - Session ID
  - Reasoning

---

### Scenario 6: Blockchain Integrity

**Objective**: Verify blockchain is working and valid

**Steps**:
1. Login as admin
2. Generate some activity (browse, add to cart)
3. Wait 60 seconds (auto-mining interval)
4. Go to "Blockchain" page
5. Check chain validity
6. Expand blocks to see events
7. Verify hashes are present

**Expected Results**:
- ✅ "Chain Integrity: ✓ VALID" shown
- ✅ Multiple blocks present (genesis + mined)
- ✅ Each block shows:
  - Block number
  - Hash (starts with 0000 for difficulty 4)
  - Previous hash
  - Timestamp
  - Nonce
  - Events (if any)
- ✅ Events show threat details

---

### Scenario 7: High-Risk Behavior Simulation

**Objective**: Trigger higher risk scores and defensive actions

**Steps**:
1. Open browser console (F12)
2. Login as user
3. Run this code to make rapid requests:
```javascript
// Rapid API calls
for(let i = 0; i < 20; i++) {
  fetch('/api/products')
    .then(r => r.json())
    .then(d => console.log('Request', i, 'complete'));
}
```
4. Watch Attack Monitor (in admin window)

**Expected Results**:
- ✅ Risk scores increase (50-80%)
- ✅ Actions escalate: monitor → throttle → shadow_ban
- ✅ Reasoning mentions high request rate
- ✅ Multiple threats logged quickly
- ✅ Charts show spike in risk

---

### Scenario 8: Session Tracking

**Objective**: Verify system tracks sessions correctly

**Steps**:
1. Login as user
2. Note your session ID in Attack Monitor
3. Browse products (generate 5-10 requests)
4. In Attack Monitor, observe all threats have same session ID
5. Logout and login again
6. Browse products again
7. Observe new session ID in Attack Monitor

**Expected Results**:
- ✅ All requests from same session have same ID
- ✅ Session ID changes after logout/login
- ✅ System maintains separate memory per session
- ✅ Risk scores accumulate within session

---

### Scenario 9: Role-Based Access Control

**Objective**: Verify different roles have appropriate access

**Test 1 - User Access**:
1. Login as user
2. Try to access `/admin` URL directly
3. Try to access `/admin/attacks` URL

**Expected**: Redirected to home page

**Test 2 - Admin Access**:
1. Login as admin
2. Access all admin pages
3. All features work

**Expected**: Full access granted

**Test 3 - Unauthenticated**:
1. Logout
2. Try to access `/cart`
3. Try to access `/admin`

**Expected**: Redirected to login

---

### Scenario 10: Data Persistence

**Objective**: Verify data persists across restarts

**Steps**:
1. Login as admin
2. Deploy 10 canaries
3. Generate some threats (browse as user)
4. Note blockchain block count
5. Stop backend (Ctrl+C)
6. Restart backend (`python app.py`)
7. Refresh frontend
8. Check:
   - Canaries still exist
   - Blockchain blocks still present
   - Request logs still in database

**Expected Results**:
- ✅ All data persists
- ✅ Blockchain maintains integrity
- ✅ Canaries remain deployed
- ✅ Statistics accurate

---

## 🔍 Feature Checklist

### Authentication
- [ ] User registration works
- [ ] User login works
- [ ] Admin login works
- [ ] JWT tokens generated
- [ ] Tokens validated on protected routes
- [ ] Logout clears session

### E-Commerce
- [ ] Products display correctly
- [ ] Search works
- [ ] Add to cart works
- [ ] Cart displays items
- [ ] Checkout creates order
- [ ] Cart clears after checkout

### System A (Threat Detection)
- [ ] Requests logged to database
- [ ] Features extracted correctly
- [ ] Risk scores calculated
- [ ] Actions determined autonomously
- [ ] Thresholds adapt to context
- [ ] Blockchain logs high-risk events
- [ ] WebSocket sends real-time updates

### System B (Data Protection)
- [ ] Canaries generate with realistic patterns
- [ ] Canaries indistinguishable from real users
- [ ] Canary access detected immediately
- [ ] Alerts trigger on breach
- [ ] Breach impact calculated
- [ ] Data encryption works (if enabled)

### Admin Dashboard
- [ ] Statistics display correctly
- [ ] Canary deployment works
- [ ] User export triggers canary check
- [ ] Real-time updates via WebSocket

### Attack Monitor
- [ ] Live threat feed updates
- [ ] Risk score chart displays
- [ ] Action distribution chart displays
- [ ] Statistics counters work
- [ ] Canary alerts show
- [ ] Color coding correct

### Blockchain
- [ ] Genesis block created
- [ ] Blocks mine automatically
- [ ] Proof-of-Work validates
- [ ] Chain integrity verified
- [ ] Events stored in blocks
- [ ] Viewer displays correctly

## 🐛 Common Issues & Solutions

### Issue: No threats appearing
**Solution**: 
- Ensure Attack Monitor page is open
- Generate activity (browse products)
- System needs 2+ requests to analyze
- Check WebSocket connection in console

### Issue: Canary alert not triggering
**Solution**:
- Ensure canaries deployed first
- Click "Export Users" button
- Check backend console for logs
- Verify WebSocket connected

### Issue: Blockchain shows "INVALID"
**Solution**:
- This shouldn't happen in normal operation
- Check backend logs for errors
- Restart backend
- Blockchain should rebuild

### Issue: WebSocket not connecting
**Solution**:
- Check backend is running
- Verify VITE_BACKEND_URL in .env.local
- Check browser console for errors
- Ensure eventlet installed

### Issue: High risk scores for normal activity
**Solution**:
- This is expected initially (learning phase)
- System adapts over time
- Admin users get +0.1 threshold adjustment
- Normal behavior: risk < 30%

## 📊 Performance Testing

### Load Test (Optional)

**Using Apache Bench**:
```bash
# Install Apache Bench
# Ubuntu: sudo apt-get install apache2-utils
# Mac: brew install httpd

# Test product listing
ab -n 1000 -c 10 http://localhost:5000/api/products

# Expected: 
# - Requests per second: 50-200
# - Mean response time: <100ms
# - No failures
```

**Using Python**:
```python
import requests
import time
import concurrent.futures

def make_request(i):
    r = requests.get('http://localhost:5000/api/products')
    return r.status_code

start = time.time()
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
    results = list(executor.map(make_request, range(100)))
end = time.time()

print(f"Completed 100 requests in {end-start:.2f}s")
print(f"Success rate: {results.count(200)/len(results)*100}%")
```

## ✅ Acceptance Criteria

Platform is considered fully functional when:

- [ ] All authentication flows work
- [ ] E-commerce operations complete successfully
- [ ] Threats detected and logged in real-time
- [ ] Blockchain maintains integrity
- [ ] Canaries deploy and trigger alerts
- [ ] Admin dashboard displays all data
- [ ] Attack monitor updates live
- [ ] WebSocket connections stable
- [ ] No critical errors in console
- [ ] Data persists across restarts

## 🎯 Success Metrics

**Functional**:
- 100% of core features working
- <1% error rate on API calls
- Real-time updates <1s latency
- Blockchain always valid

**Performance**:
- Request analysis <50ms
- WebSocket latency <100ms
- Page load <2s
- No memory leaks

**Security**:
- All routes properly protected
- Canaries trigger on access
- Blockchain tamper-proof
- Passwords hashed

## 📝 Test Report Template

```
Test Date: ___________
Tester: ___________
Environment: Local / Production

Scenario Results:
[ ] Scenario 1: Normal User Flow
[ ] Scenario 2: Admin Dashboard
[ ] Scenario 3: Canary Deployment
[ ] Scenario 4: Breach Detection
[ ] Scenario 5: Real-Time Detection
[ ] Scenario 6: Blockchain Integrity
[ ] Scenario 7: High-Risk Simulation
[ ] Scenario 8: Session Tracking
[ ] Scenario 9: Access Control
[ ] Scenario 10: Data Persistence

Issues Found:
1. ___________
2. ___________

Overall Status: PASS / FAIL

Notes:
___________
```

---

**Happy Testing! 🧪**

For questions or issues, see DEPLOYMENT.md troubleshooting section.
