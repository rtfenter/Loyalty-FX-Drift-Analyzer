# Loyalty FX Drift Analyzer  
[![Live Demo](https://img.shields.io/badge/Live%20Demo-000?style=for-the-badge)](https://rtfenter.github.io/Loyalty-FX-Drift-Analyzer/)

### A small visual tool to see how FX shifts distort loyalty point value and partner fairness.

This project is part of my **Loyalty Systems Series**, exploring how loyalty systems behave beneath the UI layer — from event flow to FX reconciliation to partner tiering.

The goal of this analyzer is to make FX drift legible:

- How does a point’s underlying value move when FX shifts?  
- Which regions become quietly “richer” or “poorer” on the same reward?  
- Which partners end up under- or over-valued when FX changes?  

Instead of staring at FX tables in isolation, this prototype visualizes the effect of FX drift on loyalty value.

---

## Features (MVP)

The prototype includes:

- Inputs for:
  - Base point value in a reference currency (e.g., 0.01 USD)  
  - A simple FX table for key regions (US, EU, UK, JP)  
  - A sample reward price in points (same across regions)  
- A single **FX drift slider**:
  - Simulates FX moving up or down (e.g., –20% to +20%)  
  - Applies the shift to selected regions  
- A **partner drift view** that shows:
  - Change in underlying reward value per partner  
  - Relative drift percentage per partner  
  - Whether each partner becomes relatively richer, poorer, or stable  
- A small “integrity band”:
  - Close to baseline  
  - Noticeable drift  
  - Distorted  

The focus is on visualizing relative movement, not precision pricing.

---

## Demo Screenshot

> (Screenshot to be added after MVP implementation.)

---

## FX Drift Analysis Flow

    [Base Point Value + FX Table + Sample Reward]
                          |
                          v
                 Baseline Value Layer
        (points * base_value → base currency liability)
                          |
                          v
                 FX Shift Simulation
        (apply +/- drift to selected FX rates)
                          |
                          v
              Region & Partner Value Recalc
        (post-shift value for each partner/region)
                          |
                          v
               Drift & Fairness Assessment
       (per-partner % change and relative ranking)
                          |
                          v
             Visual Drift Map & Explanation
      ("Hotels in EU are now 18% richer than US",
       "Retail JP rewards are heavily diluted")

---

## Purpose

In real programs, FX shifts can quietly distort loyalty value:

- A stable point value in base currency can mask regional distortions  
- Partner economics can become unbalanced when FX moves but catalogs don’t  
- Members in one region suddenly get a better or worse deal than others  

Over time, this creates value asymmetry:

- Some partners or regions become “sweet spots” far beyond intended value  
- Others become low-value traps, eroding trust in the program  
- Finance and product teams struggle to see the impact without tooling  

This tool provides a small, understandable way to:

- Define a base point value and FX assumptions  
- Simulate FX drift across regions  
- See which partners move out of alignment with each other.

---

## How This Maps to Real Loyalty Systems

Even though it's minimal, each component corresponds to real architecture:

### Base Point Value & Liability  
Programs typically anchor point value in a base currency (e.g., 0.5–1.0 cents per point). That value drives liability, margin modeling, and partner economics.

### FX Table  
FX tables are used to normalize spend and redemption across currencies. If these tables update at different cadences than catalogs or partner rates, silent distortion appears.

### FX Shift Simulation  
In production, FX volatility is continuous. This prototype compresses it into a single slider to make “what happens when FX moves by X%?” immediately visible.

### Region & Partner Value Recalc  
Partners are often funded or settled in local currency. When FX moves, their effective cost and perceived member value diverge across markets.

### Drift & Fairness Assessment  
Most systems do not treat “value parity across markets and partners” as a first-class metric. This prototype surfaces drift as an explicit signal.

### Visual Drift Map  
Instead of a table of numbers, the analyzer shows relative drift as bars and percentages. This makes it easier to reason about fairness and make decisions (e.g., “rebalance this partner” or “adjust catalog pricing”).

This tool is a legible micro-version of how FX drift interacts with loyalty value and partner fairness.

---

## Part of the Loyalty Systems Series

Main repo:  
https://github.com/rtfenter/loyalty-series

---

## Status  

MVP design defined.  
Frontend implementation in progress — this prototype will stay intentionally lightweight and visual, focusing on the relative drift and fairness story rather than full financial modeling.

---

## Local Use

No installation required.  
Once implemented, to run the analyzer locally:

1. Clone the repo  
2. Open `index.html` in your browser  

Everything will run client-side.
