export type QRType = 'url' | 'phone' | 'text' | 'wifi' | 'vcard';

export interface WiFiData {
  ssid: string;
  password?: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
  hidden?: boolean;
}

export interface VCardData {
  firstName: string;
  lastName: string;
  organization?: string;
  phone?: string;
  email?: string;
  url?: string;
  address?: string;
}

export interface QRConfig {
  type: QRType;
  value: string;
  label: string;
  dotsColor: string;
  bgColor: string;
  dotsType: 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'square' | 'extra-rounded';
  cornersType: 'square' | 'dot' | 'rounded';
  logo?: string;
}
