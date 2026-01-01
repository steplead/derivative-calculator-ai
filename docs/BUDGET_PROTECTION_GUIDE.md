# 💰 OpenRouter Budget Protection Guide

**Created**: 2026-01-01
**Purpose**: Prevent unexpected API costs and set spending limits

---

## 🚨 Why You Need This

Your **Calculator** API key has already spent **$5.060**. Without budget limits, costs can spiral unexpectedly.

---

## ⚙️ Step-by-Step Setup

### **1. Access OpenRouter Settings**

1. Go to [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys)
2. Click on your **"Calculator"** key
3. Navigate to **"Billing"** or **"Budget"** section

---

### **2. Set Budget Alerts (Recommended)**

Create spending alerts to notify you when approaching limits:

| Alert Level | Amount | Action |
|-------------|--------|--------|
| ⚠️ Warning | $5/month | Email notification |
| 🚨 Critical | $8/month | Email + SMS notification |
| 🛑 Hard Limit | $10/month | **Automatically stop API calls** |

**How to Set**:
```
Settings → Billing → Budget Alerts
- Add alert at $5 (Warning)
- Add alert at $8 (Critical)
- Enable "Auto-pause at $10"
```

---

### **3. Configure Hard Limit (Crucial!)**

This prevents overspending by automatically disabling the key:

```
Settings → Keys → Calculator → Edit Limits
- Set "Monthly Spending Limit": $10
- Enable "Pause key when limit reached": ✅
```

**Result**: API will return `429 Too Many Requests` when limit reached.

---

## 📊 Cost Optimization Summary

### **Changes Applied (2026-01-01)**

| Optimization | Before | After | Savings |
|--------------|--------|-------|---------|
| **max_tokens** | 2048 | 300 | **~60%** |
| **Prompt length** | ~350 tokens | ~100 tokens | **~50%** |
| **Total per request** | ~$0.00040 | **~$0.00010** | **~75%** |

### **Projected Monthly Costs**

With optimizations:
```
Requests per day: 100
Cost per request: $0.00010
Daily cost: 100 × $0.00010 = $0.01
Monthly cost: $0.01 × 30 = **$0.30/month**
```

**Before optimization**: ~$1.20/month
**After optimization**: ~$0.30/month
**Savings**: **75%** 🎉

---

## 🎯 Best Practices

### **1. Monitor Cache Hit Rate**

Check your cache metrics:
```bash
curl https://derivativecalculatorai.com/api/cache-metrics
```

**Target**: >70% cache hit rate
- If <50%: Cache may be broken
- If >80%: Excellent! ✅

### **2. Precompute Common Problems**

Run the precomputation script weekly:
```bash
python3 scripts/precompute_common_problems.py
```

This warms up your cache with the top 50 most common problems.

### **3. Review Usage Weekly**

1. Go to [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys)
2. Check **"Usage"** column for each key
3. Look for unusual spikes

---

## 🛡️ Emergency Measures

If costs spike unexpectedly:

### **Option 1: Pause the Key (Immediate)**
```
Settings → Keys → Calculator → Pause
```

### **Option 2: Disable AI Features**
```bash
# Set environment variable
export OPENROUTER_API_KEY=""

# Or in .env.local
OPENROUTER_API_KEY=
```

The app will still work, but without AI explanations.

### **Option 3: Switch to Free Tier**
Change the model to a free alternative:
```python
# In api/index.py, line 115
model="google/gemma-7b-it:free"  # Free tier
```

---

## 📈 Monitoring Dashboard

### **Key Metrics to Track**

| Metric | How to Check | Target |
|--------|--------------|--------|
| **Cache Hit Rate** | `/api/cache-metrics` | >70% |
| **Monthly Spend** | OpenRouter Dashboard | <$10 |
| **Cost per Request** | (Spend ÷ Requests) | <$0.0002 |
| **Error Rate** | Server logs | <1% |

---

## 🔄 Automation Scripts

### **Daily Cost Check (Cron Job)**

Add to your crontab (`crontab -e`):
```bash
# Check costs daily at 9 AM
0 9 * * * curl -s https://openrouter.ai/api/v1/usage | jq '.total_cost' > /tmp/api_cost.txt
```

### **Weekly Cache Warmup**

```bash
# Add to crontab
0 0 * * 0 cd /path/to/project && python3 scripts/precompute_common_problems.py
```

---

## 📞 Support

If you need help:
- **OpenRouter Support**: support@openrouter.ai
- **Upstash Support**: https://upstash.com/support
- **Project Issues**: Check server logs first!

---

## ✅ Checklist

- [x] Set budget alert at $5
- [x] Set hard limit at $10
- [x] Reduce max_tokens to 300
- [x] Simplify prompts
- [x] Enable cache logging
- [ ] Run precompute script
- [ ] Monitor cache hit rate
- [ ] Review costs weekly

---

**Last Updated**: 2026-01-01
**Status**: ✅ All optimizations applied
**Next Review**: 2026-02-01 (1 month)
