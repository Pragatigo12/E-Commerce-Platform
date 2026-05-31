import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext(null);

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const key     = `${action.payload._id}_${action.payload.size}_${action.payload.color}`;
      const existing = state.items.find((i) => i._cartKey === key);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i._cartKey === key ? { ...i, quantity: i.quantity + (action.payload.quantity || 1) } : i
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, _cartKey: key, quantity: action.payload.quantity || 1 }],
      };
    }

    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => i._cartKey !== action.payload) };

    case 'UPDATE_QTY': {
      if (action.payload.qty <= 0) {
        return { ...state, items: state.items.filter((i) => i._cartKey !== action.payload.key) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i._cartKey === action.payload.key ? { ...i, quantity: action.payload.qty } : i
        ),
      };
    }

    case 'CLEAR':
      return { ...state, items: [] };

    default:
      return state;
  }
};

const initialState = {
  items: JSON.parse(localStorage.getItem('cart') || '[]'),
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Persist cart to localStorage on every change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items));
  }, [state.items]);

  const addToCart   = (product) => dispatch({ type: 'ADD_ITEM',    payload: product });
  const removeItem  = (key)     => dispatch({ type: 'REMOVE_ITEM', payload: key });
  const updateQty   = (key, qty)=> dispatch({ type: 'UPDATE_QTY',  payload: { key, qty } });
  const clearCart   = ()        => dispatch({ type: 'CLEAR' });

  const subtotal    = state.items.reduce((s, i) => s + (i.discountPrice || i.price) * i.quantity, 0);
  const itemCount   = state.items.reduce((s, i) => s + i.quantity, 0);
  const shipping    = subtotal >= 2999 ? 0 : 99;
  const tax         = Math.round(subtotal * 0.18);
  const total       = subtotal + shipping + tax;

  return (
    <CartContext.Provider value={{
      items: state.items, itemCount, subtotal, shipping, tax, total,
      addToCart, removeItem, updateQty, clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};