import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { currenciesAPI } from '../api';

export const useCurrencyStore = create(
  persist(
    (set, get) => ({
      currentCurrency: 'YER', // 'YER' | 'USD'
      exchangeRate: 535, // Default USD to YER rate (1 USD = 535 YER or vice versa depending on market)
      currencies: [
        { code: 'YER', name: 'ريال يمني', symbol: 'ر.ي', exchange_rate: 1 },
        { code: 'USD', name: 'دولار أمريكي', symbol: '$', exchange_rate: 535 },
      ],

      setCurrency: (code) => set({ currentCurrency: code }),

      fetchCurrencies: async () => {
        try {
          const res = await currenciesAPI.getAll();
          if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
            const usd = res.data.find((c) => c.code === 'USD');
            const rate = usd?.exchange_rate > 0 ? usd.exchange_rate : 535;
            set({ currencies: res.data, exchangeRate: rate });
          }
        } catch (err) {
          console.warn('Could not fetch latest currencies, using defaults:', err.message);
        }
      },

      /**
       * Format and convert price from base currency (YER) to selected currency
       * @param {number} amountInYER
       * @returns {string} e.g. "6,500 ر.ي" or "$12.15"
       */
      formatPrice: (amountInYER) => {
        const { currentCurrency, exchangeRate } = get();
        const amount = Number(amountInYER) || 0;

        if (currentCurrency === 'USD') {
          const inUSD = exchangeRate > 0 ? amount / exchangeRate : amount;
          return `$${inUSD.toFixed(2)}`;
        }

        // Yemeni Rial formatting
        return `${Math.round(amount).toLocaleString('ar-YE')} ر.ي`;
      },

      /**
       * Raw converted value
       */
      convertPrice: (amountInYER) => {
        const { currentCurrency, exchangeRate } = get();
        const amount = Number(amountInYER) || 0;
        if (currentCurrency === 'USD') {
          return exchangeRate > 0 ? Number((amount / exchangeRate).toFixed(2)) : amount;
        }
        return amount;
      },
    }),
    {
      name: 'makeupi_currency_storage',
    }
  )
);
