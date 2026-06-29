# Quick Start Guide - Payment Section

## Import & Use (Fastest Way)

### Option 1: PaymentSection (Full Page)
```jsx
import { PaymentSection } from '@components/payments';

<PaymentSection
  plan={selectedPlan}
  onPaymentSuccess={handleSuccess}
  onPaymentError={handleError}
/>
```

### Option 2: PaymentModal (Dialog Box)
```jsx
import { PaymentModal } from '@components/payments';

<PaymentModal
  open={isOpen}
  plan={selectedPlan}
  onClose={handleClose}
  onSuccess={handleSuccess}
/>
```

### Option 3: Use Both (Recommended)
```jsx
import { PaymentSection, PaymentModal } from '@components/payments';

// In your component
const [showModal, setShowModal] = useState(false);

return (
  <>
    <PaymentSection plan={plan} />
    <PaymentModal 
      open={showModal} 
      plan={plan}
      onClose={() => setShowModal(false)}
    />
  </>
);
```

---

## Features at a Glance

### 🎨 Beautiful UI
- 4 Payment methods with color-coded cards
- Smooth animations and transitions
- Responsive design (mobile to desktop)
- Modern gradient backgrounds

### 💰 Price Breakdown
- Base Price
- Gateway Fee (3%)
- GST (18%)
- Total Amount

### 📱 Payment Methods
- 💳 Credit Card (with CVV input)
- 🏦 Razorpay
- 📱 PhonePe
- 📲 UPI

### ✅ Features
- Interactive card selection
- Real-time calculations
- Success animation
- Error handling
- Loading states
- Security badges

---

## Props Reference

### PaymentSection Props
```typescript
{
  plan: {
    id: string;           // e.g., 'basic', 'premium'
    name: string;         // e.g., 'Basic Plan'
    price: number;        // Base price in INR
    durationMonths: number; // e.g., 1, 2, 3
    durationLabel: string;  // e.g., '1 Month', '3 Months'
  };
  onPaymentSuccess?: (paymentData: any) => void;
  onPaymentError?: (error: string) => void;
}
```

### PaymentModal Props
```typescript
{
  open: boolean;           // Show/hide modal
  plan: { /* same as above */ };
  onClose: () => void;    // Handle close button
  onSuccess?: (paymentData: any) => void;
}
```

---

## Common Use Cases

### 1. Redirect After Payment
```jsx
const handlePaymentSuccess = (paymentData) => {
  toast.success('Payment successful!');
  navigate('/dashboard');
};

<PaymentSection onPaymentSuccess={handlePaymentSuccess} />
```

### 2. Show Modal Instead of Full Page
```jsx
const [showCheckout, setShowCheckout] = useState(false);

<Button onClick={() => setShowCheckout(true)}>
  Proceed to Checkout
</Button>

<PaymentModal
  open={showCheckout}
  plan={selectedPlan}
  onClose={() => setShowCheckout(false)}
  onSuccess={handlePaymentSuccess}
/>
```

### 3. Handle Errors
```jsx
const handleError = (error) => {
  toast.error(`Payment failed: ${error}`);
  // Log to analytics
  // Show retry button
};

<PaymentSection onPaymentError={handleError} />
```

---

## Styling & Customization

### Colors Used
```css
Primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
Success: #10B981
Error: #DC2626
Warning: #FBBF24
Background: #F9FAFB
```

### Animations
- Hover lift effect on payment methods
- Smooth fade-in/scale animations
- Glow effect on selected method
- Success checkmark animation

---

## Mobile Optimization

The payment section is fully responsive:
- ✅ Touch-friendly buttons
- ✅ Vertical stacking on mobile
- ✅ Optimized font sizes
- ✅ Full-width inputs
- ✅ Proper spacing

---

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers

---

## Common Issues & Solutions

### Issue: Payment not processing
**Solution:** Check if user is logged in with `useAuthStore()`

### Issue: Modal not opening
**Solution:** Ensure `open` prop is controlled state: `const [open, setOpen] = useState(false)`

### Issue: Animations not smooth
**Solution:** Check if browser supports CSS animations (should work on all modern browsers)

### Issue: Mobile layout broken
**Solution:** Verify viewport meta tag in HTML head

---

## Files Modified
- `src/pages/Pricing.tsx` - Integrated PaymentSection
- `src/styles/payment.css` - New animations & styles

## Files Created
- `src/components/payments/PaymentSection.tsx`
- `src/components/payments/PaymentModal.tsx`
- `src/components/payments/index.ts`
- `PAYMENT_SETUP.md` - Full documentation

---

## Dependencies Used
- React 18+
- Material-UI (MUI) v5
- Framer Motion (animations)
- React Router
- React Hot Toast
- Zustand (state management)
- Supabase (backend)

---

## Production Checklist
- [ ] Test all payment methods
- [ ] Verify calculations with edge cases
- [ ] Test on mobile devices
- [ ] Check accessibility
- [ ] Verify error handling
- [ ] Test with slow network
- [ ] Check browser compatibility
- [ ] Verify security badges display
- [ ] Test success flow end-to-end

---

## Need Help?
1. Check `PAYMENT_SETUP.md` for full documentation
2. Review component source code for implementation details
3. Test in development first before deploying
4. Check browser console for errors
