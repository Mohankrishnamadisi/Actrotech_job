# Candidate Subscription Refactoring - Implementation Plan

## Executive Summary

Restructure candidate subscription from 3-plan model (Basic/Premium/Pro) to 2-plan identical-feature model:
- **Premium Monthly**: ₹149 + 18% GST = ₹175.82
- **Premium 3 Months**: ₹399 + 18% GST = ₹470.82 (Save ₹48)

Both plans unlock identical ACTRO PREMIUM entitlements. Legacy premium/pro remain active until expiry.

---

## Phase 1: Type Definitions & Constants

### 1.1 Update Candidate Subscription Types
**File**: `src/types/index.ts`

Current:
```typescript
type CandidatePlanType = 'basic' | 'premium' | 'pro' | 'enterprise';
```

New:
```typescript
type CandidatePlanType = 'premium_monthly' | 'premium_3_month' | 'free' | 'basic' | 'premium' | 'pro'; // legacy compat
type CandidateEntitlement = 'free' | 'premium';
```

### 1.2 Create Plan Constants
**New File**: `src/constants/candidatePlans.ts`

```typescript
export const CANDIDATE_PAID_PLANS = {
  PREMIUM_MONTHLY: 'premium_monthly',
  PREMIUM_3_MONTH: 'premium_3_month',
} as const;

export const CANDIDATE_PLAN_CONFIG = {
  premium_monthly: {
    name: 'Actro Premium',
    duration: 1, // months
    basePriceInr: 149,
    gstPercent: 18,
    durationLabel: 'Monthly',
  },
  premium_3_month: {
    name: 'Actro Premium',
    duration: 3, // months
    basePriceInr: 399,
    gstPercent: 18,
    durationLabel: '3 Months',
    savingsInr: 48, // ₹149*3 - ₹399 = ₹48
  },
};

export const LEGACY_PREMIUM_PLANS = ['basic', 'premium', 'pro', 'enterprise'];
```

---

## Phase 2: Entitlement Helper

### 2.1 Create Central Entitlement Helper
**New File**: `src/utils/candidateSubscriptionHelpers.ts`

```typescript
export function isCandidatePremium(plan: string | null | undefined): boolean {
  if (!plan) return false;
  
  const normalizedPlan = String(plan).toLowerCase().trim();
  
  // New plans
  if (['premium_monthly', 'premium_3_month'].includes(normalizedPlan)) {
    return true;
  }
  
  // Legacy plans (during migration period)
  if (['premium', 'pro', 'enterprise'].includes(normalizedPlan)) {
    return true;
  }
  
  return false;
}

export function getCandidateEntitlement(plan: string | null | undefined): 'free' | 'premium' {
  return isCandidatePremium(plan) ? 'premium' : 'free';
}

export function isPremiumMonthlyPlan(plan: string | null | undefined): boolean {
  return String(plan).toLowerCase().trim() === 'premium_monthly';
}

export function isPremium3MonthPlan(plan: string | null | undefined): boolean {
  return String(plan).toLowerCase().trim() === 'premium_3_month';
}

export function calculateCandidateGrossPrice(basePriceInr: number, gstPercent: number = 18): number {
  return basePriceInr + (basePriceInr * gstPercent / 100);
}

export function formatCandidatePrice(priceInr: number): string {
  return `₹${priceInr.toFixed(2)}`;
}
```

---

## Phase 3: Payment & Subscription Creation

### 3.1 Update Payment Service
**File**: `src/services/billingSubscription.ts` (existing)

Changes:
- Update `createCandidateSubscription()` to accept new plan IDs
- Calculate price as: `basePriceInr + (basePriceInr * 0.18)` (no extra gateway fee)
- Set `duration_months` based on plan:
  - premium_monthly: 1
  - premium_3_month: 3
- Calculate `end_date` as: `start_date + duration_months months`

### 3.2 Update Razorpay Integration
**File**: `src/services/billingSubscription.ts`

- Pass gross price (base + GST) to Razorpay
- Remove 2% gateway fee calculation from candidate pricing
- Keep invoice/receipt showing: Base + GST = Total

### 3.3 Payment Success Handler
After successful payment:
- Create subscription with correct plan ID
- Set start_date = today
- Set end_date = today + duration_months
- Set status = 'active'
- Update user profile subscription fields

---

## Phase 4: Premium Detection Updates

### 4.1 Replace All Premium Checks

**Search Pattern**: `['premium', 'pro'].includes` OR `plan === 'premium'` OR `isPremium`

**Files to Update**:
1. `src/pages/JobDetails.tsx` - Remote/Hybrid job access + Priority Apply
2. `src/components/JobCard.tsx` - Job mode locking
3. `src/pages/Jobs.tsx` - Job filtering/access
4. `src/services/jobMatchNotificationDelivery.ts` - Instant notification logic
5. `src/services/aiCareerHub.ts` - AI permission checks
6. `src/services/aiDailyCareerBrief.ts` - Career brief access
7. `src/pages/dashboard/PremiumDashboard.tsx` - Dashboard access
8. `src/components/recruiter/RecruiterActivity.tsx` - Activity insights (if candidate-side)
9. `src/pages/MockInterview.tsx` (if exists) - Mock interview access
10. `src/pages/ResumeReview.tsx` (if exists) - Resume review access
11. `src/components/RemoteJobHub.tsx` - Remote hub access
12. Any component checking `subscription.plan`

**Replacement Pattern**:
```typescript
// OLD
if (['premium', 'pro'].includes(userSubscription?.plan)) {
  // premium logic
}

// NEW
if (isCandidatePremium(userSubscription?.plan)) {
  // premium logic (works for new + legacy plans)
}
```

---

## Phase 5: Job Match Notification Logic

### 5.1 Update Notification Delivery
**File**: `src/services/jobMatchNotificationDelivery.ts`

Current: Premium gets scheduled_for=NULL, free gets +4h delay

Change:
```typescript
const isCandidatePremiumUser = isCandidatePremium(candidate.subscription.plan);
const isPremiumExpired = isSubscriptionExpired(candidate.subscription.end_date);

const shouldSendImmediate = isCandidatePremiumUser && !isPremiumExpired;

notification.scheduled_for = shouldSendImmediate 
  ? null  // send immediately
  : new Date(Date.now() + 4 * 60 * 60 * 1000); // +4 hours
```

### 5.2 Update Supabase Edge Function
**File**: Supabase Edge Function (if exists)

Update premium detection in scheduled notification delivery:
- Use `isCandidatePremium()` helper
- Check subscription expiry

---

## Phase 6: AI Services

### 6.1 AI Career Hub Permissions
**File**: `src/services/aiCareerHub.ts`

Update premium access checks to use `isCandidatePremium()`.

Free: 20 requests/day
Premium: unlimited

### 6.2 AI Daily Career Brief
**File**: `src/services/aiDailyCareerBrief.ts`

Update premium access detection.

---

## Phase 7: Route Protection

### 7.1 Protected Routes
**File**: Route configuration / guards

Premium-only routes:
- /dashboard/premium
- /ai-career-hub
- /remote-hub
- /premium-intelligence
- /mock-interviews
- /resume-review
- Any other premium-only page

Guard logic:
```typescript
if (!isCandidatePremium(user.subscription.plan)) {
  if (!isSubscriptionExpired(user.subscription.end_date)) {
    return <UpgradePrompt />;
  }
}
```

---

## Phase 8: Pricing Page Redesign

### 8.1 Update Pricing Component
**File**: `src/pages/Pricing.tsx`

Remove:
- Basic paid card
- Premium 2-month card
- Pro 3-month card

Add:
- Actro Premium Monthly card (₹149 + GST)
- Actro Premium 3 Months card (₹399 + GST) with "SAVE ₹48" badge

Features MUST be identical.

Format:
```
Card 1:
Title: Actro Premium
Price: ₹149
Suffix: + GST
Duration: per month
Button: Get Premium

Card 2:
Title: Actro Premium
Price: ₹399
Suffix: + GST
Duration: for 3 months
Badge: SAVE ₹48
Note: ₹447 → ₹399
Button: Get 3 Months
```

### 8.2 Feature List
Include all 25+ premium features once (same on both cards)

### 8.3 Free vs Premium Comparison
Optional: Add one simple comparison showing Free vs Premium (not Monthly vs 3-month).

---

## Phase 9: UI Updates

### 9.1 Premium Lock States
For free users accessing premium features:
- Keep navigation visible
- Show professional lock icon
- Display upgrade prompt: "Unlock with Actro Premium"
- Link to pricing

Example:
```
🔒 AI Resume Review
Available with Actro Premium

[Unlock Premium] [Maybe Later]
```

### 9.2 Premium Dashboard Label
Update label from "Premium Dashboard" to "Actro Premium Dashboard"

Optional: Show billing duration if needed:
"Actro Premium • Monthly" or "Actro Premium • 3 Months"

---

## Phase 10: Database Migration (if needed)

### 10.1 Migration Strategy
**Important**: Do NOT delete existing subscriptions.

Option A: No schema change required if:
- `plan` column is TEXT/VARCHAR (flexible)
- Subscription records can coexist with old + new plan IDs

Option B: If stricter validation needed:
```sql
ALTER TABLE subscriptions 
  DROP CONSTRAINT IF EXISTS valid_plan_check;

ALTER TABLE subscriptions
  ADD CONSTRAINT valid_plan_check 
  CHECK (plan IN (
    'premium_monthly', 'premium_3_month',
    'basic', 'premium', 'pro', 'enterprise', 'free'
  ));
```

### 10.2 Data Migration (optional cleanup)
- Keep legacy subscriptions as-is
- New subscriptions use new plan IDs
- No need to migrate historical data

---

## Phase 11: Testing Checklist

See end of user request for complete 61-point testing checklist.

Key items:
- [ ] Free candidate sees premium lock
- [ ] Monthly plan works end-to-end
- [ ] 3-month plan works end-to-end
- [ ] Both plans identical features
- [ ] Pricing shows correct GST
- [ ] Instant notifications for premium
- [ ] 4h delay for free
- [ ] Premium access after purchase
- [ ] Access removed after expiry
- [ ] Legacy subs still work
- [ ] No recruiter functionality broken

---

## Phase 12: Regression Prevention

### DO NOT CHANGE:
- Recruiter subscriptions
- Recruiter credits
- Resume unlock credits
- Payment processing (Razorpay core)
- Authentication
- Messaging
- ATS Pipeline
- Basic candidate features

---

## Implementation Order

1. ✅ Analyze architecture (DONE via subagent)
2. ⏳ Update type definitions
3. ⏳ Create entitlement helpers
4. ⏳ Update payment flow
5. ⏳ Update premium detection (replace all checks)
6. ⏳ Update notification delivery
7. ⏳ Update AI services
8. ⏳ Update route protection
9. ⏳ Redesign pricing page
10. ⏳ Update premium locks/UI
11. ⏳ Database migration (if needed)
12. ⏳ Testing & validation

---

## Files to Modify (Complete List)

### New Files:
- `src/constants/candidatePlans.ts` - Plan definitions
- `src/utils/candidateSubscriptionHelpers.ts` - Entitlement helpers

### Existing Files (Premium Detection):
1. `src/pages/JobDetails.tsx`
2. `src/components/JobCard.tsx`
3. `src/pages/Jobs.tsx`
4. `src/services/jobMatchNotificationDelivery.ts`
5. `src/services/aiCareerHub.ts`
6. `src/services/aiDailyCareerBrief.ts`
7. `src/pages/dashboard/PremiumDashboard.tsx`
8. `src/pages/Pricing.tsx`
9. `src/services/billingSubscription.ts`
10. Type definitions in `src/types/index.ts`

### Conditional (Need to Search):
- Mock Interview components
- Resume Review components
- Premium Lock/Gate UI components
- Any other premium feature checks

---

## Key Business Rules

1. ✅ Premium Monthly: ₹149 + 18% GST = ₹175.82
2. ✅ Premium 3 Months: ₹399 + 18% GST = ₹470.82
3. ✅ 3-Month savings: ₹48 (show clearly)
4. ✅ No feature difference between plans
5. ✅ Legacy premium/pro remain active until expiry
6. ✅ Instant job notifications for both paid plans
7. ✅ Free candidates get 4-hour notification delay
8. ✅ Both plans unlock same Premium Dashboard
9. ✅ Expired premium reverts to free tier

---

## Risk Mitigation

- Use central entitlement helper (no scattered checks)
- Keep legacy plan values in types (backward compatibility)
- Don't delete existing subscriptions
- Test payment flow thoroughly
- Test notification timing carefully
- Verify recruiter logic untouched

