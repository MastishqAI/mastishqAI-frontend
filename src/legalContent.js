// Text for the four documentation pages. It describes what the app really does today.
// DRAFT: have a lawyer review the Privacy Policy and Terms before launch (see the bracketed [placeholders]).

export const SUPPORT_EMAIL = "support@mastishq.ai";
export const LAST_UPDATED = "10 November 2026";

export const PAGES = {
  about: {
    title: "About Mastishq",
    lead: "Mastishq.ai helps Indian students find exactly where they lose marks and fix it — with AI-generated practice, a personal Mistake Bank and an always-on doubt tutor.",
    sections: [
      {
        h: "Our Mission",
        p: [
          "Every student deserves a coach that knows their weak spots. Mastishq turns each quiz, mistake and doubt into a clear next step, so preparation for NEET, JEE, boards and competitive exams stays focused on what moves the score.",
          "We build for students first: every answer comes with a step-by-step reason, so you learn why, not just what.",
        ],
      },
      {
        h: "Core Values",
        ul: [
          "Student first: your data, scores and mistakes stay private unless you choose to share them.",
          "Learning over grinding: short, adaptive sets beat long, generic mocks.",
          "Clarity: every answer comes with a step-by-step reason, not just a key.",
        ],
      },
      {
        h: "Our Approach",
        p: [
          "Topic quizzes adapt across Easy, Medium and Hard stages; wrong answers flow into your Mistake Bank; weak-spot sets bring them back until you get them right twice. Mastishq AI answers doubts in the context of the exact question you are on.",
          "Questions and explanations are written by AI and checked by a second automated pass, but AI can still make mistakes. If something looks wrong, use “Report this question” and we will review it.",
        ],
      },
    ],
  },

  usage: {
    title: "Usage Policy",
    lead: "This policy explains how Mastishq may be used, so that practice stays fair and the community stays safe for every learner.",
    sections: [
      {
        h: "Acceptable Use",
        p: ["Use Mastishq to learn: practise topics, review your mistakes, ask the AI tutor about your studies and compare progress on the leaderboard. Use your own account and be honest about your own work."],
      },
      {
        h: "Prohibited Activities",
        p: ["The following are not allowed:"],
        ul: [
          "Breaking the law: using the service for anything illegal, or to infringe other people's rights.",
          "Harmful content: using the AI tutor or any form to harass, abuse, threaten or harm others, or to create sexual, hateful or violent content.",
          "Cheating the system: manipulating points, streaks or the leaderboard, using bots or scripts, or creating several accounts to gain an advantage.",
          "Misuse of the service: scraping questions in bulk, copying or reselling content, trying to break, probe or overload our systems, or bypassing usage limits.",
          "Sharing accounts: letting someone else use your account or using someone else's.",
          "Sensitive data: do not post other people's personal information, passwords or payment details in chats, queries or uploads.",
        ],
      },
      {
        h: "AI Features",
        p: ["AI answers, quizzes and explanations are study aids. They can contain mistakes, so check important facts with your textbook or teacher. We may limit how much AI you can use per day to keep the service available for everyone."],
      },
      {
        h: "Account Responsibilities",
        p: ["You are responsible for keeping your password safe and for what happens under your account. Tell us straight away at " + SUPPORT_EMAIL + " if you think someone else has accessed it."],
      },
      {
        h: "Enforcement & Violations",
        p: ["If these rules are broken we may remove content, reset points, limit features or suspend or close an account. If you think we made a mistake, write to " + SUPPORT_EMAIL + " and we will review it."],
      },
    ],
  },

  privacy: {
    title: "Privacy Policy",
    lead: "We hold your learning data in high regard. This page explains what Mastishq collects, why, who it is shared with, and the choices you have.",
    sections: [
      {
        h: "Information We Collect",
        p: ["When you use Mastishq we handle the following:"],
        ul: [
          "Account details: your name, email address, mobile number and password (stored only as a secure hash, never in plain text).",
          "Google sign-in: if you choose it, your name, verified email address and profile picture from Google. We never see your Google password.",
          "Profile details: school or college, class or course, district, state, pin code, your exam goal, daily question target and chosen subjects.",
          "Learning activity: the topics you practise, your answers, scores, time taken, points, level, streaks, badges and your Mistake Bank.",
          "AI conversations: the questions you type to Mastishq AI, the answers you receive, and any feedback (👍 / 👎 / reports) you give.",
          "Support queries: what you write in Help & Support, and any files you attach.",
          "Technical data: your sign-in session (a secure cookie), basic device and browser information, and error logs.",
        ],
      },
      {
        h: "How We Use Information",
        ul: [
          "To run Mastishq: sign you in, create quizzes, mark your answers and keep your progress.",
          "To personalise: suggest topics from your weak spots and build your Mistake Bank.",
          "To show the leaderboard: other learners with the same goal can see your name, level, points, streak, accuracy and average time. Your individual answers and scores are not shown.",
          "To keep the service safe and working: prevent abuse, fix bugs and answer your support queries.",
          "To improve the product: review feedback and reported questions.",
        ],
      },
      {
        h: "AI Processing & Sharing",
        p: [
          "To write quizzes, check answers and reply to your doubts, the text of your topic, questions and chat messages is sent to our AI provider, OpenAI. Some AI answers use web search to find sources, so the words of your question may be used as a search query. We do not send your password, email address or phone number to the AI provider.",
          "We do not sell your personal information. We share it only with service providers who help us run Mastishq (for example hosting, our database, Google for sign-in and OpenAI for AI), when the law requires it, or with your consent.",
        ],
      },
      {
        h: "Cookies",
        p: ["We use one essential cookie to keep you signed in. It is marked HttpOnly and is not readable by scripts on the page. We do not use advertising cookies."],
      },
      {
        h: "Retention & Security",
        p: [
          "We keep your data while your account is active and delete or anonymise it within a reasonable period after you ask us to delete your account [retention period to be confirmed]. Backups and legal records may be kept for longer where the law requires.",
          "We protect data with encryption in transit (HTTPS), hashed passwords, short-lived access tokens and access limits. No system is perfectly secure, so please use a strong, unique password.",
        ],
      },
      {
        h: "Your Privacy Rights",
        p: ["Depending on where you live, you may have the right to access, correct or delete your personal data, to object to some uses, or to withdraw consent. To use these rights, or to ask any privacy question, write to " + SUPPORT_EMAIL + " from the email address on your account."],
      },
      {
        h: "Children",
        p: ["Mastishq is meant for students. If you are under 18 please use it with the knowledge of a parent or guardian [age requirements to be confirmed]. If you believe a child has given us data without permission, contact us and we will remove it."],
      },
      {
        h: "Changes to This Policy",
        p: ["We may update this policy as Mastishq changes. The “Last updated” date at the top of this page will always show the latest version, and we will tell you about important changes in the app."],
      },
    ],
  },

  terms: {
    title: "Terms of Service",
    lead: "These terms are the agreement between you and Mastishq for using our learning platform, practice tools and AI tutor.",
    sections: [
      {
        h: "Acceptance of Terms",
        p: ["By creating an account or using Mastishq you agree to these terms, the Usage Policy and the Privacy Policy. If you do not agree, please do not use the service."],
      },
      {
        h: "Eligibility & Registration",
        p: ["You must give accurate information and keep it up to date. If you are under 18, you may use Mastishq only with the permission of a parent or guardian [minimum age to be confirmed]. You are responsible for your account and everything done through it."],
      },
      {
        h: "Service Use & Licence",
        p: ["We give you a personal, limited, non-exclusive, revocable licence to use Mastishq for your own learning. You may not copy, resell, scrape or reverse-engineer the service or its content, or use it to build a competing product."],
      },
      {
        h: "AI-Generated Content",
        p: [
          "Questions, answers, explanations and sources are created or found with the help of AI. They are study aids, not professional or official advice, and they can be wrong or out of date. Always check important facts with your textbooks, teachers and official exam material. Links to other websites are provided for convenience and we do not control or endorse them.",
        ],
      },
      {
        h: "Points, Levels & Leaderboard",
        p: ["Points, levels, badges and rankings are for motivation only. They have no cash value, cannot be transferred, and we may adjust them to correct errors or remove unfair activity."],
      },
      {
        h: "Your Content",
        p: ["You keep ownership of what you write or upload. You give us permission to store and process it to provide the service (including sending it to our AI provider as described in the Privacy Policy) and to review reports and support queries."],
      },
      {
        h: "Paid Plans",
        p: ["Some features may be offered in paid plans in future. Prices, billing and refunds will be shown clearly before you pay [payment terms to be added when plans launch]."],
      },
      {
        h: "Suspension & Termination",
        p: ["You can stop using Mastishq at any time and ask us to delete your account. We may suspend or close accounts that break these terms or the Usage Policy, or if we must by law."],
      },
      {
        h: "Disclaimers & Limitation of Liability",
        p: [
          "Mastishq is provided “as is”. We work hard to keep it accurate and available but do not promise that it will be uninterrupted, error-free, or that using it will lead to any particular exam result.",
          "To the extent allowed by law, Mastishq is not liable for indirect or consequential losses, or for losses caused by downtime, AI mistakes or events outside our control. Nothing in these terms limits liability that cannot be limited by law.",
        ],
      },
      {
        h: "Changes, Governing Law & Contact",
        p: [
          "We may update these terms; if the change is important we will tell you in the app, and using Mastishq afterwards means you accept the new terms. These terms are governed by the laws of [jurisdiction to be confirmed]. Questions? Write to " + SUPPORT_EMAIL + ".",
        ],
      },
    ],
  },
};

export const ORDER = [
  ["about", "About Mastishq"],
  ["usage", "Usage Policy"],
  ["privacy", "Privacy Policy"],
  ["terms", "Terms of Service"],
];
