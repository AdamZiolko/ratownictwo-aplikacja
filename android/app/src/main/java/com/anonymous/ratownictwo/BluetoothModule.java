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

// Android Bluetooth
import android.bluetooth.BluetoothClass;
import android.bluetooth.BluetoothDevice;
import android.os.ParcelUuid;
import android.os.Handler;
import android.os.Looper;

// React Native Bridge
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableNativeArray;



public class BluetoothModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;
    private static final String TAG = "BluetoothModule";

    public BluetoothModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }
    private static final ParcelUuid A2DP_SINK_UUID = ParcelUuid.fromString("0000110b-0000-1000-8000-00805f9b34fb");
    private static final ParcelUuid HFP_UUID = ParcelUuid.fromString("0000111e-0000-1000-8000-00805f9b34fb");
    private static final ParcelUuid HSP_UUID = ParcelUuid.fromString("00001108-0000-1000-8000-00805f9b34fb");
    private static final ParcelUuid OPP_UUID = ParcelUuid.fromString("00001105-0000-1000-8000-00805f9b34fb");
    @Override
    public String getName() {
        return "BluetoothModule";
    }

  
    


    @ReactMethod
public void disconnectAudioDevice(String deviceAddress, Promise promise) {
    try {
        BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
        if (adapter == null) {
            promise.reject("NO_ADAPTER", "Brak adaptera Bluetooth");
            return;
        }

        BluetoothDevice device = adapter.getRemoteDevice(deviceAddress);
        if (device == null) {
            promise.reject("NO_DEVICE", "Nie znaleziono urządzenia");
            return;
        }

        // Rozłącz tylko określone urządzenie
        adapter.getProfileProxy(reactContext, new BluetoothProfile.ServiceListener() {
            @Override
            public void onServiceConnected(int profile, BluetoothProfile proxy) {
                try {
                    if (profile == BluetoothProfile.A2DP) {
                        BluetoothA2dp a2dp = (BluetoothA2dp) proxy;
                        Method method = BluetoothA2dp.class.getMethod("disconnect", BluetoothDevice.class);
                        method.invoke(a2dp, device);
                    } else if (profile == BluetoothProfile.HEADSET) {
                        BluetoothHeadset headset = (BluetoothHeadset) proxy;
                        Method method = BluetoothHeadset.class.getMethod("disconnect", BluetoothDevice.class);
                        method.invoke(headset, device);
                    }
                    promise.resolve(true);
                } catch (Exception e) {
                    promise.reject("DISCONNECT_ERROR", e.getMessage());
                } finally {
                    adapter.closeProfileProxy(profile, proxy);
                }
            }

            @Override
            public void onServiceDisconnected(int profile) {
                // Ignoruj
            }
        }, BluetoothProfile.A2DP);

    } catch (Exception e) {
        promise.reject("ERROR", e.getMessage());
    }
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


    @ReactMethod
public void getDeviceProfiles(String deviceAddress, Promise promise) {
    try {
        BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
        if (adapter == null) {
            promise.resolve(new WritableNativeArray());
            return;
        }

        BluetoothDevice device = adapter.getRemoteDevice(deviceAddress);
        if (device == null) {
            promise.resolve(new WritableNativeArray());
            return;
        }

        WritableArray profiles = new WritableNativeArray();

        // Sprawdzanie profili poprzez refleksję (dla starszych wersji Androida)
        try {
            Method getUuidsMethod = BluetoothDevice.class.getMethod("getUuids");
            ParcelUuid[] uuids = (ParcelUuid[]) getUuidsMethod.invoke(device);
            if (uuids != null) {
                for (ParcelUuid uuid : uuids) {
                    if (uuid.equals(A2DP_SINK_UUID)) {
                        profiles.pushString("A2DP");
                    } else if (uuid.equals(HFP_UUID)) {
                        profiles.pushString("HFP");
                    } else if (uuid.equals(HSP_UUID)) {
                        profiles.pushString("HSP");
                    } else if (uuid.equals(OPP_UUID)) {
                        profiles.pushString("OPP");
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Błąd sprawdzania profili", e);
        }

        promise.resolve(profiles);
    } catch (Exception e) {
        promise.reject("PROFILE_ERROR", e.getMessage());
    }
}

@ReactMethod
public void connectToDevice(String deviceAddress, Promise promise) {
    try {
        BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
        if (adapter == null) {
            promise.reject("NO_ADAPTER", "Brak adaptera Bluetooth");
            return;
        }

        BluetoothDevice device = adapter.getRemoteDevice(deviceAddress);
        if (device == null) {
            promise.reject("NO_DEVICE", "Nie znaleziono urządzenia");
            return;
        }

        // Próba połączenia przez profile audio
        boolean connected = false;

        // 1. Próba połączenia przez A2DP
        adapter.getProfileProxy(reactContext, new BluetoothProfile.ServiceListener() {
            @Override
            public void onServiceConnected(int profile, BluetoothProfile proxy) {
                if (profile == BluetoothProfile.A2DP) {
                    BluetoothA2dp a2dp = (BluetoothA2dp) proxy;
                    try {
                        Method connectMethod = BluetoothA2dp.class.getMethod("connect", BluetoothDevice.class);
                        connectMethod.invoke(a2dp, device);
                        promise.resolve("SUCCESS");
                    } catch (Exception e) {
                        promise.reject("A2DP_ERROR", e.getMessage());
                    } finally {
                        adapter.closeProfileProxy(profile, proxy);
                    }
                }
            }

            @Override
            public void onServiceDisconnected(int profile) {
                // Ignoruj
            }
        }, BluetoothProfile.A2DP);

        // 2. Próba połączenia przez HFP (z opóźnieniem, jeśli A2DP zawiedzie)
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            if (!connected) {
                adapter.getProfileProxy(reactContext, new BluetoothProfile.ServiceListener() {
                    @Override
                    public void onServiceConnected(int profile, BluetoothProfile proxy) {
                        if (profile == BluetoothProfile.HEADSET) {
                            BluetoothHeadset headset = (BluetoothHeadset) proxy;
                            try {
                                Method connectMethod = BluetoothHeadset.class.getMethod("connect", BluetoothDevice.class);
                                connectMethod.invoke(headset, device);
                                promise.resolve("SUCCESS");
                            } catch (Exception e) {
                                promise.reject("HFP_ERROR", e.getMessage());
                            } finally {
                                adapter.closeProfileProxy(profile, proxy);
                            }
                        }
                    }

                    @Override
                    public void onServiceDisconnected(int profile) {
                        // Ignoruj
                    }
                }, BluetoothProfile.HEADSET);
            }
        }, 1000);

    } catch (Exception e) {
        promise.reject("CONNECTION_ERROR", e.getMessage());
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