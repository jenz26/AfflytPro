# Automation Studio - Design Guidelines V2.0 (Premium Edition)

**Date:** 2025-11-21  
**Status:** Final  
**Level:** Premium - All'altezza della Dashboard

---

## 🎨 Design System Analysis

### Existing Dashboard Components

**GlassCard**:
```tsx
- Background: bg-afflyt-glass-white backdrop-blur-2xl
- Border: border-afflyt-glass-border
- Shadow: shadow-[0_8px_32px_rgba(0,229,224,0.08)]
- Gradient overlay: before:bg-gradient-to-br before:from-afflyt-cyan-500/5
- Hover: shadow-[0_8px_40px_rgba(0,229,224,0.12)]
- Glow effect: bg-afflyt-cyan-500/20 blur-3xl
```

**KPIWidget**:
```tsx
- Icon container: w-10 h-10 rounded-lg con background colorato
- Title: text-sm font-medium text-gray-300
- Main value: text-2xl font-bold text-white font-mono
- Sub value: text-lg font-medium text-gray-300 font-mono
- Progress bar: h-2 bg-afflyt-dark-50 rounded-full
- Glow effect: w-32 h-32 blur-3xl opacity-20
```

**Color Palette**:
```tsx
- Cyan: afflyt-cyan-400, afflyt-cyan-500
- Plasma: afflyt-plasma-400, afflyt-plasma-500
- Profit: afflyt-profit-400, afflyt-profit-500
- Warning: yellow-400, yellow-500
- Background: afflyt-dark-100, afflyt-dark-50
- Glass border: afflyt-glass-border
```

---

## 🎯 Automation Studio - Premium Design Specs

### Page Header

```tsx
<div className="border-b border-afflyt-glass-border bg-afflyt-dark-50/50 backdrop-blur-xl">
  <div className="px-8 py-6">
    <div className="flex items-center justify-between">
      {/* Left: Title + Icon */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-cyan-600 rounded-lg flex items-center justify-center">
            <Bot className="w-6 h-6 text-afflyt-dark-100" />
          </div>
          Automation Studio
        </h1>
        <p className="text-gray-400 mt-1">
          Cyber Intelligence Deal Publishing
        </p>
      </div>

      {/* Right: Stats + CTA */}
      <div className="flex items-center gap-4">
        {/* Governance Badge */}
        <GlassCard className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-afflyt-cyan-400" />
            <div>
              <p className="text-xs text-gray-500 uppercase">Active Rules</p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white font-mono">7/10</span>
                <span className="text-xs text-afflyt-cyan-400">Slots</span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* System Status */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-afflyt-profit-400 rounded-full animate-pulse" />
          <span className="text-sm text-afflyt-profit-400">Sistema Attivo</span>
        </div>

        {/* CTA Button */}
        <CyberButton variant="primary" size="lg">
          <Plus className="w-5 h-5 mr-2" />
          Create Rule
        </CyberButton>
      </div>
    </div>
  </div>
</div>
```

---

### Rule Card (Premium Version)

```tsx
<GlassCard className="p-6 relative overflow-hidden group hover:border-afflyt-cyan-500/40 transition-all">
  {/* Background Glow Effect */}
  <div className={`absolute -top-10 -right-10 w-32 h-32 ${
    rule.isActive 
      ? 'bg-afflyt-cyan-500/20' 
      : 'bg-gray-500/10'
  } rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity`} />

  {/* Content */}
  <div className="relative z-10">
    {/* Header */}
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          rule.isActive 
            ? 'bg-afflyt-cyan-500/10 text-afflyt-cyan-400' 
            : 'bg-gray-500/10 text-gray-400'
        }`}>
          <Sparkles className="w-5 h-5" />
        </div>
        
        {/* Title */}
        <div>
          <h3 className="text-lg font-bold text-white">{rule.name}</h3>
          {rule.description && (
            <p className="text-xs text-gray-500 mt-0.5">{rule.description}</p>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
        rule.isActive 
          ? 'bg-afflyt-profit-500/20 text-afflyt-profit-400 animate-pulse' 
          : 'bg-gray-600/20 text-gray-400'
      }`}>
        {rule.isActive ? '● LIVE' : '○ PAUSED'}
      </div>
    </div>

    {/* Categories */}
    <div className="flex flex-wrap gap-2 mb-4">
      {categories.map((cat, idx) => (
        <span
          key={idx}
          className="px-3 py-1 bg-afflyt-dark-50 border border-afflyt-glass-border text-afflyt-cyan-400 text-xs rounded-full"
        >
          {cat}
        </span>
      ))}
    </div>

    {/* Score Progress */}
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 uppercase">Min Deal Score</span>
        <span className="text-sm font-bold text-white font-mono">{rule.minScore}/100</span>
      </div>
      <div className="h-2 bg-afflyt-dark-50 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${
            rule.minScore >= 80 
              ? 'from-afflyt-profit-500 to-afflyt-profit-400' 
              : rule.minScore >= 60 
                ? 'from-yellow-500 to-yellow-400' 
                : 'from-red-500 to-red-400'
          }`}
          style={{ width: `${rule.minScore}%` }}
        />
      </div>
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-2 gap-3 mb-4">
      <div className="bg-afflyt-dark-50 rounded-lg p-3">
        <p className="text-xs text-gray-500 uppercase mb-1">Total Runs</p>
        <p className="text-xl font-bold text-white font-mono">{rule.totalRuns}</p>
      </div>
      <div className="bg-afflyt-dark-50 rounded-lg p-3">
        <p className="text-xs text-gray-500 uppercase mb-1">Last Run</p>
        <p className="text-sm text-gray-300">{lastRun}</p>
      </div>
    </div>

    {/* Channel Info */}
    {rule.channel && (
      <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
        <Send className="w-4 h-4" />
        <span>Publishing to: <span className="text-afflyt-cyan-400">{rule.channel.name}</span></span>
      </div>
    )}

    {/* Actions */}
    <div className="flex gap-2">
      <CyberButton variant="primary" size="sm" className="flex-1">
        <Play className="w-4 h-4 mr-1" />
        Run Now
      </CyberButton>
      <CyberButton variant="secondary" size="sm">
        {rule.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </CyberButton>
      <CyberButton variant="secondary" size="sm">
        <Edit className="w-4 h-4" />
      </CyberButton>
      <CyberButton variant="danger" size="sm">
        <Trash2 className="w-4 h-4" />
      </CyberButton>
    </div>
  </div>
</GlassCard>
```

---

### Empty State (Premium)

```tsx
<div className="text-center py-20">
  {/* Animated Icon */}
  <div className="relative inline-block mb-6">
    <div className="absolute inset-0 bg-afflyt-cyan-500/20 blur-3xl animate-pulse" />
    <div className="relative w-24 h-24 bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-cyan-600 rounded-2xl flex items-center justify-center">
      <Bot className="w-12 h-12 text-afflyt-dark-100" />
    </div>
  </div>

  {/* Text */}
  <h2 className="text-2xl font-bold text-white mb-2">
    No Automation Rules Yet
  </h2>
  <p className="text-gray-400 mb-8 max-w-md mx-auto">
    Create your first intelligent agent to automatically find and publish deals to your channels
  </p>

  {/* CTA */}
  <CyberButton variant="primary" size="lg">
    <Sparkles className="w-5 h-5 mr-2" />
    Create First Rule
  </CyberButton>

  {/* Quick Stats */}
  <div className="mt-12 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
    <div>
      <div className="text-3xl font-bold text-afflyt-cyan-400 font-mono mb-1">10</div>
      <div className="text-sm text-gray-500">Max Rules</div>
    </div>
    <div>
      <div className="text-3xl font-bold text-afflyt-plasma-400 font-mono mb-1">24/7</div>
      <div className="text-sm text-gray-500">Auto Execution</div>
    </div>
    <div>
      <div className="text-3xl font-bold text-afflyt-profit-400 font-mono mb-1">∞</div>
      <div className="text-sm text-gray-500">Deals Published</div>
    </div>
  </div>
</div>
```

---

### Creation Wizard (Premium Modal)

```tsx
<div className="fixed inset-0 bg-afflyt-dark-100/95 backdrop-blur-xl flex items-center justify-center z-50 p-4">
  <GlassCard className="max-w-3xl w-full max-h-[90vh] overflow-hidden">
    {/* Header */}
    <div className="border-b border-afflyt-glass-border bg-afflyt-dark-50/50 backdrop-blur-xl p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-cyan-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-afflyt-dark-100" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Create Automation Rule</h2>
            <p className="text-sm text-gray-400">Configure your intelligent agent</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mt-6">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex-1">
            <div className={`h-1 rounded-full ${
              s <= step 
                ? 'bg-gradient-to-r from-afflyt-cyan-500 to-afflyt-cyan-400' 
                : 'bg-afflyt-dark-50'
            }`} />
            <p className={`text-xs mt-2 ${
              s === step ? 'text-afflyt-cyan-400 font-bold' : 'text-gray-500'
            }`}>
              {['Basic', 'Target', 'Action', 'Review'][s-1]}
            </p>
          </div>
        ))}
      </div>
    </div>

    {/* Content */}
    <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
      {/* Step content here */}
    </div>

    {/* Footer */}
    <div className="border-t border-afflyt-glass-border bg-afflyt-dark-50/50 backdrop-blur-xl p-6">
      <div className="flex justify-between">
        {step > 1 && (
          <CyberButton variant="secondary">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </CyberButton>
        )}
        {step < 4 ? (
          <CyberButton variant="primary" className="ml-auto">
            Next Step
            <ChevronRight className="w-4 h-4 ml-1" />
          </CyberButton>
        ) : (
          <CyberButton variant="primary" className="ml-auto">
            <Sparkles className="w-4 h-4 mr-2" />
            Create Rule
          </CyberButton>
        )}
      </div>
    </div>
  </GlassCard>
</div>
```

---

## 🎨 Component Specifications

### Input Fields

```tsx
// Text Input
<div>
  <label className="block text-sm font-medium text-gray-300 mb-2">
    Rule Name
  </label>
  <input
    type="text"
    className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white placeholder-gray-500 focus:border-afflyt-cyan-500 focus:ring-2 focus:ring-afflyt-cyan-500/20 transition-all"
    placeholder="Hot Deals Electronics"
  />
</div>

// Slider
<div>
  <label className="block text-sm font-medium text-gray-300 mb-2">
    Minimum Deal Score: <span className="text-afflyt-cyan-400 font-mono">{value}/100</span>
  </label>
  <input
    type="range"
    min="0"
    max="100"
    className="w-full h-2 bg-afflyt-dark-50 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-afflyt-cyan-500 [&::-webkit-slider-thumb]:to-afflyt-cyan-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
  />
</div>

// Select
<div>
  <label className="block text-sm font-medium text-gray-300 mb-2">
    Channel
  </label>
  <select className="w-full px-4 py-3 bg-afflyt-dark-50 border border-afflyt-glass-border rounded-lg text-white focus:border-afflyt-cyan-500 focus:ring-2 focus:ring-afflyt-cyan-500/20 transition-all">
    <option>Select channel...</option>
  </select>
</div>
```

---

### Execution Results Modal

```tsx
<div className="fixed inset-0 bg-afflyt-dark-100/95 backdrop-blur-xl flex items-center justify-center z-50 p-4">
  <GlassCard className="max-w-2xl w-full">
    {/* Header */}
    <div className="border-b border-afflyt-glass-border bg-afflyt-dark-50/50 backdrop-blur-xl p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-afflyt-profit-400 to-afflyt-profit-600 rounded-lg flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-afflyt-dark-100" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Execution Complete</h2>
          <p className="text-sm text-gray-400">Rule: {ruleName}</p>
        </div>
      </div>
    </div>

    {/* Steps */}
    <div className="p-6 space-y-3">
      {steps.map((step, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <div className="w-8 h-8 bg-afflyt-profit-500/20 text-afflyt-profit-400 rounded-full flex items-center justify-center">
            <Check className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-white font-medium">{step.name}</p>
            <p className="text-xs text-gray-500">{step.detail}</p>
          </div>
        </div>
      ))}
    </div>

    {/* Stats */}
    <div className="border-t border-afflyt-glass-border bg-afflyt-dark-50/50 p-6">
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-white font-mono">{stats.processed}</p>
          <p className="text-xs text-gray-500 uppercase">Processed</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-afflyt-profit-400 font-mono">{stats.published}</p>
          <p className="text-xs text-gray-500 uppercase">Published</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-afflyt-cyan-400 font-mono">{stats.time}ms</p>
          <p className="text-xs text-gray-500 uppercase">Time</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-400 font-mono">{stats.errors}</p>
          <p className="text-xs text-gray-500 uppercase">Errors</p>
        </div>
      </div>
    </div>

    {/* Actions */}
    <div className="border-t border-afflyt-glass-border p-6">
      <div className="flex gap-3">
        <CyberButton variant="secondary" className="flex-1">
          Close
        </CyberButton>
        <CyberButton variant="primary" className="flex-1">
          View Published Deals
        </CyberButton>
      </div>
    </div>
  </GlassCard>
</div>
```

---

## 🎯 Key Design Principles

1. **Glassmorphism Everywhere**: Usa sempre `GlassCard` per contenitori
2. **Gradient Icons**: Icone con gradient `from-afflyt-cyan-400 to-afflyt-cyan-600`
3. **Glow Effects**: Blur effects con `blur-3xl opacity-20`
4. **Font Mono**: Numeri sempre in `font-mono`
5. **Uppercase Labels**: Labels piccole in `uppercase text-xs`
6. **Smooth Transitions**: `transition-all duration-300`
7. **Status Colors**: Usa palette esistente (cyan, profit, warning)
8. **Backdrop Blur**: Headers con `backdrop-blur-xl`

---

**Status**: Ready for premium implementation! 💎
