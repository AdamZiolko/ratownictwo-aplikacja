package com.anonymous.ratownictwo;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.PowerManager;
import android.util.Log;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class WifiKeepAliveModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;
    private static final String TAG = "WifiKeepAliveModule";
    
    private PowerManager.WakeLock wakeLock;
    private WifiManager.WifiLock wifiLock;

    public WifiKeepAliveModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }    @Override
    public String getName() {
        return "WifiKeepAlive";
    }
      /**
     * Check if we have the required permissions
     */
    private boolean checkPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            boolean hasWakeLockPermission = ContextCompat.checkSelfPermission(
                reactContext, 
                Manifest.permission.WAKE_LOCK
            ) == PackageManager.PERMISSION_GRANTED;
            
            boolean hasWifiStatePermission = ContextCompat.checkSelfPermission(
                reactContext, 
                Manifest.permission.ACCESS_WIFI_STATE
            ) == PackageManager.PERMISSION_GRANTED;
            
            boolean hasChangeWifiStatePermission = ContextCompat.checkSelfPermission(
                reactContext, 
                Manifest.permission.CHANGE_WIFI_STATE
            ) == PackageManager.PERMISSION_GRANTED;
            
            return hasWakeLockPermission && hasWifiStatePermission && hasChangeWifiStatePermission;
        }
        
        // Permissions are granted at installation time for Android < M
        return true;
    }
    
    @ReactMethod
    public void acquireWifiLock(Promise promise) {
        try {
            if (!checkPermissions()) {
                Log.e(TAG, "Missing required permissions");
                promise.reject("PERMISSION_ERROR", "Missing required permissions");
                return;
            }
            
            // Create wake lock to keep CPU running
            PowerManager powerManager = (PowerManager) reactContext.getSystemService(Context.POWER_SERVICE);
            if (powerManager == null) {
                promise.reject("SERVICE_ERROR", "PowerManager service not available");
                return;
            }
            
            if (wakeLock == null || !wakeLock.isHeld()) {
                wakeLock = powerManager.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK,
                    "RatownictwoApp:WebSocketWakeLock"
                );
                wakeLock.acquire();
                Log.d(TAG, "Wake lock acquired");
            }
            
            // Create wifi lock to keep WiFi radio active
            WifiManager wifiManager = (WifiManager) reactContext.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            if (wifiManager == null) {
                promise.reject("SERVICE_ERROR", "WifiManager service not available");
                return;
            }
            
            if (wifiLock == null || !wifiLock.isHeld()) {
                wifiLock = wifiManager.createWifiLock(
                    WifiManager.WIFI_MODE_FULL_HIGH_PERF,
                    "RatownictwoApp:WebSocketWifiLock"
                );
                wifiLock.acquire();
                Log.d(TAG, "WiFi lock acquired");
            }
            
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error acquiring locks", e);
            promise.reject("LOCK_ERROR", e.getMessage());
        }
    }
    
    @ReactMethod
    public void releaseWifiLock(Promise promise) {
        try {
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
                wakeLock = null;
                Log.d(TAG, "Wake lock released");
            }
            
            if (wifiLock != null && wifiLock.isHeld()) {
                wifiLock.release();
                wifiLock = null;
                Log.d(TAG, "WiFi lock released");
            }
            
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error releasing locks", e);
            promise.reject("LOCK_ERROR", e.getMessage());
        }
    }
    
    @ReactMethod
    public void getStatus(Promise promise) {
        boolean wakeLockHeld = wakeLock != null && wakeLock.isHeld();
        boolean wifiLockHeld = wifiLock != null && wifiLock.isHeld();
        
        promise.resolve("Wake lock: " + (wakeLockHeld ? "Held" : "Not held") +
                        ", WiFi lock: " + (wifiLockHeld ? "Held" : "Not held"));
    }
}
