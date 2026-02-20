# Mission Control Dashboard

A professional, data-driven command center for tracking revenue, clients, pipeline, and systems.

## Features

- **Revenue Engine**: Real-time KPI tracking (MRR, pipeline value, close rates, outreach metrics)
- **Milestone Tracker**: Visual progress bars for revenue targets ($500 → $10k MRR)
- **Daily Activity Log**: Track cold emails, DMs, calls, follow-ups, and leads scraped
- **Weekly Rollup**: Auto-calculated conversion rates and outreach metrics
- **Client Tracker**: Full CRUD for client management with health monitoring
- **Automation Lab**: Track automation builds from idea to deployment
- **Pipeline/CRM**: Manage leads through stages with weighted revenue calculations
- **System Tracking**: Monitor agents and workflows with success rates
- **Weekly Review**: Structured review template with auto-pulled metrics
- **Goal Cascade**: Link daily → weekly → 90-day → annual objectives

## Tech Stack

- Pure HTML + CSS + vanilla JavaScript
- No frameworks, no dependencies
- localStorage for data persistence
- Mobile-responsive design
- Dark minimalist theme

## Deployment

### Vercel (Recommended)
```bash
npm i -g vercel
vercel --prod
```

### Other Static Hosts
Upload the following files:
- index.html
- styles.css
- app.js
- vercel.json (optional)

## Data Persistence

All data is stored in browser localStorage. No backend required.

**Note**: Data is stored locally in your browser. Clear cache = lose data. Export/backup features can be added if needed.

## Usage

1. Open the dashboard
2. Navigate using the sidebar
3. Add clients, automations, pipeline leads, and systems
4. Log daily activities to track metrics
5. Review weekly progress
6. Watch your revenue engine grow

## Design Philosophy

Pure business. No motivational quotes. No vibes. Just data.

This is a command center, not a toy.

## License

MIT
