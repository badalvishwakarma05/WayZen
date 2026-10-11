export type SupportedLanguage = 'en' | 'kn' | 'hi' | 'ta';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
];

export interface TranslationDictionary {
  common: {
    appName: string;
    cityTag: string;
    tagline: string;
    searchPlaceholder: string;
    allPlaces: string;
    transit: string;
    cafes: string;
    shopping: string;
    parks: string;
    healthcare: string;
    close: string;
    save: string;
    cancel: string;
    submit: string;
    loading: string;
    offlineMode: string;
    synced: string;
    kmRadius: string;
    distance: string;
    viewDetails: string;
    share: string;
    verified: string;
    unverified: string;
  };
  a11yToolbar: {
    quickControls: string;
    textSize: string;
    highContrast: string;
    reduceMotion: string;
    language: string;
    myNeeds: string;
    moderation: string;
    exportData: string;
    deleteData: string;
    confirmDelete: string;
    dataErased: string;
  };
  nav: {
    interactiveMap: string;
    accessibleList: string;
    partnerPortal: string;
    rewardsWallet: string;
    scanQr: string;
  };
  personas: {
    title: string;
    subtitle: string;
    dpdpNotice: string;
    consentCheckbox: string;
    powerWheelchair: string;
    powerWheelchairDesc: string;
    manualWheelchair: string;
    manualWheelchairDesc: string;
    caneWalker: string;
    caneWalkerDesc: string;
    sensoryAutism: string;
    sensoryAutismDesc: string;
    deafHoh: string;
    deafHohDesc: string;
    strollerParent: string;
    strollerParentDesc: string;
  };
  pillars: {
    stepFree: string;
    lifts: string;
    washrooms: string;
    restSeating: string;
    wayfindingSensory: string;
    unknown: string;
  };
  trafficLights: {
    accessible: string;
    partiallyAccessible: string;
    notAccessible: string;
    unknown: string;
  };
  scoring: {
    matchScore: string;
    confidence: string;
    highConfidence: string;
    mediumConfidence: string;
    lowConfidence: string;
    reviewsCount: string;
    photoVerified: string;
  };
  reviews: {
    modalTitle: string;
    stepFreeQuestion: string;
    liftQuestion: string;
    washroomQuestion: string;
    sensoryQuestion: string;
    addPhoto: string;
    submitReview: string;
    offlineSaved: string;
  };
  alerts: {
    temporaryOutage: string;
    reportOutage: string;
    reportButton: string;
    autoExpires: string;
  };
  guides: {
    title: string;
    subtitle: string;
    viewGuide: string;
    stopsCount: string;
  };
  rewards: {
    walletTitle: string;
    pointsBalance: string;
    availableVouchers: string;
    redeem: string;
    redeemed: string;
    partnerPortalTitle: string;
    claimVenue: string;
    verifyRedemption: string;
    tableQrTitle: string;
  };
}
