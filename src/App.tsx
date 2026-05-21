import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  QrCode, 
  Link as LinkIcon, 
  Phone, 
  Type, 
  Wifi, 
  UserCircle, 
  Download, 
  Palette, 
  Image as ImageIcon, 
  ExternalLink,
  Printer,
  Share,
  Plus,
  Monitor,
  Smartphone,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import QRCodeStyling from 'qr-code-styling';
import { cn } from './lib/utils';
import type { QRType, QRConfig, WiFiData, VCardData } from './types';

const DOTS_TYPES = [
  { value: 'square', label: 'Square' },
  { value: 'dots', label: 'Dots' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'extra-rounded', label: 'Extra Rounded' },
  { value: 'classy', label: 'Classy' },
  { value: 'classy-rounded', label: 'Classy Rounded' },
] as const;

const CORNER_TYPES = [
  { value: 'square', label: 'Square' },
  { value: 'dot', label: 'Dot' },
  { value: 'rounded', label: 'Rounded' },
] as const;

export default function App() {
  const [activeTab, setActiveTab] = useState<QRType>('url');
  const [config, setConfig] = useState<QRConfig>({
    type: 'url',
    value: '',
    label: '',
    dotsColor: '#1A1A1A',
    bgColor: '#FFFFFF',
    dotsType: 'square',
    cornersType: 'square',
  });

  const [wifiData, setWifiData] = useState<WiFiData>({ ssid: '', encryption: 'WPA' });
  const [vcardData, setVcardData] = useState<VCardData>({ firstName: '', lastName: '' });

  // PWA & Platform States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [platformInfo, setPlatformInfo] = useState({ os: 'Unknown', browser: 'Unknown' });

  useEffect(() => {
    // Detect standalone display mode
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                               (navigator as any).standalone === true ||
                               document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // Detect Platform & Browser
    const ua = window.navigator.userAgent;
    let os = 'Unknown';
    let browser = 'Unknown';

    if (/android/i.test(ua)) {
      os = 'Android';
    } else if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
      os = 'iOS';
    } else if (/Mac/i.test(ua)) {
      os = 'macOS';
    } else if (/Win/i.test(ua)) {
      os = 'Windows';
    } else if (/Linux/i.test(ua)) {
      os = 'Linux';
    } else if (/CrOS/i.test(ua)) {
      os = 'ChromeOS';
    }

    if (/edge|edg/i.test(ua)) {
      browser = 'Edge';
    } else if (/opr/i.test(ua)) {
      browser = 'Opera';
    } else if (/chrome|crios/i.test(ua)) {
      browser = 'Chrome';
    } else if (/safari/i.test(ua)) {
      browser = 'Safari';
    } else if (/firefox|fxios/i.test(ua)) {
      browser = 'Firefox';
    }

    setPlatformInfo({ os, browser });

    // PWA Install prompt listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Track installation completion
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try {
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsStandalone(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
      }
    } catch (err) {
      console.error('PWA installation canceled or error:', err);
    }
  };
  const qrRef = useRef<HTMLDivElement>(null);
  const qrRefMobile = useRef<HTMLDivElement>(null);
  const qrCode = useRef<QRCodeStyling>(new QRCodeStyling({
    width: 300,
    height: 300,
    dotsOptions: { type: 'square' },
    cornersSquareOptions: { type: 'square' },
    backgroundOptions: { color: "#FFFFFF" },
    imageOptions: { crossOrigin: "anonymous", margin: 10 },
    qrOptions: { errorCorrectionLevel: "H" }
  }));

  // Initialize QR Code Styling
  useEffect(() => {
    if (qrRef.current) {
      qrCode.current.append(qrRef.current);
    }
    if (qrRefMobile.current) {
      qrCode.current.append(qrRefMobile.current);
    }
  }, []);

  // Update QR Code value based on active tab data
  useEffect(() => {
    let value = '';
    let label = '';

    if (activeTab === 'url') {
      value = config.value;
      label = config.value || 'URL';
    } else if (activeTab === 'phone') {
      value = `tel:${config.value}`;
      label = config.value || 'Phone';
    } else if (activeTab === 'text') {
      value = config.value;
      label = config.value.slice(0, 20) || 'Text';
    } else if (activeTab === 'wifi') {
      const { ssid, password, encryption, hidden } = wifiData;
      value = `WIFI:T:${encryption};S:${ssid};P:${password || ''};H:${hidden ? 'true' : ''};;`;
      label = ssid || 'WiFi';
    } else if (activeTab === 'vcard') {
      const { firstName, lastName, organization, phone, email, url, address } = vcardData;
      // vCard 3.0 Standard Formatting with CRLF for better compatibility
      const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${lastName || ''};${firstName || ''};;;`,
        `FN:${(firstName || '') + ' ' + (lastName || '')}`.trim() || 'Contact',
      ];

      if (organization) lines.push(`ORG:${organization}`);
      if (phone) lines.push(`TEL;TYPE=CELL:${phone}`);
      if (email) lines.push(`EMAIL;TYPE=INTERNET:${email}`);
      if (address) lines.push(`ADR;TYPE=HOME:;;${address};;;;`);
      if (url) lines.push(`URL:${url}`);

      lines.push('END:VCARD');
      value = lines.join('\r\n') + '\r\n';
      label = `${firstName} ${lastName}`.trim() || 'vCard';
    }

    qrCode.current.update({
      data: value || 'https://qrcraft.app',
      dotsOptions: { 
        color: config.dotsColor,
        type: config.dotsType 
      },
      backgroundOptions: { color: config.bgColor },
      cornersSquareOptions: { type: config.cornersType },
      cornersDotOptions: { type: config.cornersType },
      image: config.logo
    });

    setConfig(prev => ({ ...prev, label }));
  }, [activeTab, config.value, config.dotsColor, config.bgColor, config.dotsType, config.cornersType, config.logo, wifiData, vcardData]);


  const handleDownload = useCallback((ext: 'png' | 'svg' | 'webp') => {
    qrCode.current.download({ name: `qrcraft-${config.label.replace(/\s+/g, '-').toLowerCase()}`, extension: ext });
  }, [config.label]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          setConfig(prev => ({ ...prev, logo: result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col font-sans bg-[#FDFCFB] text-[#1A1A1A]">
      {/* Editorial Header */}
      <header className="h-20 border-b border-[#1A1A1A] flex items-center justify-between px-6 lg:px-8 bg-white shrink-0 sticky top-0 z-50">
        <div className="flex items-baseline gap-2 lg:gap-4 overflow-hidden">
          <h1 className="text-2xl lg:text-4xl font-serif italic font-bold tracking-tighter uppercase leading-none whitespace-nowrap">QR Codes Australia</h1>
          <span className="text-[8px] lg:text-[10px] font-mono opacity-40 uppercase tracking-widest hidden sm:inline truncate">Matrix Gen v2.0</span>
        </div>
        <nav className="flex gap-4 lg:gap-8 items-center">
          <div className="h-8 w-8 lg:h-10 lg:w-10 bg-[#1A1A1A] text-white flex items-center justify-center rounded-full text-[10px] lg:text-xs font-bold tracking-tighter">
            QRC
          </div>
        </nav>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden relative">
        {/* Mobile Preview (Visible on small screens above configuration) */}
        <section className="lg:hidden bg-[#EAE8E4] p-8 flex flex-col items-center gap-4 shrink-0 border-b border-[#1A1A1A]/10">
          <div className="bg-white p-6 shadow-xl border border-[#1A1A1A]">
            <div 
              ref={qrRefMobile} 
              className="w-[200px] h-[200px] flex items-center justify-center overflow-hidden cursor-pointer" 
              onClick={() => qrCode.current.download({ name: `qrcraft-matrix`, extension: 'png' })}
            />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Tap to Quick Export</span>
        </section>

        {/* Configuration Panel */}
        <section className="w-full lg:w-[480px] lg:border-r border-[#1A1A1A] flex flex-col bg-white shrink-0">
          <div className="flex-1 lg:overflow-y-auto p-6 lg:p-10 space-y-10 lg:space-y-12 scrollbar-thin">
            {/* Input Type selection */}
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 block">1. Static QR Code Matrix Type</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-3 gap-1">
                {(['url', 'phone', 'text', 'wifi', 'vcard'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setActiveTab(type)}
                    className={cn(
                      "py-3 border border-[#1A1A1A] text-[9px] lg:text-[10px] uppercase font-bold transition-all",
                      activeTab === type 
                        ? "bg-[#1A1A1A] text-white" 
                        : "bg-transparent text-[#1A1A1A] hover:bg-[#F0EFEC]"
                    )}
                  >
                    {type === 'wifi' ? 'Wi-Fi' : type === 'vcard' ? 'vCard' : type.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Input */}
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 block">02. Destination Content</label>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'url' && (
                    <input
                      type="url"
                      placeholder="https://editorial.design/arch"
                      className="w-full bg-transparent border-b border-[#1A1A1A] py-4 text-lg lg:text-xl font-serif italic outline-none placeholder:opacity-20"
                      value={config.value}
                      onChange={(e) => setConfig({ ...config, value: e.target.value })}
                    />
                  )}
                  {activeTab === 'phone' && (
                    <input
                      type="tel"
                      placeholder="+1 (800) MATRIX"
                      className="w-full bg-transparent border-b border-[#1A1A1A] py-4 text-lg lg:text-xl font-serif italic outline-none placeholder:opacity-20"
                      value={config.value}
                      onChange={(e) => setConfig({ ...config, value: e.target.value })}
                    />
                  )}
                  {activeTab === 'text' && (
                    <textarea
                      rows={3}
                      placeholder="Type manifest transcript..."
                      className="w-full bg-transparent border-b border-[#1A1A1A] py-4 text-lg lg:text-xl font-serif italic outline-none placeholder:opacity-20 resize-none"
                      value={config.value}
                      onChange={(e) => setConfig({ ...config, value: e.target.value })}
                    />
                  )}
                  {activeTab === 'wifi' && (
                    <div className="space-y-4 lg:space-y-6">
                      <input
                        type="text"
                        placeholder="SSID: Network_Identity"
                        className="w-full bg-transparent border-b border-[#1A1A1A] py-2 text-base lg:text-lg font-serif italic outline-none"
                        value={wifiData.ssid}
                        onChange={(e) => setWifiData({ ...wifiData, ssid: e.target.value })}
                      />
                      <input
                        type="password"
                        placeholder="Key: Secret_Access"
                        className="w-full bg-transparent border-b border-[#1A1A1A] py-2 text-base lg:text-lg font-serif italic outline-none"
                        value={wifiData.password || ''}
                        onChange={(e) => setWifiData({ ...wifiData, password: e.target.value })}
                      />
                    </div>
                  )}
                  {activeTab === 'vcard' && (
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="First Name"
                        className="w-full bg-transparent border-b border-[#1A1A1A] py-2 text-base lg:text-lg font-serif italic outline-none"
                        value={vcardData.firstName}
                        onChange={(e) => setVcardData({ ...vcardData, firstName: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="Last Name"
                        className="w-full bg-transparent border-b border-[#1A1A1A] py-2 text-base lg:text-lg font-serif italic outline-none"
                        value={vcardData.lastName}
                        onChange={(e) => setVcardData({ ...vcardData, lastName: e.target.value })}
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        className="w-full bg-transparent border-b border-[#1A1A1A] py-2 text-base lg:text-lg font-serif italic outline-none"
                        value={vcardData.email || ''}
                        onChange={(e) => setVcardData({ ...vcardData, email: e.target.value })}
                      />
                      <input
                        type="tel"
                        placeholder="Phone"
                        className="w-full bg-transparent border-b border-[#1A1A1A] py-2 text-base lg:text-lg font-serif italic outline-none"
                        value={vcardData.phone || ''}
                        onChange={(e) => setVcardData({ ...vcardData, phone: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="Company"
                        className="w-full bg-transparent border-b border-[#1A1A1A] py-2 text-base lg:text-lg font-serif italic outline-none"
                        value={vcardData.organization || ''}
                        onChange={(e) => setVcardData({ ...vcardData, organization: e.target.value })}
                      />
                      <div className="col-span-2">
                        <input
                          type="text"
                          placeholder="Work Address"
                          className="w-full bg-transparent border-b border-[#1A1A1A] py-2 text-base lg:text-lg font-serif italic outline-none"
                          value={vcardData.address || ''}
                          onChange={(e) => setVcardData({ ...vcardData, address: e.target.value })}
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="url"
                          placeholder="Website (e.g., https://...)"
                          className="w-full bg-transparent border-b border-[#1A1A1A] py-2 text-base lg:text-lg font-serif italic outline-none"
                          value={vcardData.url || ''}
                          onChange={(e) => setVcardData({ ...vcardData, url: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Design Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-10">
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 block">03. Aesthetics</label>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      className="w-8 h-8 rounded-full border border-[#1A1A1A] cursor-pointer"
                      value={config.dotsColor}
                      onChange={(e) => setConfig({ ...config, dotsColor: e.target.value })}
                    />
                    <span className="text-[11px] font-mono tracking-tighter">DOTS {config.dotsColor.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      className="w-8 h-8 rounded-full border border-[#1A1A1A] cursor-pointer"
                      value={config.bgColor}
                      onChange={(e) => setConfig({ ...config, bgColor: e.target.value })}
                    />
                    <span className="text-[11px] font-mono tracking-tighter">BASE {config.bgColor.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 block">04. Brand Overlay</label>
                <div className="relative">
                   {config.logo ? (
                    <div className="flex items-center gap-3">
                       <img src={config.logo} alt="Logo" className="w-10 h-10 object-contain border border-[#1A1A1A] p-1 bg-white" />
                       <button onClick={() => setConfig({...config, logo: undefined})} className="text-[10px] uppercase font-bold opacity-40 hover:opacity-100 underline decoration-1 underline-offset-4">Remove</button>
                    </div>
                    ) : (
                    <label className="border border-dashed border-[#1A1A1A] p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-[#F0EFEC] transition-colors group">
                      <span className="text-[10px] uppercase font-bold opacity-40 group-hover:opacity-100">Upload Logo</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Geometry Section */}
            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 block">05. Matrix Geometry</label>
              <div className="flex flex-wrap gap-1">
                {DOTS_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setConfig({ ...config, dotsType: type.value })}
                    className={cn(
                      "px-3 py-2 border border-[#1A1A1A] text-[9px] uppercase font-bold transition-all",
                      config.dotsType === type.value 
                        ? "bg-[#1A1A1A] text-white" 
                        : "bg-transparent text-[#1A1A1A] hover:bg-[#F0EFEC]"
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Bar (Hidden on mobile as it overflows, or placed at bottom) */}
          <div className="p-6 lg:p-8 border-t border-[#1A1A1A] bg-[#F0EFEC] flex flex-col gap-2 shrink-0">
            <button 
              onClick={() => handleDownload('png')}
              className="w-full bg-[#1A1A1A] text-white py-4 text-xs font-bold uppercase tracking-[0.3em] hover:bg-black transition-colors"
            >
              Export Web Matrix (.png)
            </button>
            <div className="flex gap-2">
              <button 
                onClick={() => handleDownload('svg')}
                className="flex-1 border border-[#1A1A1A] py-3 text-[10px] uppercase font-bold bg-white/50 hover:bg-white transition-colors"
              >
                Vector Print (.svg)
              </button>
              <button 
                onClick={() => handleDownload('webp')}
                className="flex-1 border border-[#1A1A1A] py-3 text-[10px] uppercase font-bold bg-white/50 hover:bg-white transition-colors"
              >
                Web-Ready (.webp)
              </button>
            </div>
          </div>
        </section>

        {/* Desktop Preview Area (Hidden on small screens) */}
        <section className="hidden lg:flex flex-1 bg-[#EAE8E4] flex-col relative overflow-hidden">
          {/* Environment Labels */}
          <div className="absolute top-8 left-8 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] font-mono">Live Matrix Render</span>
          </div>
          
          <div className="absolute top-8 right-8 flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Dimensional Specs</span>
            <span className="text-2xl font-serif italic">V4 (Adaptive)</span>
          </div>

          <div className="flex-1 flex items-center justify-center p-12">
            <div className="relative p-12 bg-white shadow-[20px_20px_0px_0px_#1A1A1A] border border-[#1A1A1A] transition-all duration-500 hover:shadow-[30px_30px_0px_0px_#1A1A1A] hover:-translate-x-1 hover:-translate-y-1">
              <div ref={qrRef} className="qr-container bg-white" />
            </div>
          </div>

          {/* Vertical Architectural Label */}
          <div className="absolute right-0 bottom-40 rotate-90 origin-right translate-x-1/2">
            <span className="text-[10px] font-bold uppercase tracking-[0.6em] opacity-20">Editorial Architecture</span>
          </div>
        </section>
      </main>

      {/* PWA Direct Installation & Device Integration Section */}
      {!isStandalone && (
        <section id="pwa-install-section" className="border-t border-[#1A1A1A] bg-white p-6 lg:p-8 shrink-0">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Metadata Block */}
            <div className="md:col-span-3 space-y-2">
              <span className="text-[9px] font-mono uppercase tracking-[0.3em] opacity-40 block">06 // System Sync</span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" /> PWA Launcher
              </h4>
              <div className="pt-1">
                <span className="text-[9px] font-mono tracking-tighter uppercase px-2 py-1 bg-[#F0EFEC] border border-[#1A1A1A]/10 text-stone-600 rounded-sm inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  Detected: {platformInfo.os}
                </span>
              </div>
            </div>

            {/* Core Interactive Section */}
            <div className="md:col-span-9 border-l border-dashed border-[#1A1A1A]/20 md:pl-8 space-y-4">
              {isInstallable ? (
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                  <div className="space-y-1 max-w-xl">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]">PWA Installer Ready</h5>
                    <p className="text-[11px] font-serif italic text-stone-700 leading-relaxed">
                      Install this utility directly to your {platformInfo.os} launcher/desktop. Run in full workspace view, with perfect offline security capabilities.
                    </p>
                  </div>
                  <button 
                    onClick={triggerInstall}
                    className="bg-[#1A1A1A] text-white py-3.5 px-6 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-colors shrink-0 flex items-center justify-center gap-2 border border-[#1A1A1A] active:translate-y-px cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Install Application
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]">
                    How to Install on {platformInfo.os} / {platformInfo.browser}
                  </h5>
                  
                  {/* Custom platform-specific installation prompt instructions */}
                  {platformInfo.os === 'iOS' ? (
                    <div className="text-[11px] space-y-2 text-stone-700 font-serif leading-relaxed">
                      <p className="italic">
                        "Apple iOS configurations require manual alignment to Home Screen. Follow this editorial integration guide:"
                      </p>
                      <ol className="list-decimal list-inside space-y-1.5 text-[11px] font-sans text-stone-800">
                        <li>
                          Tap the <strong className="font-bold underline">Safari Share Button</strong> <Share className="w-3 h-3 inline mx-1 text-blue-900" /> at the bottom bar of your mobile screen.
                        </li>
                        <li>
                          Scroll down and click <strong className="font-bold">"Add to Home Screen"</strong> (with the plus sign).
                        </li>
                        <li>
                          Confirm the application name and click <strong className="font-bold text-[#1A1A1A]">"Add"</strong> in the top-right corner.
                        </li>
                      </ol>
                    </div>
                  ) : platformInfo.os === 'macOS' && platformInfo.browser === 'Safari' ? (
                    <div className="text-[11px] space-y-2 text-stone-700 font-serif leading-relaxed">
                      <p className="italic">
                        "Utilizing macOS local engine. Connect this web-system directly onto your Dock space:"
                      </p>
                      <ol className="list-decimal list-inside space-y-1.5 text-[11px] font-sans text-stone-800">
                        <li>
                          Click the <strong className="font-bold text-[#1A1A1A]">Share Button</strong> (box with upward arrow) in the top right of your Safari bar.
                        </li>
                        <li>
                          Select <strong className="font-bold">"Add to Dock"</strong> to spawn a permanent application bundle.
                        </li>
                        <li>
                          Open newly integrated app directly from your macOS Dock workspace.
                        </li>
                      </ol>
                    </div>
                  ) : (platformInfo.browser === 'Chrome' || platformInfo.browser === 'Edge') ? (
                    <div className="text-[11px] space-y-1.5 text-stone-700 leading-relaxed font-serif">
                      <p className="italic">
                        "Automated setup launcher not showing? Trigger installation via manual browser integration:"
                      </p>
                      <p className="text-[11px] font-sans text-stone-800">
                        Click the <strong className="font-bold underline">Install Symbol</strong> (computer with a downward arrow) in the right-hand corner of your browser's search-bar, or select <strong className="font-bold">"Install QR Codes Australia"</strong> from your browser settings dropdown menu (⋮ / …).
                      </p>
                    </div>
                  ) : (
                    <div className="text-[11px] space-y-1 text-stone-700 leading-relaxed font-serif">
                      <p className="italic">
                        "Your standard web software operates without direct engine prompts. Integrate easily:"
                      </p>
                      <p className="text-[11px] font-sans text-stone-800">
                        Inside your browser settings menu (usually top right), locate and select <strong className="font-bold">"Add to Home screen"</strong>, <strong className="font-bold">"Install Page as App"</strong>, or try loaded in <strong className="font-bold">Google Chrome / Apple Safari</strong> for automatic system execution.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Editorial Footer */}
      <footer className="h-auto lg:h-12 border-t border-[#1A1A1A] flex flex-col lg:flex-row items-center justify-center px-6 lg:px-8 py-4 lg:py-0 text-[9px] uppercase tracking-[0.2em] lg:tracking-[0.4em] font-bold shrink-0 bg-white gap-4 lg:gap-12">
        <div className="text-center">Registry Status: Matrix Verified</div>
        <div className="flex flex-wrap justify-center gap-6 lg:gap-12 opacity-60">
          <span className="hidden sm:inline">Build Archive.2024.12.01</span>
          <a 
            href="https://qrcodesaustralia.com.au/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-900 hover:text-blue-700 opacity-100 transition-colors cursor-pointer text-center"
          >
            Static QR Code generator developed by QR Codes Australia
          </a>
          <div className="flex flex-wrap justify-center gap-2 opacity-60">
            <a 
              href="https://qrcodesaustralia.com.au/dynamic-qr-codes/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-100 transition-opacity cursor-pointer"
            >
              Dynamic QR Codes
            </a>
            <span className="opacity-40">-</span>
            <a 
              href="https://digitalproductcreation.au/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-100 transition-opacity cursor-pointer"
            >
              Training
            </a>
            <span className="opacity-40">-</span>
            <a 
              href="https://msincome.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-100 transition-opacity cursor-pointer"
            >
              Products
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
