import React from 'react';
import { useLocationContext } from '../../context/LocationContext';
import { useAuth, AVAILABLE_PERSONAS } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { Compass, Navigation, Users, Map, List, Search, Award, Store, MapPin } from 'lucide-react';

interface NavbarProps {
  viewMode: 'map' | 'list';
  setViewMode: (mode: 'map' | 'list') => void;
  pointsBalance?: number;
  onOpenWallet?: () => void;
  onOpenPartnerPortal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  viewMode,
  setViewMode,
  pointsBalance = 350,
  onOpenWallet,
  onOpenPartnerPortal,
}) => {
  const {
    radiusKm,
    setRadiusKm,
    requestGps,
    isLocating,
    selectedCityId,
    selectCity,
    availableCities,
    currentNeighborhoods,
    selectedNeighborhoodId,
    selectNeighborhood,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
  } = useLocationContext();

  const { selectedPersonas, openPersonaModal } = useAuth();
  const { t } = useLanguage();
  const primaryPersonaInfo = AVAILABLE_PERSONAS.find((p) => p.id === selectedPersonas[0]);

  const categories = [
    { id: 'all', label: t('common.allPlaces') },
    { id: 'transit', label: t('common.transit') },
    { id: 'cafe', label: t('common.cafes') },
    { id: 'shopping', label: t('common.shopping') },
    { id: 'park', label: t('common.parks') },
    { id: 'healthcare', label: t('common.healthcare') },
  ];

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
        {/* Top Brand & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Logo & City Selector Dropdown */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-700 text-white flex items-center justify-center font-black text-xl shadow-md">
              <Compass className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {t('common.appName')}
                </span>

                {/* City Picker Pill */}
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs font-bold">
                  <MapPin className="w-3 h-3 text-emerald-600 shrink-0" aria-hidden="true" />
                  <label htmlFor="city-select-pill" className="sr-only">
                    Select Indian Metro City
                  </label>
                  <select
                    id="city-select-pill"
                    value={selectedCityId}
                    onChange={(e) => selectCity(e.target.value)}
                    className="bg-transparent text-emerald-900 dark:text-emerald-200 font-bold text-xs focus:outline-none cursor-pointer pr-1"
                    aria-label="Select target metro city"
                  >
                    {availableCities.map((city) => (
                      <option key={city.id} value={city.id} className="bg-slate-900 text-white">
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                {t('common.tagline')}
              </p>
            </div>
          </div>

          {/* Right Controls: View Toggle & Persona Chip */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Switcher: Equal Map and List View */}
            <div
              role="radiogroup"
              aria-label="Venue discovery display mode"
              className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700"
            >
              <button
                type="button"
                role="radio"
                aria-checked={viewMode === 'map'}
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
                  viewMode === 'map'
                    ? 'bg-sky-700 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <Map className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t('nav.interactiveMap')}</span>
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={viewMode === 'list'}
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
                  viewMode === 'list'
                    ? 'bg-sky-700 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t('nav.accessibleList')}</span>
              </button>
            </div>

            {/* Active Persona Button */}
            <button
              onClick={openPersonaModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-sky-600 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 text-xs font-bold hover:bg-sky-100 min-h-[44px] focus:outline-none"
              aria-label={`Current accessibility persona: ${
                primaryPersonaInfo ? primaryPersonaInfo.label : 'General View'
              }. Click to edit.`}
            >
              <Users className="w-4 h-4 text-sky-600 shrink-0" aria-hidden="true" />
              <span>{primaryPersonaInfo ? primaryPersonaInfo.label : t('personas.title')}</span>
            </button>

            {/* Rewards Wallet Chip */}
            {onOpenWallet && (
              <button
                onClick={onOpenWallet}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs font-black hover:bg-amber-100 min-h-[44px] focus:outline-none shadow-sm"
                aria-label={`Rewards wallet. Current balance: ${pointsBalance} points. Click to redeem.`}
              >
                <Award className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                <span>{pointsBalance} pts</span>
              </button>
            )}

            {/* Merchant Partner Portal */}
            {onOpenPartnerPortal && (
              <button
                onClick={onOpenPartnerPortal}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold min-h-[44px]"
                aria-label="Open venue merchant partner portal"
              >
                <Store className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                <span>{t('nav.partnerPortal')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Location & Filter Sub-Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <label htmlFor="venue-search-input" className="sr-only">
              Search venues or addresses
            </label>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" aria-hidden="true" />
            </div>
            <input
              id="venue-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('common.searchPlaceholder')}
              className="w-full pl-9 pr-3 py-2 text-xs md:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none min-h-[44px]"
            />
          </div>

          {/* Location & Neighborhood Fallback Selector */}
          <div className="md:col-span-5 flex items-center gap-2">
            <button
              onClick={requestGps}
              disabled={isLocating}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 shrink-0 min-h-[44px]"
              title="Detect my current location with GPS"
              aria-label="Detect GPS coordinates"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-sky-600' : 'text-sky-600'}`} />
              <span>{isLocating ? t('common.loading') : 'GPS'}</span>
            </button>

            {/* Neighborhood Fallback dropdown */}
            <div className="flex-1">
              <label htmlFor="neighborhood-select" className="sr-only">
                Metro City Neighborhood
              </label>
              <select
                id="neighborhood-select"
                value={selectedNeighborhoodId}
                onChange={(e) => selectNeighborhood(e.target.value)}
                className="w-full text-xs md:text-sm font-medium bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none min-h-[44px]"
              >
                {currentNeighborhoods.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Radius Filter */}
            <div>
              <label htmlFor="radius-select" className="sr-only">
                Radius in kilometers
              </label>
              <select
                id="radius-select"
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="text-xs md:text-sm font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-2 focus:outline-none min-h-[44px]"
                aria-label="Filter radius in kilometers"
              >
                <option value={1}>1 km</option>
                <option value={3}>3 km</option>
                <option value={5}>5 km</option>
                <option value={15}>15 km</option>
                <option value={30}>30 km</option>
              </select>
            </div>
          </div>

          {/* Category Chips Bar */}
          <div className="md:col-span-3 flex overflow-x-auto gap-1.5 pb-1 md:pb-0 scrollbar-none" role="tablist" aria-label="Venue Categories">
            {categories.slice(0, 3).map((cat) => (
              <button
                key={cat.id}
                role="tab"
                aria-selected={selectedCategory === cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all min-h-[40px] ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};
