SAMPLE_POLICIES = [
    {
        "filename": "Employee_Leave_Policy.pdf",
        "title": "Employee Leave & Attendance Policy",
        "department": "HR",
        "category": "HR",
        "source": "Employee_Leave_Policy.pdf",
        "content": """
# Employee Leave Policy

## 1. Annual Leave Policy
Full-time employees receive 18 days of paid annual leave per calendar year. Leave is credited on a pro-rata basis at 1.5 days per completed month of service. Employees are encouraged to plan and apply for annual leave at least 2 weeks in advance through the HR Portal. A maximum of 5 unused annual leave days can be carried forward into the next calendar year; any remaining excess days will lapse on December 31st.

## 2. Sick & Medical Leave
Employees are entitled to 12 days of paid sick leave per year. Sick leave covers personal illness, medical appointments, and immediate family care. If sick leave exceeds 2 consecutive business days, a certified medical practitioner's certificate must be submitted to HR upon return to work.

## 3. Parental & Family Leave
Primary caregivers are entitled to 26 weeks of fully paid maternity leave. Secondary caregivers receive 4 weeks of fully paid paternity/bonding leave. Parental leave can be taken anytime within the first 12 months following childbirth or legal adoption.

## 4. Bereavement & Compassionate Leave
Employees are provided up to 5 consecutive paid days off in the event of the loss of an immediate family member (spouse, child, parent, sibling). Additional unpaid days or annual leave days may be approved by the manager.

## 5. Public Holidays & Floating Holidays
The company observes 10 mandatory public holidays per year according to the regional calendar. Additionally, each employee is granted 2 optional floating holidays per year to observe personal religious or cultural events.
"""
    },
    {
        "filename": "Employee_Handbook.pdf",
        "title": "OnboardIQ Company Employee Handbook",
        "department": "General",
        "category": "General",
        "source": "Employee_Handbook.pdf",
        "content": """
# OnboardIQ Employee Handbook

## 1. Company Vision & Core Values
Welcome to OnboardIQ. Our mission is to accelerate human potential by building autonomous, human-centric enterprise intelligence. Our core values are:
- Radical Ownership: Take pride in end-to-end impact.
- Curiosity & Learning: Always be building and expanding your technical horizons.
- Empathy & Collaboration: Support your teammates and communicate transparently.

## 2. Working Hours & Flexible Schedule
Standard company working hours are 9:00 AM to 6:00 PM, Monday through Friday, with a core collaboration window between 10:00 AM and 4:00 PM. We support hybrid and flexible schedules coordinated with your direct manager. Lunch breaks are typically 1 hour.

## 3. Dress Code
We maintain a 'smart casual' dress code for office days. During client-facing meetings, professional business casual is recommended.

## 4. Communication Guidelines
We primarily communicate via:
- Slack: For instant team communication, project channels, and quick syncs.
- Email / Google Workspace: For formal notices, external vendors, and calendar invitations.
- Notion / Confluence: For company documentation, RFCs, and engineering playbooks.
- Jira: For sprint tracking, bug reports, and milestone delivery.

## 5. Expense Reimbursement & Stipends
Employees receive a $500 home-office setup stipend within their first 90 days. Ongoing learning stipends of $1,000 per calendar year are available for books, courses, certifications, and technical conferences. Submit receipts through the Finance Expense Portal.
"""
    },
    {
        "filename": "IT_Setup_Guide.pdf",
        "title": "IT Equipment & Developer Setup Guide",
        "department": "IT",
        "category": "IT",
        "source": "IT_Setup_Guide.pdf",
        "content": """
# IT Setup & Developer Onboarding Guide

## 1. Laptop Provisioning & Initial Account Setup
Upon joining, your primary workstation (MacBook Pro or ThinkPad Workstation) will be pre-enrolled in MDM (Mobile Device Management). Complete your initial login using the temporary credentials sent to your personal email, and immediately update your master password in the Single Sign-On (Okta/JumpCloud) portal.

## 2. Required Software Installation
All developers must install the following approved tools:
- Node.js (v20 LTS or v22 LTS) via nvm / fnm.
- Python 3.11+ using pyenv or uv.
- Docker Desktop or OrbStack for local containerized development.
- Visual Studio Code or Cursor IDE with standard company extensions: ESLint, Prettier, GitLens, Python, Docker.
- Git CLI (configured with your official company email).
- 1Password: Official company password manager.

## 3. Git & GitHub Organization Setup
1. Authenticate with the enterprise GitHub organization using your corporate email.
2. Generate an SSH key (`ssh-keygen -t ed25519 -C "your_email@company.com"`) and add it to your GitHub profile.
3. Configure your local git identity:
   `git config --global user.name "Your Full Name"`
   `git config --global user.email "your_email@company.com"`
4. Enable GPG or SSH commit signing for verified commits.

## 4. VPN & Internal Network Access
Access to internal staging clusters, test databases, and Jenkins/GitHub runners requires the Company Zero-Trust VPN (WireGuard/Cloudflare WARP). Follow the VPN setup guide in the IT Portal and verify connection to internal IP range 10.200.x.x.

## 5. Hardware Support & IT Helpdesk
For hardware issues, monitor requests, or access provisioning, open a ticket at `helpdesk.internal` or message the `#it-support` Slack channel. Average response time is within 30 minutes during business hours.
"""
    },
    {
        "filename": "Information_Security_Policy.pdf",
        "title": "Corporate Information Security & Compliance Policy",
        "department": "Security",
        "category": "Security",
        "source": "Information_Security_Policy.pdf",
        "content": """
# Corporate Information Security Policy

## 1. Multi-Factor Authentication (MFA) Requirement
Multi-Factor Authentication (MFA) is strictly mandatory for all accounts accessing company services, email, code repositories, and VPNs. Employees must configure an approved authenticator app (1Password, Google Authenticator, or YubiKey hardware token) within 48 hours of account creation. SMS-based MFA is prohibited for production access.

## 2. Password Standards & Credentials Policy
All passwords must be at least 14 characters long, contain uppercase, lowercase, numerals, and special symbols. Never reuse personal passwords. All credentials and API keys must be managed through 1Password. Never commit API keys, secrets, or .env files into Git repositories. Pre-commit hooks will automatically reject commits containing detected secret patterns.

## 3. Clean Desk & Device Security Policy
- Always lock your computer workstation screen (`Win + L` or `Cmd + Ctrl + Q`) when stepping away, even for a few moments.
- Do not leave physical access badges, confidential paperwork, or company laptops unattended in public spaces.
- Workstation disk encryption (FileVault / BitLocker) must remain enabled at all times.

## 4. Security Incident Reporting
If you suspect phishing, discover exposed credentials, or observe unusual account activity, you must immediately report it to `security@company.com` or post with `@sec-oncall` in the `#security-incidents` Slack channel. Fast reporting protects customer data and is rewarded without penalty.

## 5. Security Training Milestones
Every new employee must complete the Security Awareness & Phishing Simulation Training within their first 7 days of onboarding. Completion is required before production access permissions are granted.
"""
    },
    {
        "filename": "Engineering_Development_Guide.pdf",
        "title": "Software Engineering Guidelines & Best Practices",
        "department": "Engineering",
        "category": "Engineering",
        "source": "Engineering_Development_Guide.pdf",
        "content": """
# Engineering Development Guidelines

## 1. Architecture Overview & Tech Stack
OnboardIQ services are built on a modern micro-service & agentic architecture:
- Frontend: React with Vite, modular styling, reactive state management.
- Backend: Node.js & Express REST microservices with MongoDB.
- AI Intelligence: Python FastAPI, LangChain, LangGraph multi-agent orchestration, ChromaDB vector store, and local Ollama inference.

## 2. Git Branching & Commit Conventions
- Main branch (`main`): Always deployable and protected.
- Feature branches: Follow the convention `feat/TICKET-ID-short-description`, `fix/TICKET-ID-short-description`, or `chore/short-description`.
- Commit messages: Use Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`).

## 3. Pull Request Review Process
- All code changes require an approved Pull Request (PR) from at least one senior engineer before merging.
- PRs must pass automated CI checks: unit tests, linting, type checks, and security vulnerability scans.
- PR descriptions must include: What changed, why it changed, how it was tested, and screenshots/recordings for UI changes.

## 4. CI/CD Deployment Pipeline
Merging into `main` automatically triggers GitHub Actions to run the test suite, build container images, and deploy to the staging environment. Production releases occur twice weekly following regression test sign-off.

## 5. Observability & Logging
All API services must implement structured JSON logging with request IDs, response times, and standard error formats. Use Prometheus and Grafana dashboards for monitoring service latency and ChromaDB query performance.
"""
    }
]
