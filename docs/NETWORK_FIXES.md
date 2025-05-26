# Network Request Failed - Mobile Audio Debugging Guide

## Overview
This document provides comprehensive troubleshooting steps for resolving "network request failed" errors when playing audio on mobile devices in the Ratownictwo application.

## Common Issues and Solutions

### 1. Incorrect IP Address Configuration
**Problem**: The mobile app is trying to connect to the wrong server IP address.

**Solution**:
1. Check your computer's IP address:
   ```bash
   ipconfig  # Windows
   ifconfig  # Mac/Linux
   ```
2. Update `constants/Config.ts` with the correct IP address
3. Ensure both the mobile device and server are on the same network

### 2. Server Not Running
**Problem**: The backend server is not started or has crashed.

**Solution**:
1. Navigate to the backend directory:
   ```bash
   cd ratownictwo-backend
   npm start
   ```
2. Verify the server is running on port 8080
3. Check for any server startup errors in the console

### 3. Network Firewall Issues
**Problem**: Windows Firewall or router is blocking the connection.

**Solution**:
1. Add firewall exception for Node.js
2. Check Windows Defender Firewall settings
3. Ensure port 8080 is open on your router
4. Test connectivity from mobile browser: `http://YOUR_IP:8080/api/health`

### 4. Mobile Device Network Configuration
**Problem**: Mobile device can't reach the development server.

**Solution**:
1. Ensure mobile device is on the same WiFi network
2. Try connecting to the server from mobile browser first
3. Check if mobile device has restricted network access
4. Restart WiFi connection on mobile device

## Debugging Steps

### Step 1: Verify Server Connectivity
```javascript
// Test from mobile browser
http://192.168.100.6:8080/api/health

// Expected response: Server health status
```

### Step 2: Check Audio Streaming Endpoint
```javascript
// Test audio streaming
http://192.168.100.6:8080/api/audio/adult-male-moaning/stream

// Should return audio data or proper error message
```

### Step 3: Use Network Diagnostics Service
```javascript
import { networkDiagnostics } from '@/services/NetworkDiagnostics';

// Perform full diagnostics
const results = await networkDiagnostics.performDiagnostics();
console.log('Network Diagnostics:', results);

// Test audio streaming specifically
const audioOk = await networkDiagnostics.testAudioStreaming();
console.log('Audio Streaming:', audioOk);
```

### Step 4: Enable Debug Logging
Add these to your development environment:
```javascript
// In StudentSessionScreen.tsx
useEffect(() => {
  if (__DEV__) {
    debugMobileAudio();
    networkDiagnostics.performDiagnostics();
  }
}, []);
```

## Configuration Files

### constants/Config.ts
Ensure the IP address matches your development machine:
```typescript
const getServerIP = () => {
  if (Platform.OS === 'android') {
    return '192.168.100.6'; // Your actual IP address
  }
  // ... other platforms
};
```

### Backend server.js
Verify the server is configured to accept connections:
```javascript
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
```

## Testing Checklist

- [ ] Server is running and accessible from computer browser
- [ ] Mobile device is on same WiFi network
- [ ] IP address in Config.ts matches computer's actual IP
- [ ] Firewall allows Node.js connections
- [ ] Mobile browser can access `http://YOUR_IP:8080/api/health`
- [ ] Audio streaming endpoint responds correctly
- [ ] Network diagnostics show positive results
- [ ] Mobile app console shows successful network checks

## Fallback Behavior

When network requests fail, the app automatically:
1. Falls back to local audio files
2. Logs detailed error information
3. Shows user-friendly error messages
4. Continues functioning with reduced features

## Advanced Troubleshooting

### Network Latency Issues
- Check WiFi signal strength
- Test with mobile data vs WiFi
- Monitor network diagnostics latency values

### DNS Resolution Problems
- Try using IP address directly instead of hostname
- Check router DNS settings
- Test with different DNS servers

### Router Configuration
- Enable UPnP if available
- Check for AP isolation settings
- Verify port forwarding if needed

## Getting Help

If issues persist:
1. Check the console logs for specific error messages
2. Run network diagnostics and share the results
3. Test basic connectivity from mobile browser
4. Verify server logs for incoming requests