# Prepare for common legal tasks

An early prototype exploring how people in Barbados could get clearer information about common legal tasks, understand what to do next and prepare information or documents to check.

This is not a live government service and does not give legal advice.

## Areas covered

- wills and estates
- homes, land and renting
- documents, records and agreements
- family and relationships
- legal help and support

## Current build status

### Built in this version

- home page and task navigation
- guidance on signing, witnessing and certified copies
- guidance on changing a name or updating a record
- renting-a-home guidance
- guidance on giving land or a home while alive
- preparation before speaking to a lawyer
- information about asking for legal aid

### Tenancy agreement journey in progress

The current tenancy journey includes:

- a start page
- suitability questions
- a safe exit for situations the journey cannot cover
- landlord details
- an optional agent or manager
- tenant details
- details about the home
- tenancy dates
- browser-tab storage, recovery and answer deletion

The later tenancy questions, check-answers stage and document output have not been built yet. No tenancy agreement is created in this version.

### Planned areas

- planning what happens to money and property
- preparing information for a simple will
- finding out what may be needed after someone dies
- preparing a confidentiality agreement
- preparing for a relationship financial agreement
- preparing a parenting plan
- help choosing where to start

## Information entered

Answers entered in the tenancy journey are kept only in the current browser tab. They are not sent to GovTech. Closing the tab removes them.

## Development

This prototype uses [Vite](https://vitejs.dev/), React and TypeScript.

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Check the code with the linter:

```bash
npm run lint
```

Create a production build (runs `tsc --noEmit` and then `vite build`):

```bash
npm run build
```
