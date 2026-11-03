import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, TextInput, ActivityIndicator, 
  BackHandler, Platform, SafeAreaView, StatusBar as RNStatusBar 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';

export default function App() {
  const [appUrl, setAppUrl] = useState('https://collage-management-app.vercel.app');
  const [inputUrl, setInputUrl] = useState('https://collage-management-app.vercel.app');
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);

  const webViewRef = useRef(null);

  // Android Hardware Back Button Handling
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      if (isEditingUrl) {
        setIsEditingUrl(false);
        return true;
      }
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false; // Let Android exit app if at root
    };

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSubscription.remove();
  }, [canGoBack, isEditingUrl]);

  // Loading safety timeout
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, [appUrl]);

  const handleReload = () => {
    setHasError(false);
    setLoading(true);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  return (
    <SafeAreaView style={styles.fullScreenContainer}>
      {/* Light status bar icons on white/slate background with safe notch offset */}
      <StatusBar style="dark" translucent={true} backgroundColor="#ffffff" />

      {/* Server Settings Modal */}
      {isEditingUrl && (
        <View style={styles.configModalOverlay}>
          <View style={styles.configCard}>
            <View style={styles.configCardHeader}>
              <Text style={styles.configTitle}>CMS Campus Portal Server</Text>
              <TouchableOpacity onPress={() => setIsEditingUrl(false)} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.configSub}>Connect to your university or local server</Text>

            <View style={styles.presetGrid}>
              <TouchableOpacity 
                style={[styles.modeCard, appUrl.includes('vercel.app') && styles.modeCardActive]}
                onPress={() => {
                  const url = 'https://collage-management-app.vercel.app';
                  setAppUrl(url);
                  setInputUrl(url);
                  setIsEditingUrl(false);
                  setHasError(false);
                  setLoading(true);
                }}
              >
                <Text style={styles.modeIcon}>🌐</Text>
                <Text style={styles.modeTitle}>Cloud Server</Text>
                <Text style={styles.modeDesc}>Any 4G / 5G / Wi-Fi</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modeCard, (appUrl.includes('192.168') || appUrl.includes('localhost') || appUrl.includes('10.')) && styles.modeCardActive]}
                onPress={() => {
                  const url = 'http://10.234.143.198:5173';
                  setAppUrl(url);
                  setInputUrl(url);
                  setIsEditingUrl(false);
                  setHasError(false);
                  setLoading(true);
                }}
              >
                <Text style={styles.modeIcon}>📡</Text>
                <Text style={styles.modeTitle}>Local Wi-Fi</Text>
                <Text style={styles.modeDesc}>10.234.143.198</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.customInput}
                value={inputUrl}
                onChangeText={setInputUrl}
                placeholder="https://collage-management-app.vercel.app"
                placeholderTextColor="#64748b"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity 
                style={styles.applyBtn}
                onPress={() => {
                  if (inputUrl.trim()) {
                    setAppUrl(inputUrl.trim());
                    setIsEditingUrl(false);
                    setHasError(false);
                    setLoading(true);
                  }
                }}
              >
                <Text style={styles.applyBtnText}>Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Main WebView Container */}
      <View style={styles.webviewWrapper}>
        {loading && (
          <View style={styles.skeletonOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color="#f97316" />
            <Text style={styles.loadingTitle}>CMS Academy Portal</Text>
            <Text style={styles.loadingSubtitle}>Connecting to college portal...</Text>
          </View>
        )}

        <WebView
          ref={webViewRef}
          source={{ 
            uri: appUrl,
            headers: {
              'Bypass-Tunnel-Remainder': 'true',
              'ngrok-skip-browser-warning': 'true'
            }
          }}
          style={styles.webview}
          originWhitelist={['*']}
          mixedContentMode="always"
          allowFileAccess={true}
          domStorageEnabled={true}
          javaScriptEnabled={true}
          pullToRefreshEnabled={true}
          allowsInlineMediaPlayback={true}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          cacheEnabled={true}
          startInLoadingState={false}
          onLoadStart={() => {
            setLoading(true);
            setHasError(false);
          }}
          onLoadEnd={() => {
            setLoading(false);
            setHasError(false);
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error: ', nativeEvent);
            setLoading(false);
            setHasError(true);
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView HTTP error: ', nativeEvent.statusCode);
            if (nativeEvent.statusCode >= 400) {
              setLoading(false);
              setHasError(true);
            }
          }}
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
          }}
        />

        {hasError && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorIcon}>📡</Text>
            <Text style={styles.errorTitle}>Unable to Reach Portal</Text>
            <Text style={styles.errorSubtitle}>
              Target: {appUrl}
              {"\n"}Please make sure your phone and PC are connected to the same Wi-Fi (192.168.0.107), or tap the ⚙ icon to adjust server settings.
            </Text>
            <View style={styles.errorBtnRow}>
              <TouchableOpacity style={styles.retryBtn} onPress={handleReload}>
                <Text style={styles.retryBtnText}>Retry Connection</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.changeServerBtn} 
                onPress={() => setIsEditingUrl(true)}
              >
                <Text style={styles.changeServerBtnText}>Server Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    // Generous safe margin on Android so content is cleanly away from the front camera cutout & status bar
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) : 0,
  },
  webviewWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#f8fafc',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  // Floating settings button moved away to bottom-left so it never interferes with navigation buttons
  floatingNetPill: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 76 : 92,
    left: 14,
    zIndex: 9999,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 8
  },
  floatingNetText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  configModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 15, 25, 0.85)',
    zIndex: 9998,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  configCard: {
    width: '100%',
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10
  },
  configCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  closeModalText: {
    color: '#94a3b8',
    fontSize: 18,
    fontWeight: 'bold',
    padding: 4
  },
  configTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold'
  },
  configSub: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 3,
    marginBottom: 16
  },
  presetGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16
  },
  modeCard: {
    flex: 1,
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151'
  },
  modeCardActive: {
    backgroundColor: '#1e293b',
    borderColor: '#f97316'
  },
  modeIcon: {
    fontSize: 22,
    marginBottom: 4
  },
  modeTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  modeDesc: {
    color: '#94a3b8',
    fontSize: 9,
    marginTop: 2
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8
  },
  customInput: {
    flex: 1,
    backgroundColor: '#1f2937',
    color: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#374151'
  },
  applyBtn: {
    backgroundColor: '#f97316',
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderRadius: 12
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold'
  },
  skeletonOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100
  },
  loadingTitle: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 16
  },
  loadingSubtitle: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4
  },
  errorOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#f8fafc'
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16
  },
  errorTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  errorSubtitle: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20
  },
  errorBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24
  },
  retryBtn: {
    backgroundColor: '#f97316',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold'
  },
  changeServerBtn: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  changeServerBtnText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600'
  }
});
