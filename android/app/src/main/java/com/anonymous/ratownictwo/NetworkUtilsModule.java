package com.anonymous.ratownictwo;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkInfo;
import android.net.NetworkRequest;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.bridge.Promise;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class NetworkUtilsModule extends ReactContextBaseJavaModule {
    private static final String TAG = "NetworkUtilsModule";
    private final ReactApplicationContext reactContext;
    private ConnectivityManager.NetworkCallback networkCallback;
    private ConnectivityManager connectivityManager;

    public NetworkUtilsModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
        this.connectivityManager = (ConnectivityManager) reactContext.getSystemService(Context.CONNECTIVITY_SERVICE);
    }    @Override
    public String getName() {
        return "NetworkUtils";
    }
    
    @ReactMethod
    public void getNetworkInfo(Promise promise) {
        try {
            WritableMap networkInfo = new WritableNativeMap();
            boolean isConnected = false;
            String connectionType = "unknown";
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Network network = connectivityManager.getActiveNetwork();
                if (network != null) {
                    NetworkCapabilities capabilities = connectivityManager.getNetworkCapabilities(network);
                    isConnected = capabilities != null;
                    
                    if (capabilities != null) {
                        if (capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
                            connectionType = "wifi";
                        } else if (capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) {
                            connectionType = "cellular";
                        } else if (capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) {
                            connectionType = "ethernet";
                        }
                    }
                }
            } else {
                NetworkInfo activeNetworkInfo = connectivityManager.getActiveNetworkInfo();
                isConnected = activeNetworkInfo != null && activeNetworkInfo.isConnected();
                
                if (activeNetworkInfo != null) {
                    if (activeNetworkInfo.getType() == ConnectivityManager.TYPE_WIFI) {
                        connectionType = "wifi";
                    } else if (activeNetworkInfo.getType() == ConnectivityManager.TYPE_MOBILE) {
                        connectionType = "cellular";
                    } else if (activeNetworkInfo.getType() == ConnectivityManager.TYPE_ETHERNET) {
                        connectionType = "ethernet";
                    }
                }
            }
            
            networkInfo.putBoolean("isConnected", isConnected);
            networkInfo.putString("connectionType", connectionType);
            
            promise.resolve(networkInfo);
        } catch (Exception e) {
            Log.e(TAG, "Error getting network info", e);
            promise.reject("NETWORK_ERROR", e.getMessage());
        }
    }
    
    @ReactMethod
    public void startNetworkMonitoring() {
        try {
            // Remove any existing callbacks to avoid duplicates
            stopNetworkMonitoring();
            
            // Create a new callback
            networkCallback = new ConnectivityManager.NetworkCallback() {
                @Override
                public void onAvailable(@NonNull Network network) {
                    WritableMap params = new WritableNativeMap();
                    params.putBoolean("isConnected", true);
                    sendEvent("networkChanged", params);
                }
                
                @Override
                public void onLost(@NonNull Network network) {
                    WritableMap params = new WritableNativeMap();
                    params.putBoolean("isConnected", false);
                    sendEvent("networkChanged", params);
                }
                
                @Override
                public void onCapabilitiesChanged(@NonNull Network network, @NonNull NetworkCapabilities networkCapabilities) {
                    WritableMap params = new WritableNativeMap();
                    params.putBoolean("isConnected", true);
                    
                    String connectionType = "unknown";
                    if (networkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
                        connectionType = "wifi";
                    } else if (networkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) {
                        connectionType = "cellular";
                    } else if (networkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) {
                        connectionType = "ethernet";
                    }
                    
                    params.putString("connectionType", connectionType);
                    sendEvent("networkChanged", params);
                }
            };
            
            // Register the callback
            NetworkRequest.Builder builder = new NetworkRequest.Builder();
            connectivityManager.registerNetworkCallback(builder.build(), networkCallback);
            
            Log.d(TAG, "Network monitoring started");
        } catch (Exception e) {
            Log.e(TAG, "Error starting network monitoring", e);
        }
    }
    
    @ReactMethod
    public void stopNetworkMonitoring() {
        if (networkCallback != null) {
            try {
                connectivityManager.unregisterNetworkCallback(networkCallback);
                networkCallback = null;
                Log.d(TAG, "Network monitoring stopped");
            } catch (Exception e) {
                Log.e(TAG, "Error stopping network monitoring", e);
            }
        }
    }
    
    private void sendEvent(String eventName, WritableMap params) {
        try {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
        } catch (Exception e) {
            Log.e(TAG, "Error sending event", e);
        }
    }
}
