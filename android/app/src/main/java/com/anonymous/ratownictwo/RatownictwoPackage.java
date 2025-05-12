package com.anonymous.ratownictwo;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * A single package that registers all our native modules.
 * This helps ensure our modules are properly registered with React Native.
 */
public class RatownictwoPackage implements ReactPackage {
    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        
        // Add all our custom native modules here
        modules.add(new WifiKeepAliveModule(reactContext));
        modules.add(new NetworkUtilsModule(reactContext));
        modules.add(new BluetoothModule(reactContext));
        
        return modules;
    }
}
