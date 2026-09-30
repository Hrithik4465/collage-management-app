import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';

export default function App() {
  // Default URL points to global public tunnel or local Wi-Fi
  const [appUrl, setAppUrl] = useState('https://tasty-bars-wonder.loca.lt');
  const [inputUrl, setInputUrl] = useState('https://tasty-bars-wonder.loca.lt');
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [loading, setLoading] = useState(true);

  // Auto-hide loading overlay after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, [appUrl]);

  return (
    <View style={styles.fullScreenContainer}>
      <StatusBar style="light" translucent={true} backgroundColor="transparent" />
      
      {/* Sleek Floating Glassmorphic Network Control Button */}
      <TouchableOpacity 
        style={styles.floatingNetPill}
        onPress={() => setIsEditingUrl(!isEditingUrl)}
        activeOpacity={0.8}
      >
        <Text style={styles.floatingNetText}>{isEditingUrl ? '✕ Close' : '⚡ Network'}</Text>
      </TouchableOpacity>

      {/* Network Modal / Slide-down Config Panel */}
      {isEditingUrl && (
        <View style={styles.configModalOverlay}>
          <View style={styles.configCard}>
            <Text style={styles.configTitle}>CMS Mobile Network Settings</Text>
            <Text style={styles.configSub}>Switch connection target for Expo Go SDK 57</Text>

            <View style={styles.presetGrid}>
              <TouchableOpacity 
                style={[styles.modeCard, appUrl.includes('loca.lt') && styles.modeCardActive]}
                onPress={() => {
                  const url = 'https://tasty-bars-wonder.loca.lt';
                  setAppUrl(url);
                  setInputUrl(url);
                  setIsEditingUrl(false);
                  setLoading(true);
                }}
              >
                <Text style={styles.modeIcon}>🌐</Text>
                <Text style={styles.modeTitle}>Global Cellular</Text>
                <Text style={styles.modeDesc}>4G / 5G / Any Wi-Fi</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modeCard, appUrl.includes('192.168') && styles.modeCardActive]}
                onPress={() => {
                  const url = 'http://192.168.0.102:5173';
                  setAppUrl(url);
                  setInputUrl(url);
                  setIsEditingUrl(false);
                  setLoading(true);
                }}
              >
                <Text style={styles.modeIcon}>📡</Text>
                <Text style={styles.modeTitle}>Local Wi-Fi</Text>
                <Text style={styles.modeDesc}>Same router IP</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.customInput}
                value={inputUrl}
                onChangeText={setInputUrl}
                placeholder="https://your-custom-url.com"
                placeholderTextColor="#64748b"
                autoCapitalize="none"
              />
              <TouchableOpacity 
                style={styles.applyBtn}
                onPress={() => {
                  setAppUrl(inputUrl);
                  setIsEditingUrl(false);
                  setLoading(true);
                }}
              >
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* 100% Full Screen WebView */}
      <View style={styles.webviewWrapper}>
        {loading && (
          <View style={styles.skeletonOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingTitle}>College Management App</Text>
            <Text style={styles.loadingSubtitle}>Syncing live portal state...</Text>
          </View>
        )}
        
        <WebView
          source={{ 
            uri: appUrl,
            headers: {
              'Bypass-Tunnel-Remainder': 'true',
              'ngrok-skip-browser-warning': 'true'
            }
          }}
          style={styles.webview}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => setLoading(false)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#090d16'
  },
  webviewWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#090d16'
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  floatingNetPill: {
    position: 'absolute',
    top: 48,
    right: 14,
    zIndex: 9999,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  floatingNetText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  configModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    zIndex: 9998,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  configCard: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10
  },
  configTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  configSub: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 16
  },
  presetGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16
  },
  modeCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  modeCardActive: {
    backgroundColor: '#312e81',
    borderColor: '#818cf8'
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
    backgroundColor: '#1e293b',
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#334155'
  },
  applyBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 10
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  skeletonOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#090d16',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100
  },
  loadingTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16
  },
  loadingSubtitle: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4
  }
});
