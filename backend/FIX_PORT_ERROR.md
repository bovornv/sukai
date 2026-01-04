# Fix Port 3000 Already in Use Error

## 🔧 Quick Fix

Port 3000 is already in use by another process. Here's how to fix it:

### Option 1: Use start:clean script (Easiest)
```bash
cd backend
npm run start:clean
```

This automatically kills any process on port 3000 and starts the server.

### Option 2: Kill process manually
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Then start backend
npm start
```

### Option 3: Use the kill script
```bash
cd backend
./scripts/kill-port-3000.sh
npm start
```

---

## ✅ After Fixing

Once port 3000 is free, run:
```bash
npm start
```

You should see:
```
SukAI Backend running on port 3000
```

---

## 🐛 If Still Having Issues

Check what's using port 3000:
```bash
lsof -i:3000
```

This shows the process ID (PID) and you can kill it:
```bash
kill -9 <PID>
```
