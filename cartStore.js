import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      addItem: (product, quantity = 1, selectedVariant = null) => {
        const { items } = get();
        const existingIndex = items.findIndex(
          (item) =>
            item.id === product.id &&
            item.selectedVariant?.id === selectedVariant?.id
        );

        const currentQty = existingIndex > -1 ? items[existingIndex].quantity : 0;
        const availableStock = selectedVariant ? (selectedVariant.stock_quantity ?? product.stock_quantity) : product.stock_quantity;

        const newQty = Math.min(currentQty + quantity, availableStock);

        if (existingIndex > -1) {
          const updatedItems = [...items];
          updatedItems[existingIndex].quantity = newQty;
          set({ items: updatedItems, isOpen: true });
        } else {
          set({
            items: [
              ...items,
              {
                id: product.id,
                name: product.name,
                slug: product.slug,
                price: Number(product.price) + Number(selectedVariant?.price_adjustment || 0),
                image: product.primary_image || product.images?.[0]?.image_path || product.image || '/placeholder-beauty.jpg',
                stock: availableStock,
                sku: selectedVariant?.sku || product.sku,
                selectedVariant,
                quantity: Math.min(quantity, availableStock),
              },
            ],
            isOpen: true,
          });
        }
      },

      updateQuantity: (id, variantId, quantity) => {
        const { items } = get();
        if (quantity <= 0) {
          get().removeItem(id, variantId);
          return;
        }

        const updated = items.map((item) => {
          if (item.id === id && item.selectedVariant?.id === variantId) {
            const safeQty = Math.min(quantity, item.stock || 999);
            return { ...item, quantity: safeQty };
          }
          return item;
        });

        set({ items: updated });
      },

      removeItem: (id, variantId = null) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.id === id && item.selectedVariant?.id === variantId)
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getSubtotal: () => {
        const { items } = get();
        return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
      },

      getTotalItemsCount: () => {
        const { items } = get();
        return items.reduce((acc, item) => acc + item.quantity, 0);
      },
    }),
    {
      name: 'makeupi_cart_storage',
    }
  )
);
