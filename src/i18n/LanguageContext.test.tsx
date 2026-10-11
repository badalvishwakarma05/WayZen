import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from './LanguageContext';
import { SUPPORTED_LANGUAGES } from './types';

const TestLanguageConsumer: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div>
      <div data-testid="current-lang">{language}</div>
      <div data-testid="app-name">{t('common.appName')}</div>
      <div data-testid="city-tag">{t('common.cityTag')}</div>
      <div data-testid="text-size-label">{t('a11yToolbar.textSize')}</div>
      <div data-testid="step-free-pillar">{t('pillars.stepFree')}</div>
      <div data-testid="accessible-badge">{t('trafficLights.accessible')}</div>

      <button onClick={() => setLanguage('kn')} data-testid="btn-kn">
        Switch to Kannada
      </button>
      <button onClick={() => setLanguage('hi')} data-testid="btn-hi">
        Switch to Hindi
      </button>
      <button onClick={() => setLanguage('ta')} data-testid="btn-ta">
        Switch to Tamil
      </button>
      <button onClick={() => setLanguage('en')} data-testid="btn-en">
        Switch to English
      </button>
    </div>
  );
};

describe('Multilingual Localization System (English, Kannada, Hindi, Tamil)', () => {
  it('initializes with English defaults and updates document.documentElement.lang', () => {
    render(
      <LanguageProvider>
        <TestLanguageConsumer />
      </LanguageProvider>
    );

    expect(screen.getByTestId('current-lang').textContent).toBe('en');
    expect(screen.getByTestId('app-name').textContent).toBe('AccessPath');
    expect(screen.getByTestId('city-tag').textContent).toBe('Bengaluru Pilot');
    expect(screen.getByTestId('text-size-label').textContent).toBe('Text');
    expect(screen.getByTestId('accessible-badge').textContent).toBe('Accessible');
    expect(document.documentElement.lang).toBe('en');
  });

  it('switches to Kannada (ಕನ್ನಡ) with authentic terminology', () => {
    render(
      <LanguageProvider>
        <TestLanguageConsumer />
      </LanguageProvider>
    );

    act(() => {
      screen.getByTestId('btn-kn').click();
    });

    expect(screen.getByTestId('current-lang').textContent).toBe('kn');
    expect(screen.getByTestId('app-name').textContent).toContain('ಆಕ್ಸೆಸ್‌ಪಾಥ್');
    expect(screen.getByTestId('city-tag').textContent).toBe('ಬೆಂಗಳೂರು ಪೈಲಟ್');
    expect(screen.getByTestId('text-size-label').textContent).toBe('ಪಠ್ಯ ಗಾತ್ರ');
    expect(screen.getByTestId('step-free-pillar').textContent).toBe('ಮೆಟ್ಟಿಲು-ಮುಕ್ತ ಪ್ರವೇಶ');
    expect(document.documentElement.lang).toBe('kn');
  });

  it('switches to Hindi (हिंदी) with dignified accessibility terminology', () => {
    render(
      <LanguageProvider>
        <TestLanguageConsumer />
      </LanguageProvider>
    );

    act(() => {
      screen.getByTestId('btn-hi').click();
    });

    expect(screen.getByTestId('current-lang').textContent).toBe('hi');
    expect(screen.getByTestId('app-name').textContent).toContain('एक्सेसपाथ');
    expect(screen.getByTestId('city-tag').textContent).toBe('बेंगलुरु पायलट');
    expect(screen.getByTestId('text-size-label').textContent).toBe('फ़ॉन्ट आकार');
    expect(screen.getByTestId('step-free-pillar').textContent).toBe('सीढ़ी-मुक्त प्रवेश');
    expect(document.documentElement.lang).toBe('hi');
  });

  it('switches to Tamil (தமிழ்) with accurate Tamil terminology', () => {
    render(
      <LanguageProvider>
        <TestLanguageConsumer />
      </LanguageProvider>
    );

    act(() => {
      screen.getByTestId('btn-ta').click();
    });

    expect(screen.getByTestId('current-lang').textContent).toBe('ta');
    expect(screen.getByTestId('app-name').textContent).toContain('அக்செஸ்பாத்');
    expect(screen.getByTestId('city-tag').textContent).toBe('பெங்களூரு முன்னோட்டம்');
    expect(screen.getByTestId('text-size-label').textContent).toBe('எழுத்து அளவு');
    expect(screen.getByTestId('step-free-pillar').textContent).toBe('படிக்கட்டு இல்லாத அணுகல்');
    expect(document.documentElement.lang).toBe('ta');
  });

  it('provides all 4 supported language options with native labels', () => {
    expect(SUPPORTED_LANGUAGES).toHaveLength(4);
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(codes).toEqual(['en', 'kn', 'hi', 'ta']);

    const knOption = SUPPORTED_LANGUAGES.find((l) => l.code === 'kn');
    expect(knOption?.nativeLabel).toBe('ಕನ್ನಡ');

    const hiOption = SUPPORTED_LANGUAGES.find((l) => l.code === 'hi');
    expect(hiOption?.nativeLabel).toBe('हिंदी');

    const taOption = SUPPORTED_LANGUAGES.find((l) => l.code === 'ta');
    expect(taOption?.nativeLabel).toBe('தமிழ்');
  });
});
