import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const PaymentScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upgrade to Premium</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.titleText}>Upgrade to Premium</Text>
          <Text style={styles.subtitleText}>
            Unlock all profiles and connect with matches
          </Text>

          <View style={styles.qrWrapper}>
            <Image
              source={require('../../../assets/icici_qr.jpg')}
              style={styles.qrImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.instructionText}>
            When you complete your payment, send the screenshot on this number. Within 24 hours your profile will be activated.
          </Text>
          
          <View style={styles.supportBox}>
            <MaterialCommunityIcons name="whatsapp" size={24} color="#25D366" />
            <Text style={styles.supportText}>
              Support Number: <Text style={styles.boldText}>8446430330</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  container: {
    padding: 20,
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  instructionText: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  boldText: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  qrWrapper: {
    width: 250,
    height: 320,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  supportBox: {
    flexDirection: 'row',
    backgroundColor: '#F1F3F4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%'
  },
  supportText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  paidButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  paidButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default PaymentScreen;
