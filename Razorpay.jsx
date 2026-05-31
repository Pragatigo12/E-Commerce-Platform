import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { paymentAPI } from '../services/api';
import { useCart } from '../context/CartContext';

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src   = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const useRazorpay = () => {
  const { items, clearCart } = useCart();

  const initiatePayment = useCallback(async ({ shippingAddress, couponCode, onSuccess }) => {
    // 1. Load Razorpay SDK
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      toast.error('Failed to load payment gateway. Check your internet connection.');
      return;
    }

    // 2. Create order on backend
    let orderData;
    try {
      const payload = {
        items: items.map((i) => ({
          productId: i._id,
          quantity:  i.quantity,
          size:      i.size,
          color:     i.color,
        })),
        shippingAddress,
        couponCode,
      };
      const { data } = await paymentAPI.createOrder(payload);
      orderData = data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create order.');
      return;
    }

    // 3. Open Razorpay modal
    const options = {
      ...orderData.razorpay,
      theme: { color: '#1A1714' },
      modal: { ondismiss: () => toast('Payment cancelled.') },

      handler: async (response) => {
        // 4. Verify payment signature on backend
        try {
          const verifyPayload = {
            razorpayOrderId:   response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            orderId:           orderData.order._id,
          };
          const { data: verifyData } = await paymentAPI.verifyPayment(verifyPayload);

          clearCart();
          toast.success('🎉 Order placed successfully!');
          onSuccess?.(verifyData.orderNumber);

        } catch {
          toast.error('Payment verification failed. Please contact support.');
        }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', () => toast.error('Payment failed. Please try again.'));
    rzp.open();

  }, [items, clearCart]);

  return { initiatePayment };
};

export default useRazorpay;