package com.anonymous.ratownictwo;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothHeadset;
import android.bluetooth.BluetoothProfile;
import android.media.AudioManager;
import android.content.Context;
import android.util.Log;
import android.os.Build;
import android.media.AudioDeviceInfo;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import android.bluetooth.BluetoothA2dp;
import java.lang.reflect.Method;
import java.util.List;

public class BluetoothModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;
    private static final String TAG = "BluetoothModule";

    public BluetoothModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @Override
    public String getName() {
        return "BluetoothModule";
    }

    @ReactMethod
    public void disconnectAudio(Promise promise) {
        try {
            Log.d(TAG, "Rozpoczynanie rozłączania audio");

            // 1. Reset ustawień audio
            resetAudioRouting();

            // 2. Rozłącz profile Bluetooth
            BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
            if (adapter != null) {
                disconnectHeadsetProfile(adapter);
            }

            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Błąd rozłączania", e);
            promise.reject("DISCONNECT_ERROR", e.getMessage());
        }
    }

    private void resetAudioRouting() {
        try {
            AudioManager audioManager = (AudioManager) reactContext.getSystemService(Context.AUDIO_SERVICE);
            if (audioManager != null) {
                audioManager.setMode(AudioManager.MODE_NORMAL);
                audioManager.stopBluetoothSco();
                audioManager.setBluetoothScoOn(false);
                audioManager.setSpeakerphoneOn(false);
    
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    // Android 12 i nowsze
                    try {
                        AudioDeviceInfo[] devices = audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS);
                        if (devices.length > 0) {
                            // Jeśli urządzenia audio są dostępne, wybierz pierwsze
                            audioManager.setCommunicationDevice(devices[0]);
                            Log.d(TAG, "Ustawiono urządzenie komunikacyjne: " + devices[0].getProductName());
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "Błąd ustawienia urządzenia na Androidzie 12+", e);
                    }
                } else {
                    // Dla starszych wersji Androida
                    Log.d(TAG, "Starsza wersja Androida, brak wsparcia dla getDevices");
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Błąd resetowania audio", e);
        }
    }
    

    private void disconnectHeadsetProfile(BluetoothAdapter adapter) {
        try {
            // Rozłączamy profil HFP (Hands-Free Profile)
            adapter.getProfileProxy(reactContext, new BluetoothProfile.ServiceListener() {
                @Override
                public void onServiceConnected(int profile, BluetoothProfile proxy) {
                    try {
                        if (proxy instanceof BluetoothHeadset) {
                            BluetoothHeadset headset = (BluetoothHeadset) proxy;
                            for (BluetoothDevice device : headset.getConnectedDevices()) {
                                disconnectDevice(headset, device);
                            }
                        }
                    } finally {
                        adapter.closeProfileProxy(profile, proxy);
                    }
                }
    
                @Override
                public void onServiceDisconnected(int profile) {
                    Log.d(TAG, "Profil rozłączony: " + profile);
                }
            }, BluetoothProfile.HEADSET);
            
            // Rozłączamy profil A2DP (Advanced Audio Distribution Profile)
            adapter.getProfileProxy(reactContext, new BluetoothProfile.ServiceListener() {
                @Override
                public void onServiceConnected(int profile, BluetoothProfile proxy) {
                    try {
                        if (proxy instanceof BluetoothA2dp) {
                            BluetoothA2dp a2dp = (BluetoothA2dp) proxy;
                            for (BluetoothDevice device : a2dp.getConnectedDevices()) {
                                disconnectDevice(a2dp, device);
                            }
                        }
                    } finally {
                        adapter.closeProfileProxy(profile, proxy);
                    }
                }
    
                @Override
                public void onServiceDisconnected(int profile) {
                    Log.d(TAG, "Profil A2DP rozłączony: " + profile);
                }
            }, BluetoothProfile.A2DP);
    
        } catch (Exception e) {
            Log.e(TAG, "Błąd rozłączania profili Bluetooth", e);
        }
    }
    
    private void disconnectDevice(BluetoothA2dp a2dp, BluetoothDevice device) {
        try {
            Method method = BluetoothA2dp.class.getMethod("disconnect", BluetoothDevice.class);
            method.invoke(a2dp, device);
            Log.d(TAG, "Rozłączono A2DP: " + device.getName());
        } catch (Exception e) {
            Log.e(TAG, "Błąd rozłączania A2DP", e);
        }
    }
    
    private void disconnectDevice(BluetoothHeadset headset, BluetoothDevice device) {
        try {
            Method method = BluetoothHeadset.class.getMethod("disconnect", BluetoothDevice.class);
            method.invoke(headset, device);
            Log.d(TAG, "Rozłączono HFP: " + device.getName());
        } catch (Exception e) {
            Log.e(TAG, "Błąd rozłączania HFP", e);
        }
    }
}