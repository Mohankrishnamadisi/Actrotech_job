# Progress Update - Candidate Subscription Restructuring

## ✅ Completed

### Phase 1-2: Type Definitions & Entitlement Helpers
- ✅ Created `src/constants/candidatePlans.ts` - Plan configs & constants
- ✅ Created `src/utils/candidateSubscriptionHelpers.ts` - Central entitlement helpers
- ✅ Updated `src/services/jobMatchService.ts` - `isPremiumCandidate()` now checks expiry
- ✅ Updated `src/services/aiCareerHub.ts` - Uses new helper + checks subscription end_date
- ✅ Updated `src/services/api.ts` - Priority Apply logic uses new helper + checks expiry

### Key Updates Applied:
1. **Central Helper Functions Created**:
   - `isCandidatePremium(plan)` - Detects new + legacy premium plans
   - `isSubscriptionActive(endDate)` - Checks if subscription not expired
   - `getCandidateEntitlement(plan)` - Returns 'free' | 'premium'
   - `canAccessPremiumFeature(plan, endDate)` - Comprehensive access check

2. **Premium Detection Pattern**:
   - ✅ New: Checks `premium_monthly`, `premium_3_month`
   - ✅ Legacy: Still recognizes `premium`, `pro`, `enterprise`
   - ✅ Expiry: Verifies subscription.end_date for active status

3. **Services Updated**:
   - jobMatchService: Premium candidates get instant notifications
   - aiCareerHub: Free users get 20/day limit, premium unlimited
   - api.ts: Priority Apply checks if subscription active + premium

---

## ⏳ Remaining Phases (To Be Completed)

### Phase 3: Payment & Subscription Creation
**Files**: `src/services/billingSubscription.ts`
- Add new plan IDs to payment flow
- Update price calculation: base + 18% GST (no gateway fee on top)
- Set duration_months: 1 for monthly, 3 for 3-month
- Calculate end_date correctly

### Phase 4: More Premium Checks
**Files Requiring Updates**:
1. `src/pages/JobDetails.tsx` - Remote/Hybrid job access
2. `src/pages/Jobs.tsx` - Job filtering
3. `src/components/JobCard.tsx` - Job card display
4. `src/services/jobMatchNotificationDelivery.ts` - Notification scheduling
5. `src/services/recruiterActivity.ts` - Activity insights
6. `src/pages/dashboard/PremiumDashboard.tsx` - Dashboard access
7. Other premium feature checks

### Phase 5: Pricing Page Redesign
**File**: `src/pages/Pricing.tsx`
- Remove Basic/Premium/Pro cards
- Add two identical-feature cards:
  - ₹149 + GST (Monthly)
  - ₹399 + GST (3 Months) with "SAVE ₹48" badge
- Update feature matrix
- Keep Free vs Premium comparison

### Phase 6: Type Updates
**File**: `src/types/index.ts`
- Update `subscriptionPlan` type to include new plan IDs
- Keep legacy values for backward compatibility

### Phase 7: Database/Migrations
- Verify subscription table accepts new plan IDs
- No data migration needed (legacy subs remain as-is)
- New subscriptions use new plan IDs

### Phase 8: UI & Route Protection
- Update premium lock UI
- Protect premium-only routes
- Handle expiry states

---

## 🔍 Files to Review for Premium Checks

Existing code locations requiring similar updates:

```
src/pages/JobDetails.tsx
  - Line: Remote/Hybrid job locking
  - Pattern: Check plan for job mode access

src/pages/Jobs.tsx
  - Pattern: Job filtering logic

src/components/JobCard.tsx
  - Pattern: Display premium lock on remote jobs

src/services/jobMatchNotificationDelivery.ts
  - CRITICAL: Immediate vs delayed notification logic
  - Pattern: isPremium boolean flag

src/services/recruiterActivity.ts
  - Pattern: Premium-only insights

src/pages/dashboard/PremiumDashboard.tsx
  - Pattern: Access control to dashboard
```

---

## 🎯 Next Immediate Action

The highest priority remaining task is **Phase 3 & 5** together:

1. **Pricing Page** - User should see two cards with:
   - ₹149 + GST monthly
   - ₹399 + GST / 3 months with save badge
   - Same features on both

2. **Payment Flow** - When user clicks "Get Premium":
   - Charge correct gross amount
   - Create subscription with correct plan ID
   - Set correct duration

Without these, users cannot actually purchase the new plans.

---

## ⚠️ Important Notes

1. **Legacy Compatibility**: Existing `premium` and `pro` subscriptions continue to work
2. **No Feature Difference**: Both new plans have identical features
3. **Notification Timing**: Both premium plans get instant notifications
4. **GST Calculation**: Base + 18% GST (not gateway fee on top)
5. **Recruiter Plans**: Remain unchanged - only candidate subscription changes

---

## 📋 Testing Checklist (In Progress)

**Free Candidate**:
- [ ] Cannot access remote jobs
- [ ] Cannot access premium tools
- [ ] Gets delayed job notifications
- [ ] Free AI limit enforced

**Premium Monthly** (After Payment Flow Fixed):
- [ ] Can purchase for ₹175.82 (₹149 + 18% GST)
- [ ] Subscription active for 1 month
- [ ] Can access all premium features
- [ ] Gets instant job notifications
- [ ] Access expires after 1 month

**Premium 3-Month** (After Payment Flow Fixed):
- [ ] Can purchase for ₹470.82 (₹399 + 18% GST)
- [ ] Subscription active for 3 months
- [ ] SAME features as monthly
- [ ] Gets instant job notifications
- [ ] Access expires after 3 months

---

## Current Status Summary

**Architectural Changes**: 90% Complete
- ✅ Plan definitions created
- ✅ Entitlement helpers created
- ✅ Key services updated to use helpers
- ✅ Legacy compatibility ensured

**Implementation**: 40% Complete
- ✅ Core backend entitlement logic
- ⏳ Payment flow (Razorpay integration)
- ⏳ Pricing UI
- ⏳ All premium access points

**Testing**: Not Started
- ⏳ End-to-end payment flow
- ⏳ Feature access verification
- ⏳ Notification timing

---

## Recommendation

Continue with **Phase 3 (Payment Flow)** and **Phase 5 (Pricing UI)** in parallel, as users need to actually be able to purchase before testing other features.

