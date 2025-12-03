Onboarding Flow di Afflyt Pro
L'onboarding è un wizard multi-step che guida l'utente dalla registrazione fino alla prima automazione attiva.
Architettura
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  localStorage   │────▶│   React State   │────▶│   Database      │
│  (resume/skip)  │     │   (UI flow)     │     │   (permanente)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
Step 1: Welcome Survey (WelcomeFlow.tsx)
6 substep con auto-advance dopo selezione (800ms):
Substep	Domanda	Opzioni
0	Welcome Screen	"Usa impostazioni consigliate" (quick start)
1	Goal principale	sales / audience / monetize
2	Dimensione audience	starting (0-100) / small (100-1K) / medium (1K-10K) / large (10K+)
3	Livello esperienza	beginner / intermediate / advanced
4	Amazon Associates?	Sì/No (se No → mostra guida setup)
5	Canali da configurare	Telegram / Email / Discord (coming soon)
Calcolo Persona Type:
MONETIZER  → goal=monetize AND audience≠starting
POWER_USER → experience=advanced AND hasAmazonAssociates=true
CREATOR    → experience=intermediate AND (audience=small OR medium)
BEGINNER   → default
API chiamata: PATCH /auth/persona
{
  "experienceLevel": "beginner",
  "audienceSize": "starting", 
  "primaryGoal": "sales",
  "preferredChannels": ["telegram"],
  "hasAmazonAssociates": false
}
Step 2: Channel Setup (condizionale)
Il flow si ramifica in base ai canali selezionati:
Telegram Setup (TelegramSetup.tsx)
Substep	Azione	API
1	Inserisci Bot Token	POST /validate/telegram-token
2	Inserisci Channel ID	POST /validate/telegram-channel
3	Test messaggio	POST /validate/telegram-test
Al completamento:
Crea credenziale: POST /user/credentials (salva token criptato)
Crea canale: POST /user/channels (collega credenziale al canale)
Email Setup (EmailSetup.tsx)
Selezione provider: SendGrid o Resend
Validazione API key: POST /validate/email-key
Configurazione sender email/name
Step 3: First Automation (FirstAutomation.tsx)
Carica template: GET /automation/templates
L'utente seleziona un template pre-configurato
Crea automazione: POST /automation/from-template
Step 4: Completion
Animazione celebrativa (2 secondi)
PATCH /auth/persona con { onboardingCompleted: true }
Pulizia localStorage
Redirect a /dashboard
Persistenza Stato
localStorage (per resume):
{
  currentStep: 'welcome' | 'telegram' | 'email' | 'automation' | 'complete',
  surveyData: { goal, audienceSize, experienceLevel, ... },
  progress: {
    welcomeSurveyCompleted: boolean,
    telegramSetupCompleted: boolean,
    emailSetupCompleted: boolean,
    firstAutomationCreated: boolean
  }
}
Database (User model):
personaType          String?   // 'beginner' | 'creator' | 'power_user' | 'monetizer'
experienceLevel      String?
audienceSize         String?
primaryGoal          String?
preferredChannels    String[]
hasAmazonAssociates  Boolean
onboardingCompletedAt DateTime?
Flow Branching
Welcome Survey completato
    │
    ├─► telegram selezionato? ─► Telegram Setup
    │                                │
    │                                ▼
    ├─► email selezionato? ───► Email Setup
    │                                │
    │                                ▼
    └─────────────────────────► First Automation
                                     │
                                     ▼
                                 Completion → Dashboard
Skip & Resume
Funzionalità	Comportamento
Skip Welcome	Va direttamente alla dashboard
Skip Canale	Salta al prossimo step
Skip Automazione	Completa onboarding senza automazione
Resume	Ricarica stato da localStorage, riprende dall'ultimo step
Analytics Tracciati
onboarding_started
onboarding_welcome_completed
onboarding_telegram_completed
onboarding_email_completed
onboarding_automation_created
onboarding_channel_skipped
onboarding_wizard_completed
Redirect Logic (dopo magic-link)
Da magic-link/page.tsx:82-89:
if (data.user?.role === 'ADMIN') {
    router.push(`/${locale}/admin`);
} else if (data.isNewUser || !data.user?.onboardingCompleted) {
    router.push(`/${locale}/onboarding`);
} else {
    router.push(`/${locale}/dashboard`);
}
