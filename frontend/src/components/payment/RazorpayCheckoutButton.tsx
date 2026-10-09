import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { CreditCard, Loader2 } from 'lucide-react';
import { paymentsApi } from '../../services/payments.service';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayCheckoutButtonProps {
  amount?: number; // In paise (min 100) or rupees if inRupees=true
  inRupees?: boolean;
  planId?: string;
  planName?: string;
  currency?: string;
  receipt?: string;
  buttonText?: string;
  className?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess?: (verifyResult: any) => void;
  onError?: (error: any) => void;
  disabled?: boolean;
}

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const RazorpayCheckoutButton: React.FC<RazorpayCheckoutButtonProps> = ({
  amount,
  inRupees = false,
  planId,
  planName = 'Membership Upgrade',
  currency = 'INR',
  receipt,
  buttonText,
  className = '',
  prefill,
  onSuccess,
  onError,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    const toastId = toast.loading('Initializing Razorpay Checkout...');

    try {
      // 1. Ensure Razorpay Checkout SDK is loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Unable to load Razorpay SDK. Please check your internet connection.');
      }

      // Calculate amount in paise if direct amount provided
      let amountInPaise: number | undefined;
      if (amount !== undefined) {
        amountInPaise = inRupees ? Math.round(amount * 100) : Math.round(amount);
        if (amountInPaise < 100) {
          throw new Error('Minimum payment amount is 100 paise (₹1.00)');
        }
      }

      // 2. Call backend order creation endpoint
      const orderPayload: any = {};
      if (planId) orderPayload.planId = planId;
      if (amountInPaise !== undefined) orderPayload.amount = amountInPaise;
      if (currency) orderPayload.currency = currency;
      if (receipt) orderPayload.receipt = receipt;

      const orderData = await paymentsApi.createOrder(orderPayload);
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || orderData.key;
      const orderId = orderData.order_id || orderData.id || orderData.razorpayOrderId || orderData.orderId;

      toast.dismiss(toastId);

      // 3. Configure Razorpay Standard Checkout options
      const options: any = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency || currency || 'INR',
        name: 'S2S Community Matrimony',
        description: planName,
        image: '/images/logo.png',
        order_id: orderId,
        handler: async (response: any) => {
          const verifyToast = toast.loading('Verifying payment signature...');
          try {
            // 4. Send razorpay_payment_id, razorpay_order_id, razorpay_signature to backend
            const verifyRes = await paymentsApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id || orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            toast.success(verifyRes.message || 'Payment verified successfully! 🎉', { id: verifyToast });
            if (onSuccess) onSuccess(verifyRes);
          } catch (err: any) {
            const errorMsg = err?.response?.data?.message || err?.message || 'Payment signature verification failed';
            toast.error(errorMsg, { id: verifyToast });
            if (onError) onError(err);
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: prefill?.name || '',
          email: prefill?.email || '',
          contact: prefill?.contact || '',
        },
        theme: {
          color: '#E11D48',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast('Payment checkout cancelled');
          },
        },
      };

      // 5. Open Razorpay Checkout modal
      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', (response: any) => {
        const failureMsg = response?.error?.description || 'Payment failed';
        toast.error(`Payment failed: ${failureMsg}`);
        setLoading(false);
        if (onError) onError(response?.error);
      });

      rzp.open();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to start payment';
      toast.error(msg, { id: toastId });
      setLoading(false);
      if (onError) onError(err);
    }
  };

  const defaultBtnText = amountInPaiseText(amount, inRupees, buttonText);

  return (
    <button
      type="button"
      onClick={handleCheckout}
      disabled={disabled || loading}
      className={
        className ||
        'inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-rose-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed'
      }
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4" />
          <span>{defaultBtnText}</span>
        </>
      )}
    </button>
  );
};

function amountInPaiseText(amount?: number, inRupees = false, customText?: string) {
  if (customText) return customText;
  if (amount !== undefined) {
    const val = inRupees ? amount : amount / 100;
    return `Pay ₹${val.toLocaleString('en-IN')}`;
  }
  return 'Proceed to Pay';
}

export default RazorpayCheckoutButton;
