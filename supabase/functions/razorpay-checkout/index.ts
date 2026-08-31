import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const planCatalog: Record<string, { name: string; price: number; durationMonths: number }> = {
  basic: { name: 'Basic', price: 149, durationMonths: 1 },
  premium: { name: 'Premium', price: 269, durationMonths: 2 },
  pro: { name: 'Pro', price: 399, durationMonths: 3 },
  premium_monthly: { name: 'Premium Monthly', price: 149, durationMonths: 1 },
  premium_3_month: { name: 'Premium 3 Months', price: 399, durationMonths: 3 },
};

const recruiterPlanPrices: Record<number, number> = { 1: 999, 3: 2499, 6: 4499, 12: 7999 };

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const verifySignature = async (orderId: string, paymentId: string, signature: string, secret: string): Promise<boolean> => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${orderId}|${paymentId}`));
  const expected = Array.from(new Uint8Array(signed)).map((value) => value.toString(16).padStart(2, '0')).join('');
  return expected === signature;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!razorpayKeyId || !razorpayKeySecret || !serviceKey) return response({ error: 'Payments are not configured yet. Please contact support.' }, 503);

    const authHeader = request.headers.get('Authorization') || '';
    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || '', { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return response({ error: 'Please sign in before making a payment.' }, 401);

    const body = await request.json();
    const requestedPlan = body.plan || {};
    const plan = String(requestedPlan.id || '') === 'actro_recruiter_pro'
      ? {
        name: 'Actro Recruiter Pro',
        price: recruiterPlanPrices[Number(requestedPlan.durationMonths)],
        durationMonths: Number(requestedPlan.durationMonths),
      }
      : planCatalog[String(requestedPlan.id || '')];
    if (!plan || !plan.price || !plan.durationMonths) return response({ error: 'Selected plan is unavailable.' }, 400);
    const amount = Math.round((plan.price + Math.round(plan.price * 0.02)) * 1.18);

    if (body.action === 'create-order') {
      const authorization = `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`;
      const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: { Authorization: authorization, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amount * 100, currency: 'INR', receipt: `actro_${user.id.slice(0, 12)}_${Date.now()}` }),
      });
      if (!razorpayResponse.ok) return response({ error: 'Unable to create Razorpay order.' }, 502);
      const order = await razorpayResponse.json();
      return response({ keyId: razorpayKeyId, orderId: order.id, amount: order.amount, currency: order.currency });
    }

    if (body.action === 'verify-payment') {
      const valid = await verifySignature(String(body.razorpay_order_id || ''), String(body.razorpay_payment_id || ''), String(body.razorpay_signature || ''), razorpayKeySecret);
      if (!valid) return response({ error: 'Payment signature verification failed.' }, 400);

      const admin = createClient(supabaseUrl, serviceKey);
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + plan.durationMonths);
      const { error: expireError } = await admin.from('subscriptions').update({ status: 'expired' }).eq('user_id', user.id).eq('status', 'active');
      if (expireError) throw expireError;
      const { data: subscription, error: subscriptionError } = await admin.from('subscriptions').insert({ user_id: user.id, plan: body.plan.id, status: 'active', start_date: new Date().toISOString(), end_date: expiry.toISOString(), amount }).select().single();
      if (subscriptionError) throw subscriptionError;
      const { data: payment, error: paymentError } = await admin.from('payments').insert({ user_id: user.id, subscription_id: subscription.id, amount, currency: 'INR', status: 'completed', method: 'razorpay', transaction_id: body.razorpay_payment_id }).select().single();
      if (paymentError) throw paymentError;
      return response(payment);
    }
    return response({ error: 'Unsupported checkout action.' }, 400);
  } catch (error) {
    console.error(error);
    return response({ error: 'Payment processing failed. Please try again.' }, 500);
  }
});